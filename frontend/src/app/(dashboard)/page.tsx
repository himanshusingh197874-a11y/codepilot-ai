'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  GitBranch,
  MessageSquare,
  Star,
  AlertTriangle,
} from 'lucide-react';

import { fetchReviewStats, ReviewStats } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const data = await fetchReviewStats();

        if (cancelled) {
          return;
        }

        setStats(data);
        setError('');
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

          <p className="mt-4 text-sm text-gray-500">
            Loading Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>

          <p className="mt-2 text-gray-600">
            AI Code Review overview across all repositories.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load dashboard
              </h2>

              <p className="mt-1 text-sm text-red-600">
                {error || 'No dashboard data was returned.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}

      <section>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          AI Code Review overview across all repositories.
        </p>
      </section>

      {/* Main Statistics */}

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Reviews"
          value={stats.totalReviews}
          icon={<BarChart3 size={24} />}
          color="blue"
        />

        <StatCard
          title="Average Score"
          value={`${stats.averageScore.toFixed(1)}/10`}
          icon={<Star size={24} />}
          color="green"
        />

        <StatCard
          title="Repositories"
          value={stats.activeRepositories}
          icon={<GitBranch size={24} />}
          color="purple"
        />

        <StatCard
          title="Comments"
          value={stats.totalComments}
          icon={<MessageSquare size={24} />}
          color="orange"
        />
      </section>

      {/* Issue Distribution */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Issue Distribution
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Findings identified across reviewed pull requests.
            </p>
          </div>

          <div className="rounded-xl bg-gray-100 p-3">
            <AlertTriangle
              size={22}
              className="text-gray-600"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <IssueCard
            title="High"
            value={stats.highIssues}
            color="red"
          />

          <IssueCard
            title="Medium"
            value={stats.mediumIssues}
            color="yellow"
          />

          <IssueCard
            title="Low"
            value={stats.lowIssues}
            color="blue"
          />
        </div>
      </section>

      {/* Overall Health */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">
          Review Health
        </h2>

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Average Review Score
            </span>

            <span className="font-semibold text-gray-900">
              {stats.averageScore.toFixed(1)} / 10
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  Math.max(stats.averageScore * 10, 0),
                  100,
                )}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Based on {stats.totalReviews}{' '}
            {stats.totalReviews === 1 ? 'review' : 'reviews'}.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div
        className={`inline-flex rounded-xl p-3 ${colors[color]}`}
      >
        {icon}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {title}
      </p>

      <h2 className="mt-2 text-4xl font-bold text-gray-900">
        {value}
      </h2>
    </div>
  );
}

function IssueCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: 'red' | 'yellow' | 'blue';
}) {
  const colors = {
    red: 'bg-red-50 text-red-700 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
  };

  return (
    <div
      className={`rounded-xl border p-6 ${colors[color]}`}
    >
      <p className="text-sm font-medium">
        {title} Issues
      </p>

      <h3 className="mt-3 text-4xl font-bold">
        {value}
      </h3>
    </div>
  );
}