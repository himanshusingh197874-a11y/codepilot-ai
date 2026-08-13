import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ReviewListQuery } from './review.schema';

/* ============================================================
 * Types
 * ============================================================ */

type PersistedIssue = {
  severity: string;
  message?: string;
  suggestion?: string;
  path?: string;
  line?: number;
  codeSnippet?: string;
  [key: string]: Prisma.JsonValue | undefined;
};

type SerializedReview = {
  id: string;
  score: number;
  summary: string;
  positives: Prisma.JsonValue;
  issues: PersistedIssue[];
  suggestions: Prisma.JsonValue;
  verdict: string;
  createdAt: Date;
  pullRequest?: {
    githubPrId: string;
    repository?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/* ============================================================
 * JSON helpers
 * ============================================================ */

function isRecord(
  value: Prisma.JsonValue,
): value is Prisma.JsonObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parsePersistedIssues(
  value: Prisma.JsonValue,
): PersistedIssue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((issue) => {
      const parsed: PersistedIssue = {
        severity:
          typeof issue.severity === 'string'
            ? issue.severity
            : 'unknown',
      };

      if (typeof issue.message === 'string') {
        parsed.message = issue.message;
      }

      if (typeof issue.suggestion === 'string') {
        parsed.suggestion = issue.suggestion;
      }

      if (typeof issue.path === 'string') {
        parsed.path = issue.path;
      }

      if (typeof issue.line === 'number') {
        parsed.line = issue.line;
      }

      if (typeof issue.codeSnippet === 'string') {
        parsed.codeSnippet = issue.codeSnippet;
      }

      for (const [key, item] of Object.entries(issue)) {
        if (
          key !== 'severity' &&
          key !== 'message' &&
          key !== 'suggestion' &&
          key !== 'path' &&
          key !== 'line' &&
          key !== 'codeSnippet'
        ) {
          parsed[key] = item;
        }
      }

      return parsed;
    });
}

/* ============================================================
 * Review serialization
 * ============================================================ */

function serializeReview(
  review: Prisma.ReviewGetPayload<{
    include: {
      pullRequest: {
        include: {
          repository: true;
        };
      };
    };
  }>,
): SerializedReview {
  const issues = parsePersistedIssues(review.issues);

  return {
    ...review,

    issues,

    pullRequest: review.pullRequest
      ? {
          ...review.pullRequest,

          githubPrId:
            review.pullRequest.githubPrId.toString(),

          repository:
            review.pullRequest.repository ??
            undefined,
        }
      : undefined,
  };
}

/* ============================================================
 * List Reviews
 * ============================================================ */

export async function listReviews(
  query: ReviewListQuery,
) {
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

  /*
   * Explicitly type the Prisma where object.
   *
   * This fixes:
   *
   * Type 'string' is not assignable to type 'undefined'
   *
   * and:
   *
   * Type '"open" | "closed" | "merged"' is not
   * assignable to type 'undefined'
   */
  const where: Prisma.ReviewWhereInput = {
    pullRequest: {},
  };

  if (repositoryId) {
    where.pullRequest = {
      ...(where.pullRequest as Prisma.PullRequestWhereInput),
      repositoryId,
    };
  }

  if (state) {
    where.pullRequest = {
      ...(where.pullRequest as Prisma.PullRequestWhereInput),
      state,
    };
  }

  if (minScore !== undefined || maxScore !== undefined) {
    where.score = {};

    if (minScore !== undefined) {
      where.score.gte = minScore;
    }

    if (maxScore !== undefined) {
      where.score.lte = maxScore;
    }
  }

  if (from || to) {
    where.createdAt = {};

    if (from) {
      where.createdAt.gte = new Date(from);
    }

    if (to) {
      where.createdAt.lte = new Date(to);
    }
  }

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: order,
      },
      include: {
        pullRequest: {
          include: {
            repository: true,
          },
        },
      },
    }),

    prisma.review.count({
      where,
    }),
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

/* ============================================================
 * Get Review By ID
 * ============================================================ */

export async function getReviewById(
  id: string,
) {
  const review = await prisma.review.findUnique({
    where: {
      id,
    },

    include: {
      pullRequest: {
        include: {
          repository: true,
        },
      },

      comments: true,
    },
  });

  if (!review) {
    return null;
  }

  /*
   * The getReviewById query also includes comments,
   * therefore we serialize it separately instead of
   * forcing the list-review payload type onto it.
   */

  return {
    ...review,

    issues: parsePersistedIssues(review.issues),

    pullRequest: review.pullRequest
      ? {
          ...review.pullRequest,

          githubPrId:
            review.pullRequest.githubPrId.toString(),

          repository:
            review.pullRequest.repository ??
            undefined,
        }
      : undefined,
  };
}

/* ============================================================
 * Get Repository Reviews
 * ============================================================ */

export async function getRepositoryReviews(
  repositoryId: string,
) {
  const reviews = await prisma.review.findMany({
    where: {
      pullRequest: {
        repositoryId,
      },
    },

    orderBy: {
      createdAt: 'desc',
    },

    include: {
      pullRequest: true,
    },
  });

  return reviews.map((review) => ({
    ...review,

    issues: parsePersistedIssues(review.issues),

    pullRequest: review.pullRequest
      ? {
          ...review.pullRequest,

          githubPrId:
            review.pullRequest.githubPrId.toString(),
        }
      : undefined,
  }));
}

