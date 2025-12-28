'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">DockPulse</h1>
        <p className="text-gray-600 mb-8">
          Modularna platforma CRM/WMS typu multi-tenant dla malych i srednich firm B2B
        </p>

        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="glass-button w-full block text-center"
          >
            Rozpocznij konfiguracje
          </Link>
          <Link
            href="/login"
            className="glass-button-secondary w-full block text-center"
          >
            Zaloguj sie
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Wersja 2.0 | Auto-Branding Enabled
        </p>
      </div>
    </div>
  );
}
