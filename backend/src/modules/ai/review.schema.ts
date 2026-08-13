import { z } from "zod";

export const SeveritySchema = z.enum([
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const ReviewIssueSchema = z
  .object({
    severity: SeveritySchema,
    message: z.string().trim().min(1).max(1_000),
    suggestion: z.string().trim().min(1).max(1_000),
    path: z.string().trim().min(1).max(1_000).optional(),
    line: z.number().int().positive().optional(),
  })
  .strict();

export type ReviewIssue = z.infer<typeof ReviewIssueSchema>;

export const ReviewSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    score: z.number().finite().min(0).max(10),
    issues: z.array(ReviewIssueSchema).max(100),
    suggestions: z.array(z.string().trim().min(1).max(500)).max(20),
  })
  .strict();

export type ReviewResponse = z.infer<typeof ReviewSchema>;
