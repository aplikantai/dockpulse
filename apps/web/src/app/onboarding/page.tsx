'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Palette, LayoutTemplate, Blocks, Rocket, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import Link from 'next/link';

type OnboardingStep = 'template' | 'modules' | 'complete';

interface SocialMedia {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

interface BrandingData {
  companyData: {
    name: string;
    slogan?: string;
    description?: string;
    nip?: string;
    phone?: string;
    email?: string;
    website?: string;
    socialMedia?: SocialMedia;
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

interface ModuleState {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

const INITIAL_MODULES: ModuleState[] = [
  { id: 'customers', name: 'Baza Klientów', active: true, description: 'Inteligentne zarządzanie CRM i tagowanie klientów' },
  { id: 'products', name: 'Katalog SKU', active: true, description: 'Centrum zarządzania produktami, EAN i cenami' },
  { id: 'orders', name: 'Obsługa Zamówień', active: false, description: 'Zautomatyzowany obieg zamówień sprzedaży' },
  { id: 'warehouse', name: 'Magazyn WMS', active: false, description: 'Real-time stany magazynowe i lokalizacje' },
  { id: 'quotes', name: 'Wyceny & Oferty', active: true, description: 'Błyskawiczne generowanie profesjonalnych ofert' },
  { id: 'ai', name: 'AI Configuration', active: false, description: 'Automatyczna pomoc w ustawieniach systemu' }
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('template');
  const [brandingData, setBrandingData] = useState<BrandingData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleState[]>(INITIAL_MODULES);
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load branding data from localStorage on mount
  useEffect(() => {
    const savedBranding = localStorage.getItem('dockpulse_branding');
    if (savedBranding) {
      try {
        const parsed = JSON.parse(savedBranding);
        setBrandingData(parsed);
        // Use primary color as accent
        if (parsed.branding?.colors?.primary) {
          setAccentColor(parsed.branding.colors.primary);
        }
      } catch (error) {
        console.error('Failed to parse branding data:', error);
      }
    }
  }, []);

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const activeModulesCount = modules.filter(m => m.active).length;

  // Submit onboarding data and create tenant
  const handleSubmit = async () => {
    if (!brandingData || !selectedTemplate) {
      setError('Brak danych brandingowych lub szablonu');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Generate slug from company name
      const slug = brandingData.companyData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      // Get active modules
      const activeModules = modules.filter(m => m.active).map(m => m.id);

      // Build payload for API
      const payload = {
        companyName: brandingData.companyData.name,
        slug: slug,
        template: selectedTemplate as 'services' | 'production' | 'trade',
        websiteUrl: brandingData.companyData.website,
        adminName: brandingData.companyData.name, // Default to company name
        adminEmail: brandingData.companyData.email || 'admin@example.com',
        adminPhone: brandingData.companyData.phone || '',
        // Branding data
        logoUrl: brandingData.branding.logoUrl,
        faviconUrl: brandingData.branding.faviconUrl,
        slogan: brandingData.companyData.slogan,
        description: brandingData.companyData.description,
        colors: brandingData.branding.colors,
        // Company data
        nip: brandingData.companyData.nip,
        phone: brandingData.companyData.phone,
        email: brandingData.companyData.email,
        address: brandingData.companyData.address,
        socialMedia: brandingData.companyData.socialMedia,
        // Modules
        modules: activeModules,
      };

      console.log('Submitting tenant registration:', payload);

      // Call API
      const response = await fetch('/api/platform/tenants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nie udało się utworzyć konta');
      }

      const result = await response.json();
      console.log('Tenant created:', result);

      // Store tenant slug for dashboard
      localStorage.setItem('dockpulse_tenant_slug', result.slug);

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Failed to create tenant:', err);
      setError(err.message || 'Wystąpił błąd podczas tworzenia konta. Spróbuj ponownie.');
      setIsSubmitting(false);
    }
  };

  const templates = [
    {
      id: 'services',
      name: 'USŁUGI',
      description: 'IT, marketing, konsulting',
      modules: ['Zlecenia', 'Klienci', 'Wyceny', 'Kalendarz'],
    },
    {
      id: 'production',
      name: 'PRODUKCJA',
      description: 'Przetwórstwo, stolarka, meble',
      modules: ['Zamówienia', 'Odbiorcy', 'Wyroby', 'Magazyn'],
    },
    {
      id: 'trade',
      name: 'HANDEL',
      description: 'Hurt, dystrybucja, handel hurtowy',
      modules: ['Zamówienia', 'Kontrahenci', 'Towary', 'Faktury'],
    },
  ];

  const steps = [
    { id: 'template', label: 'Rodzaj działalności', icon: LayoutTemplate },
    { id: 'modules', label: 'Funkcje', icon: Blocks },
    { id: 'complete', label: 'Gotowe', icon: Rocket },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header with Branding */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 px-4 md:px-8 py-4 shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {brandingData && (
              <>
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-[18px] backdrop-blur-xl bg-white/70 flex items-center justify-center p-2 shadow-lg border border-white/50 shrink-0">
                  {brandingData.branding.logoUrl && (
                    <img
                      src={brandingData.branding.logoUrl}
                      alt={brandingData.companyData.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (brandingData.branding.faviconUrl && target.src !== brandingData.branding.faviconUrl) {
                          target.src = brandingData.branding.faviconUrl;
                        }
                      }}
                    />
                  )}
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-[#1d1d1f]">{brandingData.companyData.name}</h1>
                  {brandingData.companyData.slogan && (
                    <p className="text-xs text-slate-500 italic">{brandingData.companyData.slogan}</p>
                  )}
                </div>
              </>
            )}
            {!brandingData && (
              <div className="flex items-center gap-3">
                <Logo className="h-10 w-auto" showText textSize="text-xl" />
              </div>
            )}
          </div>

          <Link
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Powrót</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                  {/* Connector line */}
                  {index > 0 && (
                    <div
                      className={`absolute right-1/2 top-6 w-full h-1 -translate-y-1/2 transition-all duration-500 ${
                        isCompleted ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200'
                      }`}
                      style={{ width: 'calc(100% - 3rem)' }}
                    />
                  )}

                  <div
                    className={`
                      relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center
                      transition-all duration-500 shadow-lg
                      ${isActive ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white scale-110 shadow-blue-500/50' : ''}
                      ${isCompleted ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-white text-slate-400 border-2 border-slate-200' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={`
                      text-xs mt-3 font-bold text-center
                      ${isActive ? 'text-blue-600' : ''}
                      ${isCompleted ? 'text-blue-600' : ''}
                      ${!isActive && !isCompleted ? 'text-slate-400' : ''}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Step */}
        {currentStep === 'template' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 mb-6">
                <LayoutTemplate className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-4 tracking-tight">
                Wybierz rodzaj swojej działalności
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Każdy typ zawiera gotowe funkcje dopasowane do Twojej branży
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`
                    backdrop-blur-xl bg-white/70 p-8 rounded-[32px] text-left transition-all duration-500
                    border-2 shadow-xl hover:shadow-2xl
                    ${selectedTemplate === template.id
                      ? 'border-blue-600 bg-blue-50/50 scale-105 shadow-blue-500/20'
                      : 'border-white/60 hover:border-blue-300'
                    }
                  `}
                >
                  {selectedTemplate === template.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <h3 className="text-2xl font-black text-[#1d1d1f] mb-2">{template.name}</h3>
                  <p className="text-sm text-slate-600 mb-4 font-semibold">{template.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.modules.map((mod) => (
                      <span
                        key={mod}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={() => setCurrentStep('modules')}
                disabled={!selectedTemplate}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-lg hover:shadow-2xl hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg disabled:cursor-not-allowed"
              >
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* Modules Step */}
        {currentStep === 'modules' && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 mb-6">
                <Blocks className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-4 tracking-tight">
                Włącz potrzebne funkcje
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Wybierz moduły, które pomogą rozwinąć Twój biznes
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {modules.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={`
                    p-7 rounded-[32px] border cursor-pointer transition-all duration-500 group relative overflow-hidden
                    ${m.active
                      ? 'bg-white shadow-xl border-blue-200'
                      : 'bg-white/30 border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                    }
                  `}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all duration-500 ${
                        m.active ? 'scale-110' : ''
                      }`}
                      style={{
                        backgroundColor: m.active ? `${accentColor}10` : '#f4f4f7',
                        color: m.active ? accentColor : '#94a3b8',
                      }}
                    >
                      {m.active ? '✦' : '✧'}
                    </div>

                    <div
                      className={`w-12 h-7 rounded-full relative transition-colors duration-300 p-1 ${
                        m.active ? '' : 'bg-slate-200'
                      }`}
                      style={{ backgroundColor: m.active ? accentColor : undefined }}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${
                          m.active ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      ></div>
                    </div>
                  </div>

                  <h4 className="text-lg font-bold text-[#1d1d1f] mb-1">{m.name}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{m.description}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-8">
              <button
                onClick={() => setCurrentStep('template')}
                className="px-8 py-4 text-slate-700 font-bold rounded-full border-2 border-slate-200 hover:bg-slate-50 transition-all"
              >
                Wstecz
              </button>
              <button
                onClick={() => setCurrentStep('complete')}
                className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-lg flex items-center gap-2"
              >
                Zakończ konfigurację
                <Rocket className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="space-y-8 animate-fade-in">
            <div className="backdrop-blur-xl bg-white/70 rounded-[48px] p-12 shadow-2xl border border-white/60 max-w-3xl mx-auto">
              <div className="text-center space-y-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>

                <div>
                  <h2 className="text-5xl font-black text-[#1d1d1f] mb-4 tracking-tight">
                    Konfiguracja zakończona!
                  </h2>
                  <p className="text-xl text-slate-600">
                    Twój system DockPulse jest gotowy do użycia
                  </p>
                </div>

                {brandingData && (
                  <div className="backdrop-blur-xl bg-gradient-to-br from-slate-50 to-slate-100 rounded-[32px] p-8 text-left shadow-lg border border-slate-200">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200">
                      {brandingData.branding.logoUrl && (
                        <div className="w-16 h-16 backdrop-blur-xl bg-white/70 rounded-2xl flex items-center justify-center p-2 shadow-lg border border-white/50">
                          <img
                            src={brandingData.branding.logoUrl}
                            alt={brandingData.companyData.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (brandingData.branding.faviconUrl && target.src !== brandingData.branding.faviconUrl) {
                                target.src = brandingData.branding.faviconUrl;
                              }
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-black text-[#1d1d1f]">
                          {brandingData.companyData.name}
                        </h3>
                        {brandingData.companyData.slogan && (
                          <p className="text-slate-600 italic">{brandingData.companyData.slogan}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 font-semibold">Aktywne moduły:</span>
                        <span className="ml-2 font-black text-2xl" style={{ color: accentColor }}>
                          {activeModulesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold">Kolor główny:</span>
                        <span
                          className="inline-block w-6 h-6 rounded-lg ml-2 align-middle border-2 border-white shadow-md"
                          style={{ background: accentColor }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      <strong className="font-bold">Błąd:</strong> {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Tworzenie konta...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5" />
                        <span>Przejdź do panelu</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      localStorage.removeItem('dockpulse_branding');
                      window.location.href = '/';
                    }}
                    disabled={isSubmitting}
                    className="text-sm text-slate-500 hover:text-slate-700 font-semibold transition-colors disabled:opacity-50"
                  >
                    Zacznij od nowa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
