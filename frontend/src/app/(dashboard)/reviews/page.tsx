'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Filter,
  FolderGit2,
  GitPullRequest,
  Search,
  Star,
  X,
} from 'lucide-react';
import api from '@/lib/api';

type Review = {
  id: string;
  score: number;
  createdAt: string;
  pullRequest: {
    number: number;
    title: string;
    state?: 'open' | 'closed' | 'merged';
    repository: {
      id?: string;
      fullName: string;
    };
  };
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type ReviewsResponse = {
  items: Review[];
  pagination: Pagination;
};

type SortBy = 'createdAt' | 'score';
type Order = 'asc' | 'desc';
type StateFilter = 'all' | 'open' | 'closed' | 'merged';

const PAGE_SIZE = 10;

export default function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState<StateFilter>('all');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [order, setOrder] = useState<Order>('desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  return (
    <ReviewsLoader
      page={page}
      state={state}
      minScore={minScore}
      maxScore={maxScore}
      sortBy={sortBy}
      order={order}
      search={search}
      setSearch={setSearch}
      setPage={setPage}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      setState={setState}
      setMinScore={setMinScore}
      setMaxScore={setMaxScore}
      setSortBy={setSortBy}
      setOrder={setOrder}
    />
  );
}

type ReviewsLoaderProps = {
  page: number;
  state: StateFilter;
  minScore: string;
  maxScore: string;
  sortBy: SortBy;
  order: Order;
  search: string;
  setSearch: (value: string) => void;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  setState: (value: StateFilter) => void;
  setMinScore: (value: string) => void;
  setMaxScore: (value: string) => void;
  setSortBy: (value: SortBy) => void;
  setOrder: (value: Order) => void;
};

