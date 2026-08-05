import { FileReview } from './ai.types';
import { getAIProvider } from "./providers/provider.factory";
import { aiReviewService } from "./ai-review.service";

function getAddedLines(patch: string): string[] {
  return patch
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));
}

export async function reviewPatch(
  filename: string,
  patch: string,
): Promise<FileReview> {
  return aiReviewService.review(filename, patch);
}

// Analyze a single added line for inline comments
export function analyzeLine(content: string): string | null {
  if (content.includes('console.log(')) {
    return '⚠️ Avoid using console.log in production code.';
  }

  if (/:\s*any\b/.test(content)) {
    return '⚠️ Avoid using any; prefer a specific TypeScript type.';
  }

  if (content.includes('TODO')) {
    return '📝 TODO found — consider creating a GitHub issue for tracking.';
  }

  return null;
}
