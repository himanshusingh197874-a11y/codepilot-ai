import { logger } from "../../config/logger";
import {
  createInlineReview,
  InlineComment,
} from "../../providers/github/github.inline-review";
import { createPullRequestReview } from "../../providers/github/github.review";
import { eventBus } from "../../realtime/event-bus";

import {
  aiReviewService,
  analyzeLine,
} from "../ai/ai.service";

import {
  PullRequestReview,
  PullRequestReviewFile,
} from "../ai/pr-review.types";

import { shouldIgnoreFile } from "../ai/review.config";

import {
  saveReviewComments,
} from "../ai/review-comment.repository";

import { formatReviewComment } from "../ai/review.formatter";

import { saveReview } from "../ai/review.repository";

import { extractAddedLinesWithNumbers } from "../pr/diff.parser";

import {
  getPullRequest,
  getPullRequestFiles,
} from "../pr/pr.github";

export class ReviewPipelineError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

type RepositoryForReview = {
  id: string;
  owner: string;
  name: string;
};

function getReviewableFiles(
  files: Awaited<
    ReturnType<typeof getPullRequestFiles>
  >,
): PullRequestReviewFile[] {
  return files.flatMap((file) => {
    if (
      shouldIgnoreFile(file.filename) ||
      !file.patch
    ) {
      return [];
    }

    return [
      {
        filename: file.filename,
        patch: file.patch,
      },
    ];
  });
}

function buildInlineComments(
  files: readonly PullRequestReviewFile[],
): InlineComment[] {
  const comments: InlineComment[] = [];

  for (const file of files) {
    for (const addedLine of extractAddedLinesWithNumbers(
      file.patch,
    )) {
      const body = analyzeLine(
        addedLine.content,
      );

      if (body) {
        comments.push({
          path: file.filename,
          line: addedLine.lineNumber,
          body,
        });
      }
    }
  }

  return comments;
}

function unavailableReview(): PullRequestReview {
  return {
    summary:
      "Automated repository review was unavailable; local inline checks completed.",
    overallScore: 0,
    positives: [],
    issues: [],
    suggestions: [
      "Re-run the review after the AI provider is available.",
    ],
    verdict: "request_changes",
  };
}

function getSeverityCounts(
  issues: PullRequestReview["issues"],
) {
  return issues.reduce(
    (counts, issue) => {
      const severity =
        issue.severity.toLowerCase();

      if (
        ["high", "critical", "error"].includes(
          severity,
        )
      ) {
        counts.high += 1;
      } else if (
        ["medium", "warning"].includes(
          severity,
        )
      ) {
        counts.medium += 1;
      } else {
        counts.low += 1;
      }

      return counts;
    },
    {
      high: 0,
      medium: 0,
      low: 0,
    },
  );
}

/**
 * Converts Gemini issues into ReviewComment-compatible
 * objects so they can be persisted in PostgreSQL.
 *
 * The function intentionally accepts a flexible issue shape
 * because different prompt/schema versions may use either
 * `path` or `file`, and either `message` or `description`.
 */
function buildAIReviewComments(
  review: PullRequestReview,
) {
  return review.issues.flatMap((rawIssue) => {
    const issue =
      rawIssue as unknown as Record<
        string,
        unknown
      >;

    const path =
      typeof issue.path === "string"
        ? issue.path
        : typeof issue.file === "string"
          ? issue.file
          : "";

    const line =
      typeof issue.line === "number"
        ? issue.line
        : typeof issue.lineNumber === "number"
          ? issue.lineNumber
          : 0;

    const severity =
      typeof issue.severity === "string"
        ? issue.severity
        : "low";

    const message =
      typeof issue.message === "string"
        ? issue.message
        : typeof issue.description === "string"
          ? issue.description
          : "";

    const suggestion =
      typeof issue.suggestion === "string"
        ? issue.suggestion
        : "";

    if (!path || !message || line <= 0) {
      return [];
    }

    const body = suggestion
      ? `${message}\n\nSuggestion: ${suggestion}`
      : message;

    return [
      {
        path,
        line,
        body,
        severity,
      },
    ];
  });
}

