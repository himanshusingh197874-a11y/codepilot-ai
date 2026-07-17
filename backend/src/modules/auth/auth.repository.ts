import { prisma } from "../../lib/prisma";

export async function findUserByGithubId(githubId: string) {
  return prisma.user.findUnique({
    where: {
      githubId,
    },
  });
}

export async function createGithubUser(data: {
  githubId: string;
  username: string;
  name: string | null;
  email: string | null;
  avatarUrl: string;
}) {
  return prisma.user.create({
    data,
  });
}

export async function updateGithubUser(
  id: string,
  data: {
    username: string;
    name: string | null;
    email: string |null;
    avatarUrl: string;
  },
) {
  return prisma.user.update({
    where: {
      id,
    },
    data,
  });
}