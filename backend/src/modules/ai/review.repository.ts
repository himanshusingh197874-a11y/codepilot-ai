import { prisma } from '../../lib/prisma';
import { FileReview } from './ai.types';

export async function saveReview(params: {
  repositoryId: string;
  githubPrId: bigint;
  number: number;
  title: string;
  state: string;
  reviews: FileReview[];
}) {
  const pr = await prisma.pullRequest.upsert({
    where: { githubPrId: params.githubPrId },
    update: {
      title: params.title,
      state: params.state,
    },
    create: {
      githubPrId: params.githubPrId,
      number: params.number,
      title: params.title,
      state: params.state,
      repositoryId: params.repositoryId,
    },
  });

  const avgScore =
    params.reviews.reduce((sum, r) => sum + r.score, 0) /
    Math.max(params.reviews.length, 1);

  const review = await prisma.review.create({
    data: {
      pullRequestId: pr.id,
      summary: `${params.reviews.length} files analyzed`,
      score: Number(avgScore.toFixed(1)),
    },
  });

  return review;
}