'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchRepositoryDashboard,
  fetchRepositoryPulls,
  triggerPullRequestReview,
  RepositoryDashboard,
} from '@/lib/api';


type PullRequest = {
  number: number;
  title: string;
  state: string;
};

export default function RepositoryDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [dashboard, setDashboard] =
  useState<RepositoryDashboard | null>(null);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [reviewingPrNumber, setReviewingPrNumber] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadRepository() {
      try {
        const [dashboardData, openPullRequests] = await Promise.all([
  fetchRepositoryDashboard(params.id),
  fetchRepositoryPulls(params.id),
]);

setDashboard(dashboardData);
        setPulls(openPullRequests);
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

  async function handleRunReview(prNumber: number) {
    setReviewingPrNumber(prNumber);

    try {
      const result = await triggerPullRequestReview(params.id, prNumber);

      alert(`AI review completed. Review ID: ${result.reviewId}`);

      const [dashboardData, openPullRequests] = await Promise.all([
  fetchRepositoryDashboard(params.id),
  fetchRepositoryPulls(params.id) as Promise<PullRequest[]>,
]);

setDashboard(dashboardData);
setPulls(openPullRequests);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? 'Failed to run AI review.';

      alert(message);
    } finally {
      setReviewingPrNumber(null);
    }
  }

  if (loading) {
    return <div className="p-6">Loading repository…</div>;
  }

  if (error || !dashboard) {
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
  const repository = dashboard.repository;
  const stats = dashboard.stats;
  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => router.push('/repositories')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to repositories
      </button>

      {/* Repository Header */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{repository.fullName}</h1>

            <p className="mt-2 text-sm text-gray-600">
              Owner: {repository.owner} · Repository: {repository.name}
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Default branch: {repository.defaultBranch}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/repositories/${repository.id}/insights`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              View Insights
            </Link>

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
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">
      Average Score
    </p>

    <h2 className="mt-3 text-4xl font-bold text-green-600">
      {stats.averageScore.toFixed(1)}
    </h2>

    <p className="mt-2 text-sm text-gray-500">
      AI quality score
    </p>
  </div>

  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">
      Reviews
    </p>

    <h2 className="mt-3 text-4xl font-bold">
      {stats.totalReviews}
    </h2>

    <p className="mt-2 text-sm text-gray-500">
      Total AI reviews
    </p>
  </div>

  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">
      Pull Requests
    </p>

    <h2 className="mt-3 text-4xl font-bold">
      {stats.totalPullRequests}
    </h2>

    <p className="mt-2 text-sm text-gray-500">
      Synced PRs
    </p>
  </div>

  <div className="rounded-2xl border bg-white p-6 shadow-sm">
    <p className="text-sm font-medium text-gray-500">
      Issues Found
    </p>

    <h2 className="mt-3 text-4xl font-bold text-red-600">
      {stats.totalIssues}
    </h2>

    <p className="mt-2 text-sm text-gray-500">
      AI findings
    </p>
  </div>
</section>

      {/* Pull Requests */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Open Pull Requests</h2>

        {pulls.length === 0 ? (
          <p className="text-gray-500">No open pull requests.</p>
        ) : (
          <div className="space-y-3">
            {pulls.map((pr) => (
              <div
                key={pr.number}
                className="flex items-center justify-between rounded-lg border bg-white p-4"
              >
                <div>
                  <p className="font-medium">
                    #{pr.number} {pr.title}
                  </p>

                  <p className="text-sm capitalize text-gray-500">
                    {pr.state}
                  </p>
                </div>

                <button
                  disabled={reviewingPrNumber !== null}
                  onClick={() => handleRunReview(pr.number)}
                  className={
                    reviewingPrNumber !== null
                      ? 'cursor-not-allowed rounded bg-gray-200 px-4 py-2 text-gray-600'
                      : 'rounded bg-black px-4 py-2 text-white hover:bg-gray-800'
                  }
                >
                  {reviewingPrNumber === pr.number
                    ? 'Running AI Review...'
                    : 'Run AI Review'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Reviews */}
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recent Reviews</h2>

        {dashboard.recentReviews.length === 0 ? (
          <p className="mt-4 text-gray-500">
            No reviews have been generated yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {dashboard.recentReviews.map((review) => (
              <article
  key={review.id}
  className="rounded-xl border p-5 transition hover:border-gray-400 hover:shadow-md"
>
  <div className="flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500">
        PR #{review.pullRequest.number}
      </p>

      <h3 className="mt-1 text-lg font-semibold">
        {review.pullRequest.title}
      </h3>
    </div>

    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        review.score >= 9
          ? 'bg-green-100 text-green-700'
          : review.score >= 7
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      {review.score.toFixed(1)}/10
    </span>
  </div>

  <p className="mt-4 text-gray-600">
    {review.summary}
  </p>

  <div className="mt-5 flex items-center justify-between">
    <span className="text-sm text-gray-500">
      {new Date(review.createdAt).toLocaleString()}
    </span>

    <button
      onClick={() => router.push(`/reviews/${review.id}`)}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
    >
      View Review →
    </button>
  </div>
</article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}