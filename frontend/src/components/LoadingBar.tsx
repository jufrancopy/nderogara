'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function LoadingBarInner() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    window.addEventListener('beforeunload', handleStart);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-200">
      <div className="h-full bg-blue-600 animate-pulse" style={{ width: '70%' }} />
    </div>
  );
}

export default function LoadingBar() {
  return (
    <Suspense fallback={null}>
      <LoadingBarInner />
    </Suspense>
  );
}
