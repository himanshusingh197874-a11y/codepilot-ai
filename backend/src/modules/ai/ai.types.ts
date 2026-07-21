export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface ReviewIssue {
  severity: Severity;
  message: string;
  suggestion: string;
}

export interface FileReview {
  filename: string;
  summary: string;
  score: number; // 0-10
  issues: ReviewIssue[];
  suggestions: string[];
}