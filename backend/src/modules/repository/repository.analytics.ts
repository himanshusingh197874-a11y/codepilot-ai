import { prisma } from '../../lib/prisma';

export async function getRepositoryReviewTrend(repositoryId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      pullRequest: { repositoryId },
    },
    select: {
      createdAt: true,
      score: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = new Map<string, { count: number; totalScore: number }>();

  for (const review of reviews) {
    const day = review.createdAt.toISOString().slice(0, 10);

    const current = grouped.get(day) ?? { count: 0, totalScore: 0 };

    current.count += 1;
    current.totalScore += review.score;

    grouped.set(day, current);
  }

  return Array.from(grouped.entries()).map(([date, value]) => ({
    date,
    reviews: value.count,
    averageScore: Number((value.totalScore / value.count).toFixed(1)),
  }));
}