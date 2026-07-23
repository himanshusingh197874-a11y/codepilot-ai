import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.route';
import authRoutes from '../modules/auth/auth.routes';
import { repositoryRoutes } from '../modules/repository/repository.routes';
import webhookRoutes from '../modules/webhook/webhook.routes';
import reviewRoutes from '../modules/review/review.routes';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes, {
    prefix: '/api/v1',
  });

  await app.register(authRoutes, {
    prefix: '/api/v1/auth',
  });

  await app.register(repositoryRoutes, {
    prefix: '/api/v1/repositories',
  });

  await app.register(webhookRoutes, {
    prefix: '/api/v1/webhooks',
  });

  await app.register(reviewRoutes, {
    prefix: '/api/v1',
  });
}
