"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPullRequestReview = createPullRequestReview;
async function createPullRequestReview(accessToken, owner, repo, pullNumber, body) {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            body,
            event: 'COMMENT',
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create PR review: ${error}`);
    }
    return response.json();
}
