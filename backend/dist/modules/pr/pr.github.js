"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPullRequestFiles = getPullRequestFiles;
exports.getPullRequest = getPullRequest;
// Fetch changed files in a PR
async function getPullRequestFiles(accessToken, owner, repo, pullNumber) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
        },
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch PR files: ${error}`);
    }
    return response.json();
}
// Fetch PR metadata (including latest commit SHA)
async function getPullRequest(accessToken, owner, repo, pullNumber) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
        },
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch pull request: ${error}`);
    }
    return response.json();
}
