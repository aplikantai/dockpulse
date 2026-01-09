'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/landing';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // Check if this is a tenant subdomain (not www, app, admin, api)
    if (parts.length >= 3 && !hostname.includes('localhost')) {
      const subdomain = parts[0];

      if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'admin' && subdomain !== 'api') {
        // Redirect to tenant landing page (we'll create this route)
        router.push(`/tenant/${subdomain}`);
        return;
      }
    }
  }, [router]);

  return <LandingPage />;
}
