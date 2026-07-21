"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveReviewComments = saveReviewComments;
const crypto_1 = require("crypto");
const prisma_1 = require("../../lib/prisma");
async function saveReviewComments(params) {
    let saved = 0;
    for (const comment of params.comments) {
        const fingerprint = (0, crypto_1.createHash)('sha256')
            .update(`${comment.path}:${comment.line}:${comment.severity}`)
            .digest('hex');
        const existing = await prisma_1.prisma.reviewComment.findUnique({
            where: { fingerprint },
        });
        console.log('Fingerprint generated', {
            path: comment.path,
            line: comment.line,
            severity: comment.severity,
            fingerprint,
        });
        if (existing) {
            console.log('Skipping duplicate review comment', {
                path: comment.path,
                line: comment.line, fingerprint,
            });
            continue;
        }
        await prisma_1.prisma.reviewComment.create({
            data: {
                reviewId: params.reviewId,
                path: comment.path,
                line: comment.line,
                body: comment.body,
                severity: comment.severity,
                fingerprint,
            },
        });
        saved++;
    }
    return saved;
}
