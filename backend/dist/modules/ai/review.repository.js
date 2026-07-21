"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReview = saveReview;
const prisma_1 = require("../../lib/prisma");
async function saveReview(params) {
    const pr = await prisma_1.prisma.pullRequest.upsert({
        where: { githubPrId: params.githubPrId },
        update: {
            title: params.title,
            state: params.state,
        },
        create: {
            githubPrId: params.githubPrId,
            number: params.number,
            title: params.title,
            state: params.state,
            repositoryId: params.repositoryId,
        },
    });
    const avgScore = params.reviews.reduce((sum, r) => sum + r.score, 0) /
        Math.max(params.reviews.length, 1);
    const review = await prisma_1.prisma.review.create({
        data: {
            pullRequestId: pr.id,
            summary: `${params.reviews.length} files analyzed`,
            score: Number(avgScore.toFixed(1)),
        },
    });
    return review;
}
