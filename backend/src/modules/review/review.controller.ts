import { FastifyReply, FastifyRequest } from 'fastify';
import {
  listReviews,
  getReviewById,
  getRepositoryReviews,
  getReviewStats,
} from './review.repository';

export async function getReviews( request: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, reply: FastifyReply,) {
  const page = Number(request.query.page ?? 1);
  const limit = Number(request.query.limit ?? 10);

  const result = await listReviews(page, limit);
  return reply.send(result);
}

export async function getReview( request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply,) {
  const review = await getReviewById(request.params.id);

  if (!review) {
    return reply.code(404).send({ message: 'Review not found' });
  }

  return reply.send(review);
}

export async function getRepositoryReviewHistory( request: FastifyRequest<{ Params: { repoId: string } }>, reply: FastifyReply,) {
  const reviews = await getRepositoryReviews(request.params.repoId);
  return reply.send(reviews);
}

export async function getStats(_request: FastifyRequest, reply: FastifyReply) {
  const stats = await getReviewStats();
  return reply.send(stats);
}