
import React, { useState } from 'react';

interface RegistrationProps {
  onClose?: () => void;
}

interface FormData {
  companyName: string;
  slug: string;
  template: 'services' | 'production' | 'trade';
  websiteUrl: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

const templates = [
  {
    id: 'services',
    name: 'Usługi',
    description: 'IT, marketing, konsulting, projektowanie',
    icon: '💼',
  },
  {
    id: 'production',
    name: 'Produkcja',
    description: 'Przetw&#243;rstwo, stolarka, meble',
    icon: '🏭',
  },
  {
    id: 'trade',
    name: 'Handel',
    description: 'Hurt, dystrybucja, e-commerce B2B',
    icon: '📦',
  },
];

const Registration: React.FC<RegistrationProps> = ({ onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    slug: '',
    template: 'services',
    websiteUrl: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Auto-generate slug from company name
    if (field === 'companyName') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/platform/tenants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Błąd podczas rejestracji');
      }

      const data = await response.json();
      setSuccess(true);

      // Redirect to tenant subdomain after 3 seconds
      setTimeout(() => {
        window.location.href = `https://${data.slug}.dockpulse.com/login`;
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="glass-ios rounded-3xl p-8 md:p-12 max-w-md w-full text-center space-y-6 apple-shadow">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-[#1d1d1f]">
            Konto utworzone!
          </h2>
          <p className="text-slate-600">
            Za chwilę zostaniesz przekierowany do panelu logowania...
          </p>
          <p className="text-sm text-slate-500">
            <strong>Twoja domena:</strong><br />
            <span className="text-blue-600 font-mono">{formData.slug}.dockpulse.com</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="glass-ios rounded-3xl p-6 md:p-10 max-w-2xl w-full my-8 apple-shadow">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black text-[#1d1d1f]">
            Rozpocznij bezpłatny trial
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-all ${
                s <= step ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Template Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">
                Wybierz szablon branżowy
              </h3>
              <p className="text-slate-600 text-sm">
                Szablon dostosuje system do specyfiki Twojej branży
              </p>
            </div>

            <div className="grid gap-4">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleInputChange('template', template.id as any)}
                  className={`p-5 rounded-2xl border-2 transition-all text-left ${
                    formData.template === template.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{template.icon}</span>
                    <div>
                      <h4 className="font-bold text-[#1d1d1f] mb-1">{template.name}</h4>
                      <p className="text-sm text-slate-600">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full px-8 py-4 bg-[#1d1d1f] text-white rounded-full font-bold hover:bg-black transition-all shadow-xl active:scale-95"
            >
              Dalej
            </button>
          </div>
        )}

        {/* Step 2: Company Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">
                Dane firmy
              </h3>
              <p className="text-slate-600 text-sm">
                Podaj podstawowe informacje o Twojej firmie
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nazwa firmy *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
                  placeholder="ACME Corporation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Subdomena *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none font-mono text-sm"
                    placeholder="acme"
                    required
                  />
                  <span className="text-slate-500 text-sm">.dockpulse.com</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tylko małe litery, cyfry i myślniki
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Strona WWW (opcjonalnie)
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
                  placeholder="https://twoja-firma.pl"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Automatycznie pobierzemy logo i kolory Twojej firmy
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-8 py-4 glass-ios rounded-full font-bold hover:bg-white transition-all border border-white/40 active:scale-95"
              >
                Wstecz
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.companyName || !formData.slug}
                className="flex-1 px-8 py-4 bg-[#1d1d1f] text-white rounded-full font-bold hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dalej
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Admin Account */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#1d1d1f] mb-2">
                Konto administratora
              </h3>
              <p className="text-slate-600 text-sm">
                Te dane posłużą do pierwszego logowania
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
                  placeholder="Jan Kowalski"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
                  placeholder="jan@firma.pl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Telefon *
                </label>
                <input
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-none"
                  placeholder="+48 123 456 789"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
              <p className="font-semibold mb-1">📧 Hasło zostanie wysłane na email</p>
              <p className="text-xs">
                Po utworzeniu konta otrzymasz wiadomość email z tymczasowym hasłem.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-8 py-4 glass-ios rounded-full font-bold hover:bg-white transition-all border border-white/40 active:scale-95"
              >
                Wstecz
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.adminName || !formData.adminEmail || !formData.adminPhone}
                className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
