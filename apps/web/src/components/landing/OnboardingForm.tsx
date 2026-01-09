'use client';

import { useState } from 'react';
import Logo from './Logo';

interface BrandExtractionResult {
  companyName: string;
  domain: string;
  logo: { url: string; base64?: string; dominantColors?: string[] } | null;
  favicon: { url: string; base64?: string } | null;
  brandColors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  description: string;
  tagline?: string;
  industry?: string;
  contact: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialLinks: Record<string, string>;
}

interface ExtractionResult {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: BrandExtractionResult;
  errorMessage?: string;
  processingTimeMs?: number;
  confidence?: number;
}

type OnboardingStep = 'url' | 'extracting' | 'preview' | 'subdomain' | 'success';

export function OnboardingForm() {
  const [step, setStep] = useState<OnboardingStep>('url');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [subdomainChecking, setSubdomainChecking] = useState(false);
  const [extractionData, setExtractionData] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

  const handleExtractBrand = async () => {
    if (!websiteUrl) {
      setError('Wprowadz adres strony internetowej');
      return;
    }

    setError(null);
    setIsLoading(true);
    setStep('extracting');

    try {
      const response = await fetch(`${API_BASE}/api/v1/ai-branding/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Nie udalo sie przeanalizowac strony');
      }

      const data = await response.json();
      setExtractionData(data);

      // Generate suggested subdomain from company name
      if (data.result?.companyName) {
        const suggested = data.result.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 30);
        setSubdomain(suggested);
      }

      // Pre-fill email from extracted contact if available
      if (data.result?.contact?.email) {
        setAdminEmail(data.result.contact.email);
      }

      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystapil blad');
      setStep('url');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSubdomain = async (value: string) => {
    setSubdomain(value);
    setSubdomainAvailable(null);

    if (value.length < 3) return;

    setSubdomainChecking(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/ai-branding/validate-subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subdomain: value }),
      });

      const data = await response.json();
      setSubdomainAvailable(data.isAvailable ?? data.available);
    } catch (err) {
      console.error('Subdomain check failed:', err);
    } finally {
      setSubdomainChecking(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!subdomain || !subdomainAvailable) {
      setError('Wybierz dostepna subdomene');
      return;
    }

    if (!adminEmail || !adminEmail.includes('@')) {
      setError('Wprowadz poprawny adres email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/ai-branding/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`,
          subdomain,
          adminEmail,
          companyName: extractionData?.result?.companyName || subdomain,
          extractionId: extractionData?.id,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Nie udalo sie utworzyc konta');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystapil blad');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUrlStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-200">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm font-bold text-indigo-700">AI Auto-Branding</span>
        </div>
        <h3 className="text-3xl md:text-4xl font-black text-[#1d1d1f]">
          Rozpocznij w 15 sekund
        </h3>
        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Podaj adres strony internetowej Twojej firmy, a AI automatycznie pobierze logo, kolory i dane kontaktowe.
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="twojafirma.pl"
            className="w-full pl-12 pr-4 py-5 text-lg rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-white/80 backdrop-blur-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleExtractBrand()}
          />
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleExtractBrand}
          disabled={isLoading || !websiteUrl}
          className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-xl shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Analizuj strone z AI
        </button>

        <p className="text-center text-sm text-slate-400">
          Nie masz strony? <button className="text-blue-600 font-semibold hover:underline">Wprowadz dane recznie</button>
        </p>
      </div>
    </div>
  );

  const renderExtractingStep = () => (
    <div className="text-center space-y-8 py-12">
      <div className="relative w-24 h-24 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 animate-spin" style={{ animationDuration: '3s' }}></div>
        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
          <Logo className="w-12 h-12" />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-2xl font-bold text-[#1d1d1f]">AI analizuje Twoja strone...</h3>
        <p className="text-slate-500">Pobieramy logo, kolory i informacje o firmie</p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 text-sm font-medium">Polaczono ze strona</span>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 animate-pulse">
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-blue-700 text-sm font-medium">Analizowanie zawartosci...</span>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-bold text-green-700">Analiza zakonczona</span>
        </div>
        <h3 className="text-3xl font-black text-[#1d1d1f]">Sprawdz pobrane dane</h3>
      </div>

      {/* Brand Preview Card */}
      <div className="max-w-2xl mx-auto glass-ios rounded-3xl p-8 border border-white/50 apple-shadow">
        <div className="flex items-start gap-6">
          {/* Logo */}
          <div className="shrink-0">
            {extractionData?.result?.logo?.url ? (
              <img
                src={extractionData.result.logo.url}
                alt="Logo"
                className="w-20 h-20 rounded-2xl object-contain bg-white shadow-sm border border-slate-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h4 className="text-2xl font-bold text-[#1d1d1f]">
                {extractionData?.result?.companyName || 'Nazwa firmy'}
              </h4>
              <p className="text-slate-500 mt-1">
                {extractionData?.result?.description || 'Brak opisu'}
              </p>
            </div>

            {/* Colors */}
            {extractionData?.result?.brandColors && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Kolory:</span>
                <div className="flex gap-2">
                  {extractionData.result.brandColors.primary && (
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-white"
                      style={{ backgroundColor: extractionData.result.brandColors.primary }}
                      title="Primary"
                    />
                  )}
                  {extractionData.result.brandColors.secondary && (
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-white"
                      style={{ backgroundColor: extractionData.result.brandColors.secondary }}
                      title="Secondary"
                    />
                  )}
                  {extractionData.result.brandColors.accent && (
                    <div
                      className="w-8 h-8 rounded-lg shadow-sm border border-white"
                      style={{ backgroundColor: extractionData.result.brandColors.accent }}
                      title="Accent"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Contact */}
            {extractionData?.result?.contact && (
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {extractionData.result.contact.email && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {extractionData.result.contact.email}
                  </div>
                )}
                {extractionData.result.contact.phone && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {extractionData.result.contact.phone}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Input */}
      <div className="max-w-xl mx-auto space-y-4">
        <label className="block text-sm font-bold text-slate-700">Twoj adres email (do logowania):</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="jan.kowalski@firma.pl"
            className="w-full pl-12 pr-4 py-4 text-lg rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          />
        </div>
      </div>

      {/* Subdomain Input */}
      <div className="max-w-xl mx-auto space-y-4">
        <label className="block text-sm font-bold text-slate-700">Wybierz adres Twojego panelu:</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => handleCheckSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="twojafirma"
              className={`w-full px-4 py-4 text-lg rounded-xl border-2 outline-none transition-all ${
                subdomainAvailable === true
                  ? 'border-green-500 focus:ring-4 focus:ring-green-500/10'
                  : subdomainAvailable === false
                  ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
              }`}
            />
            {subdomainChecking && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
            {!subdomainChecking && subdomainAvailable === true && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {!subdomainChecking && subdomainAvailable === false && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          <span className="text-lg font-semibold text-slate-500">.dockpulse.com</span>
        </div>
        {subdomainAvailable === false && (
          <p className="text-sm text-red-600">Ta subdomena jest juz zajeta. Wybierz inna.</p>
        )}
        {subdomainAvailable === true && (
          <p className="text-sm text-green-600">Subdomena jest dostepna!</p>
        )}
      </div>

      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="max-w-xl mx-auto flex gap-4">
        <button
          onClick={() => setStep('url')}
          className="flex-1 py-4 px-6 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all"
        >
          Wstecz
        </button>
        <button
          onClick={handleCreateTenant}
          disabled={isLoading || !subdomainAvailable || !adminEmail.includes('@')}
          className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Tworzenie...' : 'Utworz konto'}
        </button>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-8 py-8">
      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30">
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div className="space-y-3">
        <h3 className="text-3xl font-black text-[#1d1d1f]">Twoje konto jest gotowe!</h3>
        <p className="text-slate-500 text-lg">
          Mozesz teraz zalogowac sie do panelu pod adresem:
        </p>
      </div>

      <div className="inline-block">
        <a
          href={`https://${subdomain}.dockpulse.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 text-white font-mono text-lg hover:bg-black transition-all shadow-xl"
        >
          <span className="text-cyan-400">{subdomain}</span>
          <span className="text-slate-400">.dockpulse.com</span>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="max-w-md mx-auto p-6 rounded-2xl bg-blue-50 border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>Co dalej?</strong> Na Twoj email wyslalismy dane logowania. Mozesz tez zalogowac sie przez Google lub utworzyc haslo w panelu.
        </p>
      </div>
    </div>
  );

  return (
    <section id="onboarding" className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-ios rounded-[48px] p-8 md:p-12 border border-white/50 apple-shadow">
          {step === 'url' && renderUrlStep()}
          {step === 'extracting' && renderExtractingStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </div>
    </section>
  );
}

export default OnboardingForm;
