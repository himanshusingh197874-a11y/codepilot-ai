import { FileReview } from "./ai.types";
import {
  PullRequestReview,
  PullRequestReviewFile,
} from "./pr-review.types";
import { AIProvider } from "./providers/ai-provider";
import { getAIProvider } from "./providers/provider.factory";

export class AIReviewService {
  constructor(private readonly provider: AIProvider = getAIProvider()) {}

  reviewFile(filename: string, patch: string): Promise<FileReview> {
    return this.provider.reviewFile({ filename, patch });
  }

  reviewPullRequest(
    files: readonly PullRequestReviewFile[],
  ): Promise<PullRequestReview> {
    return this.provider.reviewPullRequest(files);
  }
}

export const aiReviewService = new AIReviewService();
