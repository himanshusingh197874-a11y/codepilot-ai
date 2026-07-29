'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  GitPullRequest,
  FolderGit2,
  Star,
  ClipboardCheck,
} from 'lucide-react';
import api from '@/lib/api';

type Review = {
  id: string;
  score: number;
  createdAt: string;
  pullRequest: {
    number: number;
    title: string;
    repository: {
      fullName: string;
    };
  };
};

export default function ReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await api.get('/reviews?limit=10');
        setReviews(res.data.items);
      } catch (err) {
        console.error(err);
        setError('Failed to load reviews.');
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  const averageScore = useMemo(() => {
    if (!reviews.length) return 0;

    return (
      reviews.reduce((sum, review) => sum + review.score, 0) /
      reviews.length
    );
  }, [reviews]);

  function scoreColor(score: number) {
    if (score >= 9) return 'bg-green-100 text-green-700';

    if (score >= 7) return 'bg-yellow-100 text-yellow-700';

    return 'bg-red-100 text-red-700';
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center text-gray-500">
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          AI Reviews
        </h1>

        <p className="mt-2 text-gray-600">
          Browse every AI-generated pull request review.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">

        <StatCard
          title="Total Reviews"
          value={reviews.length}
          icon={<ClipboardCheck size={22} />}
        />

        <StatCard
          title="Average Score"
          value={`${averageScore.toFixed(1)}/10`}
          icon={<Star size={22} />}
        />

        <StatCard
          title="Repositories"
          value={
            new Set(
              reviews.map(
                (r) => r.pullRequest.repository.fullName,
              ),
            ).size
          }
          icon={<FolderGit2 size={22} />}
        />

      </section>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

        <table className="min-w-full">

          <thead className="border-b bg-gray-50">

            <tr>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Repository
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Pull Request
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Score
              </th>

              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Reviewed
              </th>

              <th className="px-6 py-4" />

            </tr>

          </thead>

          <tbody className="divide-y">

            {reviews.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="py-14 text-center text-gray-500"
                >
                  No reviews found.
                </td>

              </tr>

            ) : (

              reviews.map((review) => (

                <tr
                  key={review.id}
                  onClick={() =>
                    router.push(`/reviews/${review.id}`)
                  }
                  className="cursor-pointer transition-all hover:bg-gray-50"
                >

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <FolderGit2
                        size={18}
                        className="text-gray-400"
                      />

                      <span className="font-medium text-gray-900">
                        {review.pullRequest.repository.fullName}
                      </span>

                    </div>

                  </td>

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-2">

                      <GitPullRequest
                        size={16}
                        className="text-gray-500"
                      />

                      <span className="font-medium">
                        #{review.pullRequest.number}
                      </span>

                    </div>

                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                      {review.pullRequest.title}
                    </p>

                  </td>

                  <td className="px-6 py-5">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreColor(
                        review.score,
                      )}`}
                    >
                      {review.score.toFixed(1)}/10
                    </span>

                  </td>

                  <td className="px-6 py-5 text-sm text-gray-500">
                    {new Date(
                      review.createdAt,
                    ).toLocaleString()}
                  </td>

                  <td className="px-6 py-5 text-right">

                    <ArrowRight
                      size={18}
                      className="inline text-gray-400 transition group-hover:translate-x-1"
                    />

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <div className="text-gray-500">
          {icon}
        </div>

      </div>

      <p className="mt-4 text-3xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}