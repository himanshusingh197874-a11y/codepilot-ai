'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchReview, ReviewDetail } from '@/lib/api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Severity = 'all' | 'high' | 'medium' | 'low';

const severityClasses: Record<Exclude<Severity, 'all'>, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

function getSeverity(
  severity: string,
): Exclude<Severity, 'all'> {
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'high':
    case 'error':
      return 'high';

    case 'medium':
    case 'warning':
      return 'medium';

    case 'low':
    case 'info':
    case 'suggestion':
    default:
      return 'low';
  }
}

function getScoreColor(score: number) {
  if (score >= 8) {
    return {
      container: 'bg-green-50 border-green-200',
      label: 'text-green-600',
      score: 'text-green-700',
    };
  }

  if (score >= 5) {
    return {
      container: 'bg-amber-50 border-amber-200',
      label: 'text-amber-600',
      score: 'text-amber-700',
    };
  }

  return {
    container: 'bg-red-50 border-red-200',
    label: 'text-red-600',
    score: 'text-red-700',
  };
}

function getVerdictStyle(verdict: string) {
  if (verdict === 'approve') {
    return 'bg-green-100 text-green-700 border-green-200';
  }

  return 'bg-red-100 text-red-700 border-red-200';
}

export default function ReviewDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const reviewId = params.id;

  const [review, setReview] =
    useState<ReviewDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedSeverity, setSelectedSeverity] =
    useState<Severity>('all');

  useEffect(() => {
    if (!reviewId) {
      return;
    }

    let active = true;

    async function loadReview() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchReview(reviewId);

        if (!active) {
          return;
        }

        setReview(data);
      } catch (err) {
        console.error('Failed to load review:', err);

        if (!active) {
          return;
        }

        setError('Failed to load review.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReview();

    return () => {
      active = false;
    };
  }, [reviewId]);

  /*
   * Invalid ID is handled during rendering instead of
   * calling setState synchronously inside useEffect.
   */
  if (!reviewId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Invalid Review ID
          </h2>

          <p className="mt-2 text-gray-600">
            The review ID is missing or invalid.
          </p>

          <button
            onClick={() => router.push('/reviews')}
            className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>

        <div className="h-48 animate-pulse rounded-xl bg-gray-100" />

        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="text-5xl">⚠️</div>

          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Unable to load review
          </h2>

          <p className="mt-2 text-gray-600">
            {error ?? 'Review not found.'}
          </p>

          <button
            onClick={() => router.push('/reviews')}
            className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    );
  }

  const highCount = review.findings.filter(
    (finding) =>
      getSeverity(finding.severity) === 'high',
  ).length;

  const mediumCount = review.findings.filter(
    (finding) =>
      getSeverity(finding.severity) === 'medium',
  ).length;

  const lowCount = review.findings.filter(
    (finding) =>
      getSeverity(finding.severity) === 'low',
  ).length;

  const filteredFindings =
    selectedSeverity === 'all'
      ? review.findings
      : review.findings.filter(
          (finding) =>
            getSeverity(finding.severity) ===
            selectedSeverity,
        );

  const scoreColor = getScoreColor(review.score);

  const githubUrl = `https://github.com/${review.repository}/pull/${review.pullRequest.number}`;

  return (
    <div className="space-y-6 p-8">
      {/* Back navigation */}

      <button
        onClick={() => router.push('/reviews')}
        className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
      >
        ← Back to Reviews
      </button>

      {/* Repository / PR Header */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
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

            <div className="mt-5 flex flex-wrap gap-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getVerdictStyle(
                  review.verdict,
                )}`}
              >
                {review.verdict === 'approve'
                  ? '✓ Approved'
                  : '⚠ Request Changes'}
              </span>

              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                View on GitHub ↗
              </a>
            </div>
          </div>

          {/* Score */}

          <div
            className={`rounded-xl border px-8 py-5 text-center ${scoreColor.container}`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${scoreColor.label}`}
            >
              Overall Score
            </p>

            <h2
              className={`mt-2 text-4xl font-bold ${scoreColor.score}`}
            >
              {review.score.toFixed(1)}
            </h2>

            <p
              className={`text-sm ${scoreColor.label}`}
            >
              /10
            </p>
          </div>
        </div>
      </section>

      {/* Finding statistics */}

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Findings
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {review.findings.length}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-red-600">
            High
          </p>

          <p className="mt-2 text-3xl font-bold text-red-700">
            {highCount}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-700">
            Medium
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-700">
            {mediumCount}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-blue-700">
            Low
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-700">
            {lowCount}
          </p>
        </div>
      </section>

      {/* Executive Summary */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Executive Summary
        </h2>

        <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-700">
          {review.summary}
        </p>
      </section>

      {/* Verdict */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Review Verdict
            </h2>

            <p className="mt-2 text-gray-600">
              The AI reviewer recommends{' '}
              <span className="font-semibold">
                {review.verdict === 'approve'
                  ? 'approving'
                  : 'requesting changes to'}
              </span>{' '}
              this pull request.
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getVerdictStyle(
              review.verdict,
            )}`}
          >
            {review.verdict === 'approve'
              ? '✓ Approve'
              : '⚠ Request Changes'}
          </span>
        </div>

        {review.positives.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900">
              What went well
            </h3>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              {review.positives.map(
                (positive, index) => (
                  <li key={`${positive}-${index}`}>
                    {positive}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {review.suggestions.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900">
              Suggestions
            </h3>

            <ul className="mt-3 list-disc space-y-2 pl-5 text-gray-700">
              {review.suggestions.map(
                (suggestion, index) => (
                  <li key={`${suggestion}-${index}`}>
                    {suggestion}
                  </li>
                ),
              )}
            </ul>
          </div>
        )}
      </section>

      {/* Review Metadata */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Review Metadata
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Repository
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {review.repository}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Pull Request
            </p>

            <p className="mt-1 font-medium text-gray-900">
              #{review.pullRequest.number}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Review ID
            </p>

            <code className="mt-1 block break-all rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
              {review.id}
            </code>

            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  review.id,
                )
              }
              className="mt-2 text-xs font-medium text-blue-600 hover:underline"
            >
              Copy Review ID
            </button>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Generated
            </p>

            <p className="mt-1 text-gray-900">
              {new Date(
                review.createdAt,
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Findings */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Findings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Issues identified during the automated
                review.
              </p>
            </div>

            <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              {filteredFindings.length}{' '}
              {filteredFindings.length === 1
                ? 'Finding'
                : 'Findings'}
            </span>
          </div>

          {/* Severity filters */}

          <div className="mt-5 flex flex-wrap gap-2">
            {(
              ['all', 'high', 'medium', 'low'] as Severity[]
            ).map((severity) => {
              const count =
                severity === 'all'
                  ? review.findings.length
                  : severity === 'high'
                    ? highCount
                    : severity === 'medium'
                      ? mediumCount
                      : lowCount;

              return (
                <button
                  key={severity}
                  onClick={() =>
                    setSelectedSeverity(severity)
                  }
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    selectedSeverity === severity
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {severity.charAt(0).toUpperCase() +
                    severity.slice(1)}{' '}
                  ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state */}

        {filteredFindings.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-10 text-center">
            <div className="text-5xl">🎉</div>

            <h3 className="mt-4 text-lg font-semibold text-green-700">
              {review.findings.length === 0
                ? 'Excellent Code Quality'
                : 'No Matching Findings'}
            </h3>

            <p className="mt-2 text-gray-600">
              {review.findings.length === 0
                ? 'The AI reviewer did not identify any issues in this pull request.'
                : `There are no ${selectedSeverity} severity findings in this review.`}
            </p>

            {review.findings.length > 0 &&
              selectedSeverity !== 'all' && (
                <button
                  onClick={() =>
                    setSelectedSeverity('all')
                  }
                  className="mt-4 text-sm font-medium text-green-700 hover:underline"
                >
                  Show all findings
                </button>
              )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredFindings.map(
              (finding, index) => {
                const normalizedSeverity =
                  getSeverity(finding.severity);

                return (
                  <article
                    key={finding.id}
                    className="rounded-xl border p-5 transition hover:shadow-sm"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Finding #{index + 1}
                        </span>

                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                          {finding.source === 'ai'
                            ? 'AI Finding'
                            : 'Inline Finding'}
                        </span>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                          severityClasses[
                            normalizedSeverity
                          ]
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>

                    {/* File location */}

                    {finding.path ? (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Location
                        </p>

                        <code className="mt-1 block break-all text-sm font-medium text-gray-800">
                          {finding.path}
                          {finding.line !== undefined
                            ? `:${finding.line}`
                            : ''}
                        </code>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm font-medium text-gray-600">
                          PR-level AI finding
                        </p>
                      </div>
                    )}

                    {/* Finding message */}

                    <div className="mt-5">
                      <p className="text-sm font-medium text-gray-500">
                        Issue
                      </p>

                      <p className="mt-1 leading-7 text-gray-800">
                        {finding.message}
                      </p>
                    </div>

                    {/* Suggestion */}

                    {finding.suggestion && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-4">
                        <p className="text-sm font-medium text-gray-500">
                          Suggested Fix
                        </p>

                        <p className="mt-1 text-sm leading-6 text-gray-700">
                          {finding.suggestion}
                        </p>
                      </div>
                    )}

                    {/* Code snippet */}

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
                            marginTop: '8px',
                          }}
                          showLineNumbers
                        >
                          {finding.codeSnippet}
                        </SyntaxHighlighter>
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}