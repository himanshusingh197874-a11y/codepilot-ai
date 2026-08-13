import { z } from "zod";

import { ReviewIssueSchema } from "./review.schema";

export const ReviewVerdictSchema = z.enum([
  "approve",
  "request_changes",
]);

export const PullRequestReviewSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .min(1)
      .max(2_000),

    overallScore: z
      .number()
      .finite()
      .min(0)
      .max(10),

    positives: z
      .array(
        z.string().trim().min(1).max(500),
      )
      .max(20),

    issues: z
      .array(ReviewIssueSchema)
      .max(100),

    suggestions: z
      .array(
        z.string().trim().min(1).max(500),
      )
      .max(20),

    verdict: ReviewVerdictSchema,
  })
  .strict();