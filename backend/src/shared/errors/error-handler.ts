import { FastifyInstance } from 'fastify';

export async function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number((error as { statusCode?: unknown }).statusCode) || 500
        : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';

    reply.status(statusCode).send({
      success: false,
      message,
    });
  });
}
