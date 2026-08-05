export function buildReviewPrompt(
  filename: string,
  patch: string,
): string {
  return `
You are a senior TypeScript reviewer.

Review ONLY the added lines from this git diff.

File:
${filename}

Diff:
${patch}

Find:

- bugs
- security issues
- performance problems
- maintainability
- readability
- best practices

Ignore deleted lines.

Return only structured JSON.
`;
}