import { FastifyReply, FastifyRequest } from "fastify";

import * as repositoryService from "./repository.service";

export async function syncRepositories(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const result =
    await repositoryService.syncRepositories(request);

  return reply.send(result);
}

export async function listRepositories(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const repositories =
    await repositoryService.listRepositories(request);

  return reply.send(repositories);
}

export async function enableRepository(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const repository =
    await repositoryService.enableRepository(
      request,
    );

  return reply.send(repository);
}

export async function disableRepository(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const repository =
    await repositoryService.disableRepository(
      request,
    );

  return reply.send(repository);
}