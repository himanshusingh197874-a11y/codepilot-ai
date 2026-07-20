import { FileReview } from './ai.types';

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
  // Extract only newly added lines from the diff
  const addedLines = getAddedLines(patch);
  const addedCode = addedLines.join('\n');

  const issues: FileReview['issues'] = [];
  const suggestions: string[] = [];

  // Check for debug logging
  if (
    addedCode.includes('console.log(') &&
    !filename.includes('ai.service.ts')
  ) {
    issues.push({
      severity: 'low',
      message: 'Debug logging found in newly added code',
      suggestion: 'Remove console.log statements before production deployment',
    });
  }

  // Check for any type usage
  if (/:\s*any\b/.test(addedCode)) {
    issues.push({
      severity: 'medium',
      message: 'Usage of any type detected in newly added code',
      suggestion: 'Use a specific TypeScript type instead of any',
    });
  }

  // Check for TODO comments
  if (addedCode.includes('TODO')) {
    issues.push({
      severity: 'low',
      message: 'TODO comment found in newly added code',
      suggestion: 'Track TODOs in GitHub Issues or complete them before merge',
    });
  }

  // General suggestions
  if (filename.endsWith('.service.ts')) {
    suggestions.push('Consider adding unit tests for service logic');
  }

  if (filename.endsWith('.controller.ts')) {
    suggestions.push('Consider validating request payloads with Zod');
  }

  return {
    filename,
    summary:
      issues.length === 0
        ? 'Code looks good overall'
        : `Found ${issues.length} potential issue(s) in newly added code`,
    issues,
    suggestions,
  };
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