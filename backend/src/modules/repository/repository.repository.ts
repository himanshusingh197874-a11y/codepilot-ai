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
          },
        },
      },
    },
  });
}