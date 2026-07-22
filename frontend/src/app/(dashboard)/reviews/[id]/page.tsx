'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchReview } from '@/lib/api';

type ReviewComment = {
  id: string;
  path: string;
  line: number;
  body: string;
  severity: string;
};

type ReviewDetail = {
  id: string;
  summary: string;
  score: number;
  createdAt: string;
  pullRequest: {
    number: number;
    title: string;
    repository: {
      fullName: string;
    };
  };
  comments: ReviewComment[];
};

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReview() {
      try {
        const data = await fetchReview(params.id as string);
        setReview(data);
      } catch (err) {
        setError('Failed to load review');
      } finally {
        setLoading(false);
      }
    }

    loadReview();
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Loading review…</div>;
  }

  if (error || !review) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Review not found'}</p>
        <button
          onClick={() => router.push('/reviews')}
          className="mt-4 rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Back to reviews
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={() => router.push('/reviews')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to reviews
      </button>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {review.pullRequest.repository.fullName}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              PR #{review.pullRequest.number}: {review.pullRequest.title}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Reviewed on{' '}
              {new Date(review.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            {review.score.toFixed(1)}/10
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
        <p className="mt-3 whitespace-pre-wrap text-gray-700">
          {review.summary}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Inline Comments
          </h2>
          <span className="text-sm text-gray-500">
            {review.comments.length} comment
            {review.comments.length === 1 ? '' : 's'}
          </span>
        </div>

        {review.comments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
            No inline comments for this review.
          </div>
        ) : (
          <div className="space-y-4">
            {review.comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-yellow-200 bg-yellow-50 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <code className="text-sm font-medium text-gray-800">
                    {comment.path}:{comment.line}
                  </code>

                  <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium uppercase tracking-wide text-yellow-800">
                    {comment.severity}
                  </span>
                </div>

                <p className="text-sm text-gray-700">{comment.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}