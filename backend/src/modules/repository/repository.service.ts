import { FastifyRequest } from 'fastify';

import { getGithubRepositories } from '../../providers/github/github.repository';
import {
  createWebhook,
  deleteWebhook,
} from '../../providers/github/github.webhook';
import { listOpenPullRequests } from '../../providers/github/github.pulls';
import {
  ReviewPipelineError,
  runPullRequestReview,
} from '../webhook/webhook.service';
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

export async function triggerPullRequestReview(
  request: FastifyRequest<{ Params: { id: string; number: string } }>,
) {
  const user = request.user as { sub: string };
  const pullNumber = Number(request.params.number);

  if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
    throw new ReviewPipelineError('Pull request not found', 404);
  }

  const repository = await repositoryRepository.findRepositoryById(
    request.params.id,
    user.sub,
  );

  if (!repository) {
    throw new ReviewPipelineError('Repository not found', 404);
  }

  const githubAccount = await repositoryRepository.findGithubAccountByUserId(
    user.sub,
  );

  if (!githubAccount) {
    throw new ReviewPipelineError('AI review failed', 500);
  }

  const review = await runPullRequestReview({
    repository,
    accessToken: githubAccount.accessToken,
    pullNumber,
  });

  return { reviewId: review.id, message: 'AI review completed' };
}

export async function getRepositoryInsights(
  repositoryId: string,
  userId: string,
) {
  const repository =
    await repositoryRepository.getRepositoryInsightsData(
      repositoryId,
      userId,
    );

  if (!repository) {
    return null;
  }

  const reviews = repository.pullRequests.flatMap(pr => pr.reviews);

  const totalReviews = reviews.length;

  const averageScore =
    totalReviews === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.score, 0) /
        totalReviews;

  const totalComments =
    reviews.reduce(
      (sum, review) => sum + review.comments.length,
      0,
    );

  return {
    repository: {
      id: repository.id,
      name: repository.name,
      fullName: repository.fullName,
    },

    stats: {
      totalPullRequests: repository.pullRequests.length,
      totalReviews,
      averageScore: Number(averageScore.toFixed(1)),
      totalComments,
    },

    recentReviews: reviews
      .sort(
        (a, b) =>
          b.createdAt.getTime() -
          a.createdAt.getTime(),
      )
      .slice(0, 10)
      .map(review => ({
        id: review.id,
        score: review.score,
        summary: review.summary,
        createdAt: review.createdAt,
      })),
  };
}


