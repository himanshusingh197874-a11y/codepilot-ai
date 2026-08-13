"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGithubAccountByUserId = findGithubAccountByUserId;
exports.upsertRepository = upsertRepository;
exports.getRepositories = getRepositories;
exports.findRepositoryById = findRepositoryById;
exports.updateWebhook = updateWebhook;
exports.clearWebhook = clearWebhook;
exports.findRepositoryWithReviews = findRepositoryWithReviews;
exports.getRepositoryInsightsData = getRepositoryInsightsData;
exports.getRepositoryDashboard = getRepositoryDashboard;
const prisma_1 = require("../../lib/prisma");
async function findGithubAccountByUserId(userId) {
    return prisma_1.prisma.githubAccount.findUnique({
        where: {
            userId,
        },
    });
}
async function upsertRepository(userId, repo) {
    return prisma_1.prisma.repository.upsert({
        where: {
            githubRepoId: repo.id,
        },
        update: {
            owner: repo.owner.login,
            name: repo.name,
            fullName: repo.full_name,
            defaultBranch: repo.default_branch,
            private: repo.private,
        },
        create: {
            githubRepoId: repo.id,
            owner: repo.owner.login,
            name: repo.name,
            fullName: repo.full_name,
            defaultBranch: repo.default_branch,
            private: repo.private,
            userId,
        },
    });
}
async function getRepositories(userId) {
    return prisma_1.prisma.repository.findMany({
        where: {
            userId,
        },
        orderBy: {
            updatedAt: "desc",
        },
    });
}
async function findRepositoryById(id, userId) {
    return prisma_1.prisma.repository.findUnique({
        where: { id, userId, },
        include: {
            pullRequests: {
                include: {
                    reviews: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                },
                orderBy: { updatedAt: 'desc' },
            },
        },
    });
}
async function updateWebhook(repositoryId, webhookId) {
    return prisma_1.prisma.repository.update({
        where: {
            id: repositoryId,
        },
        data: {
            enabled: true,
            webhookId,
        },
    });
}
async function clearWebhook(repositoryId) {
    return prisma_1.prisma.repository.update({
        where: {
            id: repositoryId,
        },
        data: {
            enabled: false,
            webhookId: null,
        },
    });
}
async function findRepositoryWithReviews(id, userId) {
    return prisma_1.prisma.repository.findFirst({
        where: {
            id,
            ...(userId ? { userId } : {}),
        },
        include: {
            pullRequests: {
                include: {
                    reviews: {
                        orderBy: { createdAt: 'desc' },
                    },
                },
            },
        },
    });
}
async function getRepositoryInsightsData(repositoryId, userId) {
    return prisma_1.prisma.repository.findFirst({
        where: {
            id: repositoryId,
            userId,
        },
        include: {
            pullRequests: {
                include: {
                    reviews: {
                        include: {
                            comments: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },
                },
            },
        },
    });
}
async function getRepositoryDashboard(repositoryId) {
    const repository = await prisma_1.prisma.repository.findUnique({
        where: {
            id: repositoryId,
        },
    });
    if (!repository) {
        return null;
    }
    const [totalReviews, averageScore, totalPullRequests, totalIssues, recentReviews,] = await Promise.all([
        prisma_1.prisma.review.count({
            where: {
                pullRequest: {
                    repositoryId,
                },
            },
        }),
        prisma_1.prisma.review.aggregate({
            where: {
                pullRequest: {
                    repositoryId,
                },
            },
            _avg: {
                score: true,
            },
        }),
        prisma_1.prisma.pullRequest.count({
            where: {
                repositoryId,
            },
        }),
        prisma_1.prisma.reviewComment.count({
            where: {
                review: {
                    pullRequest: {
                        repositoryId,
                    },
                },
            },
        }),
        prisma_1.prisma.review.findMany({
            where: {
                pullRequest: {
                    repositoryId,
                },
            },
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                pullRequest: true,
            },
        }),
    ]);
    return {
        repository,
        stats: {
            totalReviews,
            averageScore: Number(averageScore._avg.score?.toFixed(1) ?? 0),
            totalPullRequests,
            totalIssues,
        },
        recentReviews: recentReviews.map((review) => ({
            id: review.id,
            score: review.score,
            summary: review.summary,
            createdAt: review.createdAt,
            pullRequest: {
                id: review.pullRequest.id,
                githubPrId: review.pullRequest.githubPrId.toString(),
                number: review.pullRequest.number,
                title: review.pullRequest.title,
                state: review.pullRequest.state,
                repositoryId: review.pullRequest.repositoryId,
                createdAt: review.pullRequest.createdAt,
                updatedAt: review.pullRequest.updatedAt,
            },
        })),
    };
}
