'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  GitBranch,
  MessageSquare,
  Star,
} from 'lucide-react';
import { fetchReviewStats } from '@/lib/api';

type DashboardStats = {
  totalReviews: number;
  averageScore: number;
  totalComments: number;
  activeRepositories: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchReviewStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        Loading Dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-600">
        Failed to load dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          AI Code Review overview across all repositories.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Reviews"
          value={stats.totalReviews}
          icon={<BarChart3 size={24} />}
          color="blue"
        />

        <StatCard
          title="Average Score"
          value={`${stats.averageScore}/10`}
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
      </div>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">
          Issue Distribution
        </h2>

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

      <h2 className="mt-2 text-4xl font-bold">
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
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className={`rounded-xl p-6 ${colors[color]}`}>
      <p className="text-sm font-medium">
        {title} Issues
      </p>

      <h3 className="mt-3 text-4xl font-bold">
        {value}
      </h3>
    </div>
  );
}