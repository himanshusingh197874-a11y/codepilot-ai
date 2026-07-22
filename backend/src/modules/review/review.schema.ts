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