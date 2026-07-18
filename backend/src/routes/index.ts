import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.route';
import authRoutes from '../modules/auth/auth.routes';
import repositoryRoutes from "../modules/repository/repository.routes";

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
}