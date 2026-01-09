'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui/GlassCard';
import { getUsers, type User, type UserRole } from '@/lib/api/users';
import { UserPlus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

const roleColors: Record<UserRole, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  EMPLOYEE: 'bg-gray-100 text-gray-700',
  VIEWER: 'bg-yellow-100 text-yellow-700',
  PLATFORM_ADMIN: 'bg-red-100 text-red-700',
};

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Właściciel',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  EMPLOYEE: 'Pracownik',
  VIEWER: 'Podgląd',
  PLATFORM_ADMIN: 'Super Admin',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [activeFilter, setActiveFilter] = useState<boolean | 'ALL'>('ALL');

  useEffect(() => {
    loadUsers();
  }, [roleFilter, activeFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters: any = {};
      if (roleFilter !== 'ALL') filters.role = roleFilter;
      if (activeFilter !== 'ALL') filters.active = activeFilter;

      const response = await getUsers(filters);
      setUsers(response.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.includes(searchQuery))
    );
  });

  return (
    <>
      <PageHeader
        title="Użytkownicy"
        description="Zarządzaj użytkownikami i ich uprawnieniami"
        actions={
          <Link
            href="/settings/users/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Dodaj użytkownika
          </Link>
        }
      />

      <GlassCard>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Szukaj użytkownika..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Wszystkie role</option>
              <option value="OWNER">Właściciel</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Pracownik</option>
              <option value="VIEWER">Podgląd</option>
            </select>

            <select
              value={activeFilter === 'ALL' ? 'ALL' : activeFilter ? 'true' : 'false'}
              onChange={(e) =>
                setActiveFilter(
                  e.target.value === 'ALL'
                    ? 'ALL'
                    : e.target.value === 'true'
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">Wszystkie</option>
              <option value="true">Aktywni</option>
              <option value="false">Nieaktywni</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Ładowanie...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Brak użytkowników spełniających kryteria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Użytkownik
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Rola
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Ostatnie logowanie
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{user.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          roleColors[user.role]
                        }`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.active ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          Aktywny
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                          Nieaktywny
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-sm">
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleString('pl-PL')
                        : 'Nigdy'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/settings/users/${user.id}`}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        Edytuj
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Łącznie użytkowników: <strong className="text-gray-900">{users.length}</strong>
            </div>
            <div>
              Wyświetlono: <strong className="text-gray-900">{filteredUsers.length}</strong>
            </div>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
