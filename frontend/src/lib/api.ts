import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

console.log('Axios Base URL:', api.defaults.baseURL);

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* ============================================================
 * Reviews
 * ============================================================ */

export interface ReviewListItem {
  id: string;
  summary: string;
  score: number;
  createdAt: string;

  pullRequest: {
    number: number;
    title: string;
    githubPrId: string;

    repository: {
      id: string;
      fullName: string;
    };
  };
}

export interface ReviewListResponse {
  items: ReviewListItem[];

  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export type FindingSeverity =
  | 'high'
  | 'medium'
  | 'low'
  | string;

export interface ReviewFinding {
  id: string;

  source: 'ai' | 'inline';

  path?: string;

  line?: number;

  message: string;

  suggestion?: string;

  severity: FindingSeverity;

  codeSnippet?: string;
}

export interface ReviewDetail {
  id: string;

  repository: string;

  score: number;

  summary: string;

  positives: string[];

  issues: Array<{
    severity: FindingSeverity;
    message: string;
    suggestion: string;
    path?: string;
    line?: number;
  }>;

  suggestions: string[];

  verdict: 'approve' | 'request_changes';

  createdAt: string;

  pullRequest: {
    number: number;
    title: string;
  };

  findings: ReviewFinding[];
}

export async function fetchReviews(
  page = 1,
  limit = 10,
) {
  const res = await api.get<ReviewListResponse>(
    '/reviews',
    {
      params: {
        page,
        limit,
      },
    },
  );

  return res.data;
}

export async function fetchReview(id: string) {
  const res = await api.get<ReviewDetail>(
    `/reviews/${id}`,
  );

  return res.data;
}

/* ============================================================
 * Review Analytics
 * ============================================================ */

export interface DailyReviewActivity {
  /*
   * Calendar date.
   *
   * Example:
   * 2026-08-12
   */
  date: string;

  /*
   * Short weekday.
   *
   * Example:
   * Wed
   */
  day: string;

  /*
   * Number of AI review records created that day.
   */
  reviews: number;

  /*
   * Number of unique PRs reviewed that day.
   */
  pullRequests: number;

  /*
   * Number of inline GitHub review comments.
   */
  comments: number;

  /*
   * Total findings:
   *
   * AI issues + inline comments
   */
  findings: number;

  /*
   * High/critical/error findings.
   */
  highIssues: number;

  /*
   * Average AI review score for that day.
   */
  averageScore: number;
}

export type ReviewStats = {
  totalReviews: number;

  averageScore: number;

  totalComments: number;

  activeRepositories: number;

  highIssues: number;

  mediumIssues: number;

  lowIssues: number;

  dailyActivity: DailyReviewActivity[];
};

export async function fetchReviewStats(): Promise<ReviewStats> {
  const res = await api.get<ReviewStats>(
    '/reviews/stats',
  );

  return res.data;
}

/* ============================================================
 * Repository APIs
 * ============================================================ */

export async function fetchRepositoryPulls(
  id: string,
) {
  const res = await api.get(
    `/repositories/${id}/pulls`,
  );

  return res.data;
}

export async function triggerPullRequestReview(
  repoId: string,
  prNumber: number,
) {
  const res = await api.post(
    `/repositories/${repoId}/pulls/${prNumber}/review`,
  );

  return res.data;
}

/* ============================================================
 * Repository Dashboard
 * ============================================================ */

export interface RepositoryDashboard {
  repository: {
    id: string;

    githubRepoId: number;

    owner: string;

    name: string;

    fullName: string;

    defaultBranch: string;

    private: boolean;

    enabled: boolean;

    webhookId: string | null;

    lastSyncedAt: string | null;

    userId: string;

    createdAt: string;

    updatedAt: string;
  };

  stats: {
    totalReviews: number;

    averageScore: number;

    totalPullRequests: number;

    totalIssues: number;
  };

  recentReviews: {
    id: string;

    score: number;

    summary: string;

    createdAt: string;

    pullRequest: {
      id: string;

      githubPrId: string;

      number: number;

      title: string;

      state: string;

      repositoryId: string;

      createdAt: string;

      updatedAt: string;
    };
  }[];
}

export async function fetchRepositoryDashboard(
  id: string,
) {
  const res =
    await api.get<RepositoryDashboard>(
      `/repositories/${id}/dashboard`,
    );

  return res.data;
}

/* ============================================================
 * Repository Insights
 * ============================================================ */

export interface RepositoryInsights {
  repository: {
    id: string;

    name: string;

    fullName: string;
  };

  stats: {
    totalPullRequests: number;

    totalReviews: number;

    averageScore: number;

    totalComments: number;
  };

  severity: {
    high: number;

    medium: number;

    low: number;
  };

  topFiles: {
    path: string;

    findings: number;
  }[];

  scoreTrend: {
    date: string;

    score: number;
  }[];
}

export async function fetchRepositoryInsights(
  id: string,
) {
  const res =
    await api.get<RepositoryInsights>(
      `/repositories/${id}/insights`,
    );

  return res.data;
}

export default api;