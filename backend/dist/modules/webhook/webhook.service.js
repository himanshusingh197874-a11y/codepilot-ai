"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewPipelineError = void 0;
exports.runPullRequestReview = runPullRequestReview;
const diff_parser_1 = require("../pr/diff.parser");
const pr_github_1 = require("../pr/pr.github");
const ai_service_1 = require("../ai/ai.service");
const review_config_1 = require("../ai/review.config");
const review_formatter_1 = require("../ai/review.formatter");
const review_repository_1 = require("../ai/review.repository");
const review_comment_repository_1 = require("../ai/review-comment.repository");
const github_inline_review_1 = require("../../providers/github/github.inline-review");
const github_review_1 = require("../../providers/github/github.review");
const event_bus_1 = require("../../realtime/event-bus");
class ReviewPipelineError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ReviewPipelineError = ReviewPipelineError;
async function runPullRequestReview({ repository, accessToken, pullNumber, }) {
    let pullRequest;
    let files;
    try {
        pullRequest = await (0, pr_github_1.getPullRequest)(accessToken, repository.owner, repository.name, pullNumber);
        files = await (0, pr_github_1.getPullRequestFiles)(accessToken, repository.owner, repository.name, pullNumber);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'GitHub request failed';
        if (message.includes('404') || message.includes('Not Found')) {
            throw new ReviewPipelineError('Pull request not found', 404);
        }
        throw new ReviewPipelineError('AI review failed', 500);
    }
    if (files.length === 0) {
        throw new ReviewPipelineError('No changed files', 400);
    }
    const reviews = [];
    const inlineComments = [];
    for (const file of files) {
        if ((0, review_config_1.shouldIgnoreFile)(file.filename) || !file.patch) {
            continue;
        }
        for (const addedLine of (0, diff_parser_1.extractAddedLinesWithNumbers)(file.patch)) {
            const comment = (0, ai_service_1.analyzeLine)(addedLine.content);
            if (comment) {
                inlineComments.push({
                    path: file.filename,
                    line: addedLine.lineNumber,
                    body: comment,
                });
            }
        }
        reviews.push(await (0, ai_service_1.reviewPatch)(file.filename, file.patch));
    }
    try {
        if (inlineComments.length > 0) {
            await (0, github_inline_review_1.createInlineReview)(accessToken, repository.owner, repository.name, pullNumber, pullRequest.head.sha, inlineComments);
        }
        await (0, github_review_1.createPullRequestReview)(accessToken, repository.owner, repository.name, pullNumber, (0, review_formatter_1.formatReviewComment)(reviews));
        const savedReview = await (0, review_repository_1.saveReview)({
            repositoryId: repository.id,
            githubPrId: BigInt(pullRequest.id),
            number: pullNumber,
            title: pullRequest.title,
            state: pullRequest.state,
            reviews,
        });
        await (0, review_comment_repository_1.saveReviewComments)({
            reviewId: savedReview.id,
            repositoryId: repository.id,
            githubPrId: BigInt(pullRequest.id),
            comments: inlineComments.map((comment) => ({
                ...comment,
                severity: 'warning',
            })),
        });
        // Notify the application that a review has completed
        event_bus_1.eventBus.emit("review.completed", {
            repositoryId: repository.id,
            reviewId: savedReview.id,
        });
        event_bus_1.eventBus.emit("repository.updated", {
            repositoryId: repository.id,
        });
        return savedReview;
    }
    catch (error) {
        if (error instanceof ReviewPipelineError) {
            throw error;
        }
        throw new ReviewPipelineError('AI review failed', 500);
    }
}
