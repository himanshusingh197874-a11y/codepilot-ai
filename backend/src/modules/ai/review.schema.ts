import { z } from "zod";

export const SeveritySchema = z.enum([
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const ReviewIssueSchema = z.object({
  severity: SeveritySchema,
  message: z.string(),
  suggestion: z.string(),
});

export const ReviewSchema = z.object({
  summary: z.string(),
  score: z.number().min(0).max(10),
  issues: z.array(ReviewIssueSchema),
  suggestions: z.array(z.string()),
});

export type ReviewResponse = z.infer<typeof ReviewSchema>;