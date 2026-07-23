import { extractAddedLinesWithNumbers } from '../pr/diff.parser';
import { getPullRequest, getPullRequestFiles } from '../pr/pr.github';
import { analyzeLine, reviewPatch } from '../ai/ai.service';
import { shouldIgnoreFile } from '../ai/review.config';
import { formatReviewComment } from '../ai/review.formatter';
import { saveReview } from '../ai/review.repository';
import { saveReviewComments } from '../ai/review-comment.repository';
import { createFindings } from '../review/review.repository';
import { createInlineReview, InlineComment } from '../../providers/github/github.inline-review';
import { createPullRequestReview } from '../../providers/github/github.review';

export class ReviewPipelineError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
  }
}

type RepositoryForReview = {
  id: string;
  owner: string;
  name: string;
};

export async function runPullRequestReview({
  repository,
  accessToken,
  pullNumber,
}: {
  repository: RepositoryForReview;
  accessToken: string;
  pullNumber: number;
}) {
  let pullRequest: Awaited<ReturnType<typeof getPullRequest>>;
  let files: Awaited<ReturnType<typeof getPullRequestFiles>>;

  try {
    pullRequest = await getPullRequest(
      accessToken,
      repository.owner,
      repository.name,
      pullNumber,
    );
    files = await getPullRequestFiles(
      accessToken,
      repository.owner,
      repository.name,
      pullNumber,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'GitHub request failed';
    if (message.includes('404') || message.includes('Not Found')) {
      throw new ReviewPipelineError('Pull request not found', 404);
    }
    throw new ReviewPipelineError('AI review failed', 500);
  }

  if (files.length === 0) {
    throw new ReviewPipelineError('No changed files', 400);
  }

  const reviews = [];
  const inlineComments: InlineComment[] = [];

  for (const file of files) {
    if (shouldIgnoreFile(file.filename) || !file.patch) {
      continue;
    }

    for (const addedLine of extractAddedLinesWithNumbers(file.patch)) {
      const comment = analyzeLine(addedLine.content);
      if (comment) {
        inlineComments.push({
          path: file.filename,
          line: addedLine.lineNumber,
          body: comment,
        });
      }
    }

    reviews.push(await reviewPatch(file.filename, file.patch));
  }

  try {
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

    await createPullRequestReview(
      accessToken,
      repository.owner,
      repository.name,
      pullNumber,
      formatReviewComment(reviews),
    );

    const savedReview = await saveReview({
      repositoryId: repository.id,
      githubPrId: BigInt(pullRequest.id),
      number: pullNumber,
      title: pullRequest.title,
      state: pullRequest.state,
      reviews,
    });

    // TODO: Remove this temporary verification seed once AI findings are persisted.
    await createFindings(savedReview.id, [
      {
        severity: 'medium',
        filePath: 'src/app/page.tsx',
        lineNumber: 42,
        message: 'Potential null access.',
        suggestion: 'Add optional chaining before property access.',
      },
    ]);

    await saveReviewComments({
      reviewId: savedReview.id,
      repositoryId: repository.id,
      githubPrId: BigInt(pullRequest.id),
      comments: inlineComments.map((comment) => ({
        ...comment,
        severity: 'warning',
      })),
    });

    return savedReview;
  } catch (error) {
    if (error instanceof ReviewPipelineError) {
      throw error;
    }
    throw new ReviewPipelineError('AI review failed', 500);
  }
}
