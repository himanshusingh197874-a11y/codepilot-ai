import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

export default fp(async function (app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CodePilot AI API',
        description: 'AI Code Review & PR Assistant',
        version: '1.0.0',
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: '/docs',
  });
});
