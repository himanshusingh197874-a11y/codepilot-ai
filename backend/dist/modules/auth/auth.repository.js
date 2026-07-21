"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByGithubId = findUserByGithubId;
exports.createGithubUser = createGithubUser;
exports.updateGithubUser = updateGithubUser;
const prisma_1 = require("../../lib/prisma");
async function findUserByGithubId(githubUserId) {
    return prisma_1.prisma.user.findFirst({
        where: {
            githubAccount: {
                githubUserId,
            },
        },
        include: {
            githubAccount: true,
        },
    });
}
async function createGithubUser(data) {
    return prisma_1.prisma.user.create({
        data: {
            username: data.username,
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUrl,
            githubAccount: {
                create: {
                    githubUserId: data.githubUserId,
                    accessToken: data.accessToken,
                },
            },
        },
        include: {
            githubAccount: true,
        },
    });
}
async function updateGithubUser(id, data) {
    return prisma_1.prisma.user.update({
        where: {
            id,
        },
        data: {
            username: data.username,
            name: data.name,
            email: data.email,
            avatarUrl: data.avatarUrl,
            githubAccount: {
                update: {
                    githubUserId: data.githubUserId,
                    accessToken: data.accessToken,
                },
            },
        },
        include: {
            githubAccount: true,
        },
    });
}
