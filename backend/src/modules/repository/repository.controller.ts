import { FastifyReply, FastifyRequest } from 'fastify';
import * as repositoryService from './repository.service';
import {
  getRepositoryDashboardService,
} from './repository.service';
import { ReviewPipelineError } from '../webhook/webhook.service';

export async function syncRepositories(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  request.log.info("Repository sync endpoint invoked");
  const result = await repositoryService.syncRepositories(request);
  return reply.send(result);
}

export async function listRepositories(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const repositories = await repositoryService.listRepositories(request);
  return reply.send(repositories);
}

export async function enableRepository(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const repository = await repositoryService.enableRepository(request);
  return reply.send(repository);
}

export async function disableRepository(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const repository = await repositoryService.disableRepository(request);
  return reply.send(repository);
}

export async function getRepositoryByIdController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = request.user as { sub: string };
  const repository = await repositoryService.getRepositoryDetails(
    request.params.id,
    user.sub,
  );

  if (!repository) {
    return reply.code(404).send({
      message: 'Repository not found',
    });
  }

  return reply.send(repository);
}

export async function getRepositoryInsightsController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const user = request.user as { sub: string };

  const insights = await repositoryService.getRepositoryInsights(
    request.params.id,
    user.sub,
  );

  return reply.send(insights);
}

export async function getOpenPullRequestsController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const prs = await repositoryService.getOpenPullRequests(request);
  return reply.send(prs);
}

export async function triggerPullRequestReviewController(
  request: FastifyRequest<{ Params: { id: string; number: string } }>,
  reply: FastifyReply,
) {
  try {
    const result = await repositoryService.triggerPullRequestReview(request);
    return reply.send(result);
  } catch (error) {
    if (error instanceof ReviewPipelineError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }

    return reply.code(500).send({ message: 'AI review failed' });
  }
}

export async function getRepositoryDashboardHandler(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply,
) {
  try {
    const dashboard = await getRepositoryDashboardService(
      request.params.id,
    );

    return reply.send(dashboard);
  } catch {
    return reply.status(404).send({
      message: 'Repository not found',
    });
  }
}