function ReviewsLoader({
  page,
  state,
  minScore,
  maxScore,
  sortBy,
  order,
  search,
  setSearch,
  setPage,
  showFilters,
  setShowFilters,
  setState,
  setMinScore,
  setMaxScore,
  setSortBy,
  setOrder,
}: ReviewsLoaderProps) {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchReviews() {
      setLoading(true);
      setError('');

      try {
        const params: Record<string, string | number> = {
          page,
          limit: PAGE_SIZE,
          sortBy,
          order,
        };

        if (state !== 'all') {
          params.state = state;
        }

        if (minScore !== '') {
          const value = Number(minScore);

          if (!Number.isNaN(value)) {
            params.minScore = value;
          }
        }

        if (maxScore !== '') {
          const value = Number(maxScore);

          if (!Number.isNaN(value)) {
            params.maxScore = value;
          }
        }

        const response = await api.get<ReviewsResponse>('/reviews', {
          params,
        });

        if (cancelled) {
          return;
        }

        setReviews(response.data.items);
        setPagination(response.data.pagination);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Failed to load reviews:', err);
        setError('Failed to load reviews.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchReviews();

    return () => {
      cancelled = true;
    };
  }, [page, state, minScore, maxScore, sortBy, order]);

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return reviews;
    }

    return reviews.filter((review) => {
      const repository =
        review.pullRequest.repository.fullName.toLowerCase();

      const title = review.pullRequest.title.toLowerCase();

      const prNumber = String(review.pullRequest.number);

      return (
        repository.includes(query) ||
        title.includes(query) ||
        prNumber.includes(query)
      );
    });
  }, [reviews, search]);

  const averageScore = useMemo(() => {
    if (reviews.length === 0) {
      return 0;
    }

    return (
      reviews.reduce((sum, review) => sum + review.score, 0) /
      reviews.length
    );
  }, [reviews]);

  const repositoryCount = useMemo(() => {
    return new Set(
      reviews.map(
        (review) => review.pullRequest.repository.fullName,
      ),
    ).size;
  }, [reviews]);

  const activeFilterCount = [
    state !== 'all',
    minScore !== '',
    maxScore !== '',
  ].filter(Boolean).length;

  function scoreColor(score: number) {
    if (score >= 8) {
      return 'bg-green-100 text-green-700';
    }

    if (score >= 5) {
      return 'bg-yellow-100 text-yellow-700';
    }

    return 'bg-red-100 text-red-700';
  }

  function scoreLabel(score: number) {
    if (score >= 8) {
      return 'Good';
    }

    if (score >= 5) {
      return 'Needs Attention';
    }

    return 'Poor';
  }

  function stateColor(reviewState?: string) {
    switch (reviewState) {
      case 'open':
        return 'bg-green-100 text-green-700';

      case 'merged':
        return 'bg-purple-100 text-purple-700';

      case 'closed':
        return 'bg-gray-100 text-gray-700';

      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function clearFilters() {
    setState('all');
    setMinScore('');
    setMaxScore('');
    setSearch('');
    setPage(1);
  }

  function handleStateChange(value: StateFilter) {
    setState(value);
    setPage(1);
  }

  function handleMinScoreChange(value: string) {
    setMinScore(value);
    setPage(1);
  }

  function handleMaxScoreChange(value: string) {
    setMaxScore(value);
    setPage(1);
  }

  function handleSortChange(value: string) {
    const [newSortBy, newOrder] = value.split('-') as [
      SortBy,
      Order,
    ];

    setSortBy(newSortBy);
    setOrder(newOrder);
    setPage(1);
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-gray-500">
        Loading reviews...
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Reviews
          </h1>

          <p className="mt-2 text-gray-600">
            Browse every AI-generated pull request review.
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            AI Reviews
          </h1>

          <p className="mt-2 text-gray-600">
            Browse and analyze AI-generated pull request reviews.
          </p>
        </div>

        <div className="text-sm text-gray-500">
          {pagination?.total ?? reviews.length} total reviews
        </div>
      </div>

      {/* Summary Cards */}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Reviews"
          value={pagination?.total ?? reviews.length}
          icon={<ClipboardCheck size={22} />}
        />

        <StatCard
          title="Average Score"
          value={`${averageScore.toFixed(1)}/10`}
          icon={<Star size={22} />}
        />

        <StatCard
          title="Repositories"
          value={repositoryCount}
          icon={<FolderGit2 size={22} />}
        />
      </section>

      {/* Search + Filters */}

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repository, PR title or PR number..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={`${sortBy}-${order}`}
            onChange={(event) =>
              handleSortChange(event.target.value)
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-400"
          >
            <option value="createdAt-desc">Newest first</option>
            <option value="createdAt-asc">Oldest first</option>
            <option value="score-desc">Highest score</option>
            <option value="score-asc">Lowest score</option>
          </select>

          <button
            onClick={() => setShowFilters((value) => !value)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              showFilters || activeFilterCount > 0
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={17} />

            Filters

            {activeFilterCount > 0 && (
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-900">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-5 border-t pt-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Pull Request State
                </label>

                <select
                  value={state}
                  onChange={(event) =>
                    handleStateChange(
                      event.target.value as StateFilter,
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                >
                  <option value="all">All states</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="merged">Merged</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Minimum Score
                </label>

                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={minScore}
                  onChange={(event) =>
                    handleMinScoreChange(event.target.value)
                  }
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Maximum Score
                </label>

                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={maxScore}
                  onChange={(event) =>
                    handleMaxScoreChange(event.target.value)
                  }
                  placeholder="10"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </section>

      {search && (
        <div className="text-sm text-gray-500">
          Showing {filteredReviews.length} matching reviews on this
          page.
        </div>
      )}

      {/* Reviews Table */}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
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
                  State
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Reviewed
                </th>

                <th className="px-6 py-4" />
              </tr>
            </thead>

            <tbody className="divide-y">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto flex max-w-md flex-col items-center">
                      <div className="rounded-full bg-gray-100 p-4">
                        <ClipboardCheck
                          size={28}
                          className="text-gray-400"
                        />
                      </div>

                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        No reviews found
                      </h3>

                      <p className="mt-2 text-sm text-gray-500">
                        {search || activeFilterCount > 0
                          ? 'Try changing your search or filters.'
                          : 'Run an AI review on a pull request to see it here.'}
                      </p>

                      {(search || activeFilterCount > 0) && (
                        <button
                          onClick={clearFilters}
                          className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr
                    key={review.id}
                    onClick={() =>
                      router.push(`/reviews/${review.id}`)
                    }
                    className="group cursor-pointer transition hover:bg-gray-50"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <FolderGit2
                          size={18}
                          className="shrink-0 text-gray-400"
                        />

                        <span className="font-medium text-gray-900">
                          {review.pullRequest.repository.fullName}
                        </span>
                      </div>
                    </td>

                    <td className="max-w-md px-6 py-5">
                      <div className="flex items-center gap-2">
                        <GitPullRequest
                          size={16}
                          className="shrink-0 text-gray-500"
                        />

                        <span className="font-medium text-gray-900">
                          #{review.pullRequest.number}
                        </span>
                      </div>

                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                        {review.pullRequest.title}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreColor(
                            review.score,
                          )}`}
                        >
                          {review.score.toFixed(1)}/10
                        </span>

                        <span className="text-xs text-gray-400">
                          {scoreLabel(review.score)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      {review.pullRequest.state ? (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${stateColor(
                            review.pullRequest.state,
                          )}`}
                        >
                          {review.pullRequest.state}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          —
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                      {new Date(
                        review.createdAt,
                      ).toLocaleString()}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <ArrowRight
                        size={18}
                        className="inline text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 0 && (
          <div className="flex flex-col gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
              {' · '}
              {pagination.total} reviews
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={!pagination.hasPrevPage || loading}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <button
                disabled={!pagination.hasNextPage || loading}
                onClick={() =>
                  setPage((current) => current + 1)
                }
                className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && reviews.length > 0 && (
        <div className="text-center text-sm text-gray-400">
          Updating reviews...
        </div>
      )}

      {error && reviews.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
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
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>

        <div className="rounded-lg bg-gray-50 p-2 text-gray-500">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}