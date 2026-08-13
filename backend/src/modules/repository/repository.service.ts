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
import { getRepositoryDashboard } from './repository.repository';

export async function syncRepositories(request: FastifyRequest) {
  const user = request.user as { sub: string };
  const log = request.log;

  log.info({ userId: user.sub }, "Repository sync started");

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(user.sub);

  if (!githubAccount) {
    log.warn({ userId: user.sub }, "GitHub account not connected for repository sync");
    throw new Error('Github account not connected');
  }

  log.info({ userId: user.sub }, "GitHub account found for repository sync");

  const repositories = await getGithubRepositories(
    githubAccount.accessToken,
    log,
  );

  log.info(
    { userId: user.sub, repositoryCount: repositories.length },
    "GitHub repositories received for sync",
  );

  if (repositories.length === 0) {
    log.warn(
      { userId: user.sub },
      "GitHub returned no repositories; verify the GitHub account has repository access and approved the repo scope",
    );
  }

  try {
    await Promise.all(
      repositories.map(async (repo: any) => {
        const repositoryName =
          repo.full_name ?? `${repo.owner?.login}/${repo.name}`;

        log.info(
          { userId: user.sub, repository: repositoryName },
          "Saving repository",
        );
        const savedRepository = await repositoryRepository.upsertRepository(
          user.sub,
          repo,
        );
        log.info(
          { userId: user.sub, repository: savedRepository.fullName },
          "Repository saved",
        );
      }),
    );
  } catch (error) {
    log.error({ err: error, userId: user.sub }, "Repository sync persistence failed");
    throw error;
  }

  log.info(
    { userId: user.sub, repositoryCount: repositories.length },
    "Repository sync completed",
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

  const reviews = repository.pullRequests.flatMap((pr) => pr.reviews);
  const totalReviews = reviews.length;
  const comments = reviews.flatMap((review) => review.comments);

  const trendMap = new Map<
  string,
  {
    total: number;
    count: number;
  }
>();

for (const review of reviews) {
  const date = review.createdAt.toISOString().split("T")[0];

  const existing = trendMap.get(date);

  if (existing) {
    existing.total += review.score;
    existing.count += 1;
  } else {
    trendMap.set(date, {
      total: review.score,
      count: 1,
    });
  }
}

const scoreTrend = [...trendMap.entries()]
  .map(([date, value]) => ({
    date,
    score: Number((value.total / value.count).toFixed(1)),
  }))
  .sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime(),
  );

  const severity = {
    high: comments.filter((c) =>
      ['high', 'critical', 'error'].includes(c.severity.toLowerCase()),
    ).length,
    medium: comments.filter((c) =>
      ['medium', 'warning'].includes(c.severity.toLowerCase()),
    ).length,
    low: comments.filter((c) =>
      ['low', 'info', 'suggestion'].includes(c.severity.toLowerCase()),
    ).length,
  };

  const fileMap = new Map<string, number>();

comments.forEach((comment) => {
  fileMap.set(
    comment.path,
    (fileMap.get(comment.path) ?? 0) + 1,
  );
});

const topFiles = [...fileMap.entries()]
  .map(([path, findings]) => ({
    path,
    findings,
  }))
  .sort((a, b) => b.findings - a.findings)
  .slice(0, 5);
  
  const averageScore =
  reviews.length === 0
    ? 0
    : reviews.reduce((sum, review) => sum + review.score, 0) /
      reviews.length;

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

  severity,

  topFiles,

  scoreTrend,

  recentReviews: [...reviews]
    .sort(
      (a, b) =>
        b.createdAt.getTime() -
        a.createdAt.getTime(),
    )
    .slice(0, 10)
    .map((review) => ({
      id: review.id,
      score: review.score,
      summary: review.summary,
      createdAt: review.createdAt,
    })),
};

}
export async function getRepositoryDashboardService(id: string) {
  const dashboard = await getRepositoryDashboard(id);

  if (!dashboard) {
    throw new Error('Repository not found');
  }

  return dashboard;
}

