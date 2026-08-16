import axios, { type AxiosError } from "axios";
import { z } from "zod";

import { env } from "../../../config/env";
import { logger } from "../../../config/logger";
import { FileReview } from "../ai.types";
import {
  PullRequestReview,
  PullRequestReviewFile,
} from "../pr-review.types";
import { buildReviewPrompt } from "../prompt.builder";
import { buildPRReviewPrompt } from "../pr-prompt.builder";
import { PullRequestReviewSchema } from "../review-pr.schema";
import { ReviewIssueSchema, ReviewSchema } from "../review.schema";

import { AIProvider, ReviewRequest } from "./ai-provider";
import { geminiClient } from "./gemini.client";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly details: {
      provider: "gemini";
      status?: number;
      retryable: boolean;
      reviewScope: "file" | "pull_request";
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function responseText(
  data: GeminiResponse,
  reviewScope: "file" | "pull_request",
): string {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text?.trim()) {
    throw new AIProviderError("Gemini returned an empty response", {
      provider: "gemini",
      retryable: false,
      reviewScope,
    });
  }

  return text.trim();
}

function parseJson(
  text: string,
  reviewScope: "file" | "pull_request",
): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new AIProviderError("Gemini returned invalid JSON", {
      provider: "gemini",
      retryable: false,
      reviewScope,
      originalError: error,
    });
  }
}

function isRetryableGeminiError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    error.code === "ECONNABORTED" ||
    error.code === "ERR_NETWORK" ||
    !error.response
  );
}

function retryDelay(
  error: unknown,
  attempt: number,
): number | null {
  if (!isRetryableGeminiError(error)) {
    return null;
  }

  const retryAfter = (error as AxiosError).response?.headers[
    "retry-after"
  ];

  const retryAfterSeconds = Number(retryAfter);

  if (
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds > 0
  ) {
    return retryAfterSeconds * 1_000;
  }

  return BASE_BACKOFF_MS * 2 ** attempt;
}

/**
 * Gemini's structured output schema for PR reviews.
 *
 * This mirrors PullRequestReviewSchema so Gemini is encouraged
 * to return exactly the structure our backend expects.
 */
const pullRequestResponseJsonSchema = {
  type: "object",
  additionalProperties: false,

  required: [
    "summary",
    "overallScore",
    "positives",
    "issues",
    "suggestions",
    "verdict",
  ],

  properties: {
    summary: {
      type: "string",
    },

    overallScore: {
      type: "number",
      minimum: 0,
      maximum: 10,
    },

    positives: {
      type: "array",
      items: {
        type: "string",
      },
    },

    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,

        required: [
          "severity",
          "message",
          "suggestion",
        ],

        properties: {
          severity: {
            type: "string",
            enum: [
              "info",
              "low",
              "medium",
              "high",
              "critical",
            ],
          },

          message: {
            type: "string",
          },

          suggestion: {
            type: "string",
          },

          path: {
            type: "string",
          },

          line: {
            type: "integer",
            minimum: 1,
          },
        },
      },
    },

    suggestions: {
      type: "array",
      items: {
        type: "string",
      },
    },

    verdict: {
      type: "string",
      enum: [
        "approve",
        "request_changes",
      ],
    },
  },
};

type SanitizedReview = {
  payload: unknown;
  skippedIssueCount: number;
};

/**
 * Gemini can occasionally return a malformed issue even when
 * the rest of the review is valid.
 *
 * We keep valid findings instead of throwing away the complete
 * review because of one malformed finding.
 */
function sanitizePullRequestReview(
  payload: unknown,
): SanitizedReview {
  if (
    !payload ||
    typeof payload !== "object" ||
    !Array.isArray(
      (payload as { issues?: unknown }).issues,
    )
  ) {
    return {
      payload,
      skippedIssueCount: 0,
    };
  }

  const review = payload as Record<string, unknown>;

  const issues = review.issues as unknown[];

  const validIssues = issues.flatMap((issue) => {
    const parsed = ReviewIssueSchema.safeParse(issue);

    if (!parsed.success) {
      return [];
    }

    return [parsed.data];
  });

  return {
    payload: {
      ...review,
      issues: validIssues,
    },

    skippedIssueCount:
      issues.length - validIssues.length,
  };
}

