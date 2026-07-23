import { FastifyReply, FastifyRequest } from 'fastify';
import {
  listReviews,
  getReviewById,
  getRepositoryReviews,
  getReviewStats,
} from './review.repository';
import { reviewListQuerySchema } from './review.schema';
import { getReviewDetails } from './review.service';

export async function getReviews(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const query = reviewListQuerySchema.parse(request.query);

  const result = await listReviews(query);

  return reply.send(result);
}

export async function getReview(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const review = await getReviewById(request.params.id);

  if (!review) {
    return reply.code(404).send({ message: 'Review not found' });
  }

  return reply.send(review);
}

export async function getRepositoryReviewHistory(
  request: FastifyRequest<{ Params: { repoId: string } }>,
  reply: FastifyReply,
) {
  const reviews = await getRepositoryReviews(request.params.repoId);

  return reply.send(reviews);
}

export async function getStats(
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  const stats = await getReviewStats();

  return reply.send(stats);
}

export async function getReviewByIdController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const review = await getReviewDetails(request.params.id);

  if (!review) {
    return reply.code(404).send({
      message: 'Review not found',
    });
  }

  return reply.send(review);
}