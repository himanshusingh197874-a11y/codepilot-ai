'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

type RecentReview = {
  id: string;
  score: number;
  summary: string;
  createdAt: string;
};

type RepositoryDetails = {
  id: string;
  fullName: string;
  owner: string;
  name: string;
  defaultBranch: string;
  enabled: boolean;
  totalReviews: number;
  averageScore: number;
  recentReviews: RecentReview[];
};

export default function RepositoryDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [repository, setRepository] = useState<RepositoryDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRepository() {
      try {
        const response = await api.get<RepositoryDetails>(
          `/repositories/${params.id}`,
        );
        setRepository(response.data);
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response
          ?.status;
        setError(
          status === 404
            ? 'Repository not found.'
            : 'Failed to load repository details.',
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadRepository();
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Loading repository…</div>;
  }

  if (error || !repository) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Repository not found.'}</p>
        <button
          onClick={() => router.push('/repositories')}
          className="mt-4 rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Back to repositories
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => router.push('/repositories')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to repositories
      </button>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {repository.fullName}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Owner: {repository.owner} · Repository: {repository.name}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Default branch: {repository.defaultBranch}
            </p>
          </div>
          <span
            className={
              repository.enabled
                ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700'
                : 'rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600'
            }
          >
            {repository.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total reviews</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {repository.totalReviews}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Average score</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {repository.averageScore.toFixed(1)}/10
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Recent reviews</h2>
        {repository.recentReviews.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No reviews have been generated for this repository yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {repository.recentReviews.map((review) => (
              <article key={review.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-gray-900">
                    Score: {review.score.toFixed(1)}/10
                  </span>
                  <time className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {review.summary}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