/**
 * Normalizes the score before persisting it.
 *
 * Zod already validates the score, but this provides an
 * additional defensive boundary around external AI output.
 */
function normalizeReviewScore(
  payload: unknown,
): unknown {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return payload;
  }

  const review = payload as Record<string, unknown>;

  if (typeof review.overallScore !== "number") {
    return payload;
  }

  const normalizedScore = Math.min(
    10,
    Math.max(
      0,
      Number(review.overallScore.toFixed(1)),
    ),
  );

  return {
    ...review,
    overallScore: normalizedScore,
  };
}

/**
 * Ensures line-level findings contain useful location data.
 *
 * We don't invent missing paths or line numbers.
 * Instead, such findings remain PR-level findings.
 */
function normalizePullRequestReview(
  payload: unknown,
): unknown {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return payload;
  }

  const review = payload as Record<string, unknown>;

  if (!Array.isArray(review.issues)) {
    return payload;
  }

  const issues = review.issues.map((issue) => {
    if (
      !issue ||
      typeof issue !== "object"
    ) {
      return issue;
    }

    const normalizedIssue = {
      ...(issue as Record<string, unknown>),
    };

    if (
      typeof normalizedIssue.path !== "string" ||
      normalizedIssue.path.trim() === ""
    ) {
      delete normalizedIssue.path;
    }

    if (
      typeof normalizedIssue.line !== "number" ||
      !Number.isInteger(normalizedIssue.line) ||
      normalizedIssue.line < 1
    ) {
      delete normalizedIssue.line;
    }

    return normalizedIssue;
  });

  return {
    ...review,
    issues,
  };
}

export class GeminiProvider implements AIProvider {
  async reviewFile(
    request: ReviewRequest,
  ): Promise<FileReview> {
    const review = await this.generate(
      buildReviewPrompt(
        request.filename,
        request.patch,
      ),
      ReviewSchema,
      "file",
    );

    return {
      filename: request.filename,
      ...review,
    };
  }

  reviewPullRequest(
    files: readonly PullRequestReviewFile[],
  ): Promise<PullRequestReview> {
    return this.generate(
      buildPRReviewPrompt(files),
      PullRequestReviewSchema,
      "pull_request",
    );
  }

