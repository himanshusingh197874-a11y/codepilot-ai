import { prisma } from "../../lib/prisma";

export async function findGithubAccountByUserId(userId: string) {
  return prisma.githubAccount.findUnique({
    where: {
      userId,
    },
  });
}

export async function upsertRepository(
  userId: string,
  repo: any,
) {
  return prisma.repository.upsert({
    where: {
      githubRepoId: repo.id,
    },

    update: {
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      private: repo.private,
    },

    create: {
      githubRepoId: repo.id,
      owner: repo.owner.login,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      private: repo.private,
      userId,
    },
  });
}

export async function getRepositories(userId: string) {
  return prisma.repository.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}



export async function findRepositoryById(
  id: string,
  userId: string,
) 

{
  return prisma.repository.findUnique({
    where: { id, userId,},
    include: {
      pullRequests: {
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });
}

export async function updateWebhook(
  repositoryId: string,
  webhookId: string,
) {
  return prisma.repository.update({
    where: {
      id: repositoryId,
    },
    data: {
      enabled: true,
      webhookId,
    },
  });
}

export async function clearWebhook(
  repositoryId: string,
) {
  return prisma.repository.update({
    where: {
      id: repositoryId,
    },
    data: {
      enabled: false,
      webhookId: null,
    },
  });
}

export async function findRepositoryWithReviews(
  id: string,
  userId?: string,
) {
  return prisma.repository.findFirst({
    where: {
      id,
      ...(userId ? { userId } : {}),
    },
    include: {
      pullRequests: {
        include: {
          reviews: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
}

export async function getRepositoryInsightsData(
  repositoryId: string,
  userId: string,
) {
  return prisma.repository.findFirst({
    where: {
      id: repositoryId,
      userId,
    },

    include: {
      pullRequests: {
        include: {
          reviews: {
            include: {
              comments: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });
}

export async function getRepositoryDashboard(repositoryId: string) {
  const repository = await prisma.repository.findUnique({
    where: {
      id: repositoryId,
    },
  });

  if (!repository) {
    return null;
  }

  const [
    totalReviews,
    averageScore,
    totalPullRequests,
    totalIssues,
    recentReviews,
  ] = await Promise.all([
    prisma.review.count({
      where: {
        pullRequest: {
          repositoryId,
        },
      },
    }),

    prisma.review.aggregate({
      where: {
        pullRequest: {
          repositoryId,
        },
      },
      _avg: {
        score: true,
      },
    }),

    prisma.pullRequest.count({
      where: {
        repositoryId,
      },
    }),

    prisma.reviewComment.count({
      where: {
        review: {
          pullRequest: {
            repositoryId,
          },
        },
      },
    }),

    prisma.review.findMany({
      where: {
        pullRequest: {
          repositoryId,
        },
      },
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        pullRequest: true,
      },
    }),
  ]);

  return {
    repository,

    stats: {
      totalReviews,
      averageScore: Number(
        averageScore._avg.score?.toFixed(1) ?? 0,
      ),
      totalPullRequests,
      totalIssues,
    },

    recentReviews: recentReviews.map((review) => ({
  id: review.id,
  score: review.score,
  summary: review.summary,
  createdAt: review.createdAt,

  pullRequest: {
    id: review.pullRequest.id,
    githubPrId: review.pullRequest.githubPrId.toString(),
    number: review.pullRequest.number,
    title: review.pullRequest.title,
    state: review.pullRequest.state,
    repositoryId: review.pullRequest.repositoryId,
    createdAt: review.pullRequest.createdAt,
    updatedAt: review.pullRequest.updatedAt,
  },
})),
  };
}