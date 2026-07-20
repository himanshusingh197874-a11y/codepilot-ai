export interface ReviewIssue {
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
}

export interface FileReview {
  filename: string;
  summary: string;
  issues: ReviewIssue[];
  suggestions: string[];
}