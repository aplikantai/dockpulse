'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Sparkles, Rocket } from 'lucide-react';
import Link from 'next/link';

interface BrandingPreview {
  companyData: {
    name: string;
    nip?: string;
    phone?: string;
    email?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
    };
  };
  branding: {
    logoUrl: string;
    faviconUrl: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

export default function HomePage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [preview, setPreview] = useState<BrandingPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!websiteUrl) {
      setError('Podaj adres strony WWW');
      return;
    }

    // Validate URL format
    try {
      new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    } catch {
      setError('Nieprawidłowy format adresu URL');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setPreview(null);

    try {
      const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

      const response = await fetch('/api/branding/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteUrl: url }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych');
      }

      const result: BrandingPreview = await response.json();
      setPreview(result);
    } catch (err) {
      setError('Nie udało się pobrać brandingu. Sprawdź adres URL lub spróbuj ponownie.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DockPulse</h1>
                <p className="text-xs text-gray-500">System do zarządzania firmą</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                Zaloguj się
              </Link>
              <Link href="/dashboard" className="glass-button text-sm px-4 py-2">
                Panel główny
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Automatyczna konfiguracja z AI
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Skonfiguruj swój system<br />w 30 sekund
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Wprowadź adres swojej strony WWW, a nasze AI automatycznie pobierze logo, kolory marki
            i zaproponuje odpowiednie funkcje dla Twojej firmy.
          </p>
        </div>

        {/* AI Scanner Form */}
        {!preview && (
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <form onSubmit={handleExtract} className="space-y-6">
              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-semibold text-gray-700 mb-3">
                  Adres strony WWW Twojej firmy
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="websiteUrl"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://twoja-firma.pl"
                    className="flex-1 px-4 py-3 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    disabled={isExtracting}
                  />
                  <button
                    type="submit"
                    disabled={isExtracting}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Skanuję...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Skanuj AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <Link
                  href="/onboarding"
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Lub skonfiguruj ręcznie
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Preview Results */}
        {preview && (
          <div className="space-y-6">
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 text-green-600 mb-6">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-semibold">Gotowe! Znaleźliśmy Twój branding</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">Logo firmy</label>
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center min-h-[120px]">
                    <img
                      src={preview.branding.logoUrl}
                      alt="Logo"
                      className="max-h-20 w-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/default-logo.png';
                      }}
                    />
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Kolory marki
                  </label>
                  <div className="flex gap-4">
                    <div className="text-center flex-1">
                      <div
                        className="w-full h-20 rounded-xl border-2 border-white shadow-lg"
                        style={{ background: preview.branding.colors.primary }}
                      />
                      <span className="text-xs text-gray-600 mt-2 block font-medium">Główny</span>
                    </div>
                    <div className="text-center flex-1">
                      <div
                        className="w-full h-20 rounded-xl border-2 border-white shadow-lg"
                        style={{ background: preview.branding.colors.secondary }}
                      />
                      <span className="text-xs text-gray-600 mt-2 block font-medium">Dodatkowy</span>
                    </div>
                    <div className="text-center flex-1">
                      <div
                        className="w-full h-20 rounded-xl border-2 border-white shadow-lg"
                        style={{ background: preview.branding.colors.accent }}
                      />
                      <span className="text-xs text-gray-600 mt-2 block font-medium">Akcent</span>
                    </div>
                  </div>
                </div>

                {/* Company Data */}
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-3 block">
                    Dane firmy
                  </label>
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl space-y-2">
                    <p className="text-gray-900">
                      <strong>Nazwa:</strong> {preview.companyData.name}
                    </p>
                    {preview.companyData.nip && (
                      <p className="text-gray-900">
                        <strong>NIP:</strong> {preview.companyData.nip}
                      </p>
                    )}
                    {preview.companyData.phone && (
                      <p className="text-gray-900">
                        <strong>Telefon:</strong> {preview.companyData.phone}
                      </p>
                    )}
                    {preview.companyData.email && (
                      <p className="text-gray-900">
                        <strong>Email:</strong> {preview.companyData.email}
                      </p>
                    )}
                    {preview.companyData.address?.city && (
                      <p className="text-gray-900">
                        <strong>Adres:</strong>{' '}
                        {[
                          preview.companyData.address.street,
                          preview.companyData.address.postalCode,
                          preview.companyData.address.city,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-8 border-t border-gray-100 mt-8">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 px-6 py-3 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Skanuj ponownie
                </button>
                <Link
                  href="/onboarding"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Kontynuuj konfigurację
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        {!preview && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Automatyczne AI</h3>
              <p className="text-sm text-gray-600">
                Skanujemy Twoją stronę i pobieramy wszystkie dane w 30 sekund
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Szybki start</h3>
              <p className="text-sm text-gray-600">
                Gotowy system w kilka minut bez konieczności wypełniania formularzy
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dopasowane funkcje</h3>
              <p className="text-sm text-gray-600">
                AI zaproponuje moduły idealnie dopasowane do Twojej branży
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
