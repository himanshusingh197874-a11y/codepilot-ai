import { FileReview } from "../ai.types";
import {
  PullRequestReview,
  PullRequestReviewFile,
} from "../pr-review.types";

export interface ReviewRequest {
  filename: string;
  patch: string;
}

export interface AIProvider {
  reviewFile(request: ReviewRequest): Promise<FileReview>;
  reviewPullRequest(
    files: readonly PullRequestReviewFile[],
  ): Promise<PullRequestReview>;
}
