"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewPipelineError = void 0;
exports.runPullRequestReview = runPullRequestReview;
const logger_1 = require("../../config/logger");
const github_inline_review_1 = require("../../providers/github/github.inline-review");
const github_review_1 = require("../../providers/github/github.review");
const event_bus_1 = require("../../realtime/event-bus");
const ai_service_1 = require("../ai/ai.service");
const review_config_1 = require("../ai/review.config");
const review_comment_repository_1 = require("../ai/review-comment.repository");
const review_formatter_1 = require("../ai/review.formatter");
const review_repository_1 = require("../ai/review.repository");
const diff_parser_1 = require("../pr/diff.parser");
const pr_github_1 = require("../pr/pr.github");
class ReviewPipelineError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.ReviewPipelineError = ReviewPipelineError;
function getReviewableFiles(files) {
    return files.flatMap((file) => {
        if ((0, review_config_1.shouldIgnoreFile)(file.filename) || !file.patch) {
            return [];
        }
        return [{ filename: file.filename, patch: file.patch }];
    });
}
function buildInlineComments(files) {
    const comments = [];
    for (const file of files) {
        for (const addedLine of (0, diff_parser_1.extractAddedLinesWithNumbers)(file.patch)) {
            const body = (0, ai_service_1.analyzeLine)(addedLine.content);
            if (body) {
                comments.push({ path: file.filename, line: addedLine.lineNumber, body });
            }
        }
    }
    return comments;
}
function unavailableReview() {
    return {
        summary: "Automated repository review was unavailable; local inline checks completed.",
        overallScore: 0,
        positives: [],
        issues: [],
        suggestions: ["Re-run the review after the AI provider is available."],
        verdict: "request_changes",
    };
}
async function runPullRequestReview({ repository, accessToken, pullNumber, }) {
    let pullRequest;
    let files;
    try {
        [pullRequest, files] = await Promise.all([
            (0, pr_github_1.getPullRequest)(accessToken, repository.owner, repository.name, pullNumber),
            (0, pr_github_1.getPullRequestFiles)(accessToken, repository.owner, repository.name, pullNumber),
        ]);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "GitHub request failed";
        if (message.includes("404") || message.includes("Not Found")) {
            throw new ReviewPipelineError("Pull request not found", 404);
        }
        throw new ReviewPipelineError("GitHub request failed", 502);
    }
    if (files.length === 0) {
        throw new ReviewPipelineError("No changed files", 400);
    }
    const filesToReview = getReviewableFiles(files);
    if (filesToReview.length === 0) {
        throw new ReviewPipelineError("No reviewable changed files", 400);
    }
    const inlineComments = buildInlineComments(filesToReview);
    let review;
    try {
        // One logical Gemini request contains every reviewable file in the PR.
        review = await ai_service_1.aiReviewService.reviewPullRequest(filesToReview);
    }
    catch (error) {
        logger_1.logger.error({
            err: error,
            repositoryId: repository.id,
            pullNumber,
            provider: "gemini",
        }, "Repository AI review failed; continuing with fallback review");
        review = unavailableReview();
    }
    try {
        if (inlineComments.length > 0) {
            await (0, github_inline_review_1.createInlineReview)(accessToken, repository.owner, repository.name, pullNumber, pullRequest.head.sha, inlineComments);
        }
        await (0, github_review_1.createPullRequestReview)(accessToken, repository.owner, repository.name, pullNumber, (0, review_formatter_1.formatReviewComment)(review));
        const savedReview = await (0, review_repository_1.saveReview)({
            repositoryId: repository.id,
            githubPrId: BigInt(pullRequest.id),
            number: pullNumber,
            title: pullRequest.title,
            state: pullRequest.state,
            review,
        });
        await (0, review_comment_repository_1.saveReviewComments)({
            reviewId: savedReview.id,
            repositoryId: repository.id,
            githubPrId: BigInt(pullRequest.id),
            comments: inlineComments.map((comment) => ({
                ...comment,
                severity: "warning",
            })),
        });
        event_bus_1.eventBus.emit("review.completed", {
            repositoryId: repository.id,
            reviewId: savedReview.id,
        });
        event_bus_1.eventBus.emit("repository.updated", { repositoryId: repository.id });
        return savedReview;
    }
    catch (error) {
        logger_1.logger.error({ err: error, repositoryId: repository.id, pullNumber }, "Failed to publish or persist pull request review");
        throw new ReviewPipelineError("Failed to publish pull request review", 502);
    }
}
