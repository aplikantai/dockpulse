'use client';

import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Package,
} from 'lucide-react';

interface DashboardStats {
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
  users: {
    total: number;
    active: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
  };
  modules: {
    code: string;
    name: string;
    installations: number;
  }[];
  recentTenants: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    plan: string;
  }[];
  issues: {
    suspendedTenants: number;
    failedPayments: number;
    expiredTrials: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white/50 rounded-2xl skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/50 rounded-2xl skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white/50 rounded-2xl skeleton" />
          <div className="h-96 bg-white/50 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <GlassCard className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">Błąd wczytywania danych</div>
        <p className="text-gray-600 mb-4">{error || 'Brak danych'}</p>
        <button
          onClick={fetchDashboardStats}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Spróbuj ponownie
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Platformy</h1>
        <p className="text-gray-600 mt-2">
          Przegląd statystyk i aktywności DockPulse
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tenants */}
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tenanci</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.tenants.total}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats.tenants.active} aktywnych
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        {/* Total Users */}
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Użytkownicy</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.users.total}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stats.users.active} aktywnych
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        {/* MRR */}
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">MRR</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.mrr)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.revenue.growth}% vs. poprz. miesiąc
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        {/* ARR */}
        <GlassCard className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">ARR</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.arr)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Roczny przychód</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Issues Alert */}
      {(stats.issues.suspendedTenants > 0 ||
        stats.issues.failedPayments > 0 ||
        stats.issues.expiredTrials > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">
                Wymagana uwaga admina
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {stats.issues.suspendedTenants > 0 && (
                  <li>
                    • {stats.issues.suspendedTenants} zawieszonych tenantów
                  </li>
                )}
                {stats.issues.failedPayments > 0 && (
                  <li>• {stats.issues.failedPayments} nieudanych płatności</li>
                )}
                {stats.issues.expiredTrials > 0 && (
                  <li>• {stats.issues.expiredTrials} wygasłych trial periods</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Modules */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Najpopularniejsze moduły
            </h2>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.modules.slice(0, 5).map((module, index) => (
              <div
                key={module.code}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{module.name}</h3>
                    <p className="text-xs text-gray-500">{module.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {module.installations}
                  </p>
                  <p className="text-xs text-gray-500">instalacji</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent Tenants */}
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Ostatnio dodani tenanci
            </h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats.recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
                onClick={() =>
                  (window.location.href = `/admin/tenants/${tenant.id}`)
                }
              >
                <div>
                  <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                  <p className="text-xs text-gray-500">
                    {tenant.slug}.dockpulse.com
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {tenant.plan}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(tenant.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Tenant Status Breakdown */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Rozkład statusów tenantów
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Aktywni
              </span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {stats.tenants.active}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Trial</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {stats.tenants.trial}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Zawieszeni
              </span>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {stats.tenants.suspended}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                Razem
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.tenants.total}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
