'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchReview, ReviewDetail } from '@/lib/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const severityClasses: Record<string, string> = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',

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
  const [selectedSeverity, setSelectedSeverity] = useState<
  'all' | 'high' | 'medium' | 'low'
>('all');

const getSeverity = (
  severity: string,
): 'high' | 'medium' | 'low' => {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'error':
      return 'high';

    case 'medium':
    case 'warning':
      return 'medium';

    case 'low':
    case 'info':
      return 'low';

    default:
      return 'low';
  }
};

const highCount =
  review?.findings.filter(
    (f) => getSeverity(f.severity) === 'high',
  ).length ?? 0;

const mediumCount =
  review?.findings.filter(
    (f) => getSeverity(f.severity) === 'medium',
  ).length ?? 0;

const lowCount =
  review?.findings.filter(
    (f) => getSeverity(f.severity) === 'low',
  ).length ?? 0;

const filteredFindings =
  selectedSeverity === 'all'
    ? review?.findings ?? []
    : (review?.findings ?? []).filter(
        (finding) =>
          getSeverity(finding.severity) === selectedSeverity,
      );
  useEffect(() => {
    let active = true;

    async function loadReview() {
      try {
        const data = await fetchReview(params.id);

        if (active) {
          setReview(data);
        }
      } catch {
        if (active) {
          setError('Failed to load review.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (params.id) {
      void loadReview();
    }

    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) {
    return <div className="p-8">Loading review...</div>;
  }

  if (error || !review) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error ?? 'Review not found.'}</p>

        <button
          onClick={() => router.push('/reviews')}
          className="mt-4 rounded-lg border px-4 py-2 hover:bg-gray-100"
        >
          Back to Reviews
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <button
        onClick={() => router.push('/reviews')}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Back to Reviews
      </button>

      {/* Header */}
    <section className="grid gap-4 md:grid-cols-4">
  <div className="rounded-xl border bg-white p-5 shadow-sm">
    <p className="text-sm text-gray-500">Total Findings</p>

    <p className="mt-2 text-3xl font-bold">
      {review.findings.length}
    </p>
  </div>

  <div className="rounded-xl border bg-red-50 p-5 shadow-sm">
    <p className="text-sm text-red-600">High</p>

    <p className="mt-2 text-3xl font-bold text-red-700">
      {highCount}
    </p>
  </div>

  <div className="rounded-xl border bg-yellow-50 p-5 shadow-sm">
    <p className="text-sm text-yellow-700">Medium</p>

    <p className="mt-2 text-3xl font-bold text-yellow-700">
      {mediumCount}
    </p>
  </div>

  <div className="rounded-xl border bg-blue-50 p-5 shadow-sm">
    <p className="text-sm text-blue-700">Low</p>

    <p className="mt-2 text-3xl font-bold text-blue-700">
      {lowCount}
    </p>
  </div>
</section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {review.repository}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              Pull Request #{review.pullRequest.number}
            </h1>

            <p className="mt-1 text-gray-600">
              {review.pullRequest.title}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Generated on{' '}
              {new Date(review.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="rounded-xl bg-green-50 px-8 py-5 text-center">
            <p className="text-xs uppercase tracking-wide text-green-600">
              Overall Score
            </p>

            <h2 className="mt-2 text-4xl font-bold text-green-700">
              {review.score.toFixed(1)}
            </h2>

            <p className="text-sm text-green-600">/10</p>
          </div>
        </div>
      </section>

      {/* Summary */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">
          Executive Summary
        </h2>

        <p className="mt-4 whitespace-pre-wrap text-gray-700 leading-7">
          {review.summary}
        </p>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-5">
              Review Metadata
          </h2>

  <div className="grid grid-cols-2 gap-6">

    <div>
      <p className="text-xs uppercase text-gray-500">
        Repository
      </p>

      <p className="mt-1 font-medium">
        {review.repository}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase text-gray-500">
        Pull Request
      </p>

      <p className="mt-1 font-medium">
        #{review.pullRequest.number}
      </p>
    </div>

    <div>
      <p className="text-xs uppercase text-gray-500">
        Review ID
      </p>

      <code className="mt-1 block rounded bg-gray-100 px-2 py-1 text-xs">
        {review.id}
      </code>
    </div>

    <div>
      <p className="text-xs uppercase text-gray-500">
        Generated
      </p>

      <p className="mt-1">
        {new Date(review.createdAt).toLocaleString()}
      </p>
    </div>

    <button
    onClick={() => navigator.clipboard.writeText(review.id)}
    className="mt-2 text-xs text-blue-600 hover:underline"
>
    Copy ID
</button>

  </div>
</section>

      {/* Findings */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Findings
          </h2>
           <div className="flex gap-2">
    {['all', 'high', 'medium', 'low'].map((severity) => (
      <button
        key={severity}
        onClick={() =>
          setSelectedSeverity(
            severity as 'all' | 'high' | 'medium' | 'low',
          )
        }
        className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
          selectedSeverity === severity
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </button>
    ))}
  </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {review.findings.length}{' '}
            {review.findings.length === 1
              ? 'Finding'
              : 'Findings'}
          </span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-10 text-center">

    <div className="text-5xl">
        🎉
    </div>

    <h3 className="mt-4 text-lg font-semibold text-green-700">
        Excellent Code Quality
    </h3>

    <p className="mt-2 text-gray-600">
        No findings matched this filter.
    </p>

</div>
        ) : (
          <div className="space-y-5">
            {filteredFindings.map((finding, index) => (
              <article
                key={finding.id}
                className="rounded-xl border p-5"
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
  Finding #{index + 1}
</p>
                <div className="flex items-center justify-between">
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm font-medium">
                    {finding.path}:{finding.line}
                  </code>

                  <span
  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
    severityClasses[getSeverity(finding.severity)]
  }`}
>
  {finding.severity}
</span>          
                </div>

                <p className="mt-4 text-gray-700">
                  {finding.message}
                </p>

                {finding.codeSnippet && (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium text-gray-600">
                      Code Snippet
                    </p>

                    <SyntaxHighlighter
  language="typescript"
  style={oneDark}
  customStyle={{
    borderRadius: '12px',
    fontSize: '14px',
    marginTop: '16px',
  }}
  showLineNumbers
>
  {finding.codeSnippet}
</SyntaxHighlighter>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  
}

