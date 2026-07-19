import { FastifyInstance } from 'fastify';
import * as webhookController from './webhook.controller';

export default async function webhookRoutes(app: FastifyInstance) {
  app.post('/github', webhookController.githubWebhook);
}