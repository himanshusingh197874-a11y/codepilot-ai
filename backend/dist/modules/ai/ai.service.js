"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiReviewService = void 0;
exports.reviewPatch = reviewPatch;
exports.analyzeLine = analyzeLine;
const ai_review_service_1 = require("./ai-review.service");
Object.defineProperty(exports, "aiReviewService", { enumerable: true, get: function () { return ai_review_service_1.aiReviewService; } });
async function reviewPatch(filename, patch) {
    return ai_review_service_1.aiReviewService.reviewFile(filename, patch);
}
// Local rules intentionally remain deterministic because they are used for
// immediate, line-addressable GitHub inline comments.
function analyzeLine(content) {
    if (content.includes("console.log(")) {
        return "Avoid using console.log in production code.";
    }
    if (/:\s*any\b/.test(content)) {
        return "Avoid using any; prefer a specific TypeScript type.";
    }
    if (content.includes("TODO")) {
        return "TODO found — consider creating a GitHub issue for tracking.";
    }
    return null;
}
