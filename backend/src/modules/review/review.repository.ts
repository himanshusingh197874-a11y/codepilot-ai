import { prisma } from '../../lib/prisma';

function serializeReview(review: any) {
  return {
    ...review,
    pullRequest: review.pullRequest
      ? {
          ...review.pullRequest,
          githubPrId: review.pullRequest.githubPrId.toString(),
          repository: review.pullRequest.repository ?? undefined,
        }
      : undefined,
  };
}

export async function listReviews(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        pullRequest: {
          include: { repository: true },
        },
      },
    }),
    prisma.review.count(),
  ]);

  return {
    items: items.map(serializeReview),
    total,
    page,
    limit,
  };
}

export async function getReviewById(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      pullRequest: {
        include: { repository: true },
      },
      comments: true,
    },
  });

  return review ? serializeReview(review) : null;
}

export async function getRepositoryReviews(repositoryId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      pullRequest: { repositoryId },
    },
    orderBy: { createdAt: 'desc' },
    include: { pullRequest: true },
  });

  return reviews.map(serializeReview);
}

export async function getReviewStats() {
  const [totalReviews, avgScore, totalComments] = await Promise.all([
    prisma.review.count(),
    prisma.review.aggregate({ _avg: { score: true } }),
    prisma.reviewComment.count(),
  ]);

  return {
    totalReviews,
    averageScore: Number(avgScore._avg.score?.toFixed(1) ?? 0),
    totalComments,
  };
}