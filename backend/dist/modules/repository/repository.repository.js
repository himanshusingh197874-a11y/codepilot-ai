"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findGithubAccountByUserId = findGithubAccountByUserId;
exports.upsertRepository = upsertRepository;
exports.getRepositories = getRepositories;
exports.findRepositoryById = findRepositoryById;
exports.updateWebhook = updateWebhook;
exports.clearWebhook = clearWebhook;
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
async function findRepositoryById(repositoryId, userId) {
    return prisma_1.prisma.repository.findFirst({
        where: {
            id: repositoryId,
            userId,
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
