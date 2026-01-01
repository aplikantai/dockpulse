'use client';

import { useState } from 'react';
import { BrandingStep } from './steps/BrandingStep';
import { CheckCircle, Palette, LayoutTemplate, Blocks, Rocket } from 'lucide-react';

type OnboardingStep = 'branding' | 'template' | 'modules' | 'complete';

interface BrandingData {
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('branding');
  const [brandingData, setBrandingData] = useState<BrandingData | null>(null);

  const handleBrandingComplete = (data: BrandingData) => {
    setBrandingData(data);
    setCurrentStep('template');
  };

  const handleBrandingSkip = () => {
    setCurrentStep('template');
  };

  const steps = [
    { id: 'branding', label: 'Dane firmy', icon: Palette },
    { id: 'template', label: 'Rodzaj działalności', icon: LayoutTemplate },
    { id: 'modules', label: 'Funkcje', icon: Blocks },
    { id: 'complete', label: 'Gotowe', icon: Rocket },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Konfiguracja DockPulse</h1>
          <p className="text-gray-600 mt-2">
            Skonfiguruj system w kilku prostych krokach
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className="relative flex items-center justify-center">
                    {/* Connector line */}
                    {index > 0 && (
                      <div
                        className={`absolute right-1/2 w-full h-0.5 -translate-y-1/2 ${
                          isCompleted ? 'bg-primary' : 'bg-gray-200'
                        }`}
                        style={{ top: '50%', right: '50%', width: 'calc(100% + 2rem)' }}
                      />
                    )}

                    <div
                      className={`
                        relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                        transition-all duration-300
                        ${isActive ? 'bg-primary text-white shadow-lg scale-110' : ''}
                        ${isCompleted ? 'bg-primary text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                  <span
                    className={`
                      text-sm mt-2 font-medium
                      ${isActive ? 'text-primary' : ''}
                      ${isCompleted ? 'text-primary' : ''}
                      ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar fill */}
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {currentStep === 'branding' && (
            <BrandingStep
              onComplete={handleBrandingComplete}
              onSkip={handleBrandingSkip}
            />
          )}

          {currentStep === 'template' && (
            <TemplateStep
              onNext={() => setCurrentStep('modules')}
              onBack={() => setCurrentStep('branding')}
            />
          )}

          {currentStep === 'modules' && (
            <ModulesStep
              onNext={() => setCurrentStep('complete')}
              onBack={() => setCurrentStep('template')}
            />
          )}

          {currentStep === 'complete' && (
            <CompleteStep brandingData={brandingData} />
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other steps
function TemplateStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const templates = [
    {
      id: 'services',
      name: 'USLUGI',
      description: 'IT, marketing, konsulting',
      modules: ['Zlecenia', 'Klienci', 'Wyceny', 'Kalendarz'],
    },
    {
      id: 'production',
      name: 'PRODUKCJA',
      description: 'Przetworstwo, stolarka, meble',
      modules: ['Zamówienia', 'Odbiorcy', 'Wyroby', 'Magazyn'],
    },
    {
      id: 'trade',
      name: 'HANDEL',
      description: 'Hurt, dystrybucja, handel hurtowy',
      modules: ['Zamówienia', 'Kontrahenci', 'Towary', 'Faktury'],
    },
  ];

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <LayoutTemplate className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Wybierz rodzaj swojej działalności</h2>
        <p className="mt-2 text-gray-600">
          Każdy typ zawiera gotowe funkcje dopasowane do Twojej branży
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelected(template.id)}
            className={`
              glass-card p-6 text-left transition-all
              ${selected === template.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-white/80'}
            `}
          >
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            <div className="mt-4 flex flex-wrap gap-1">
              {template.modules.map((mod) => (
                <span
                  key={mod}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {mod}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="glass-button-secondary">
          Wstecz
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="glass-button disabled:opacity-50"
        >
          Dalej
        </button>
      </div>
    </div>
  );
}

function ModulesStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Blocks className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Wybierz potrzebne funkcje</h2>
        <p className="mt-2 text-gray-600">
          Włącz lub wyłącz funkcje zgodnie z potrzebami Twojej firmy
        </p>
      </div>

      <div className="glass-card p-6">
        <p className="text-center text-gray-500 py-8">
          Konfiguracja funkcji będzie dostępna w pełnej wersji
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="glass-button-secondary">
          Wstecz
        </button>
        <button onClick={onNext} className="glass-button">
          Zakończ konfigurację
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ brandingData }: { brandingData: BrandingData | null }) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Konfiguracja zakończona!</h2>
        <p className="mt-2 text-gray-600">
          Twój system DockPulse jest gotowy do użycia
        </p>
      </div>

      {brandingData && (
        <div className="glass-card p-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-4">Podsumowanie</h3>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Firma:</span>{' '}
              <span className="font-medium">{brandingData.companyData.name}</span>
            </p>
            <p>
              <span className="text-gray-500">Kolor główny:</span>{' '}
              <span
                className="inline-block w-4 h-4 rounded ml-2 align-middle"
                style={{ background: brandingData.branding.colors.primary }}
              />
            </p>
          </div>
        </div>
      )}

      <div className="pt-4">
        <a href="/dashboard" className="glass-button inline-block">
          Przejdź do panelu
        </a>
      </div>
    </div>
  );
}
