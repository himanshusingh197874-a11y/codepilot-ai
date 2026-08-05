import { FileReview } from "../ai.types";

export interface ReviewRequest {
  filename: string;
  patch: string;
}

export interface AIProvider {
  review(
    request: ReviewRequest,
  ): Promise<FileReview>;
}