export interface AddedLine {
  lineNumber: number;
  content: string;
}

export function extractAddedLinesWithNumbers(patch: string): AddedLine[] {
  const lines = patch.split('\n');
  const result: AddedLine[] = [];

  let currentLine = 0;

  for (const line of lines) {
    // Hunk header: @@ -1,5 +10,8 @@
    const hunkMatch = line.match(/^@@ -\\d+(?:,\\d+)? \\+(\\d+)(?:,\\d+)? @@/);

    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1], 10);
      continue;
    }

    // Added line
    if (line.startsWith('+') && !line.startsWith('+++')) {
      result.push({
        lineNumber: currentLine,
        content: line.slice(1),
      });
      currentLine++;
      continue;
    }

    // Context line
    if (line.startsWith(' ')) {
      currentLine++;
    }

    // Removed lines do not increment the new-file line counter
  }

  return result;
}