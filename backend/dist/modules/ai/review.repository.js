"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReview = saveReview;
const prisma_1 = require("../../lib/prisma");
async function saveReview(params) {
    const pullRequest = await prisma_1.prisma.pullRequest.upsert({
        where: { githubPrId: params.githubPrId },
        update: { title: params.title, state: params.state },
        create: {
            githubPrId: params.githubPrId,
            number: params.number,
            title: params.title,
            state: params.state,
            repositoryId: params.repositoryId,
        },
    });
    return prisma_1.prisma.review.create({
        data: {
            pullRequestId: pullRequest.id,
            summary: params.review.summary,
            score: params.review.overallScore,
            positives: params.review.positives,
            issues: params.review.issues,
            suggestions: params.review.suggestions,
            verdict: params.review.verdict,
        },
    });
}
