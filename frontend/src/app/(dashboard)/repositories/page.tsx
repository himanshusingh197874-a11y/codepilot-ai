'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  GitBranch,
  GitFork,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import api from '@/lib/api';

type Repository = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  enabled: boolean;
};

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRepositories(sync = false) {
    try {
      setError(null);

      if (sync) {
        setSyncing(true);
        await api.post('/repositories/sync');
      }

      const response = await api.get<Repository[]>('/repositories');

      setRepositories(response.data);
    } catch (err) {
      console.error('Failed to load repositories', err);

      const status = (
        err as {
          response?: {
            status?: number;
          };
        }
      ).response?.status;

      if (status === 401) {
        window.location.assign(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/github`,
        );
        return;
      }

      setError(
        sync
          ? 'Unable to synchronize repositories. Please try again.'
          : 'Unable to load repositories. Please try again.',
      );
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initializeRepositories() {
      try {
        if (cancelled) {
          return;
        }

        setError(null);
        setSyncing(true);

        await api.post('/repositories/sync');

        if (cancelled) {
          return;
        }

        const response = await api.get<Repository[]>('/repositories');

        if (!cancelled) {
          setRepositories(response.data);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error('Failed to initialize repositories', err);

        const status = (
          err as {
            response?: {
              status?: number;
            };
          }
        ).response?.status;

        if (status === 401) {
          window.location.assign(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/github`,
          );
          return;
        }

        setError(
          'Unable to synchronize repositories. Please try again.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    }

    void initializeRepositories();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRepositories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return repositories;
    }

    return repositories.filter((repository) => {
      return (
        repository.fullName.toLowerCase().includes(query) ||
        repository.owner.toLowerCase().includes(query) ||
        repository.name.toLowerCase().includes(query)
      );
    });
  }, [repositories, search]);

  const enabledCount = useMemo(() => {
    return repositories.filter((repository) => repository.enabled).length;
  }, [repositories]);

  const disabledCount = repositories.length - enabledCount;

  function clearSearch() {
    setSearch('');
  }

  function handleSync() {
    void fetchRepositories(true);
  }

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span>Synchronizing repositories...</span>
        </div>
      </div>
    );
  }

  if (error && repositories.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Repositories
          </h1>

          <p className="mt-2 text-gray-600">
            Manage repositories available for AI code reviews.
          </p>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <XCircle
              size={22}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <h2 className="font-semibold text-red-800">
                Failed to load repositories
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={syncing ? 'animate-spin' : ''}
                />

                {syncing ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Repositories
          </h1>

          <p className="mt-2 text-gray-600">
            Manage repositories available for AI code reviews.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={syncing ? 'animate-spin' : ''}
          />

          {syncing ? 'Syncing...' : 'Sync Repositories'}
        </button>
      </div>

      {/* Summary Cards */}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Repositories"
          value={repositories.length}
          icon={<GitFork size={21} />}
        />

        <SummaryCard
          title="Enabled"
          value={enabledCount}
          icon={<CheckCircle2 size={21} />}
        />

        <SummaryCard
          title="Disabled"
          value={disabledCount}
          icon={<XCircle size={21} />}
        />
      </section>

      {/* Search */}

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="relative max-w-xl">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search repositories..."
            className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
          />

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
            >
              <X size={17} />
            </button>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Showing {filteredRepositories.length} of{' '}
          {repositories.length} repositories
        </p>
      </section>

      {/* Error while repositories are already loaded */}

      {error && repositories.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Repository List */}

      {filteredRepositories.length === 0 ? (
        <section className="rounded-2xl border bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <GitFork size={26} className="text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No repositories found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {search
              ? 'Try changing your search query.'
              : 'No GitHub repositories are available for your account.'}
          </p>

          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="mt-5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Clear search
            </button>
          )}
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {filteredRepositories.map((repository) => (
            <Link
              key={repository.id}
              href={`/repositories/${repository.id}`}
              className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="rounded-xl bg-gray-100 p-3">
                    <GitFork
                      size={22}
                      className="text-gray-600"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-gray-900">
                      {repository.fullName}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {repository.owner}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    repository.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {repository.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <GitBranch size={16} />

                  <span>
                    Default branch:{' '}
                    <span className="font-medium text-gray-700">
                      {repository.defaultBranch}
                    </span>
                  </span>
                </div>

                <span className="text-sm font-medium text-gray-400 transition group-hover:text-gray-900">
                  View →
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
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