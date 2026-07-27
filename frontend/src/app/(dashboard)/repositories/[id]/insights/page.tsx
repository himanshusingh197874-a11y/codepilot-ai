"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRepositoryInsights } from "@/lib/api/repositories";
import StatCard from "@/components/dashboard/stat-card";
import RecentReviewTable from "@/components/dashboard/recent-review-table";

type RepositoryInsights = {
  repository: {
    id: string;
    name: string;
    fullName: string;
  };

  stats: {
    totalPullRequests: number;
    totalReviews: number;
    averageScore: number;
    totalComments: number;
  };

  recentReviews: {
    id: string;
    score: number;
    summary: string;
    createdAt: string;
  }[];
};

export default function RepositoryInsightsPage() {
  const params = useParams();
  const id = params.id as string;

 const [data, setData] = useState<RepositoryInsights | null>(null);

  useEffect(() => {
    console.log("========== INSIGHTS PAGE ==========");
    console.log("id =", id);

    const token = localStorage.getItem("accessToken");

    console.log("token =", token);

    if (!token) {
      console.log("NO TOKEN");
      return;
    }

    console.log("Calling API...");

    getRepositoryInsights(id, token)
      .then((res) => {
        console.log("SUCCESS", res);
        setData(res);
      })
      .catch((err) => {
        console.error("FAILED", err);
      });
  }, [id]);

  if (!data) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">
          {data.repository.name}
        </h1>

        <p className="text-gray-500">
          {data.repository.fullName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pull Requests"
          value={data.stats.totalPullRequests}
        />

        <StatCard
          title="Reviews"
          value={data.stats.totalReviews}
        />

        <StatCard
          title="Average Score"
          value={data.stats.averageScore}
        />

        <StatCard
          title="AI Comments"
          value={data.stats.totalComments}
        />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">
          Recent Reviews
        </h2>

        <RecentReviewTable
          reviews={data.recentReviews}
        />
      </div>
    </div>
  );
}