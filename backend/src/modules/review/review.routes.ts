import { FastifyInstance } from 'fastify';
import {
  getReviews,
  getReview,
  getRepositoryReviewHistory,
  getStats,
} from './review.controller';

export default async function reviewRoutes(app: FastifyInstance) {
  app.get('/reviews', getReviews);
  app.get('/reviews/stats', getStats);
  app.get('/reviews/:id', getReview);
  app.get('/reviews/repository/:repoId', getRepositoryReviewHistory);
}