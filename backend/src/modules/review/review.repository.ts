import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ReviewListQuery } from './review.schema';

type ReviewWithRepository = Prisma.ReviewGetPayload<{
  include: { pullRequest: { include: { repository: true } } };
}>;

type FindingInput = Pick<
  Prisma.FindingCreateManyInput,
  'severity' | 'filePath' | 'lineNumber' | 'message' | 'suggestion'
>;

function serializeReview(review: ReviewWithRepository) {
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

export async function listReviews(query: ReviewListQuery) {
  const {
    page,
    limit,
    repositoryId,
    state,
    minScore,
    maxScore,
    from,
    to,
    sortBy,
    order,
  } = query;

  const skip = (page - 1) * limit;

  const pullRequestWhere: Prisma.PullRequestWhereInput = {};
  const where: Prisma.ReviewWhereInput = { pullRequest: pullRequestWhere };

  if (repositoryId) {
    pullRequestWhere.repositoryId = repositoryId;
  }

  if (state) {
    pullRequestWhere.state = state;
  }

  if (minScore !== undefined || maxScore !== undefined) {
    where.score = {};

    if (minScore !== undefined) where.score.gte = minScore;
    if (maxScore !== undefined) where.score.lte = maxScore;
  }

  if (from || to) {
    where.createdAt = {};

    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      include: {
        pullRequest: {
          include: { repository: true },
        },
      },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    items: items.map(serializeReview),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}

export async function getReviewById(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      pullRequest: {
        include: { repository: true },
      },
      findings: true,
    },
  });

  return review;
}

export async function createFindings(
  reviewId: string,
  findings: readonly FindingInput[],
) {
  if (findings.length === 0) {
    return { count: 0 };
  }

  return prisma.finding.createMany({
    data: findings.map((finding) => ({ ...finding, reviewId })),
  });
}

export async function getFindingsByReviewId(reviewId: string) {
  return prisma.finding.findMany({
    where: { reviewId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getRepositoryReviews(repositoryId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      pullRequest: { repositoryId },
    },
    orderBy: { createdAt: 'desc' },
    include: { pullRequest: { include: { repository: true } } },
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
