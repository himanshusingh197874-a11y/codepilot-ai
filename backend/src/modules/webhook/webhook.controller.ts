import { prisma } from '../../lib/prisma';
import { FastifyReply, FastifyRequest } from 'fastify';
import { runPullRequestReview } from './webhook.service';

export async function githubWebhook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const event = request.headers['x-github-event'];
  const payload = request.body as any;

  if (event !== 'pull_request' || payload.action === 'closed') {
    return reply.send({ received: true, skipped: true });
  }

  const repository = await prisma.repository.findFirst({
    where: {
      owner: payload.repository.owner.login,
      name: payload.repository.name,
    },
  });

  if (!repository) {
    return reply.send({ received: true, skipped: true });
  }

  const githubAccount = await prisma.githubAccount.findUnique({
    where: { userId: repository.userId },
  });

  if (!githubAccount) {
    throw new Error('Github account not connected');
  }

  const review = await runPullRequestReview({
    repository,
    accessToken: githubAccount.accessToken,
    pullNumber: payload.pull_request.number,
  });

  return reply.send({ received: true, reviewId: review.id });
}
