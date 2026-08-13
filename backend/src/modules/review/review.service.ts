import { getReviewById } from './review.repository';
import { ReviewIssueSchema } from '../ai/review.schema';

type ReviewComment = {
  id: string;
  path: string;
  line: number;
  body: string;
  severity: string;
};

function parsePersistedIssues(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((issue) => {
    const parsed = ReviewIssueSchema.safeParse(issue);

    if (!parsed.success) {
      return [];
    }

    return [parsed.data];
  });
}

export async function getReviewDetails(id: string) {
  const review = await getReviewById(id);

  if (!review) {
    return null;
  }

  /*
   * Prisma can type an included relation as optional.
   *
   * A review without a pull request cannot be represented
   * correctly in the review-details response, so guard it here.
   */
  if (!review.pullRequest) {
    return null;
  }

  const persistedIssues = parsePersistedIssues(
    review.issues,
  );

  const comments = review.comments as ReviewComment[];

  const findings = [
    ...persistedIssues.map((issue, index) => ({
      id: `${review.id}:ai:${index}`,
      source: 'ai' as const,
      path: issue.path,
      line: issue.line,
      message: issue.message,
      suggestion: issue.suggestion,
      severity: issue.severity,
    })),

    ...comments.map((comment) => ({
      id: comment.id,
      source: 'inline' as const,
      path: comment.path,
      line: comment.line,
      message: comment.body,
      severity: comment.severity,
    })),
  ];

  return {
    id: review.id,

    score: review.score,

    summary: review.summary,

    positives: review.positives,

    issues: persistedIssues,

    suggestions: review.suggestions,

    verdict: review.verdict,

    createdAt: review.createdAt,

    repository:
      review.pullRequest.repository.fullName,

    pullRequest: {
      number: review.pullRequest.number,
      title: review.pullRequest.title,
    },

    findings,
  };
}