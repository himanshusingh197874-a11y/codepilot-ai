"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderGit2, ShieldCheck, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

const items = [
  {
    href: '/repositories',
    label: 'Repositories',
    icon: FolderGit2,
  },
  {
    href: '/reviews',
    label: 'Reviews',
    icon: ShieldCheck,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r bg-white">
      <div className="border-b p-6">
        <h1 className="text-xl font-bold text-gray-900">
          Codepilot AI
        </h1>

        <p className="text-sm text-gray-500">
          PR Review Dashboard
        </p>
      </div>

      <nav className="space-y-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}