  private async generate<T>(
    prompt: string,
    schema: z.ZodType<T>,
    reviewScope: "file" | "pull_request",
  ): Promise<T> {
    let lastError: unknown;

    for (
      let attempt = 0;
      attempt < MAX_ATTEMPTS;
      attempt += 1
    ) {
      const startedAt = Date.now();

      try {
        logger.info(
          {
            provider: "gemini",
            model: env.GEMINI_MODEL,
            reviewScope,
            attempt: attempt + 1,
          },
          "Gemini request started",
        );

        const { data } =
          await geminiClient.post<GeminiResponse>(
            `/models/${env.GEMINI_MODEL}:generateContent`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],

              generationConfig: {
                temperature: 0,
                responseMimeType: "application/json",

                ...(reviewScope === "pull_request"
                  ? {
                      responseJsonSchema:
                        pullRequestResponseJsonSchema,
                    }
                  : {}),
              },
            },
          );

        const durationMs =
          Date.now() - startedAt;

        logger.info(
          {
            provider: "gemini",
            model: env.GEMINI_MODEL,
            reviewScope,
            status: 200,
            durationMs,
          },
          "Gemini request completed",
        );

        const rawText = responseText(
          data,
          reviewScope,
        );

        const parsedResponse = parseJson(
          rawText,
          reviewScope,
        );

        let sanitized: SanitizedReview;

        if (reviewScope === "pull_request") {
          const normalized =
            normalizeReviewScore(
              parsedResponse,
            );

          const normalizedLocations =
            normalizePullRequestReview(
              normalized,
            );

          sanitized =
            sanitizePullRequestReview(
              normalizedLocations,
            );
        } else {
          sanitized = {
            payload: parsedResponse,
            skippedIssueCount: 0,
          };
        }

        if (
          sanitized.skippedIssueCount > 0
        ) {
          logger.warn(
            {
              provider: "gemini",
              model: env.GEMINI_MODEL,
              reviewScope,
              skippedIssueCount:
                sanitized.skippedIssueCount,
            },
            "Malformed Gemini findings skipped",
          );
        }

        const validated =
          schema.parse(
            sanitized.payload,
          );

        if (
          reviewScope === "pull_request"
        ) {
          const pullRequestReview =
            validated as PullRequestReview;

          logger.info(
            {
              provider: "gemini",
              model: env.GEMINI_MODEL,
              reviewScope,
              score:
                pullRequestReview.overallScore,
              issueCount:
                pullRequestReview.issues.length,
              positiveCount:
                pullRequestReview.positives.length,
              suggestionCount:
                pullRequestReview.suggestions.length,
              verdict:
                pullRequestReview.verdict,
            },
            "Gemini review validated",
          );
        }

        return validated;
      } catch (error) {
        lastError = error;

        const delay = retryDelay(
          error,
          attempt,
        );

        if (axios.isAxiosError(error)) {
          logger.warn(
            {
              provider: "gemini",
              model: env.GEMINI_MODEL,
              reviewScope,
              status:
                error.response?.status,
              code: error.code,
              retryable:
                delay !== null,
              durationMs:
                Date.now() - startedAt,
            },
            "Gemini request failed",
          );
        } else if (
          error instanceof z.ZodError
        ) {
          logger.warn(
            {
              provider: "gemini",
              model: env.GEMINI_MODEL,
              reviewScope,
              validationIssues:
                error.issues.map(
                  (issue) => ({
                    path: issue.path,
                    code: issue.code,
                    message:
                      issue.message,
                  }),
                ),
            },
            "Gemini response validation failed",
          );
        }

        if (
          delay === null ||
          attempt ===
            MAX_ATTEMPTS - 1
        ) {
          break;
        }

        logger.warn(
          {
            attempt:
              attempt + 1,
            delay,
            provider: "gemini",
            model: env.GEMINI_MODEL,
            reviewScope,
          },
          "Transient Gemini request failure; retrying",
        );

        await wait(delay);
      }
    }

    if (
      lastError instanceof
      AIProviderError
    ) {
      throw lastError;
    }

    if (
      lastError instanceof z.ZodError
    ) {
      logger.error(
        {
          provider: "gemini",
          model: env.GEMINI_MODEL,
          reviewScope,
          validationIssues:
            lastError.issues.map(
              (issue) => ({
                path: issue.path,
                code: issue.code,
                message:
                  issue.message,
              }),
            ),
        },
        "Gemini response failed schema validation",
      );

      throw new AIProviderError(
        "Gemini response validation failed",
        {
          provider: "gemini",
          retryable: false,
          reviewScope,
          originalError:
            lastError,
        },
      );
    }

    if (
      axios.isAxiosError(lastError)
    ) {
      const status =
        lastError.response?.status;

      logger.error(
        {
          provider: "gemini",
          model: env.GEMINI_MODEL,
          reviewScope,
          status,
          code: lastError.code,
          retryable:
            isRetryableGeminiError(
              lastError,
            ),
        },
        "Gemini request failed",
      );

      throw new AIProviderError(
        `Gemini request failed${
          status
            ? ` with status ${status}`
            : ""
        }`,
        {
          provider: "gemini",
          status,
          retryable:
            isRetryableGeminiError(
              lastError,
            ),
          reviewScope,
          originalError:
            lastError,
        },
      );
    }

    logger.error(
      {
        provider: "gemini",
        model: env.GEMINI_MODEL,
        reviewScope,
      },
      "Gemini response processing failed",
    );

    throw new AIProviderError(
      "Gemini response processing failed",
      {
        provider: "gemini",
        retryable: false,
        reviewScope,
        originalError:
          lastError,
      },
    );
  }
}