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
exports.getRepositoryByIdController = getRepositoryByIdController;
exports.getRepositoryInsightsController = getRepositoryInsightsController;
exports.getOpenPullRequestsController = getOpenPullRequestsController;
exports.triggerPullRequestReviewController = triggerPullRequestReviewController;
exports.getRepositoryDashboardHandler = getRepositoryDashboardHandler;
const repositoryService = __importStar(require("./repository.service"));
const repository_service_1 = require("./repository.service");
const webhook_service_1 = require("../webhook/webhook.service");
async function syncRepositories(request, reply) {
    const result = await repositoryService.syncRepositories(request);
    return reply.send(result);
}
async function listRepositories(request, reply) {
    const repositories = await repositoryService.listRepositories(request);
    return reply.send(repositories);
}
async function enableRepository(request, reply) {
    const repository = await repositoryService.enableRepository(request);
    return reply.send(repository);
}
async function disableRepository(request, reply) {
    const repository = await repositoryService.disableRepository(request);
    return reply.send(repository);
}
async function getRepositoryByIdController(request, reply) {
    const user = request.user;
    const repository = await repositoryService.getRepositoryDetails(request.params.id, user.sub);
    if (!repository) {
        return reply.code(404).send({
            message: 'Repository not found',
        });
    }
    return reply.send(repository);
}
async function getRepositoryInsightsController(request, reply) {
    const user = request.user;
    const insights = await repositoryService.getRepositoryInsights(request.params.id, user.sub);
    return reply.send(insights);
}
async function getOpenPullRequestsController(request, reply) {
    const prs = await repositoryService.getOpenPullRequests(request);
    return reply.send(prs);
}
async function triggerPullRequestReviewController(request, reply) {
    try {
        const result = await repositoryService.triggerPullRequestReview(request);
        return reply.send(result);
    }
    catch (error) {
        if (error instanceof webhook_service_1.ReviewPipelineError) {
            return reply.code(error.statusCode).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'AI review failed' });
    }
}
async function getRepositoryDashboardHandler(request, reply) {
    try {
        const dashboard = await (0, repository_service_1.getRepositoryDashboardService)(request.params.id);
        return reply.send(dashboard);
    }
    catch {
        return reply.status(404).send({
            message: 'Repository not found',
        });
    }
}
