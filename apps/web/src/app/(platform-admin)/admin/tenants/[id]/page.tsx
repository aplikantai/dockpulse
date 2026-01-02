'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';

interface TenantDetails {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
  userCount: number;
  storageUsed: number;
  plan: string;
  adminEmail: string;
  modules: InstalledModule[];
  users: TenantUser[];
  recentEvents: RecentEvent[];
}

interface InstalledModule {
  code: string;
  name: string;
  version: string;
  enabled: boolean;
  installedAt: string;
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
}

interface RecentEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface AvailableModule {
  code: string;
  name: string;
  description: string;
  version: string;
  category: string;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [availableModules, setAvailableModules] = useState<AvailableModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
      fetchAvailableModules();
    }
  }, [tenantId]);

  const fetchTenantDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/tenants/${tenantId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tenant details');
      }

      const data = await response.json();
      setTenant(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableModules = async () => {
    try {
      const response = await fetch('/api/admin/modules');
      if (response.ok) {
        const data = await response.json();
        setAvailableModules(data);
      }
    } catch (err) {
      console.error('Failed to fetch available modules:', err);
    }
  };

  const handleInstallModule = async (moduleCode: string) => {
    if (!confirm(`Install module ${moduleCode}?`)) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/admin/tenants/${tenantId}/modules/${moduleCode}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to install module');
      }

      await fetchTenantDetails();
      alert('Module installed successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to install module');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUninstallModule = async (moduleCode: string) => {
    if (!confirm(`Uninstall module ${moduleCode}? This action cannot be undone.`))
      return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/admin/tenants/${tenantId}/modules/${moduleCode}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to uninstall module');
      }

      await fetchTenantDetails();
      alert('Module uninstalled successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to uninstall module');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleModule = async (moduleCode: string, currentState: boolean) => {
    try {
      setActionLoading(true);
      // This would be a PATCH endpoint to enable/disable
      // For now, we'll just show the action
      console.log(`Toggle module ${moduleCode} to ${!currentState}`);
      alert(`Module ${currentState ? 'disabled' : 'enabled'} (demo)`);
    } catch (err) {
      alert('Failed to toggle module');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles] || styles.inactive
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const installedModuleCodes = tenant?.modules.map((m) => m.code) || [];
  const modulesToInstall = availableModules.filter(
    (m) => !installedModuleCodes.includes(m.code)
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-white/50 rounded-2xl skeleton" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-white/50 rounded-2xl skeleton" />
          <div className="h-64 bg-white/50 rounded-2xl skeleton" />
          <div className="h-64 bg-white/50 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <GlassCard className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">Error Loading Tenant</div>
        <p className="text-gray-600 mb-4">{error || 'Tenant not found'}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push('/tenants')}
            className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Back to Tenants
          </button>
          <button
            onClick={fetchTenantDetails}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/tenants" className="hover:text-blue-600">
          Tenants
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenant.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-gray-600 mt-1">
            {tenant.subdomain}.dockpulse.com
          </p>
        </div>
        <div className="flex gap-3">
          {getStatusBadge(tenant.status)}
          <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium">
            Settings
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-gray-900">
            {tenant.userCount}
          </div>
          <div className="text-sm text-gray-600 mt-1">Users</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl mb-2">🧩</div>
          <div className="text-2xl font-bold text-gray-900">
            {tenant.modules.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Modules</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl mb-2">💾</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatStorage(tenant.storageUsed)}
          </div>
          <div className="text-sm text-gray-600 mt-1">Storage Used</div>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="text-3xl mb-2">📅</div>
          <div className="text-sm font-medium text-gray-900">
            {formatDate(tenant.createdAt).split(',')[0]}
          </div>
          <div className="text-sm text-gray-600 mt-1">Created</div>
        </GlassCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Installed Modules */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Installed Modules
            </h2>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleInstallModule(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={actionLoading || modulesToInstall.length === 0}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">+ Install Module</option>
              {modulesToInstall.map((module) => (
                <option key={module.code} value={module.code}>
                  {module.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {tenant.modules.length > 0 ? (
              tenant.modules.map((module) => (
                <div
                  key={module.code}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">
                        {module.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        v{module.version}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          module.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {module.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Installed {formatDate(module.installedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleModule(module.code, module.enabled)}
                      disabled={actionLoading}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-white transition-all disabled:opacity-50"
                    >
                      {module.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleUninstallModule(module.code)}
                      disabled={actionLoading}
                      className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      Uninstall
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                No modules installed yet
              </div>
            )}
          </div>
        </GlassCard>

        {/* Recent Events */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Recent Events
          </h2>
          <div className="space-y-4">
            {tenant.recentEvents && tenant.recentEvents.length > 0 ? (
              tenant.recentEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium">
                      {event.description}
                    </p>
                    {event.user && (
                      <p className="text-xs text-gray-500 mt-1">{event.user}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent events
              </p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Users List */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Users ({tenant.userCount})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenant.users && tenant.users.length > 0 ? (
                tenant.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
