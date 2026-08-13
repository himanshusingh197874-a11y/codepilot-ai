import { z } from 'zod';

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),

  repositoryId: z.string().optional(),
  state: z.enum(['open', 'closed', 'merged']).optional(),

  minScore: z.coerce.number().min(0).max(10).optional(),
  maxScore: z.coerce.number().min(0).max(10).optional(),

  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),

  sortBy: z.enum(['createdAt', 'score']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;

export const ReviewIssueSchema = z
  .object({
    severity: z.enum([
      'critical',
      'high',
      'medium',
      'low',
      'info',
    ]),

    message: z
      .string()
      .trim()
      .min(1)
      .max(2_000),

    suggestion: z
      .string()
      .trim()
      .min(1)
      .max(2_000),

    path: z
      .string()
      .trim()
      .min(1)
      .optional(),

    line: z
      .number()
      .int()
      .min(1)
      .optional(),
  })
  .strict();

export const ReviewSchema = z
  .object({
    summary: z
      .string()
      .trim()
      .min(1)
      .max(2_000),

    score: z
      .number()
      .finite()
      .min(0)
      .max(10),

    issues: z
      .array(ReviewIssueSchema)
      .max(100),

    suggestions: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(500),
      )
      .max(20),
  })
  .strict();

export type AIReviewResponse = z.infer<typeof ReviewSchema>;