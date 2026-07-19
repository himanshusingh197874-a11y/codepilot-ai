import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.route';
import authRoutes from '../modules/auth/auth.routes';
import repositoryRoutes from "../modules/repository/repository.routes";
import webhookRoutes from '../modules/webhook/webhook.routes';

export async function registerRoutes(app: FastifyInstance) {
  app.register(healthRoutes, {
    prefix: "/api/v1",
  });

  app.register(authRoutes, {
    prefix: "/api/v1/auth",
  });

  app.register(repositoryRoutes, {
    prefix: "/api/v1/repositories",
  });

   await app.register(webhookRoutes, {
    prefix: '/api/v1/webhooks',
  });
}