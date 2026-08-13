'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  GitPullRequest,
  MessageSquare,
  Star,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  fetchReviewStats,
  ReviewStats,
} from '@/lib/api';

type DailyActivity =
  ReviewStats['dailyActivity'][number];

const EMPTY_DAILY_ACTIVITY: ReviewStats['dailyActivity'] =
  [];

type TooltipPayloadItem = {
  payload?: DailyActivity;
};

type DailyActivityTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
};

export default function AnalyticsPage() {
  const [stats, setStats] =
    useState<ReviewStats | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

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

        console.error(
          'Failed to load analytics:',
          err,
        );

        setError(
          'Failed to load analytics data.',
        );
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

  /*
   * Keep the empty array reference stable.
   */
  const dailyActivity = stats
    ? stats.dailyActivity
    : EMPTY_DAILY_ACTIVITY;

  const sevenDayTotals = useMemo(() => {
    return dailyActivity.reduce(
      (acc, day) => ({
        reviews:
          acc.reviews + day.reviews,

        pullRequests:
          acc.pullRequests +
          day.pullRequests,

        comments:
          acc.comments +
          day.comments,

        findings:
          acc.findings +
          day.findings,

        highIssues:
          acc.highIssues +
          day.highIssues,
      }),
      {
        reviews: 0,
        pullRequests: 0,
        comments: 0,
        findings: 0,
        highIssues: 0,
      },
    );
  }, [dailyActivity]);

  const bestDay = useMemo(() => {
    if (!dailyActivity.length) {
      return null;
    }

    return dailyActivity.reduce(
      (best, current) => {
        if (
          current.pullRequests >
          best.pullRequests
        ) {
          return current;
        }

        if (
          current.pullRequests ===
            best.pullRequests &&
          current.averageScore >
            best.averageScore
        ) {
          return current;
        }

        return best;
      },
      dailyActivity[0],
    );
  }, [dailyActivity]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

          <p className="mt-4 text-sm text-gray-500">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics
          </h1>

          <p className="mt-2 text-gray-600">
            Review activity and quality metrics.
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
                Unable to load analytics
              </h2>

              <p className="mt-1 text-sm text-red-600">
                {error ||
                  'No analytics data was returned.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =====================================================
          Header
      ====================================================== */}

      <section>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics
        </h1>

        <p className="mt-2 text-gray-600">
          Review activity, pull request volume,
          findings and code quality across your
          repositories.
        </p>
      </section>

      {/* =====================================================
          Top Statistics
      ====================================================== */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Reviews"
          value={stats.totalReviews}
          subtitle="All-time AI reviews"
          icon={<BarChart3 size={22} />}
        />

        <MetricCard
          title="Average Score"
          value={`${stats.averageScore.toFixed(1)}/10`}
          subtitle="Overall review quality"
          icon={<Star size={22} />}
        />

        <MetricCard
          title="Total Comments"
          value={stats.totalComments}
          subtitle="Inline review comments"
          icon={<MessageSquare size={22} />}
        />

        <MetricCard
          title="Repositories"
          value={stats.activeRepositories}
          subtitle="Active repositories"
          icon={<Activity size={22} />}
        />
      </section>

      {/* =====================================================
          7 Day Summary
      ====================================================== */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="PRs Reviewed"
          value={sevenDayTotals.pullRequests}
          subtitle="Last 7 days"
          icon={<GitPullRequest size={20} />}
        />

        <SummaryCard
          title="AI Reviews"
          value={sevenDayTotals.reviews}
          subtitle="Review executions"
          icon={<BarChart3 size={20} />}
        />

        <SummaryCard
          title="Total Findings"
          value={sevenDayTotals.findings}
          subtitle="AI + inline findings"
          icon={<MessageSquare size={20} />}
        />

        <SummaryCard
          title="High Issues"
          value={sevenDayTotals.highIssues}
          subtitle="High / critical findings"
          icon={<AlertTriangle size={20} />}
        />
      </section>

      {/* =====================================================
          Daily Activity Chart
      ====================================================== */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Daily Review Activity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Pull requests, AI reviews and findings
              processed during the last 7 days.
            </p>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Last 7 days
          </div>
        </div>

        <div className="mt-8 h-[380px]">
          {dailyActivity.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No review activity available.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={dailyActivity}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="activity"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="score"
                  orientation="right"
                  domain={[0, 10]}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  content={<DailyActivityTooltip />}
                />

                <Legend />

                <Bar
                  yAxisId="activity"
                  dataKey="pullRequests"
                  name="PRs"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  yAxisId="activity"
                  dataKey="reviews"
                  name="Reviews"
                  radius={[6, 6, 0, 0]}
                />

                <Bar
                  yAxisId="activity"
                  dataKey="findings"
                  name="Findings"
                  radius={[6, 6, 0, 0]}
                />

                <Line
                  yAxisId="score"
                  type="monotone"
                  dataKey="averageScore"
                  name="Avg Score"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* =====================================================
          Daily Breakdown
      ====================================================== */}

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Daily Breakdown
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Detailed activity for each day.
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <TableHeader>Date</TableHeader>
                <TableHeader>PRs</TableHeader>
                <TableHeader>Reviews</TableHeader>
                <TableHeader>Findings</TableHeader>
                <TableHeader>Comments</TableHeader>
                <TableHeader>High Issues</TableHeader>
                <TableHeader>Avg Score</TableHeader>
              </tr>
            </thead>

            <tbody className="divide-y">
              {dailyActivity.map((day) => (
                <tr
                  key={day.date}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">
                      {formatDate(day.date)}
                    </div>

                    <div className="text-xs text-gray-400">
                      {day.day}
                    </div>
                  </td>

                  <td className="px-4 py-4 font-semibold text-gray-900">
                    {day.pullRequests}
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {day.reviews}
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {day.findings}
                  </td>

                  <td className="px-4 py-4 text-gray-700">
                    {day.comments}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        day.highIssues > 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {day.highIssues}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <ScoreBadge
                      score={day.averageScore}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          Insights
      ====================================================== */}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <Activity
                size={20}
                className="text-gray-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Most Active Day
              </h2>

              <p className="text-sm text-gray-500">
                Highest number of PRs reviewed
              </p>
            </div>
          </div>

          {bestDay ? (
            <div className="mt-6">
              <p className="text-3xl font-bold text-gray-900">
                {bestDay.day}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                {bestDay.pullRequests}{' '}
                {bestDay.pullRequests === 1
                  ? 'pull request'
                  : 'pull requests'}{' '}
                reviewed
              </p>

              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-gray-600">
                  {bestDay.findings} findings
                </span>

                <span className="text-gray-600">
                  {bestDay.averageScore.toFixed(1)}
                  /10 score
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-gray-500">
              No activity available.
            </p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <AlertTriangle
                size={20}
                className="text-gray-600"
              />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Issue Overview
              </h2>

              <p className="text-sm text-gray-500">
                Findings detected during the last 7
                days
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <IssueStat
              label="High"
              value={stats.highIssues}
            />

            <IssueStat
              label="Medium"
              value={stats.mediumIssues}
            />

            <IssueStat
              label="Low"
              value={stats.lowIssues}
            />
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Severity totals are based on persisted
            review comments.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ============================================================
 * Metric Card
 * ============================================================ */

function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-gray-50 p-3 text-gray-600">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm font-medium text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}

/* ============================================================
 * Summary Card
 * ============================================================ */

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <div className="rounded-lg bg-gray-50 p-2 text-gray-500">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {subtitle}
      </p>
    </div>
  );
}

/* ============================================================
 * Tooltip
 * ============================================================ */

function DailyActivityTooltip({
  active,
  payload,
}: DailyActivityTooltipProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const data = payload[0]?.payload;

  if (!data) {
    return null;
  }

  return (
    <div className="min-w-[210px] rounded-xl border bg-white p-4 shadow-lg">
      <p className="font-semibold text-gray-900">
        {formatDate(data.date)}
      </p>

      <p className="mt-1 text-xs text-gray-400">
        {data.day}
      </p>

      <div className="mt-4 space-y-2 text-sm">
        <TooltipRow
          label="Pull Requests"
          value={data.pullRequests}
        />

        <TooltipRow
          label="AI Reviews"
          value={data.reviews}
        />

        <TooltipRow
          label="Findings"
          value={data.findings}
        />

        <TooltipRow
          label="Comments"
          value={data.comments}
        />

        <TooltipRow
          label="High Issues"
          value={data.highIssues}
        />

        <div className="my-2 border-t" />

        <TooltipRow
          label="Average Score"
          value={`${data.averageScore}/10`}
        />
      </div>
    </div>
  );
}

/* ============================================================
 * Tooltip Row
 * ============================================================ */

function TooltipRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-gray-500">
        {label}
      </span>

      <span className="font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
 * Table Header
 * ============================================================ */

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}

/* ============================================================
 * Score Badge
 * ============================================================ */

function ScoreBadge({
  score,
}: {
  score: number;
}) {
  let className =
    'bg-red-100 text-red-700';

  if (score >= 8) {
    className =
      'bg-green-100 text-green-700';
  } else if (score >= 5) {
    className =
      'bg-yellow-100 text-yellow-700';
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {score.toFixed(1)}/10
    </span>
  );
}

/* ============================================================
 * Issue Stat
 * ============================================================ */

function IssueStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* ============================================================
 * Date Formatter
 * ============================================================ */

function formatDate(date: string) {
  return new Date(
    `${date}T00:00:00`,
  ).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}