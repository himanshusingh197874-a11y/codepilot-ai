import { FileReview } from "./ai.types";
import { aiReviewService } from "./ai-review.service";

export async function reviewPatch(
  filename: string,
  patch: string,
): Promise<FileReview> {
  return aiReviewService.reviewFile(filename, patch);
}

export { aiReviewService };

// Local rules intentionally remain deterministic because they are used for
// immediate, line-addressable GitHub inline comments.
export function analyzeLine(content: string): string | null {
  if (content.includes("console.log(")) {
    return "Avoid using console.log in production code.";
  }

  if (/:\s*any\b/.test(content)) {
    return "Avoid using any; prefer a specific TypeScript type.";
  }

  if (content.includes("TODO")) {
    return "TODO found — consider creating a GitHub issue for tracking.";
  }

  return null;
}
