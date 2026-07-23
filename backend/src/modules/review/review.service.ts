import { getReviewById } from './review.repository';

type ReviewComment = {
  id: string;
  path: string;
  line: number;
  body: string;
  severity: string;
};

export async function getReviewDetails(id: string) {
  const review = await getReviewById(id);

  if (!review) {
    return null;
  }

  return {
    id: review.id,
    score: review.score,
    summary: review.summary,
    createdAt: review.createdAt,

    repository: review.pullRequest.repository.fullName,

    pullRequest: {
      number: review.pullRequest.number,
      title: review.pullRequest.title,
    },

    // Review comments are the persisted findings produced by the review
    // pipeline. Keeping this mapping here makes it safe to add a dedicated
    // findings model later without changing the API contract.
    findings: (review.comments as ReviewComment[]).map((comment) => ({
      id: comment.id,
      path: comment.path,
      line: comment.line,
      message: comment.body,
      severity: comment.severity,
    })),
  };
}
