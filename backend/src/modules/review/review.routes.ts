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
              'positives',
              'issues',
              'suggestions',
              'verdict',
              'findings',
            ],
            properties: {
              id: { type: 'string' },
              repository: { type: 'string' },
              score: { type: 'number' },
              summary: { type: 'string' },
              positives: { type: 'array', items: { type: 'string' } },
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['severity', 'message', 'suggestion'],
                  properties: {
                    severity: { type: 'string' },
                    message: { type: 'string' },
                    suggestion: { type: 'string' },
                    path: { type: 'string' },
                    line: { type: 'integer', minimum: 1 },
                  },
                },
              },
              suggestions: { type: 'array', items: { type: 'string' } },
              verdict: { type: 'string', enum: ['approve', 'request_changes'] },
              createdAt: { type: 'string', format: 'date-time' },
              pullRequest: {
                type: 'object',
                required: ['number', 'title'],
                properties: {
                  number: { type: 'integer' },
                  title: { type: 'string' },
                },
              },
              findings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'source', 'message', 'severity'],
                  properties: {
                    id: { type: 'string' },
                    source: { type: 'string', enum: ['ai', 'inline'] },
                    path: { type: 'string' },
                    line: { type: 'integer' },
                    message: { type: 'string' },
                    suggestion: { type: 'string' },
                    severity: { type: 'string' },
                    codeSnippet: { type: 'string' },
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
