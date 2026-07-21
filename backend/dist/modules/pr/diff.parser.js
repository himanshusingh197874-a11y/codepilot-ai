"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAddedLinesWithNumbers = extractAddedLinesWithNumbers;
function extractAddedLinesWithNumbers(patch) {
    const lines = patch.split('\n');
    const result = [];
    let newLineNumber = 0;
    for (const line of lines) {
        // Match hunk header: @@ -1,5 +10,8 @@
        const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (hunkMatch) {
            newLineNumber = parseInt(hunkMatch[1], 10);
            continue;
        }
        // Added line
        if (line.startsWith('+') && !line.startsWith('+++')) {
            result.push({
                lineNumber: newLineNumber,
                content: line.slice(1),
            });
            newLineNumber++;
            continue;
        }
        // Context line
        if (line.startsWith(' ')) {
            newLineNumber++;
            continue;
        }
        // Removed line: do not increment new-file line number
        if (line.startsWith('-') && !line.startsWith('---')) {
            continue;
        }
    }
    return result;
}
