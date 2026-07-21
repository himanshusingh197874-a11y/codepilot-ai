"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubWebhook = githubWebhook;
const prisma_1 = require("../../lib/prisma");
const pr_service_1 = require("../pr/pr.service");
const pr_github_1 = require("../pr/pr.github");
const diff_parser_1 = require("../pr/diff.parser");
const ai_service_1 = require("../ai/ai.service");
const review_config_1 = require("../ai/review.config");
const review_formatter_1 = require("../ai/review.formatter");
const review_repository_1 = require("../ai/review.repository");
const review_comment_repository_1 = require("../ai/review-comment.repository");
const github_review_1 = require("../../providers/github/github.review");
const github_inline_review_1 = require("../../providers/github/github.inline-review");
async function githubWebhook(request, reply) {
    const event = request.headers['x-github-event'];
    const payload = request.body;
    console.log('==============================');
    console.log('GitHub Event:', event);
    console.log('Action:', payload?.action);
    console.log('Repository:', payload?.repository?.full_name);
    if (event === 'pull_request') {
        // Skip closed PRs
        if (payload.action === 'closed') {
            console.log('Skipping closed pull request');
            return reply.send({ received: true, skipped: true });
        }
        console.log('PR EVENT RECEIVED');
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pullNumber = payload.pull_request.number;
        console.log({
            action: payload.action,
            repo: payload.repository.full_name,
            prNumber: pullNumber,
            title: payload.pull_request.title,
        });
        // Find repository in DB
        const repository = await prisma_1.prisma.repository.findFirst({
            where: {
                owner,
                name: repo,
            },
        });
        if (!repository) {
            console.log('Repository not found in database');
            return reply.send({ received: true });
        }
        // Fetch changed files
        const files = await (0, pr_service_1.fetchPullRequestFiles)(repository.userId, owner, repo, pullNumber);
        console.log(`Fetched ${files.length} changed files`);
        // Get GitHub account
        const githubAccount = await prisma_1.prisma.githubAccount.findUnique({
            where: { userId: repository.userId },
        });
        if (!githubAccount) {
            throw new Error('GitHub account not connected');
        }
        // Get latest commit SHA for inline comments
        const pr = await (0, pr_github_1.getPullRequest)(githubAccount.accessToken, owner, repo, pullNumber);
        const latestCommitSha = pr.head.sha;
        // Collect summary reviews
        const reviews = [];
        // Collect inline comments
        const inlineComments = [];
        for (const file of files) {
            if ((0, review_config_1.shouldIgnoreFile)(file.filename)) {
                console.log(`Skipping ignored file: ${file.filename}`);
                continue;
            }
            console.log({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
            });
            // Inline comments on specific added lines
            if (file.patch) {
                const addedLines = (0, diff_parser_1.extractAddedLinesWithNumbers)(file.patch);
                for (const addedLine of addedLines) {
                    const comment = (0, ai_service_1.analyzeLine)(addedLine.content);
                    if (comment) {
                        console.log(`Queueing inline comment for ${file.filename}:${addedLine.lineNumber}`);
                        inlineComments.push({
                            path: file.filename,
                            line: addedLine.lineNumber,
                            body: comment,
                        });
                    }
                }
                // Summary review for the file
                const review = await (0, ai_service_1.reviewPatch)(file.filename, file.patch);
                reviews.push(review);
                console.log('AI REVIEW RESULT');
                console.log(JSON.stringify(review, null, 2));
            }
            else {
                console.log('No patch available for file:', file.filename);
            }
        }
        // Post inline comments as a single review
        if (inlineComments.length > 0) {
            try {
                await (0, github_inline_review_1.createInlineReview)(githubAccount.accessToken, owner, repo, pullNumber, latestCommitSha, inlineComments);
                console.log(`Posted ${inlineComments.length} inline comments`);
            }
            catch (error) {
                console.error('Inline review failed:', error);
            }
        }
        // Format summary review comment
        const reviewBody = (0, review_formatter_1.formatReviewComment)(reviews);
        // Post summary review to GitHub PR
        await (0, github_review_1.createPullRequestReview)(githubAccount.accessToken, owner, repo, pullNumber, reviewBody);
        console.log('Posted AI review to GitHub PR');
        // Persist review in database
        const savedReview = await (0, review_repository_1.saveReview)({
            repositoryId: repository.id,
            githubPrId: BigInt(payload.pull_request.id),
            number: pullNumber,
            title: payload.pull_request.title,
            state: payload.pull_request.state,
            reviews,
        });
        const savedComments = await (0, review_comment_repository_1.saveReviewComments)({
            reviewId: savedReview.id,
            comments: inlineComments.map((comment) => ({
                path: comment.path,
                line: comment.line,
                body: comment.body,
                severity: 'warning',
            })),
        });
        console.log(`Saved ${savedComments} review comments to database`);
        console.log('Saved review to database:', {
            reviewId: savedReview.id,
            score: savedReview.score,
        });
    }
    console.log('==============================');
    return reply.send({ received: true });
}
