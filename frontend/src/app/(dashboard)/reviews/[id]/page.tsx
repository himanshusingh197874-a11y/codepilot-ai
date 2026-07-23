'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchReview, ReviewDetail } from '@/lib/api';

const severityClasses: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadReview() {
      try {
        const data = await fetchReview(params.id);
        if (isCurrent) setReview(data);
      } catch {
        if (isCurrent) setError('Failed to load this review.');
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void loadReview();
    return () => {
      isCurrent = false;
    };
  }, [params.id]);

  if (loading) return <div className="p-6 text-gray-600">Loading review…</div>;

  if (error || !review) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error ?? 'Review not found.'}</p>
        <button onClick={() => router.push('/reviews')} className="mt-4 rounded-lg border px-4 py-2 hover:bg-gray-50">
          Back to reviews
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <button onClick={() => router.push('/reviews')} className="text-sm text-gray-600 hover:text-gray-900">
        ← Back to reviews
      </button>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{review.repository}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              PR #{review.pullRequest.number}: {review.pullRequest.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">Reviewed on {new Date(review.createdAt).toLocaleString()}</p>
          </div>
          <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            {review.score.toFixed(1)}/10
          </span>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">AI Summary</h2>
        <p className="mt-3 whitespace-pre-wrap text-gray-700">{review.summary}</p>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Findings</h2>
          <span className="text-sm text-gray-500">{review.findings.length} finding{review.findings.length === 1 ? '' : 's'}</span>
        </div>
        {review.findings.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">No findings were recorded for this review.</div>
        ) : (
          <div className="space-y-4">
            {review.findings.map((finding) => (
              <article key={finding.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-sm font-medium text-gray-800">{finding.path}:{finding.line}</code>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${severityClasses[finding.severity.toLowerCase()] ?? 'bg-gray-100 text-gray-700'}`}>
                    {finding.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-700">{finding.message}</p>
                {finding.codeSnippet && (
                  <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-950 p-4 text-sm text-gray-100"><code>{finding.codeSnippet}</code></pre>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
