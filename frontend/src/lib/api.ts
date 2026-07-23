import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

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

export async function fetchReviews(page = 1, limit = 10) {
  const res = await api.get<ReviewListResponse>(
    `/reviews?page=${page}&limit=${limit}`,
  );

  return res.data;
}

export async function fetchReview(id: string) {
  const res = await api.get(`/reviews/${id}`);
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

export default api;
