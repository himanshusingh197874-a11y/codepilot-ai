'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.search).get(
      'accessToken',
    );

    if (!accessToken) {
      router.replace('/repositories');
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    router.replace('/repositories');
  }, [router]);

  return <p className="p-6">Signing you in…</p>;
}
