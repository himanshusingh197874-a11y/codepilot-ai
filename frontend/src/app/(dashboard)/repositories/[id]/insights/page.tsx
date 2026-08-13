'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchRepositoryInsights,
  RepositoryInsights,
} from '@/lib/api';
import ScoreTrendChart from '@/components/charts/score-trend-chart';
import SeverityPieChart from '@/components/charts/severity-pie-chart';
import TopFilesChart from '@/components/charts/top-files-chart';

export default function RepositoryInsightsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [insights, setInsights] =
    useState<RepositoryInsights | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) {
      return;
    }

    let cancelled = false;

    fetchRepositoryInsights(params.id)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setInsights(data);
        setError('');
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        console.error('Failed to load repository insights:', err);
        setError('Failed to load repository insights.');
      })
      .finally(() => {
        if (cancelled) {
          return;
        }

        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center text-gray-500">
        Loading repository insights...
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="space-y-4 p-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back
        </button>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Failed to load insights.'}
        </div>

        <button
          onClick={() => router.back()}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to repository
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Header */}

      <div>
        <button
          onClick={() => router.back()}
          className="mb-5 text-sm text-gray-600 transition hover:text-gray-900"
        >
          ← Back to repository
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Repository Insights
        </h1>

        <p className="mt-2 text-gray-500">
          {insights.repository.fullName}
        </p>
      </div>

      {/* Summary Stats */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pull Requests"
          value={insights.stats.totalPullRequests}
          description="Total synced PRs"
        />

        <StatCard
          title="Reviews"
          value={insights.stats.totalReviews}
          description="AI-generated reviews"
        />

        <StatCard
          title="Average Score"
          value={insights.stats.averageScore.toFixed(1)}
          description="AI quality score"
          valueClassName="text-green-600"
        />

        <StatCard
          title="Findings"
          value={insights.stats.totalComments}
          description="Issues identified"
          valueClassName="text-red-600"
        />
      </section>

      {/* Severity Distribution */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Severity Distribution
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Breakdown of issues identified by the AI reviewer.
          </p>
        </div>

        <SeverityPieChart data={insights.severity} />
      </section>

      {/* Score Trend */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            AI Score Trend
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review quality score over time.
          </p>
        </div>

        {insights.scoreTrend.length === 0 ? (
          <EmptyState message="No score history available yet." />
        ) : (
          <ScoreTrendChart data={insights.scoreTrend} />
        )}
      </section>

      {/* Top Problematic Files */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Top Problematic Files
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Files with the highest number of AI findings.
          </p>
        </div>

        {insights.topFiles.length === 0 ? (
          <EmptyState message="No problematic files found yet." />
        ) : (
          <TopFilesChart data={insights.topFiles} />
        )}
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  valueClassName = 'text-gray-900',
}: {
  title: string;
  value: string | number;
  description: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <h2
        className={`mt-3 text-4xl font-bold ${valueClassName}`}
      >
        {value}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl bg-gray-50">
      <p className="text-sm text-gray-500">
        {message}
      </p>
    </div>
  );
}