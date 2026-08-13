import { PullRequestReview } from "./pr-review.types";

const severityEmoji: Record<string, string> = {
  critical: "🔴",
  high: "🔴",
  medium: "🟠",
  low: "🟡",
  info: "🔵",
};

export function formatReviewComment(review: PullRequestReview): string {
  const lines = [
    "## CodePilot AI Review",
    "",
    `**Verdict:** ${review.verdict === "approve" ? "Approve" : "Request changes"}`,
    `**Score:** ${review.overallScore.toFixed(1)}/10`,
    "",
    review.summary,
  ];

  if (review.positives.length > 0) {
    lines.push("", "### Positives", ...review.positives.map((positive) => `- ${positive}`));
  }

  if (review.issues.length > 0) {
    lines.push("", "### Findings");
    for (const issue of review.issues) {
      lines.push(
        `- ${severityEmoji[issue.severity]} **${issue.severity.toUpperCase()}**: ${issue.message}`,
        `  - Suggestion: ${issue.suggestion}`,
      );
    }
  }

  if (review.suggestions.length > 0) {
    lines.push("", "### Suggestions", ...review.suggestions.map((suggestion) => `- ${suggestion}`));
  }

  return lines.join("\n");
}
