"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPullRequestFiles = fetchPullRequestFiles;
const pr_github_1 = require("./pr.github");
const prisma_1 = require("../../lib/prisma");
async function fetchPullRequestFiles(userId, owner, repo, pullNumber) {
    // Find the user’s GitHub account
    const githubAccount = await prisma_1.prisma.githubAccount.findUnique({
        where: { userId },
    });
    if (!githubAccount) {
        throw new Error('GitHub account not connected');
    }
    // Fetch changed files for the PR
    const files = await (0, pr_github_1.getPullRequestFiles)(githubAccount.accessToken, owner, repo, pullNumber);
    return files;
}
