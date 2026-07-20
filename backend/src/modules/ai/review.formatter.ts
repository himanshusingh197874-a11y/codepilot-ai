import { FileReview } from './ai.types';

export function formatReviewComment(reviews: FileReview[]): string {
  let body = '## 🤖 CodePilot AI Review\n\n';

  for (const review of reviews) {
    body += `### ${review.filename}\n\n`;
    body += `**${review.summary}**\n\n`;

    if (review.issues.length > 0) {
      for (const issue of review.issues) {
        const emoji =
          issue.severity === 'high'
            ? '🔴'
            : issue.severity === 'medium'
            ? '🟠'
            : '🟡';

        body += `${emoji} **${issue.message}**\n`;
        if (issue.suggestion) {
          body += `   - Suggestion: ${issue.suggestion}\n`;
        }
      }
      body += '\n';
    }

    if (review.suggestions.length > 0) {
      body += '💡 **Suggestions**\n';
      for (const suggestion of review.suggestions) {
        body += `- ${suggestion}\n`;
      }
      body += '\n';
    }

    body += '---\n\n';
  }

  return body;
}