export async function runPullRequestReview({
  repository,
  accessToken,
  pullNumber,
}: {
  repository: RepositoryForReview;
  accessToken: string;
  pullNumber: number;
}) {
  let pullRequest: Awaited<
    ReturnType<typeof getPullRequest>
  >;

  let files: Awaited<
    ReturnType<typeof getPullRequestFiles>
  >;

  try {
    [pullRequest, files] =
      await Promise.all([
        getPullRequest(
          accessToken,
          repository.owner,
          repository.name,
          pullNumber,
        ),

        getPullRequestFiles(
          accessToken,
          repository.owner,
          repository.name,
          pullNumber,
        ),
      ]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "GitHub request failed";

    if (
      message.includes("404") ||
      message.includes("Not Found")
    ) {
      throw new ReviewPipelineError(
        "Pull request not found",
        404,
      );
    }

    throw new ReviewPipelineError(
      "GitHub request failed",
      502,
    );
  }

  if (files.length === 0) {
    throw new ReviewPipelineError(
      "No changed files",
      400,
    );
  }

  const filesToReview =
    getReviewableFiles(files);

  if (filesToReview.length === 0) {
    throw new ReviewPipelineError(
      "No reviewable changed files",
      400,
    );
  }

  /**
   * Local deterministic inline checks.
   */
  const inlineComments =
    buildInlineComments(filesToReview);

  let review: PullRequestReview;

  /**
   * Gemini review.
   */
  try {
    review =
      await aiReviewService.reviewPullRequest(
        filesToReview,
      );
  } catch (error) {
    logger.error(
      {
        err: error,
        repositoryId: repository.id,
        pullNumber,
        provider: "gemini",
      },
      "Repository AI review failed; continuing with fallback review",
    );

    review = unavailableReview();
  }

  logger.info(
    {
      repositoryId: repository.id,
      pullNumber,
      aiFindingCount:
        review.issues.length,
      severityCounts:
        getSeverityCounts(
          review.issues,
        ),
    },
    "AI review findings received",
  );

  /**
   * Convert Gemini issues into ReviewComment records.
   */
  const aiComments =
    buildAIReviewComments(review);

  logger.info(
    {
      repositoryId: repository.id,
      pullNumber,
      aiCommentsPrepared:
        aiComments.length,
      localInlineComments:
        inlineComments.length,
    },
    "Review comments prepared for persistence",
  );

  try {
    /**
     * Publish deterministic inline comments
     * directly to GitHub.
     */
    if (inlineComments.length > 0) {
      await createInlineReview(
        accessToken,
        repository.owner,
        repository.name,
        pullNumber,
        pullRequest.head.sha,
        inlineComments,
      );
    }

    /**
     * Publish overall PR review to GitHub.
     */
    await createPullRequestReview(
      accessToken,
      repository.owner,
      repository.name,
      pullNumber,
      formatReviewComment(review),
    );

    /**
     * Save the main Review record.
     */
    const savedReview =
      await saveReview({
        repositoryId:
          repository.id,

        githubPrId:
          BigInt(pullRequest.id),

        number: pullNumber,

        title:
          pullRequest.title,

        state:
          pullRequest.state,

        review,
      });

    logger.info(
      {
        reviewId:
          savedReview.id,

        aiFindings:
          review.issues.length,

        severityCounts:
          getSeverityCounts(
            review.issues,
          ),
      },
      "AI review persisted",
    );

    /**
     * Combine:
     *
     * 1. Gemini AI findings
     * 2. Local deterministic findings
     *
     * and persist both into ReviewComment.
     */
    const commentsToPersist = [
      ...aiComments,

      ...inlineComments.map(
        (comment) => ({
          path: comment.path,
          line: comment.line,
          body: comment.body,
          severity: "warning",
        }),
      ),
    ];

    const commentsPersisted =
      await saveReviewComments({
        reviewId:
          savedReview.id,

        repositoryId:
          repository.id,

        githubPrId:
          BigInt(pullRequest.id),

        comments:
          commentsToPersist,
      });

    logger.info(
      {
        reviewId:
          savedReview.id,

        commentsPrepared:
          commentsToPersist.length,

        commentsPersisted,
      },
      "Review comments persisted",
    );

    /**
     * Notify frontend/dashboard.
     */
    eventBus.emit(
      "review.completed",
      {
        repositoryId:
          repository.id,

        reviewId:
          savedReview.id,
      },
    );

    eventBus.emit(
      "repository.updated",
      {
        repositoryId:
          repository.id,
      },
    );

    return savedReview;
  } catch (error) {
    logger.error(
      {
        err: error,
        repositoryId:
          repository.id,
        pullNumber,
      },
      "Failed to publish or persist pull request review",
    );

    throw new ReviewPipelineError(
      "Failed to publish pull request review",
      502,
    );
  }
}