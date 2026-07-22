'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchReviewStats } from '@/lib/api';

type Stats = {
  totalReviews: number;
  averageScore: number;
  totalComments: number;
};

const demoData = [
  { day: 'Mon', reviews: 4 },
  { day: 'Tue', reviews: 7 },
  { day: 'Wed', reviews: 5 },
  { day: 'Thu', reviews: 9 },
  { day: 'Fri', reviews: 6 },
  { day: 'Sat', reviews: 3 },
  { day: 'Sun', reviews: 8 },
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchReviewStats();
        setStats(data);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <div className="p-6">Loading analytics…</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">
          Review activity and quality metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Reviews</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.totalReviews ?? 0}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Average Score</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {stats?.averageScore?.toFixed(1) ?? '0.0'}/10
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Comments</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {stats?.totalComments ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Review Activity
          </h2>
          <p className="text-sm text-gray-500">
            Reviews processed during the last 7 days
          </p>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoData}>
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="reviews" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}