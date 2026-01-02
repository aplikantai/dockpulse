'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import { Package, CheckCircle, XCircle, Loader2, DollarSign, AlertCircle } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ModuleDefinition {
  code: string;
  name: string;
  namePl: string;
  description: string;
  descriptionPl: string;
  icon: string;
  category: string;
  price: number | null;
  features: string[];
  dependencies?: string[];
}

interface TenantModule {
  code: string;
  isEnabled: boolean;
  config: any;
  definition: ModuleDefinition | null;
}

export default function ModulesSettingsPage() {
  const { tenant, refreshTenant } = useTenant();
  const [availableModules, setAvailableModules] = useState<ModuleDefinition[]>([]);
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [tenant]);

  const fetchModules = async () => {
    if (!tenant) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all available modules
      const availableRes = await fetch('/api/platform/modules/available');
      if (!availableRes.ok) throw new Error('Failed to fetch available modules');
      const availableData = await availableRes.json();

      // Fetch tenant's current modules
      const tenantRes = await fetch(`/api/platform/tenants/${tenant.slug}/modules`);
      if (!tenantRes.ok) throw new Error('Failed to fetch tenant modules');
      const tenantData = await tenantRes.json();

      setAvailableModules(availableData.modules || []);
      setTenantModules(tenantData.modules || []);
    } catch (err: any) {
      console.error('Error fetching modules:', err);
      setError(err.message || 'Nie udało się pobrać modułów');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = async (moduleCode: string, currentlyEnabled: boolean) => {
    if (!tenant) return;

    try {
      setTogglingModule(moduleCode);
      setError(null);

      const response = await fetch(`/api/platform/tenants/${tenant.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleCode,
          isEnabled: !currentlyEnabled,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Nie udało się zmienić statusu modułu');
      }

      // Refresh modules list
      await fetchModules();
      await refreshTenant();
    } catch (err: any) {
      console.error('Error toggling module:', err);
      setError(err.message || 'Wystąpił błąd podczas zmiany statusu modułu');
    } finally {
      setTogglingModule(null);
    }
  };

  const isModuleEnabled = (code: string): boolean => {
    return tenantModules.some((m) => m.code === code && m.isEnabled);
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      core: 'bg-blue-100 text-blue-700',
      addon: 'bg-green-100 text-green-700',
      premium: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-orange-100 text-orange-700',
    };
    return styles[category as keyof typeof styles] || styles.addon;
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Zarządzanie modułami"
          description="Aktywuj lub dezaktywuj moduły dla swojej firmy"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Zarządzanie modułami"
        description="Aktywuj lub dezaktywuj moduły dla swojej firmy"
      />

      {error && (
        <GlassCard className="mb-6 border-red-200 bg-red-50/50">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableModules.map((module) => {
          const enabled = isModuleEnabled(module.code);
          const isToggling = togglingModule === module.code;

          return (
            <GlassCard key={module.code} className={enabled ? 'border-green-200 bg-green-50/30' : ''}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-xl ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Package className={`w-6 h-6 ${enabled ? 'text-green-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{module.namePl}</h3>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase ${getCategoryBadge(module.category)}`}>
                        {module.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{module.descriptionPl}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleModule(module.code, enabled)}
                  disabled={isToggling}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all
                    ${enabled
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                    ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : enabled ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Aktywny
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Nieaktywny
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3 mb-4">
                {module.price !== null && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-bold">{module.price} PLN/msc</span>
                  </div>
                )}

                {module.dependencies && module.dependencies.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs font-bold text-amber-800 mb-1">Wymagane moduły:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.dependencies.map((dep) => (
                        <span key={dep} className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Funkcje:</p>
                <ul className="space-y-1">
                  {module.features.slice(0, 4).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {module.features.length > 4 && (
                    <li className="text-xs text-gray-500 italic">+ {module.features.length - 4} więcej...</li>
                  )}
                </ul>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </>
  );
}
