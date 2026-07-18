import { FastifyRequest } from "fastify";

import { getGithubRepositories } from "../../providers/github/github.repository";

import {
  createWebhook,
  deleteWebhook,
} from "../../providers/github/github.webhook";

import * as repositoryRepository from "./repository.repository";

export async function syncRepositories(
  request: FastifyRequest,
) {
  const user = request.user as {
    sub: string;
  };

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(
      user.sub,
    );

  if (!githubAccount) {
    throw new Error("Github account not connected");
  }

  const repositories = await getGithubRepositories(
    githubAccount.accessToken,
  );

  await Promise.all(
    repositories.map((repo: any) =>
      repositoryRepository.upsertRepository(
        user.sub,
        repo,
      ),
    ),
  );

  return {
    synced: repositories.length,
    repositories,
  };
}

export async function listRepositories(
  request: FastifyRequest,
) {
  const user = request.user as {
    sub: string;
  };

  return repositoryRepository.getRepositories(user.sub);
}

export async function enableRepository(
  request: FastifyRequest,
) {
  const user = request.user as {
    sub: string;
  };

  const { id } = request.params as {
    id: string;
  };

  const repository =
    await repositoryRepository.findRepositoryById(
      id,
      user.sub,
    );

  if (!repository) {
    throw new Error("Repository not found");
  }

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(
      user.sub,
    );

  if (!githubAccount) {
    throw new Error("Github account not connected");
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

export async function disableRepository(
  request: FastifyRequest,
) {
  const user = request.user as {
    sub: string;
  };

  const { id } = request.params as {
    id: string;
  };

  const repository =
    await repositoryRepository.findRepositoryById(
      id,
      user.sub,
    );

  if (!repository) {
    throw new Error("Repository not found");
  }

  const githubAccount =
    await repositoryRepository.findGithubAccountByUserId(
      user.sub,
    );

  if (!githubAccount) {
    throw new Error("Github account not connected");
  }

  if (repository.webhookId) {
    await deleteWebhook(
      githubAccount.accessToken,
      repository.owner,
      repository.name,
      Number(repository.webhookId),
    );
  }

  return repositoryRepository.clearWebhook(
    repository.id,
  );
}