'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { CheckCircle, Building2, TrendingUp, Zap } from 'lucide-react';

export function MarketingPage() {
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
            <Link
              href="/start"
              className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 bg-[#1d1d1f] text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-2xl active:scale-95 hover:shadow-blue-500/20"
            >
              Rozpocznij teraz
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 backdrop-blur-xl bg-white/70 text-slate-900 rounded-full font-bold text-lg hover:bg-white transition-all shadow-lg active:scale-95 border border-white/40"
            >
              Zaloguj się
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-16 md:mt-24 relative group px-2 md:px-0">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 rounded-[40px] md:rounded-[60px] blur-3xl opacity-50"></div>
            <div className="relative backdrop-blur-xl bg-white/70 rounded-[24px] md:rounded-[48px] p-2 md:p-3 shadow-2xl border border-white/60 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                alt="DockPulse Dashboard Preview"
                className="rounded-[20px] md:rounded-[40px] w-full object-cover h-[300px] sm:h-[450px] md:h-[650px] shadow-inner"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Tenant Subdomain Info */}
      <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold tracking-[0.3em] text-indigo-600 uppercase bg-indigo-50 px-4 py-1.5 rounded-full">
              Jak to działa
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-[#1d1d1f] mt-6 mb-4 tracking-tight">
              Twoja własna przestrzeń w chmurze
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Każda firma dostaje unikalną subdomenę i kompletnie izolowane środowisko
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-8 md:p-12 border border-white/60 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <h3 className="text-xl font-bold text-[#1d1d1f]">Zarejestruj firmę</h3>
                  </div>
                  <p className="text-slate-600 pl-13">
                    Wybierz nazwę swojej firmy podczas rejestracji
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <h3 className="text-xl font-bold text-[#1d1d1f]">Otrzymaj subdomenę</h3>
                  </div>
                  <p className="text-slate-600 pl-13">
                    Automatycznie tworzymy dla Ciebie unikalną subdomenę
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <h3 className="text-xl font-bold text-[#1d1d1f]">Zaloguj się</h3>
                  </div>
                  <p className="text-slate-600 pl-13">
                    Wejdź na swój dedykowany adres i zacznij pracę
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-700">
                <div className="space-y-4">
                  <div className="text-sm text-slate-400 font-mono">Przykładowe adresy:</div>
                  <div className="space-y-3">
                    <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-white font-mono text-sm md:text-base break-all">
                        <span className="text-blue-400">twojafirma</span>.dockpulse.com
                      </div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-white font-mono text-sm md:text-base break-all">
                        <span className="text-purple-400">abc-transport</span>.dockpulse.com
                      </div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-white font-mono text-sm md:text-base break-all">
                        <span className="text-cyan-400">studio-design</span>.dockpulse.com
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-4">
                    Twoje dane są całkowicie izolowane od innych firm
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-600 font-medium">Bezpieczne połączenie SSL</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-600 font-medium">Pełna izolacja danych</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-slate-600 font-medium">Własne branding</span>
                </div>
              </div>
            </div>
          </div>
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
      <footer className="bg-white/40 border-t border-slate-200 py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-16">
          <div className="space-y-6">
            <Link href="/" className="inline-block">
              <Logo className="h-12 md:h-14 w-auto" showText textSize="text-2xl md:text-3xl" />
            </Link>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-medium">
              Modularna platforma typu multi-tenant zaprojektowana dla dynamicznych firm B2B. Skalowalność bez kompromisów.
            </p>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
              © 2026 DockPulse. Wszelkie prawa zastrzeżone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
