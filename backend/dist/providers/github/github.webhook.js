"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhook = createWebhook;
exports.deleteWebhook = deleteWebhook;
exports.listWebhooks = listWebhooks;
const rest_1 = require("@octokit/rest");
async function createWebhook(accessToken, owner, repo) {
    const octokit = new rest_1.Octokit({
        auth: accessToken,
    });
    const response = await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
            url: `${process.env.APP_URL}/api/v1/webhooks/github`,
            content_type: "json",
            secret: process.env.WEBHOOK_SECRET,
            insecure_ssl: "0",
        },
        events: ["pull_request"],
        active: true,
    });
    return response.data;
}
async function deleteWebhook(accessToken, owner, repo, hookId) {
    const octokit = new rest_1.Octokit({
        auth: accessToken,
    });
    await octokit.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookId,
    });
}
async function listWebhooks(accessToken, owner, repo) {
    const octokit = new rest_1.Octokit({
        auth: accessToken,
    });
    const response = await octokit.repos.listWebhooks({
        owner,
        repo,
    });
    return response.data;
}
