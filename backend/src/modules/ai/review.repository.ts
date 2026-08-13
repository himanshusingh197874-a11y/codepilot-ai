import { prisma } from "../../lib/prisma";
import { PullRequestReview } from "./pr-review.types";

export async function saveReview(params: {
  repositoryId: string;
  githubPrId: bigint;
  number: number;
  title: string;
  state: string;
  review: PullRequestReview;
}) {
  const pullRequest = await prisma.pullRequest.upsert({
    where: { githubPrId: params.githubPrId },
    update: { title: params.title, state: params.state },
    create: {
      githubPrId: params.githubPrId,
      number: params.number,
      title: params.title,
      state: params.state,
      repositoryId: params.repositoryId,
    },
  });

  return prisma.review.create({
    data: {
      pullRequestId: pullRequest.id,
      summary: params.review.summary,
      score: params.review.overallScore,
      positives: params.review.positives,
      issues: params.review.issues,
      suggestions: params.review.suggestions,
      verdict: params.review.verdict,
    },
  });
}
