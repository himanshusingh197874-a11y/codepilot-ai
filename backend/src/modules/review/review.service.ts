import { getReviewById } from './review.repository';

export async function getReviewDetails(id: string) {
  const review = await getReviewById(id);

  if (!review) {
    return null;
  }

  const pullRequest = review.pullRequest;
  const repository = pullRequest?.repository;

  return {
    id: review.id,
    score: review.score,
    summary: review.summary,
    createdAt: review.createdAt,

    repository: repository?.fullName ?? 'Unknown repository',

    pullRequest: {
      number: pullRequest?.number ?? 0,
      title: pullRequest?.title ?? 'Unknown PR',
      state: pullRequest?.state ?? 'unknown',
    },

    findings: (review.findings ?? []).map((finding) => ({
      id: finding.id,
      severity: finding.severity,
      filePath: finding.filePath,
      lineNumber: finding.lineNumber,
      message: finding.message,
      suggestion: finding.suggestion,
    })),
  };
}
