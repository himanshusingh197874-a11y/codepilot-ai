import { createHash } from 'crypto';
import { prisma } from '../../lib/prisma';

export async function saveReviewComments(params: {
  reviewId: string;
  comments: {
    path: string;
    line: number;
    body: string;
    severity: string;
  }[];
}) {
  let saved = 0;

  for (const comment of params.comments) {
  const fingerprint = createHash('sha256')
    .update(`${comment.path}:${comment.line}:${comment.severity}`)
    .digest('hex');

  const existing = await prisma.reviewComment.findUnique({
    where: { fingerprint },
  });
  console.log('Fingerprint generated', {
  path: comment.path,
  line: comment.line,
  severity: comment.severity,
  fingerprint,
});

  if (existing) {
    console.log('Skipping duplicate review comment', {
      path: comment.path,
      line: comment.line, fingerprint,
    });
    continue;
  }

  await prisma.reviewComment.create({
    data: {
      reviewId: params.reviewId,
      path: comment.path,
      line: comment.line,
      body: comment.body,
      severity: comment.severity,
      fingerprint,
    },
  });


    saved++;
  }

  return saved;
}