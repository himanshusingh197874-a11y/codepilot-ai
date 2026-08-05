"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubWebhook = githubWebhook;
const prisma_1 = require("../../lib/prisma");
const webhook_service_1 = require("./webhook.service");
async function githubWebhook(request, reply) {
    const event = request.headers['x-github-event'];
    const payload = request.body;
    if (event !== 'pull_request' || payload.action === 'closed') {
        return reply.send({ received: true, skipped: true });
    }
    const repository = await prisma_1.prisma.repository.findFirst({
        where: {
            owner: payload.repository.owner.login,
            name: payload.repository.name,
        },
    });
    if (!repository) {
        return reply.send({ received: true, skipped: true });
    }
    const githubAccount = await prisma_1.prisma.githubAccount.findUnique({
        where: { userId: repository.userId },
    });
    if (!githubAccount) {
        throw new Error('Github account not connected');
    }
    const review = await (0, webhook_service_1.runPullRequestReview)({
        repository,
        accessToken: githubAccount.accessToken,
        pullNumber: payload.pull_request.number,
    });
    return reply.send({ received: true, reviewId: review.id });
}
