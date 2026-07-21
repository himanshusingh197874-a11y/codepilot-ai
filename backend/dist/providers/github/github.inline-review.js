"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInlineReview = createInlineReview;
async function createInlineReview(accessToken, owner, repo, pullNumber, commitId, comments) {
    if (comments.length === 0)
        return;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            commit_id: commitId,
            event: 'COMMENT',
            comments: comments.map((c) => ({
                path: c.path,
                line: c.line,
                side: 'RIGHT',
                body: c.body,
            })),
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create inline review: ${error}`);
    }
    return response.json();
}
