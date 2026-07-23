import { FastifyRequest } from 'fastify';

import { getGithubRepositories } from '../../providers/github/github.repository';
import {
  createWebhook,
  deleteWebhook,
} from '../../providers/github/github.webhook';
import { listOpenPullRequests } from '../../providers/github/github.pulls';
import * as repositoryRepository from './repository.repository';

export async function syncRepositories(request: FastifyRequest) {
  const user = request.user as { sub: string };

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(user.sub);

  if (!githubAccount) {
    throw new Error('Github account not connected');
  }

  const repositories = await getGithubRepositories(
    githubAccount.accessToken,
  );

  await Promise.all(
    repositories.map((repo: any) =>
      repositoryRepository.upsertRepository(user.sub, repo),
    ),
  );

  return {
    synced: repositories.length,
    repositories,
  };
}

export async function listRepositories(request: FastifyRequest) {
  const user = request.user as { sub: string };

  return repositoryRepository.getRepositories(user.sub);
}

export async function enableRepository(request: FastifyRequest) {
  const user = request.user as { sub: string };
  const { id } = request.params as { id: string };

  const repository = await repositoryRepository.findRepositoryById(
    id,
    user.sub,
  );

  if (!repository) {
    throw new Error('Repository not found');
  }

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(user.sub);

  if (!githubAccount) {
    throw new Error('Github account not connected');
  }

  const webhook = await createWebhook(
    githubAccount.accessToken,
    repository.owner,
    repository.name,
  );

  return repositoryRepository.updateWebhook(
    repository.id,
    webhook.id.toString(),
  );
}

export async function disableRepository(request: FastifyRequest) {
  const user = request.user as { sub: string };
  const { id } = request.params as { id: string };

  const repository = await repositoryRepository.findRepositoryById(
    id,
    user.sub,
  );

  if (!repository) {
    throw new Error('Repository not found');
  }

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(user.sub);

  if (!githubAccount) {
    throw new Error('Github account not connected');
  }

  if (repository.webhookId) {
    await deleteWebhook(
      githubAccount.accessToken,
      repository.owner,
      repository.name,
      Number(repository.webhookId),
    );
  }

  return repositoryRepository.clearWebhook(repository.id);
}

export async function getRepositoryDetails(id: string, userId?: string) {
  const repository = await repositoryRepository.findRepositoryWithReviews(
    id,
    userId,
  );

  if (!repository) {
    return null;
  }

  const allReviews = repository.pullRequests
    .flatMap((pr) => pr.reviews)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalReviews = allReviews.length;

  const averageScore =
    totalReviews === 0
      ? 0
      : allReviews.reduce((sum, review) => sum + review.score, 0) /
        totalReviews;

  return {
    id: repository.id,
    fullName: repository.fullName,
    owner: repository.owner,
    name: repository.name,
    defaultBranch: repository.defaultBranch,
    enabled: repository.enabled,
    totalReviews,
    averageScore: Number(averageScore.toFixed(1)),
    recentReviews: allReviews.slice(0, 10).map((review) => ({
      id: review.id,
      score: review.score,
      summary: review.summary,
      createdAt: review.createdAt,
    })),
  };
}

export async function getOpenPullRequests(
  request: FastifyRequest<{ Params: { id: string } }>,
) {
  const user = request.user as { sub: string };
  const { id } = request.params;

  const repository = await repositoryRepository.findRepositoryById(id, user.sub);

  if (!repository) {
    throw new Error('Repository not found');
  }

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(user.sub);

  if (!githubAccount) {
    throw new Error('Github account not connected');
  }

  return listOpenPullRequests(
    githubAccount.accessToken,
    repository.owner,
    repository.name,
  );
}
