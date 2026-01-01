'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';

interface Module {
  code: string;
  name: string;
  description: string;
  version: string;
  category: string;
  installCount: number;
  icon?: string;
  features?: string[];
  dependencies?: string[];
}

const categories = [
  'All',
  'Operations',
  'Finance',
  'Vessels',
  'Port Services',
  'Analytics',
];

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3003/api/admin/modules');

      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      const data = await response.json();
      setModules(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter((module) => {
    const matchesSearch =
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Operations: '⚙️',
      Finance: '💰',
      Vessels: '🚢',
      'Port Services': '⚓',
      Analytics: '📊',
      All: '🧩',
    };
    return icons[category] || '📦';
  };

  const getModuleIcon = (code: string) => {
    const icons: Record<string, string> = {
      berth_management: '⚓',
      vessel_tracking: '🚢',
      cargo_management: '📦',
      billing: '💰',
      analytics: '📊',
      maintenance: '🔧',
      security: '🔒',
      notifications: '🔔',
    };
    return icons[code] || '🧩';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white/50 rounded-2xl skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-white/50 rounded-2xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <GlassCard className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">Error Loading Modules</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchModules}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Module Catalog</h1>
        <p className="text-gray-600 mt-2">
          Browse and manage available modules for your tenants
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all
              ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            <span className="mr-2">{getCategoryIcon(category)}</span>
            {category}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Total Modules</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {modules.length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Categories</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {new Set(modules.map((m) => m.category)).size}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Total Installations</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {modules.reduce((sum, m) => sum + (m.installCount || 0), 0)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-600">Showing</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {filteredModules.length}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.length > 0 ? (
          filteredModules.map((module) => (
            <GlassCard
              key={module.code}
              className="relative group cursor-pointer"
              onClick={() => setSelectedModule(module)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{getModuleIcon(module.code)}</div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    v{module.version}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                    {module.category}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {module.name}
              </h3>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {module.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>📥</span>
                  <span>{module.installCount || 0} installations</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium group-hover:underline">
                  View Details →
                </button>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            No modules match your filters
          </div>
        )}
      </div>

      {/* Module Detail Modal */}
      {selectedModule && (
        <ModuleDetailModal
          module={selectedModule}
          onClose={() => setSelectedModule(null)}
        />
      )}
    </div>
  );
}

// Module Detail Modal Component
function ModuleDetailModal({
  module,
  onClose,
}: {
  module: Module;
  onClose: () => void;
}) {
  const getModuleIcon = (code: string) => {
    const icons: Record<string, string> = {
      berth_management: '⚓',
      vessel_tracking: '🚢',
      cargo_management: '📦',
      billing: '💰',
      analytics: '📊',
      maintenance: '🔧',
      security: '🔒',
      notifications: '🔔',
    };
    return icons[code] || '🧩';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getModuleIcon(module.code)}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {module.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {module.code} · v{module.version}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Description
            </h3>
            <p className="text-gray-700">{module.description}</p>
          </div>

          {/* Category & Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Category</div>
              <div className="font-semibold text-gray-900">{module.category}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Installations</div>
              <div className="font-semibold text-gray-900">
                {module.installCount || 0} tenants
              </div>
            </div>
          </div>

          {/* Features */}
          {module.features && module.features.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Features
              </h3>
              <ul className="space-y-2">
                {module.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {module.dependencies && module.dependencies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Dependencies
              </h3>
              <div className="flex flex-wrap gap-2">
                {module.dependencies.map((dep, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Technical Details
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Module Code:</span>
                <span className="text-gray-900 font-semibold">
                  {module.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="text-gray-900 font-semibold">
                  {module.version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="text-gray-900 font-semibold">
                  {module.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
            >
              Close
            </button>
            <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium">
              Install to Tenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
