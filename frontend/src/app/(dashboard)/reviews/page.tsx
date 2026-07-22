'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

type Review = {
  id: string;
  score: number;
  createdAt: string;
  pullRequest: {
    repository: { fullName: string };
    number: number;
  };
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const router = useRouter();

  useEffect(() => {
    api
      .get('/reviews?limit=10')
      .then((res) => setReviews(res.data.items))
      .catch((err) => console.error('Failed to load reviews', err));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recent Reviews</h1>
        <p className="text-gray-600">
          Latest AI-generated pull request reviews
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Repository
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                PR
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Created
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {reviews.map((review) => (
              <tr key={review.id}
                    onClick={() => router.push(`/reviews/${review.id}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {review.pullRequest.repository.fullName}
                </td>

                <td className="px-6 py-4 text-sm text-gray-600">
                  #{review.pullRequest.number}
                </td>

                <td className="px-6 py-4">
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    {review.score}/10
                  </span>
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
