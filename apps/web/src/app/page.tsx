'use client';

import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, Sparkles, Rocket, Building2, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 px-4 md:px-8 py-3 shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-12">
          <Link href="/" className="cursor-pointer group flex items-center z-10 shrink-0">
            <Logo className="h-9 w-auto" showText textSize="text-lg md:text-xl" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Strona główna
            </Link>
            <a href="#features" className="hover:text-blue-600 transition-colors">
              Funkcje
            </a>
            <a href="#demo" className="hover:text-blue-600 transition-colors">
              Demo AI
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
            >
              Zaloguj się
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2 text-sm font-bold rounded-full bg-[#1d1d1f] text-white hover:bg-black transition-all shadow-md active:scale-95"
            >
              Panel główny
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 pb-16 md:pb-32 px-4 md:px-6 text-center overflow-hidden max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
          <div className="flex flex-col items-center">
            <Logo className="w-16 h-16 md:w-20 md:h-20 mb-6 md:mb-8" />
            <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-blue-600 uppercase bg-blue-50 px-4 py-1.5 rounded-full">
              Nowość: DockPulse 2026
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[80px] lg:text-[92px] font-black tracking-tighter text-[#1d1d1f] leading-[1.1] md:leading-[0.95]">
            Prostota to <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400">
              najwyższa forma modułowości.
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium px-4">
            Odkryj najbardziej intuicyjną platformę dla sektora B2B. <br className="hidden md:block" />
            Zaprojektowana, by skalować Twój biznes z lekkością systemu iOS.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 md:pt-10">
            <a
              href="#demo"
              className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 bg-[#1d1d1f] text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-2xl active:scale-95 hover:shadow-blue-500/20"
            >
              Wypróbuj Demo AI
            </a>
            <Link
              href="/onboarding"
              className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 backdrop-blur-xl bg-white/70 text-slate-900 rounded-full font-bold text-lg hover:bg-white transition-all shadow-lg active:scale-95 border border-white/40"
            >
              Dowiedz się więcej
            </Link>
          </div>
        </div>
      </section>

      {/* AI Demo Section */}
      <section id="demo" className="py-16 md:py-32 px-4 md:px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Automatyczna konfiguracja z AI
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-[#1d1d1f] mb-4 tracking-tight">
              Uruchom system<br />w 30 sekund
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Wprowadź adres swojej strony WWW, a nasze AI automatycznie pobierze logo, kolory marki
              i zaproponuje odpowiednie funkcje dla Twojej firmy.
            </p>
          </div>

          {/* AI Scanner Form */}
          {!preview && (
            <div className="backdrop-blur-xl bg-white/70 rounded-[32px] p-8 shadow-2xl border border-white/60">
              <form onSubmit={handleExtract} className="space-y-6">
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-bold text-slate-700 mb-3 tracking-wide uppercase text-xs">
                    Adres strony WWW Twojej firmy
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      id="websiteUrl"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://twoja-firma.pl"
                      className="flex-1 px-6 py-4 text-lg rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white/50 backdrop-blur-sm outline-none font-medium"
                      disabled={isExtracting}
                    />
                    <button
                      type="submit"
                      disabled={isExtracting}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2 shadow-lg"
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

                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-red-700">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  </div>
                )}

                <div className="text-center pt-4">
                  <Link
                    href="/onboarding"
                    className="text-sm text-slate-500 hover:text-slate-700 underline font-semibold"
                  >
                    Lub skonfiguruj ręcznie
                  </Link>
                </div>
              </form>
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div className="backdrop-blur-xl bg-white/70 rounded-[32px] p-8 shadow-2xl border border-white/60">
              <div className="flex items-center gap-3 text-green-600 mb-6">
                <CheckCircle className="w-6 h-6" />
                <h3 className="text-xl font-bold">Gotowe! Znaleźliśmy Twój branding</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-3 block uppercase tracking-wide">Logo firmy</label>
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center min-h-[120px] border-2 border-slate-200">
                    <img
                      src={preview.branding.logoUrl}
                      alt="Logo"
                      className="max-h-20 w-auto object-contain"
                      onError={(e) => {
                        // Fallback: try favicon if logo fails
                        const target = e.target as HTMLImageElement;
                        if (preview.branding.faviconUrl && target.src !== preview.branding.faviconUrl) {
                          target.src = preview.branding.faviconUrl;
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-3 block uppercase tracking-wide">Kolory marki</label>
                  <div className="flex gap-4">
                    {['primary', 'secondary', 'accent'].map((colorType) => (
                      <div key={colorType} className="text-center flex-1">
                        <div
                          className="w-full h-20 rounded-2xl border-2 border-white shadow-lg"
                          style={{ background: preview.branding.colors[colorType as keyof typeof preview.branding.colors] }}
                        />
                        <span className="text-xs text-slate-600 mt-2 block font-bold uppercase tracking-wide">
                          {colorType === 'primary' ? 'Główny' : colorType === 'secondary' ? 'Dodatkowy' : 'Akcent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-3 block uppercase tracking-wide">Dane firmy</label>
                  <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl space-y-2 border-2 border-slate-200">
                    <p className="text-slate-900 font-semibold">
                      <strong className="text-slate-600">Nazwa:</strong> {preview.companyData.name}
                    </p>
                    {preview.companyData.nip && (
                      <p className="text-slate-900 font-semibold">
                        <strong className="text-slate-600">NIP:</strong> {preview.companyData.nip}
                      </p>
                    )}
                    {preview.companyData.phone && (
                      <p className="text-slate-900 font-semibold">
                        <strong className="text-slate-600">Telefon:</strong> {preview.companyData.phone}
                      </p>
                    )}
                    {preview.companyData.email && (
                      <p className="text-slate-900 font-semibold">
                        <strong className="text-slate-600">Email:</strong> {preview.companyData.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setPreview(null)}
                  className="flex-1 px-6 py-4 text-slate-700 font-bold rounded-2xl border-2 border-slate-200 hover:bg-slate-50 transition-all"
                >
                  Skanuj ponownie
                </button>
                <Link
                  href="/onboarding"
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-2xl hover:scale-105 transition-all text-center flex items-center justify-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Kontynuuj konfigurację
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-32 px-4 md:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-[#1d1d1f] mb-4 tracking-tight">
              Zaprojektowane dla<br />nowoczesnych firm
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Wszystko czego potrzebujesz do zarządzania klientami, zamówieniami i magazynem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="backdrop-blur-xl bg-white rounded-[32px] p-8 border border-slate-200 shadow-lg hover:shadow-2xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] mb-3">Zarządzanie klientami</h3>
              <p className="text-slate-600 leading-relaxed">
                Wszystkie dane o klientach w jednym miejscu. Historia kontaktów, zamówień i preferencji.
              </p>
            </div>

            <div className="backdrop-blur-xl bg-white rounded-[32px] p-8 border border-slate-200 shadow-lg hover:shadow-2xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] mb-3">Zamówienia i faktury</h3>
              <p className="text-slate-600 leading-relaxed">
                Twórz oferty, zamówienia i faktury w kilka sekund. Pełna automatyzacja procesów.
              </p>
            </div>

            <div className="backdrop-blur-xl bg-white rounded-[32px] p-8 border border-slate-200 shadow-lg hover:shadow-2xl transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-[#1d1d1f] mb-3">Magazyn i logistyka</h3>
              <p className="text-slate-600 leading-relaxed">
                Kontroluj stany magazynowe, planuj dostawy i optymalizuj koszty transportu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/40 border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo className="h-12 w-auto mx-auto" showText textSize="text-2xl" />
          </Link>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Modularna platforma dla dynamicznych firm B2B. Skalowalność bez kompromisów.
          </p>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            © 2026 DockPulse. Wszelkie prawa zastrzeżone.
          </p>
        </div>
      </footer>
    </div>
  );
}
