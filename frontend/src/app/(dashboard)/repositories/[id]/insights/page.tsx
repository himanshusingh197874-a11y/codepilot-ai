'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchRepositoryInsights, RepositoryInsights } from '@/lib/api';
import ScoreTrendChart from "@/components/charts/score-trend-chart";
import SeverityPieChart from "@/components/charts/severity-pie-chart";
import TopFilesChart from "@/components/charts/top-files-chart";

export default function RepositoryInsightsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [insights, setInsights] =
    useState<RepositoryInsights | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRepositoryInsights(params.id);
        setInsights(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      load();
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-8">Loading insights...</div>;
  }

  if (!insights) {
    return (
      <div className="p-8">
        Failed to load insights.
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back
      </button>

      <div>
        <h1 className="text-3xl font-bold">
          Repository Insights
        </h1>

        <p className="mt-2 text-gray-500">
          {insights.repository.fullName}
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Reviews
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            {insights.stats.totalReviews}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Average Score
          </p>

          <h2 className="mt-3 text-4xl font-bold text-green-600">
            {insights.stats.averageScore.toFixed(1)}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Findings
          </p>

          <h2 className="mt-3 text-4xl font-bold text-red-600">
            {insights.stats.totalComments}
          </h2>
        </div>
      </section>

     <section className="rounded-xl border bg-white p-6 shadow-sm">
  <h2 className="mb-6 text-xl font-semibold">
    Severity Distribution
  </h2>

  <SeverityPieChart
    data={insights.severity}
  />
</section>
        <section className="rounded-xl border bg-white p-6 shadow-sm">
  <h2 className="mb-6 text-xl font-semibold">
    AI Score Trend
  </h2>

  <ScoreTrendChart
    data={insights.scoreTrend}
  />
</section>
      <section className="rounded-xl border bg-white p-6 shadow-sm">
  <h2 className="mb-6 text-xl font-semibold">
    Top Problematic Files
  </h2>

  <TopFilesChart
    data={insights.topFiles}
  />
</section>
    </div>
  );
}
