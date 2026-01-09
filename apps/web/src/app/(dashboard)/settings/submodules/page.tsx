/**
 * Submodules Management Page
 *
 * Page for tenant admins to manage enabled submodules
 */

'use client';

import { useState } from 'react';
import { useSubmodules } from '@/lib/hooks/useSubmodules';
import { SubmoduleGate, UpgradePrompt } from '@/components/SubmoduleGate';
import { SubmoduleDefinition } from '@/lib/api/submodules';

export default function SubmodulesPage() {
  const {
    catalog,
    enabled,
    enable,
    disable,
    isLoading,
    isEnabled,
    allSubmodules,
    enabledSubmodules,
  } = useSubmodules();

  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Group submodules by parent module
  const moduleGroups = allSubmodules.reduce((acc, submodule) => {
    if (!acc[submodule.parentModule]) {
      acc[submodule.parentModule] = [];
    }
    acc[submodule.parentModule].push(submodule);
    return acc;
  }, {} as Record<string, SubmoduleDefinition[]>);

  // Filter submodules
  const filteredSubmodules = allSubmodules.filter((sm) => {
    const matchesSearch =
      sm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sm.namePl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sm.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule =
      selectedModule === 'ALL' || sm.parentModule === selectedModule;

    return matchesSearch && matchesModule;
  });

  const handleToggle = async (submodule: SubmoduleDefinition) => {
    if (isEnabled(submodule.code)) {
      await disable.mutateAsync(submodule.code);
    } else {
      await enable.mutateAsync(submodule.code);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Podmoduły</h1>
        <p className="text-gray-600 mt-2">
          Zarządzaj dodatkowymi funkcjami i rozszerzeniami systemu
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Dostępne podmoduły</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {allSubmodules.length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Włączone</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {Array.isArray(enabledSubmodules) ? enabledSubmodules.length : 0}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Dodatki płatne</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {allSubmodules.filter((sm) => sm.category === 'ADDON').length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Moduły</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {Object.keys(moduleGroups).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Szukaj podmodułów..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Wszystkie moduły</option>
          {Object.keys(moduleGroups).map((module) => (
            <option key={module} value={module}>
              {module} ({moduleGroups[module].length})
            </option>
          ))}
        </select>
      </div>

      {/* Submodules List */}
      <div className="space-y-6">
        {Object.entries(moduleGroups).map(([moduleName, submodules]) => {
          if (selectedModule !== 'ALL' && selectedModule !== moduleName) {
            return null;
          }

          const filteredSubsForModule = submodules.filter((sm) =>
            filteredSubmodules.includes(sm)
          );

          if (filteredSubsForModule.length === 0) {
            return null;
          }

          return (
            <div key={moduleName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{moduleName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredSubsForModule.length} podmodułów
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredSubsForModule.map((submodule) => (
                  <SubmoduleCard
                    key={submodule.code}
                    submodule={submodule}
                    isEnabled={isEnabled(submodule.code)}
                    onToggle={() => handleToggle(submodule)}
                    isLoading={enable.isPending || disable.isPending}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filteredSubmodules.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Brak podmodułów pasujących do wybranych filtrów
        </div>
      )}

      {/* Demo: SubmoduleGate usage */}
      <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Demo: SubmoduleGate Component
        </h3>

        <SubmoduleGate
          require="CRM.SEGMENTS"
          fallback={
            <UpgradePrompt
              submodule="CRM.SEGMENTS"
              title="Segmentacja klientów"
              description="Ta funkcja wymaga modułu Segmentacja"
              price={79}
              features={[
                'Zaawansowana segmentacja',
                'Własne reguły',
                'Auto-tagowanie',
                'Eksport segmentów',
              ]}
            />
          }
        >
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            ✅ CRM.SEGMENTS jest włączony! Ta zawartość jest widoczna.
          </div>
        </SubmoduleGate>
      </div>
    </div>
  );
}

// Submodule Card Component
function SubmoduleCard({
  submodule,
  isEnabled,
  onToggle,
  isLoading,
}: {
  submodule: SubmoduleDefinition;
  isEnabled: boolean;
  onToggle: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {submodule.namePl}
            </h3>
            {submodule.category === 'ADDON' && submodule.price && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {submodule.price} PLN/msc
              </span>
            )}
            {submodule.category === 'INCLUDED' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                W cenie
              </span>
            )}
            {submodule.isBeta && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                BETA
              </span>
            )}
            {submodule.defaultEnabled && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                Domyślny
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3">{submodule.descriptionPl}</p>

          {submodule.features.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {submodule.features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
              {submodule.features.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{submodule.features.length - 3} więcej
                </span>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            <code className="bg-gray-100 px-2 py-0.5 rounded">{submodule.code}</code>
          </div>
        </div>

        <div className="ml-4">
          <button
            onClick={onToggle}
            disabled={isLoading || submodule.defaultEnabled}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors
              ${isEnabled ? 'bg-blue-600' : 'bg-gray-200'}
              ${isLoading || submodule.defaultEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          {submodule.defaultEnabled && (
            <p className="text-xs text-gray-500 mt-1">Zawsze włączony</p>
          )}
        </div>
      </div>
    </div>
  );
}
