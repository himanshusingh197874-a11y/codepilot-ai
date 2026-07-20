import { getPullRequestFiles } from './pr.github';
import { prisma } from '../../lib/prisma';

export async function fetchPullRequestFiles(
  userId: string,
  owner: string,
  repo: string,
  pullNumber: number,
) {
  // Find the user’s GitHub account
  const githubAccount = await prisma.githubAccount.findUnique({
    where: { userId },
  });

  if (!githubAccount) {
    throw new Error('GitHub account not connected');
  }

  // Fetch changed files for the PR
  const files = await getPullRequestFiles(
    githubAccount.accessToken,
    owner,
    repo,
    pullNumber,
  );

  return files;
}