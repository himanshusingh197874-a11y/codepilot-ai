import { FastifyInstance } from 'fastify';
import {
  getReviews,
  getRepositoryReviewHistory,
  getStats,
  getReviewByIdController,
} from './review.controller';

export default async function reviewRoutes(app: FastifyInstance) {
  app.get('/reviews', getReviews);
  app.get('/reviews/stats', getStats);
  app.get<{ Params: { id: string } }>(
    '/reviews/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Reviews'],
        summary: 'Get a review with its pull request and findings',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            required: [
              'id',
              'repository',
              'pullRequest',
              'summary',
              'score',
              'findings',
            ],
            properties: {
              id: { type: 'string' },
              repository: { type: 'string' },
              score: { type: 'number' },
              summary: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              pullRequest: {
                type: 'object',
                required: ['number', 'title', 'state'],
                properties: {
                  number: { type: 'integer' },
                  title: { type: 'string' },
                  state: { type: 'string' },
                },
              },
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: [
                    'id',
                    'filePath',
                    'message',
                    'severity',
                  ],
                  properties: {
                    id: { type: 'string' },
                    filePath: { type: 'string' },
                    lineNumber: { type: 'integer', nullable: true },
                    message: { type: 'string' },
                    severity: { type: 'string' },
                    suggestion: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
          404: {
            type: 'object',
            required: ['message'],
            properties: { message: { type: 'string' } },
          },
        },
      },
    },
    getReviewByIdController,
  );
  app.get('/reviews/repository/:repoId', getRepositoryReviewHistory);
}
