'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import { Brain, Key, Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  tier: 'free' | 'paid';
  cost?: string;
}

interface AIModels {
  free: {
    text: AIModel[];
    vision: AIModel[];
    code: AIModel[];
  };
  paid: {
    text: AIModel[];
    vision: AIModel[];
    code: AIModel[];
  };
}

interface AISettings {
  openrouterApiKey: string | null;
  models: {
    text: string;
    vision: string;
    code: string;
  };
  enableAIBranding: boolean;
  enableAIAssistant: boolean;
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModels | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [textModel, setTextModel] = useState('');
  const [visionModel, setVisionModel] = useState('');
  const [codeModel, setCodeModel] = useState('');
  const [enableBranding, setEnableBranding] = useState(true);
  const [enableAssistant, setEnableAssistant] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Fetch available models
      const modelsRes = await fetch('/api/settings/ai/models');
      if (!modelsRes.ok) throw new Error('Failed to load available models');
      const modelsData = await modelsRes.json();
      setAvailableModels(modelsData);

      // Fetch current settings
      const settingsRes = await fetch('/api/settings/ai', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!settingsRes.ok) throw new Error('Failed to load AI settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // Populate form
      setApiKey(settingsData.openrouterApiKey || '');
      setTextModel(settingsData.models?.text || '');
      setVisionModel(settingsData.models?.vision || '');
      setCodeModel(settingsData.models?.code || '');
      setEnableBranding(settingsData.enableAIBranding ?? true);
      setEnableAssistant(settingsData.enableAIAssistant ?? false);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    setError('');

    try {
      const token = localStorage.getItem('token');

      const payload = {
        openrouterApiKey: apiKey || null,
        models: {
          textModel,
          visionModel,
          codeModel,
        },
        enableAIBranding: enableBranding,
        enableAIAssistant: enableAssistant,
      };

      const res = await fetch('/api/settings/ai', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      const updatedSettings = await res.json();
      setSettings(updatedSettings);
      setSaveStatus('success');

      // Hide success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);

    } catch (err: any) {
      setError(err.message);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const getAllModels = (type: 'text' | 'vision' | 'code'): AIModel[] => {
    if (!availableModels) return [];
    return [
      ...availableModels.free[type],
      ...availableModels.paid[type],
    ];
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Ustawienia AI"
          description="Konfiguracja modeli AI i funkcji asystenta"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Ustawienia AI"
        description="Konfiguracja modeli AI i funkcji asystenta"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Key Section */}
        <GlassCard>
          <GlassCardTitle>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Klucz API OpenRouter
            </div>
          </GlassCardTitle>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="text-sm text-gray-500 mt-2">
              Opcjonalnie możesz użyć własnego klucza API z{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenRouter.ai
              </a>
              . Pozostaw puste aby używać domyślnego klucza platformy.
            </p>
          </div>
        </GlassCard>

        {/* AI Models Section */}
        <GlassCard>
          <GlassCardTitle>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Modele AI
            </div>
          </GlassCardTitle>

          <div className="mt-4 space-y-6">
            {/* Text Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model tekstowy
              </label>
              <select
                value={textModel}
                onChange={(e) => setTextModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Wybierz model</option>
                <optgroup label="🆓 Darmowe modele">
                  {availableModels?.free.text.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💎 Płatne modele">
                  {availableModels?.paid.text.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider}) - {model.cost}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Model używany do generowania tekstów, opisów produktów, odpowiedzi na pytania
              </p>
            </div>

            {/* Vision Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model wizyjny
              </label>
              <select
                value={visionModel}
                onChange={(e) => setVisionModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Wybierz model</option>
                <optgroup label="🆓 Darmowe modele">
                  {availableModels?.free.vision.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💎 Płatne modele">
                  {availableModels?.paid.vision.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider}) - {model.cost}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Model do analizy obrazów, zdjęć produktów, rozpoznawania logo
              </p>
            </div>

            {/* Code Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model kodowy
              </label>
              <select
                value={codeModel}
                onChange={(e) => setCodeModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Wybierz model</option>
                <optgroup label="🆓 Darmowe modele">
                  {availableModels?.free.code.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💎 Płatne modele">
                  {availableModels?.paid.code.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider}) - {model.cost}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Model specjalizujący się w analizie i generowaniu kodu
              </p>
            </div>
          </div>
        </GlassCard>

        {/* AI Features Section */}
        <GlassCard>
          <GlassCardTitle>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Funkcje AI
            </div>
          </GlassCardTitle>

          <div className="mt-4 space-y-4">
            {/* AI Branding Toggle */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Automatyczny branding</p>
                <p className="text-sm text-gray-500">
                  Automatyczne wykrywanie kolorów i logo z witryny firmowej
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableBranding}
                  onChange={(e) => setEnableBranding(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* AI Assistant Toggle */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Asystent AI</p>
                <p className="text-sm text-gray-500">
                  Inteligentny asystent do pomocy w zarządzaniu zamówieniami i klientami
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableAssistant}
                  onChange={(e) => setEnableAssistant(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              'Zapisz ustawienia'
            )}
          </button>

          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Zapisano pomyślnie!</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">{error || 'Błąd zapisu'}</span>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">💡 Wskazówka</p>
              <p>
                Modele darmowe są idealne do testów i małych projektów.
                Dla produkcyjnych aplikacji z dużym ruchem rekomendujemy modele płatne,
                które oferują lepszą jakość i większe limity API.
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
