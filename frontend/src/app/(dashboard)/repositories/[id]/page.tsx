'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  GitPullRequest,
  Play,
  RefreshCw,
  Star,
} from 'lucide-react';

import {
  fetchRepositoryDashboard,
  fetchRepositoryPulls,
  triggerPullRequestReview,
  fetchRepositoryInsights,
  RepositoryDashboard,
  RepositoryInsights,
} from '@/lib/api';

import { socket } from '@/lib/socket';

type PullRequest = {
  number: number;
  title: string;
  state: string;
};

export default function RepositoryDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const repositoryId = params.id;

  const [dashboard, setDashboard] =
    useState<RepositoryDashboard | null>(null);

  const [insights, setInsights] =
    useState<RepositoryInsights | null>(null);

  const [pulls, setPulls] = useState<PullRequest[]>([]);

  const [reviewingPrNumber, setReviewingPrNumber] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadRepository = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const [
          dashboardData,
          openPullRequests,
          insightsData,
        ] = await Promise.all([
          fetchRepositoryDashboard(repositoryId),
          fetchRepositoryPulls(repositoryId),
          fetchRepositoryInsights(repositoryId),
        ]);

        setDashboard(dashboardData);
        setPulls(openPullRequests);
        setInsights(insightsData);
      } catch (err) {
        console.error('Failed to load repository details:', err);

        const status = (
          err as {
            response?: {
              status?: number;
            };
          }
        ).response?.status;

        setError(
          status === 404
            ? 'Repository not found.'
            : 'Failed to load repository details.',
        );
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [repositoryId],
  );

  useEffect(() => {
    let active = true;

    async function initializeRepository() {
      if (!active) {
        return;
      }

      await loadRepository();
    }

    void initializeRepository();

    return () => {
      active = false;
    };
  }, [loadRepository]);

  useEffect(() => {
    function onRepositoryUpdated(payload: {
      repositoryId: string;
    }) {
      if (payload.repositoryId !== repositoryId) {
        return;
      }

      void loadRepository({ silent: true });
    }

    socket.on('repository.updated', onRepositoryUpdated);

    return () => {
      socket.off('repository.updated', onRepositoryUpdated);
    };
  }, [repositoryId, loadRepository]);

  async function handleRunReview(prNumber: number) {
    setReviewingPrNumber(prNumber);
    setError('');

    try {
      await triggerPullRequestReview(repositoryId, prNumber);

      /*
       * The backend emits repository.updated after the review
       * completes. The Socket.IO listener above will refresh the
       * repository automatically.
       */
    } catch (err) {
      const message =
        (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response?.data?.message ??
        'Failed to run AI review.';

      setError(message);
    } finally {
      setReviewingPrNumber(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-gray-400"
          />

          <p className="mt-4 text-gray-500">
            Loading repository...
          </p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <CircleAlert
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load repository
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error || 'Repository not found.'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/repositories')}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to repositories
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const repository = dashboard.repository;
  const stats = dashboard.stats;

  const latestScore =
    insights?.scoreTrend?.length
      ? insights.scoreTrend[insights.scoreTrend.length - 1]?.score
      : null;

  return (
    <div className="space-y-8">
      {/* Back */}

      <button
        onClick={() => router.push('/repositories')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back to repositories
      </button>

      {/* Repository Header */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {repository.fullName}
              </h1>

              <span
                className={
                  repository.enabled
                    ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700'
                    : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600'
                }
              >
                {repository.enabled
                  ? 'Enabled'
                  : 'Disabled'}
              </span>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {repository.owner} / {repository.name}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Default branch:{' '}
              <span className="font-medium text-gray-700">
                {repository.defaultBranch}
              </span>
            </p>

            {repository.lastSyncedAt && (
              <p className="mt-2 text-xs text-gray-400">
                Last synced{' '}
                {new Date(
                  repository.lastSyncedAt,
                ).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() =>
                void loadRepository({ silent: true })
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? 'animate-spin' : ''
                }
              />

              Refresh
            </button>

            <Link
              href={`/repositories/${repository.id}/insights`}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <BarChart3 size={16} />
              View Insights
            </Link>
          </div>
        </div>
      </section>

      {/* Error Banner */}

      {error && dashboard && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Repository Stats */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Average Score"
          value={`${stats.averageScore.toFixed(1)}/10`}
          description="AI quality score"
          icon={<Star size={21} />}
          iconClassName="bg-green-50 text-green-600"
        />

        <StatCard
          title="Reviews"
          value={stats.totalReviews}
          description="Total AI reviews"
          icon={<CheckCircle2 size={21} />}
          iconClassName="bg-blue-50 text-blue-600"
        />

        <StatCard
          title="Pull Requests"
          value={stats.totalPullRequests}
          description="Synced pull requests"
          icon={<GitPullRequest size={21} />}
          iconClassName="bg-purple-50 text-purple-600"
        />

        <StatCard
          title="Issues Found"
          value={stats.totalIssues}
          description="AI findings"
          icon={<CircleAlert size={21} />}
          iconClassName="bg-red-50 text-red-600"
        />
      </section>

      {/* Repository Insights */}

      {insights && (
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Repository Insights
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Overview of code quality and review findings.
              </p>
            </div>

            <Link
              href={`/repositories/${repository.id}/insights`}
              className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
            >
              View Full Dashboard →
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {/* Severity */}

            <div className="rounded-xl border bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">
                Issue Severity
              </h3>

              <div className="mt-4 space-y-3">
                <SeverityRow
                  label="High"
                  value={insights.severity.high}
                  className="text-red-600"
                />

                <SeverityRow
                  label="Medium"
                  value={insights.severity.medium}
                  className="text-yellow-600"
                />

                <SeverityRow
                  label="Low"
                  value={insights.severity.low}
                  className="text-blue-600"
                />
              </div>
            </div>

            {/* Top Files */}

            <div className="rounded-xl border bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">
                Top Problem Files
              </h3>

              {insights.topFiles.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">
                  No problematic files found.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {insights.topFiles
                    .slice(0, 3)
                    .map((file) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between gap-3"
                      >
                        <span
                          className="truncate text-sm text-gray-600"
                          title={file.path}
                        >
                          {file.path}
                        </span>

                        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                          {file.findings}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Latest Score */}

            <div className="rounded-xl border bg-gray-50 p-5">
              <h3 className="font-semibold text-gray-900">
                Latest Score
              </h3>

              {latestScore !== null &&
              latestScore !== undefined ? (
                <>
                  <p
                    className={`mt-4 text-5xl font-bold ${
                      latestScore >= 8
                        ? 'text-green-600'
                        : latestScore >= 5
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }`}
                  >
                    {latestScore.toFixed(1)}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    Latest AI quality score
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  No score available yet.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Pull Requests */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Open Pull Requests
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Run an AI review against an open pull request.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {pulls.length}
          </span>
        </div>

        {pulls.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <GitPullRequest
              size={32}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-4 font-semibold text-gray-900">
              No open pull requests
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              There are currently no open pull requests in
              this repository.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pulls.map((pr) => (
              <div
                key={pr.number}
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <GitPullRequest
                        size={18}
                        className="shrink-0 text-gray-500"
                      />

                      <p className="font-semibold text-gray-900">
                        #{pr.number}
                      </p>

                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                        {pr.state}
                      </span>
                    </div>

                    <p className="mt-2 truncate text-sm text-gray-600">
                      {pr.title}
                    </p>
                  </div>

                  <button
                    disabled={reviewingPrNumber !== null}
                    onClick={() =>
                      void handleRunReview(pr.number)
                    }
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    <Play size={15} />

                    {reviewingPrNumber === pr.number
                      ? 'Running Review...'
                      : 'Run AI Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Reviews */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Reviews
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest AI-generated reviews for this repository.
            </p>
          </div>

          {dashboard.recentReviews.length > 0 && (
            <Link
              href="/reviews"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              View All →
            </Link>
          )}
        </div>

        {dashboard.recentReviews.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center">
            <CheckCircle2
              size={30}
              className="mx-auto text-gray-300"
            />

            <p className="mt-3 font-medium text-gray-700">
              No reviews yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Run an AI review on a pull request to see
              results here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {dashboard.recentReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-xl border p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      PR #{review.pullRequest.number}
                    </p>

                    <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">
                      {review.pullRequest.title}
                    </h3>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${
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

                <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
                  {review.summary}
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-gray-500">
                    {new Date(
                      review.createdAt,
                    ).toLocaleString()}
                  </span>

                  <button
                    onClick={() =>
                      router.push(
                        `/reviews/${review.id}`,
                      )
                    }
                    className="text-left text-sm font-semibold text-indigo-600 hover:text-indigo-800 sm:text-right"
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

function StatCard({
  title,
  value,
  description,
  icon,
  iconClassName,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`inline-flex rounded-xl p-3 ${iconClassName}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

function SeverityRow({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">
        {label}
      </span>

      <span className={`font-bold ${className}`}>
        {value}
      </span>
    </div>
  );
}