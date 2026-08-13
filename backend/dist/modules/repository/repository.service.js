"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRepositories = syncRepositories;
exports.listRepositories = listRepositories;
exports.enableRepository = enableRepository;
exports.disableRepository = disableRepository;
exports.getRepositoryDetails = getRepositoryDetails;
exports.getOpenPullRequests = getOpenPullRequests;
exports.triggerPullRequestReview = triggerPullRequestReview;
exports.getRepositoryInsights = getRepositoryInsights;
exports.getRepositoryDashboardService = getRepositoryDashboardService;
const github_repository_1 = require("../../providers/github/github.repository");
const github_webhook_1 = require("../../providers/github/github.webhook");
const github_pulls_1 = require("../../providers/github/github.pulls");
const webhook_service_1 = require("../webhook/webhook.service");
const repositoryRepository = __importStar(require("./repository.repository"));
const repository_repository_1 = require("./repository.repository");
async function syncRepositories(request) {
    const user = request.user;
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error('Github account not connected');
    }
    const repositories = await (0, github_repository_1.getGithubRepositories)(githubAccount.accessToken);
    await Promise.all(repositories.map((repo) => repositoryRepository.upsertRepository(user.sub, repo)));
    return {
        synced: repositories.length,
        repositories,
    };
}
async function listRepositories(request) {
    const user = request.user;
    return repositoryRepository.getRepositories(user.sub);
}
async function enableRepository(request) {
    const user = request.user;
    const { id } = request.params;
    const repository = await repositoryRepository.findRepositoryById(id, user.sub);
    if (!repository) {
        throw new Error('Repository not found');
    }
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error('Github account not connected');
    }
    const webhook = await (0, github_webhook_1.createWebhook)(githubAccount.accessToken, repository.owner, repository.name);
    return repositoryRepository.updateWebhook(repository.id, webhook.id.toString());
}
async function disableRepository(request) {
    const user = request.user;
    const { id } = request.params;
    const repository = await repositoryRepository.findRepositoryById(id, user.sub);
    if (!repository) {
        throw new Error('Repository not found');
    }
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error('Github account not connected');
    }
    if (repository.webhookId) {
        await (0, github_webhook_1.deleteWebhook)(githubAccount.accessToken, repository.owner, repository.name, Number(repository.webhookId));
    }
    return repositoryRepository.clearWebhook(repository.id);
}
async function getRepositoryDetails(id, userId) {
    const repository = await repositoryRepository.findRepositoryWithReviews(id, userId);
    if (!repository) {
        return null;
    }
    const allReviews = repository.pullRequests
        .flatMap((pr) => pr.reviews)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const totalReviews = allReviews.length;
    const averageScore = totalReviews === 0
        ? 0
        : allReviews.reduce((sum, review) => sum + review.score, 0) /
            totalReviews;
    return {
        id: repository.id,
        fullName: repository.fullName,
        owner: repository.owner,
        name: repository.name,
        defaultBranch: repository.defaultBranch,
        enabled: repository.enabled,
        totalReviews,
        averageScore: Number(averageScore.toFixed(1)),
        recentReviews: allReviews.slice(0, 10).map((review) => ({
            id: review.id,
            score: review.score,
            summary: review.summary,
            createdAt: review.createdAt,
        })),
    };
}
async function getOpenPullRequests(request) {
    const user = request.user;
    const { id } = request.params;
    const repository = await repositoryRepository.findRepositoryById(id, user.sub);
    if (!repository) {
        throw new Error('Repository not found');
    }
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error('Github account not connected');
    }
    return (0, github_pulls_1.listOpenPullRequests)(githubAccount.accessToken, repository.owner, repository.name);
}
async function triggerPullRequestReview(request) {
    const user = request.user;
    const pullNumber = Number(request.params.number);
    if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
        throw new webhook_service_1.ReviewPipelineError('Pull request not found', 404);
    }
    const repository = await repositoryRepository.findRepositoryById(request.params.id, user.sub);
    if (!repository) {
        throw new webhook_service_1.ReviewPipelineError('Repository not found', 404);
    }
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new webhook_service_1.ReviewPipelineError('AI review failed', 500);
    }
    const review = await (0, webhook_service_1.runPullRequestReview)({
        repository,
        accessToken: githubAccount.accessToken,
        pullNumber,
    });
    return { reviewId: review.id, message: 'AI review completed' };
}
async function getRepositoryInsights(repositoryId, userId) {
    const repository = await repositoryRepository.getRepositoryInsightsData(repositoryId, userId);
    if (!repository) {
        return null;
    }
    const reviews = repository.pullRequests.flatMap((pr) => pr.reviews);
    const totalReviews = reviews.length;
    const comments = reviews.flatMap((review) => review.comments);
    const trendMap = new Map();
    for (const review of reviews) {
        const date = review.createdAt.toISOString().split("T")[0];
        const existing = trendMap.get(date);
        if (existing) {
            existing.total += review.score;
            existing.count += 1;
        }
        else {
            trendMap.set(date, {
                total: review.score,
                count: 1,
            });
        }
    }
    const scoreTrend = [...trendMap.entries()]
        .map(([date, value]) => ({
        date,
        score: Number((value.total / value.count).toFixed(1)),
    }))
        .sort((a, b) => new Date(a.date).getTime() -
        new Date(b.date).getTime());
    const severity = {
        high: comments.filter((c) => ['high', 'critical', 'error'].includes(c.severity.toLowerCase())).length,
        medium: comments.filter((c) => ['medium', 'warning'].includes(c.severity.toLowerCase())).length,
        low: comments.filter((c) => ['low', 'info', 'suggestion'].includes(c.severity.toLowerCase())).length,
    };
    const fileMap = new Map();
    comments.forEach((comment) => {
        fileMap.set(comment.path, (fileMap.get(comment.path) ?? 0) + 1);
    });
    const topFiles = [...fileMap.entries()]
        .map(([path, findings]) => ({
        path,
        findings,
    }))
        .sort((a, b) => b.findings - a.findings)
        .slice(0, 5);
    const averageScore = reviews.length === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.score, 0) /
            reviews.length;
    const totalComments = reviews.reduce((sum, review) => sum + review.comments.length, 0);
    return {
        repository: {
            id: repository.id,
            name: repository.name,
            fullName: repository.fullName,
        },
        stats: {
            totalPullRequests: repository.pullRequests.length,
            totalReviews,
            averageScore: Number(averageScore.toFixed(1)),
            totalComments,
        },
        severity,
        topFiles,
        scoreTrend,
        recentReviews: [...reviews]
            .sort((a, b) => b.createdAt.getTime() -
            a.createdAt.getTime())
            .slice(0, 10)
            .map((review) => ({
            id: review.id,
            score: review.score,
            summary: review.summary,
            createdAt: review.createdAt,
        })),
    };
}
async function getRepositoryDashboardService(id) {
    const dashboard = await (0, repository_repository_1.getRepositoryDashboard)(id);
    if (!dashboard) {
        throw new Error('Repository not found');
    }
    return dashboard;
}
