'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

type Repository = {
  id: string;
  fullName: string;
  defaultBranch: string;
  enabled: boolean;
};

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/repositories');
        setRepositories(res.data);
      } catch (err) {
        console.error('Failed to load repositories', err);
        if ((err as { response?: { status?: number } }).response?.status === 401) {
          window.location.assign(`${process.env.NEXT_PUBLIC_API_URL}/auth/github`);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading repositories...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Repositories</h1>

      <div className="grid gap-4">
        {repositories.map((repo) => (
          <Link
            key={repo.id}
            href={`/repositories/${repo.id}`}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="font-semibold">{repo.fullName}</div>
            <div className="text-sm text-gray-600">
              Default branch: {repo.defaultBranch}
            </div>
            <div className="text-sm mt-1">
              Status:{' '}
              <span
                className={
                  repo.enabled ? 'text-green-600 font-medium' : 'text-gray-500'
                }
              >
                {repo.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
