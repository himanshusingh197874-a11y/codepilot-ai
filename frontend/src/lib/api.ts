import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});
console.log("Axios Base URL:", api.defaults.baseURL);

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

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
  total: number;
  page: number;
  limit: number;
}

export type FindingSeverity = 'high' | 'medium' | 'low' | string;

export interface ReviewFinding {
  id: string;
  path: string;
  line: number;
  message: string;
  severity: FindingSeverity;
  codeSnippet?: string;
}

export interface ReviewDetail {
  id: string;
  repository: string;
  score: number;
  summary: string;
  createdAt: string;
  pullRequest: {
    number: number;
    title: string;
  };
  findings: ReviewFinding[];
}

export async function fetchReviews(page = 1, limit = 10) {
  const res = await api.get<ReviewListResponse>(
    `/reviews?page=${page}&limit=${limit}`,
  );

  return res.data;
}

export async function fetchReview(id: string) {
  const res = await api.get<ReviewDetail>(`/reviews/${id}`);
  return res.data;
}

export async function fetchReviewStats() {
  const res = await api.get('/reviews/stats');
  return res.data;
}

export async function fetchRepositoryPulls(id: string) {
  const res = await api.get(`/repositories/${id}/pulls`);
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

export async function fetchRepositoryDashboard(id: string) {
  const res = await api.get<RepositoryDashboard>(
    `/repositories/${id}/dashboard`,
  );

  return res.data;
}

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

export async function fetchRepositoryInsights(id: string) {
  const res = await api.get<RepositoryInsights>(
    `/repositories/${id}/insights`,
  );

  return res.data;
}

export default api;
