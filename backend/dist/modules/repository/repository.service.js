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
const github_repository_1 = require("../../providers/github/github.repository");
const github_webhook_1 = require("../../providers/github/github.webhook");
const repositoryRepository = __importStar(require("./repository.repository"));
async function syncRepositories(request) {
    const user = request.user;
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error("Github account not connected");
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
        throw new Error("Repository not found");
    }
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error("Github account not connected");
    }
    const webhook = await (0, github_webhook_1.createWebhook)(githubAccount.accessToken, repository.owner, repository.name);
    return repositoryRepository.updateWebhook(repository.id, webhook.id.toString());
}
async function disableRepository(request) {
    const user = request.user;
    const { id } = request.params;
    const repository = await repositoryRepository.findRepositoryById(id, user.sub);
    if (!repository) {
        throw new Error("Repository not found");
    }
    const githubAccount = await repositoryRepository.findGithubAccountByUserId(user.sub);
    if (!githubAccount) {
        throw new Error("Github account not connected");
    }
    if (repository.webhookId) {
        await (0, github_webhook_1.deleteWebhook)(githubAccount.accessToken, repository.owner, repository.name, Number(repository.webhookId));
    }
    return repositoryRepository.clearWebhook(repository.id);
}
