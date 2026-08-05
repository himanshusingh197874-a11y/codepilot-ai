import { FileReview } from "./ai.types";
import { getAIProvider } from "./providers/provider.factory";

export class AIReviewService {
  private readonly provider = getAIProvider();

  async review(
    filename: string,
    patch: string,
  ): Promise<FileReview> {
    try {
      return await this.provider.review({
        filename,
        patch,
      });
    } catch (error) {
      console.error("AI review failed:", error);

      throw error;
    }
  }
}

export const aiReviewService = new AIReviewService();