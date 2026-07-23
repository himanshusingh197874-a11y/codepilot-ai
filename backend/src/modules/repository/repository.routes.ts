import { FastifyInstance } from 'fastify';
import {
  syncRepositories,
  listRepositories,
  enableRepository,
  disableRepository,
  getRepositoryByIdController,
  getRepositoryTrendController,
} from './repository.controller';

export async function repositoryRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/sync',
    { preHandler: [fastify.authenticate] },
    syncRepositories,
  );

  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    listRepositories,
  );

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    getRepositoryByIdController,
  );

  fastify.get<{ Params: { id: string } }>(
    '/:id/trend',
    { preHandler: [fastify.authenticate] },
    getRepositoryTrendController,
  );

  fastify.patch<{ Params: { id: string } }>(
    '/:id/enable',
    { preHandler: [fastify.authenticate] },
    enableRepository,
  );

  fastify.patch<{ Params: { id: string } }>(
    '/:id/disable',
    { preHandler: [fastify.authenticate] },
    disableRepository,
  );
}