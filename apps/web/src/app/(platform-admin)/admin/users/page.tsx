'use client';

import { useEffect, useState } from 'react';
import { Shield, Plus, Pencil, Trash2, Key, Loader2, AlertCircle } from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api';

interface Admin {
  id: string;
  email: string;
  name: string | null;
  role: string;
  active: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [changingPasswordAdmin, setChangingPasswordAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Admin[]>('/api/admin/admins');
      setAdmins(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
      if (err instanceof ApiError) {
        setError(`Error ${err.status}: ${err.data?.message || err.statusText}`);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch admins');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`Czy na pewno chcesz usunąć admina ${admin.email}?`)) {
      return;
    }

    try {
      await apiDelete(`/api/admin/admins/${admin.id}`);
      fetchAdmins();
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.data?.message || `Error ${err.status}: ${err.statusText}`);
      } else {
        alert(err instanceof Error ? err.message : 'Failed to delete admin');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Admins</h1>
          <p className="text-gray-600 mt-1">Zarządzaj administratorami platformy</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Dodaj admina
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Nazwa</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ostatnie logowanie</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Data utworzenia</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Brak administratorów
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{admin.email}</div>
                        <div className="text-sm text-gray-500">{admin.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {admin.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {admin.lastLogin
                      ? new Date(admin.lastLogin).toLocaleDateString('pl-PL')
                      : 'Nigdy'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(admin.createdAt).toLocaleDateString('pl-PL')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingAdmin(admin)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edytuj"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChangingPasswordAdmin(admin)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Zmień hasło"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Usuń"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAdmins();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingAdmin && (
        <EditAdminModal
          admin={editingAdmin}
          onClose={() => setEditingAdmin(null)}
          onSuccess={() => {
            setEditingAdmin(null);
            fetchAdmins();
          }}
        />
      )}

      {/* Change Password Modal */}
      {changingPasswordAdmin && (
        <ChangePasswordModal
          admin={changingPasswordAdmin}
          onClose={() => setChangingPasswordAdmin(null)}
          onSuccess={() => {
            setChangingPasswordAdmin(null);
          }}
        />
      )}
    </div>
  );
}

// Create Admin Modal
function CreateAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiPost('/api/admin/admins', formData);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || `Error ${err.status}: ${err.statusText}`);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dodaj nowego admina</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 znaków</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Tworzenie...' : 'Utwórz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Admin Modal
function EditAdminModal({ admin, onClose, onSuccess }: { admin: Admin; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ email: admin.email, name: admin.name || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiPut(`/api/admin/admins/${admin.id}`, formData);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || `Error ${err.status}: ${err.statusText}`);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Edytuj admina</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Change Password Modal
function ChangePasswordModal({ admin, onClose, onSuccess }: { admin: Admin; onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiPut(`/api/admin/admins/${admin.id}/password`, { newPassword: password });
      alert('Hasło zostało zmienione!');
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.data?.message || `Error ${err.status}: ${err.statusText}`);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Zmień hasło</h2>
        <p className="text-sm text-gray-600 mb-4">
          Zmieniasz hasło dla: <strong>{admin.email}</strong>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nowe hasło</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 znaków</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Zmiana...' : 'Zmień hasło'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
