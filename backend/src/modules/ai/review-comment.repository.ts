import { createHash } from 'crypto';
import { prisma } from '../../lib/prisma';

export async function saveReviewComment(params: {
  reviewId: string;
  path: string;
  line: number;
  body: string;
  severity: string;
}) {
  const fingerprint = createHash('sha256')
  .update(`${params.path}:${params.line}:${params.body}`)
  .digest('hex');

  return prisma.reviewComment.upsert({
    where: { fingerprint },
    update: {},
    create: {
      reviewId: params.reviewId,
      path: params.path,
      line: params.line,
      body: params.body,
      severity: params.severity,
      fingerprint,
    },
  })
}