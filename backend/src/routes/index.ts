import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.route';
import authRoutes from '../modules/auth/auth.routes';

export async function registerRoutes(app: FastifyInstance) {
  app.register(healthRoutes, {
    prefix: '/api/v1',
    
  });
  
  app.register(authRoutes, {
  prefix: '/api/v1/auth',
});
}
