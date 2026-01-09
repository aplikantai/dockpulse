'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Globe,
  Sparkles,
  ArrowRight,
  Loader2,
  Building2,
  Palette,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

interface ExtractedBranding {
  companyData: {
    name: string;
    slogan?: string;
    description?: string;
    nip?: string;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      linkedin?: string;
      instagram?: string;
      twitter?: string;
      youtube?: string;
    };
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

type Step = 'url' | 'analyzing' | 'preview' | 'error';

export default function StartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('url');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedBranding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [companyName, setCompanyName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');

  const normalizeUrl = (url: string): string => {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  };

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) {
      setError('Podaj adres strony internetowej');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const normalizedUrl = normalizeUrl(websiteUrl);

      const response = await fetch('/api/branding/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteUrl: normalizedUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nie udało się pobrać danych ze strony');
      }

      const result = await response.json();

      // Map API response to our format
      const data: ExtractedBranding = {
        companyData: {
          name: result.companyName || result.companyData?.name || 'Twoja Firma',
          slogan: result.slogan || result.companyData?.slogan || '',
          description: result.description || result.companyData?.description || '',
          email: result.contactInfo?.email || result.companyData?.email || '',
          phone: result.contactInfo?.phone || result.companyData?.phone || '',
          website: normalizedUrl,
          nip: result.companyData?.nip || '',
          socialMedia: result.socialMedia || result.companyData?.socialMedia || {},
          address: result.address || result.companyData?.address || {},
        },
        branding: {
          logoUrl: result.logoUrl || result.branding?.logoUrl || '',
          faviconUrl: result.faviconUrl || result.branding?.faviconUrl || '',
          colors: {
            primary: result.colors?.primary || result.branding?.colors?.primary || '#3B82F6',
            secondary: result.colors?.secondary || result.branding?.colors?.secondary || '#1E40AF',
            accent: result.colors?.accent || result.branding?.colors?.accent || '#60A5FA',
          },
        },
      };

