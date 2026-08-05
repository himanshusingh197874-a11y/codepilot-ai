"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReviewComments = saveReviewComments;
const crypto_1 = require("crypto");
const prisma_1 = require("../../lib/prisma");
function mapSeverity(severity) {
    switch (severity.toLowerCase()) {
        case 'error':
        case 'critical':
        case 'high':
            return 'HIGH';
        case 'warning':
        case 'medium':
            return 'MEDIUM';
        case 'info':
        case 'suggestion':
        case 'low':
            return 'LOW';
        default:
            return 'LOW';
    }
}
async function saveReviewComments(params) {
    let saved = 0;
    for (const comment of params.comments) {
        const fingerprint = (0, crypto_1.createHash)('sha256')
            .update(`${params.repositoryId}:${params.githubPrId}:${comment.path}:${comment.line}:${comment.severity}`)
            .digest('hex');
        const existing = await prisma_1.prisma.reviewComment.findUnique({
            where: { fingerprint },
        });
        if (existing) {
            continue;
        }
        await prisma_1.prisma.reviewComment.create({
            data: {
                reviewId: params.reviewId,
                path: comment.path,
                line: comment.line,
                body: comment.body,
                severity: mapSeverity(comment.severity),
                fingerprint,
            },
        });
        saved++;
    }
    return saved;
}