/* ============================================================
 * Review Statistics
 * ============================================================ */

export async function getReviewStats() {
  const [
    totalReviews,
    avgScore,
    totalComments,
    activeRepositories,
    highIssues,
    mediumIssues,
    lowIssues,
    recentReviews,
  ] = await Promise.all([
    /* Total reviews */

    prisma.review.count(),

    /* Average review score */

    prisma.review.aggregate({
      _avg: {
        score: true,
      },
    }),

    /* Total persisted comments */

    prisma.reviewComment.count(),

    /* Active repositories */

    prisma.repository.count({
      where: {
        enabled: true,
      },
    }),

    /* High severity comments */

    prisma.reviewComment.count({
      where: {
        severity: 'ERROR',
      },
    }),

    /* Medium severity comments */

    prisma.reviewComment.count({
      where: {
        severity: 'WARNING',
      },
    }),

    /* Low severity comments */

    prisma.reviewComment.count({
      where: {
        severity: 'INFO',
      },
    }),

    /*
     * Fetch reviews from the last 7 calendar days.
     *
     * Daily analytics are calculated in application
     * code so this remains database-agnostic.
     */

    prisma.review.findMany({
      orderBy: {
        createdAt: 'desc',
      },

      where: {
        createdAt: {
          gte: (() => {
            const date = new Date();

            date.setHours(
              0,
              0,
              0,
              0,
            );

            date.setDate(
              date.getDate() - 6,
            );

            return date;
          })(),
        },
      },

      include: {
        pullRequest: true,
        comments: true,
      },
    }),
  ]);

  /* ==========================================================
   * Create 7 daily buckets
   * ========================================================== */

  const dailyMap = new Map<
    string,
    {
      date: string;
      day: string;
      reviews: number;
      scores: number[];
      findings: number;
      comments: number;
      highIssues: number;
      pullRequestIds: Set<string>;
    }
  >();

  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0,
  );

  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(today);

    date.setDate(
      today.getDate() - i,
    );

    const dateKey =
      date.toISOString().slice(0, 10);

    dailyMap.set(dateKey, {
      date: dateKey,

      day: date.toLocaleDateString(
        'en-US',
        {
          weekday: 'short',
        },
      ),

      reviews: 0,

      scores: [],

      findings: 0,

      comments: 0,

      highIssues: 0,

      pullRequestIds:
        new Set<string>(),
    });
  }

  /* ==========================================================
   * Populate daily buckets
   * ========================================================== */

  for (const review of recentReviews) {
    const reviewDate =
      new Date(review.createdAt);

    reviewDate.setHours(
      0,
      0,
      0,
      0,
    );

    const dateKey =
      reviewDate.toISOString().slice(0, 10);

    const bucket =
      dailyMap.get(dateKey);

    if (!bucket) {
      continue;
    }

    /*
     * Count unique pull requests.
     */

    bucket.pullRequestIds.add(
      review.pullRequestId,
    );

    /*
     * Store review score.
     */

    bucket.scores.push(
      review.score,
    );

    /*
     * Parse persisted AI issues safely.
     */

    const issues =
      parsePersistedIssues(
        review.issues,
      );

    bucket.findings +=
      issues.length;

    /*
     * Count high/critical AI issues.
     */

    for (const issue of issues) {
      const severity =
        issue.severity.toLowerCase();

      if (
        severity === 'high' ||
        severity === 'critical' ||
        severity === 'error'
      ) {
        bucket.highIssues += 1;
      }
    }

    /*
     * Count persisted inline comments.
     */

    for (const comment of review.comments) {
      bucket.comments += 1;

      bucket.findings += 1;

      const severity =
        String(
          comment.severity,
        ).toLowerCase();

      if (
        severity === 'error' ||
        severity === 'high' ||
        severity === 'critical'
      ) {
        bucket.highIssues += 1;
      }
    }
  }

  /* ==========================================================
   * Convert buckets into API response
   * ========================================================== */

  const dailyActivity =
    Array.from(
      dailyMap.values(),
    ).map((bucket) => ({
      date: bucket.date,

      day: bucket.day,

      /*
       * Reviews here represent unique PRs reviewed.
       */

      reviews:
        bucket.pullRequestIds.size,

      /*
       * Keep pullRequests explicit for the
       * frontend analytics page.
       */

      pullRequests:
        bucket.pullRequestIds.size,

      comments:
        bucket.comments,

      findings:
        bucket.findings,

      highIssues:
        bucket.highIssues,

      averageScore:
        bucket.scores.length > 0
          ? Number(
              (
                bucket.scores.reduce(
                  (
                    sum,
                    score,
                  ) =>
                    sum + score,
                  0,
                ) /
                bucket.scores.length
              ).toFixed(1),
            )
          : 0,
    }));

  /* ==========================================================
   * Final response
   * ========================================================== */

  return {
    totalReviews,

    averageScore:
      avgScore._avg.score !== null
        ? Number(
            avgScore._avg.score.toFixed(
              1,
            ),
          )
        : 0,

    totalComments,

    activeRepositories,

    highIssues,

    mediumIssues,

    lowIssues,

    dailyActivity,
  };
}