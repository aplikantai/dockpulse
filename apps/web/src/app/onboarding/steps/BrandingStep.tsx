'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Palette, Globe } from 'lucide-react';

/**
 * Branding Preview Interface
 */
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

interface BrandingStepProps {
  onComplete: (branding: BrandingPreview) => void;
  onSkip: () => void;
}

export function BrandingStep({ onComplete, onSkip }: BrandingStepProps) {
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
      setError('Nieprawidlowy format adresu URL');
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
        throw new Error('Nie udalo sie pobrac danych');
      }

      const result: BrandingPreview = await response.json();
      setPreview(result);
    } catch (err) {
      setError('Nie udalo sie pobrac brandingu. Sprawdz adres URL lub sprobuj ponownie.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Twoj branding</h2>
        <p className="mt-2 text-gray-600">
          Podaj adres strony WWW Twojej firmy, a automatycznie pobierzemy logo,
          kolory i dane kontaktowe.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="glass-card p-6">
        <form onSubmit={handleExtract} className="space-y-4">
          <div>
            <label
              htmlFor="websiteUrl"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Adres strony WWW
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://twoja-firma.pl"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={isExtracting}
                className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Pobieram...
                  </>
                ) : (
                  'Pobierz dane'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-semibold">Podglad brandingu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="text-sm text-gray-600 font-medium">Logo</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-xl flex items-center justify-center min-h-[80px]">
                <img
                  src={preview.branding.logoUrl}
                  alt="Logo"
                  className="max-h-16 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/default-logo.png';
                  }}
                />
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="text-sm text-gray-600 font-medium">
                Kolory brandingu
              </label>
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-lg"
                    style={{ background: preview.branding.colors.primary }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Primary</span>
                </div>
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-lg"
                    style={{ background: preview.branding.colors.secondary }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Secondary</span>
                </div>
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-white shadow-lg"
                    style={{ background: preview.branding.colors.accent }}
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Accent</span>
                </div>
              </div>
            </div>

            {/* Company Data */}
            <div className="md:col-span-2">
              <label className="text-sm text-gray-600 font-medium">
                Dane firmy
              </label>
              <div className="mt-2 p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                <p>
                  <strong className="text-gray-700">Nazwa:</strong>{' '}
                  {preview.companyData.name}
                </p>
                {preview.companyData.nip && (
                  <p>
                    <strong className="text-gray-700">NIP:</strong>{' '}
                    {preview.companyData.nip}
                  </p>
                )}
                {preview.companyData.phone && (
                  <p>
                    <strong className="text-gray-700">Telefon:</strong>{' '}
                    {preview.companyData.phone}
                  </p>
                )}
                {preview.companyData.email && (
                  <p>
                    <strong className="text-gray-700">Email:</strong>{' '}
                    {preview.companyData.email}
                  </p>
                )}
                {preview.companyData.address?.city && (
                  <p>
                    <strong className="text-gray-700">Adres:</strong>{' '}
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
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setPreview(null)}
              className="px-5 py-2.5 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              Edytuj recznie
            </button>
            <button
              onClick={() => onComplete(preview)}
              className="px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all"
            >
              Wyglada dobrze! Dalej
            </button>
          </div>
        </div>
      )}

      {/* Skip Option */}
      {!preview && (
        <div className="text-center pt-4">
          <button
            onClick={onSkip}
            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
          >
            Pomin i skonfiguruj pozniej
          </button>
        </div>
      )}

      {/* Glass Card Styles */}
      <style jsx>{`
        .glass-card {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
}
