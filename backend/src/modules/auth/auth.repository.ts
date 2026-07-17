import { prisma } from "../../lib/prisma";

export async function findUserByGithubId(githubUserId: string) {
  return prisma.user.findFirst({
    where: {
      githubAccount: {
        githubUserId,
      },
    },
    include: {
      githubAccount: true,
    },
  });
}

export async function createGithubUser(data: {
  githubUserId: string;
  accessToken: string;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}) {
  return prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,

      githubAccount: {
        create: {
          githubUserId: data.githubUserId,
          accessToken: data.accessToken,
        },
      },
    },
    include: {
      githubAccount: true,
    },
  });
}

export async function updateGithubUser(
  id: string,
  data: {
    githubUserId: string;
    accessToken: string;
    username: string;
    name: string | null;
    email: string | null;
    avatarUrl: string;
  },
) {
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      username: data.username,
      name: data.name,
      email: data.email,
      avatarUrl: data.avatarUrl,

      githubAccount: {
        update: {
          githubUserId: data.githubUserId,
          accessToken: data.accessToken,
        },
      },
    },
    include: {
      githubAccount: true,
    },
  });
}