      setExtractedData(data);
      setCompanyName(data.companyData.name);
      setSlogan(data.companyData.slogan || '');
      setDescription(data.companyData.description || '');
      setEmail(data.companyData.email || '');
      setPhone(data.companyData.phone || '');
      setPrimaryColor(data.branding.colors.primary);
      setStep('preview');
    } catch (err: any) {
      console.error('Branding extraction failed:', err);
      setError(err.message || 'Wystąpił błąd podczas analizy strony. Spróbuj ponownie.');
      setStep('error');
    }
  };

  const handleContinue = () => {
    if (!extractedData) return;

    // Build final data with any edits
    const finalData: ExtractedBranding = {
      companyData: {
        ...extractedData.companyData,
        name: companyName,
        slogan: slogan,
        description: description,
        email: email,
        phone: phone,
      },
      branding: {
        ...extractedData.branding,
        colors: {
          ...extractedData.branding.colors,
          primary: primaryColor,
        },
      },
    };

    // Save to localStorage for onboarding page
    localStorage.setItem('dockpulse_branding', JSON.stringify(finalData));

    // Redirect to onboarding
    router.push('/onboarding');
  };

  const handleManualEntry = () => {
    // Create empty branding data for manual entry
    const emptyData: ExtractedBranding = {
      companyData: {
        name: companyName || 'Moja Firma',
        slogan: '',
        description: '',
        email: '',
        phone: '',
        website: '',
      },
      branding: {
        logoUrl: '',
        faviconUrl: '',
        colors: {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          accent: '#60A5FA',
        },
      },
    };

    setExtractedData(emptyData);
    setCompanyName(emptyData.companyData.name);
    setPrimaryColor(emptyData.branding.colors.primary);
    setIsEditing(true);
    setStep('preview');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 px-4 md:px-8 py-4 shadow-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-10 w-auto" showText textSize="text-xl" />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Anuluj
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Step 1: URL Input */}
        {step === 'url' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-4">
                <Sparkles className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1f] tracking-tight">
                Skonfiguruj system automatycznie
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Podaj adres swojej strony internetowej, a AI pobierze wszystkie dane o Twojej firmie
              </p>
            </div>

            <div className="backdrop-blur-xl bg-white/80 rounded-[32px] p-8 md:p-12 shadow-2xl border border-white/60 max-w-2xl mx-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Adres strony internetowej
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="np. mojafirma.pl"
                      className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleAnalyze}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-lg hover:shadow-2xl hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Analizuj stronę z AI
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-500 font-medium">lub</span>
                  </div>
                </div>

                <button
                  onClick={handleManualEntry}
                  className="w-full py-4 backdrop-blur-xl bg-white/70 text-slate-700 font-bold rounded-2xl text-lg hover:bg-white transition-all border-2 border-slate-200 flex items-center justify-center gap-2"
                >
                  <Building2 className="w-5 h-5" />
                  Wprowadź dane ręcznie
                </button>
              </div>
            </div>

            <div className="text-center text-sm text-slate-500">
              <p>AI przeanalizuje stronę i pobierze: logo, kolory, dane kontaktowe, opis firmy</p>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <div className="space-y-8 animate-fade-in text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-[#1d1d1f]">
                AI analizuje Twoją stronę...
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Pobieramy logo, kolory firmowe, dane kontaktowe i opis działalności
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Edit */}
        {step === 'preview' && extractedData && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#1d1d1f]">
                {isEditing ? 'Wprowadź dane firmy' : 'Sprawdź pobrane dane'}
              </h2>
              <p className="text-lg text-slate-600">
                {isEditing ? 'Uzupełnij informacje o swojej firmie' : 'Możesz edytować dowolne pole przed kontynuowaniem'}
              </p>
            </div>

            <div className="backdrop-blur-xl bg-white/80 rounded-[32px] p-8 md:p-10 shadow-2xl border border-white/60 max-w-3xl mx-auto">
              {/* Company Logo & Name */}
              <div className="flex items-start gap-6 mb-8 pb-8 border-b border-slate-200">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white"
                  style={{ backgroundColor: primaryColor + '15' }}
                >
                  {extractedData.branding.logoUrl ? (
                    <img
                      src={extractedData.branding.logoUrl}
                      alt={companyName}
                      className="w-full h-full object-contain rounded-xl p-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="w-10 h-10" style={{ color: primaryColor }} />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Nazwa firmy
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-2xl font-black text-[#1d1d1f] bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 transition-colors outline-none py-1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Slogan / hasło
                    </label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="np. Jakość i profesjonalizm"
                      className="w-full text-slate-600 italic bg-transparent border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 transition-colors outline-none py-1"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Opis działalności
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Krótki opis czym zajmuje się Twoja firma..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none resize-none"
                />
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Email kontaktowy
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kontakt@firma.pl"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Color */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Kolor główny
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white shadow-lg"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="px-4 py-2 rounded-lg border-2 border-slate-200 font-mono text-sm uppercase"
                  />
                  <div
                    className="flex-1 h-10 rounded-lg"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}88)` }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setStep('url');
                    setExtractedData(null);
                    setIsEditing(false);
                  }}
                  className="flex-1 py-4 backdrop-blur-xl bg-white/70 text-slate-700 font-bold rounded-2xl hover:bg-white transition-all border-2 border-slate-200 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Zacznij od nowa
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl text-lg hover:shadow-2xl hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Kontynuuj
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Error */}
        {step === 'error' && (
          <div className="space-y-8 animate-fade-in text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-[#1d1d1f]">
                Nie udało się pobrać danych
              </h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                {error || 'Wystąpił problem z analizą strony. Możesz spróbować ponownie lub wprowadzić dane ręcznie.'}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('url');
                  setError(null);
                }}
                className="px-8 py-4 backdrop-blur-xl bg-white/70 text-slate-700 font-bold rounded-2xl hover:bg-white transition-all border-2 border-slate-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Spróbuj ponownie
              </button>
              <button
                onClick={handleManualEntry}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-2xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                Wprowadź ręcznie
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
