'use client';

import { useEffect, useState } from 'react';
import { platformApi } from '@/lib/api';
import type { Tenant, PlatformStats } from '@/types';
import { Building2, Users, ShoppingCart, TrendingUp, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPlan, setFilterPlan] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filterStatus, filterPlan]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, tenantsRes] = await Promise.all([
        platformApi.getStats(),
        platformApi.getTenants({ status: filterStatus, plan: filterPlan }),
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      starter: 'bg-blue-100 text-blue-700',
      business: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700',
    };
    return colors[plan] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      suspended: 'bg-red-100 text-red-700',
      deleted: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Platform Admin</h1>
            <p className="text-gray-600 mt-2">DockPulse Multi-Tenant Dashboard</p>
          </div>
          <Link href="/tenants/new" className="btn-primary">
            + Nowy Tenant
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTenants}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tenants</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeTenants}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Szukaj tenanta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Wszystkie statusy</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Wszystkie plany</option>
              <option value="free">FREE</option>
              <option value="starter">STARTER</option>
              <option value="business">BUSINESS</option>
              <option value="enterprise">ENTERPRISE</option>
            </select>
          </div>
        </div>

        {/* Tenants List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Tenants ({filteredTenants.length})</h2>

          <div className="grid gap-4">
            {filteredTenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/tenants/${tenant.id}`}
                className="glass-card p-6 hover:shadow-2xl transition-all duration-300 block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{tenant.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(tenant.status)}`}>
                        {tenant.status.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPlanColor(tenant.plan)}`}>
                        {tenant.plan.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{tenant.slug}.dockpulse.com</span>
                      {tenant.domain && <> • {tenant.domain}</>}
                    </p>

                    <div className="flex gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">Users:</span> {tenant._count?.users || 0}
                      </div>
                      <div>
                        <span className="font-semibold">Customers:</span> {tenant._count?.customers || 0}
                      </div>
                      <div>
                        <span className="font-semibold">Products:</span> {tenant._count?.products || 0}
                      </div>
                      <div>
                        <span className="font-semibold">Orders:</span> {tenant._count?.orders || 0}
                      </div>
                    </div>

                    {tenant.settings?.modules && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tenant.settings.modules.map((module) => (
                          <span key={module} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                            {module}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>{new Date(tenant.createdAt).toLocaleDateString('pl-PL')}</p>
                  </div>
                </div>
              </Link>
            ))}

            {filteredTenants.length === 0 && (
              <div className="glass-card p-12 text-center">
                <p className="text-gray-500">Brak tenantów spełniających kryteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
