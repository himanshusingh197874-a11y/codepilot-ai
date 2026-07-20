import { FileReview } from './ai.types';

export async function reviewPatch( filename: string, patch: string,): Promise<FileReview> {
  console.log(`Reviewing ${filename}...`);

  const issues: FileReview['issues'] = [];
  const suggestions: string[] = [];

  // Simple rule-based checks
  if (patch.includes('console.log')) {
    issues.push({
      severity: 'low',
      message: 'console.log found in code',
      suggestion: 'Remove debug logging before production deployment',
    });
  }

  if (patch.includes('any')) {
    issues.push({
      severity: 'medium',
      message: 'Usage of any type detected',
      suggestion: 'Replace any with a specific TypeScript type',
    });
  }

  if (patch.includes('TODO')) {
    issues.push({
      severity: 'low',
      message: 'TODO comment found',
      suggestion: 'Track TODOs in issues or complete before merge',
    });
  }

  // General suggestions
  suggestions.push('Consider adding unit tests for new functionality');

  return {
    filename,
    summary:
      issues.length === 0
        ? 'Code looks good overall'
        : `Found ${issues.length} potential issue(s)`,
    issues,
    suggestions,
  };
}