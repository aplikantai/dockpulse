'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import {
  getUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  unlockUser,
  type User,
  type UserRole,
  type UpdateUserDto,
  getPermissionsByModule,
  type PermissionsByModule,
} from '@/lib/api/users';
import { ArrowLeft, Save, Loader2, Trash2, Lock, Unlock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'OWNER', label: 'Właściciel', description: 'Pełne uprawnienia w tenantcie' },
  { value: 'ADMIN', label: 'Administrator', description: 'Zarządza systemem i użytkownikami' },
  { value: 'MANAGER', label: 'Manager', description: 'Zarządza zespołem i projektami' },
  { value: 'EMPLOYEE', label: 'Pracownik', description: 'Podstawowe uprawnienia operacyjne' },
  { value: 'VIEWER', label: 'Podgląd', description: 'Tylko odczyt danych' },
];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [formData, setFormData] = useState<UpdateUserDto>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    name: '',
    avatar: '',
    role: 'EMPLOYEE',
    permissions: [],
    customRole: '',
    mustChangePw: false,
    active: true,
  });

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
      loadPermissions();
    }
  }, [userId]);

  // Auto-generate name from firstName + lastName
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const generatedName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');
      if (generatedName && generatedName !== user?.name) {
        setFormData((prev) => ({ ...prev, name: generatedName }));
      }
    }
  }, [formData.firstName, formData.lastName, user?.name]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUser(userId);
      setUser(userData);
      setFormData({
        email: userData.email,
        phone: userData.phone || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        name: userData.name,
        avatar: userData.avatar || '',
        role: userData.role,
        permissions: userData.permissions,
        customRole: userData.customRole || '',
        mustChangePw: userData.mustChangePw,
        active: userData.active,
      });
    } catch (err: any) {
      setError(err.message || 'Nie udało się załadować użytkownika');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const perms = await getPermissionsByModule();
      setPermissionsByModule(perms);
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.email || !formData.name) {
      setError('Email i nazwa są wymagane');
      return;
    }

    setSaving(true);

    try {
      const dto: UpdateUserDto = {
        ...formData,
        phone: formData.phone || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        avatar: formData.avatar || undefined,
        customRole: formData.customRole || undefined,
      };

      await updateUser(userId, dto);
      setSuccess('Użytkownik został zaktualizowany');
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Nie udało się zaktualizować użytkownika');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Hasło musi mieć minimum 8 znaków');
      return;
    }

    setResetPasswordLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetUserPassword(userId, {
        newPassword,
        mustChangePw: true,
      });
      setSuccess('Hasło zostało zresetowane');
      setShowResetPassword(false);
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się zresetować hasła');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleUnlock = async () => {
    setError(null);
    setSuccess(null);

    try {
      await unlockUser(userId);
      setSuccess('Konto zostało odblokowane');
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Nie udało się odblokować konta');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    setError(null);

    try {
      await deleteUser(userId);
      router.push('/settings/users');
    } catch (err: any) {
      setError(err.message || 'Nie udało się usunąć użytkownika');
      setDeleteLoading(false);
    }
  };

  const handlePermissionToggle = (permissionKey: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions || [];
      if (permissions.includes(permissionKey)) {
        return { ...prev, permissions: permissions.filter((p) => p !== permissionKey) };
      } else {
        return { ...prev, permissions: [...permissions, permissionKey] };
      }
    });
  };

  const handleModuleToggle = (module: string) => {
    const modulePermissions = permissionsByModule[module]?.map((p) => p.key) || [];
    const allSelected = modulePermissions.every((p) => formData.permissions?.includes(p));

    setFormData((prev) => {
      const currentPermissions = prev.permissions || [];
      if (allSelected) {
        return {
          ...prev,
          permissions: currentPermissions.filter((p) => !modulePermissions.includes(p)),
        };
      } else {
        const newPermissions = [...currentPermissions];
        modulePermissions.forEach((p) => {
          if (!newPermissions.includes(p)) {
            newPermissions.push(p);
          }
        });
        return { ...prev, permissions: newPermissions };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Nie znaleziono użytkownika</p>
      </div>
    );
  }

  const isLocked = user.lockedUntil && new Date(user.lockedUntil) > new Date();

  return (
    <>
      <PageHeader
        title={`Edycja: ${user.name}`}
        description={user.email}
        actions={
          <Link
            href="/settings/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót
          </Link>
        }
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600">
          {success}
        </div>
      )}

      {/* Account Status */}
      {(isLocked || user.failedLogins > 0 || !user.active) && (
        <GlassCard className="mb-6">
          <GlassCardTitle>Status konta</GlassCardTitle>
          <div className="mt-4 space-y-3">
            {!user.active && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Konto nieaktywne</p>
                  <p className="text-sm text-red-600">Użytkownik nie może się zalogować</p>
                </div>
              </div>
            )}

            {isLocked && (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">Konto zablokowane</p>
                  <p className="text-sm text-orange-600">
                    Odblokowanie: {new Date(user.lockedUntil!).toLocaleString('pl-PL')}
                  </p>
                </div>
                <button
                  onClick={handleUnlock}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Unlock className="w-4 h-4" />
                  Odblokuj
                </button>
              </div>
            )}

            {user.failedLogins > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Nieudane próby logowania: <strong>{user.failedLogins}</strong> / 5
                </p>
              </div>
            )}

            {user.lastLogin && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Ostatnie logowanie: <strong>{new Date(user.lastLogin).toLocaleString('pl-PL')}</strong>
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <GlassCard className="mb-6">
          <GlassCardTitle>Podstawowe dane</GlassCardTitle>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imię
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwisko
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa wyświetlana <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL avatara
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
        </GlassCard>

        {/* Password Management */}
        <GlassCard className="mb-6">
          <GlassCardTitle>Zarządzanie hasłem</GlassCardTitle>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.mustChangePw}
                onChange={(e) => setFormData({ ...formData, mustChangePw: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Wymuś zmianę hasła przy następnym logowaniu</span>
            </label>
          </div>

          <div className="mt-6">
            {!showResetPassword ? (
              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Lock className="w-4 h-4" />
                Resetuj hasło
              </button>
            ) : (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nowe hasło
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Minimum 8 znaków"
                    minLength={8}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetPasswordLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {resetPasswordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetowanie...
                      </>
                    ) : (
                      'Ustaw nowe hasło'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false);
                      setNewPassword('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Role & Permissions */}
        <GlassCard className="mb-6">
          <GlassCardTitle>Rola i uprawnienia</GlassCardTitle>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rola <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={formData.role === option.value}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="mt-1 w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niestandardowa nazwa roli
            </label>
            <input
              type="text"
              value={formData.customRole}
              onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="np. 'Senior Manager', 'Team Lead'"
            />
          </div>

          {/* Permissions */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Dodatkowe uprawnienia
            </h3>
            {loadingPermissions ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Ładowanie uprawnień...
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(permissionsByModule).map(([module, permissions]) => {
                  const allSelected = permissions.every((p) => formData.permissions?.includes(p.key));
                  const someSelected = permissions.some((p) => formData.permissions?.includes(p.key));

                  return (
                    <div key={module} className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center gap-2 mb-3 font-medium text-gray-900">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => handleModuleToggle(module)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          style={{ opacity: someSelected && !allSelected ? 0.5 : 1 }}
                        />
                        {module.toUpperCase()}
                      </label>
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permissions.map((permission) => (
                          <label key={permission.key} className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={formData.permissions?.includes(permission.key)}
                              onChange={() => handlePermissionToggle(permission.key)}
                              className="mt-0.5 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">{permission.description}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Status */}
        <GlassCard className="mb-6">
          <GlassCardTitle>Status</GlassCardTitle>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Konto aktywne</span>
            </label>
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Zapisz zmiany
                </>
              )}
            </button>

            <Link
              href="/settings/users"
              className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </Link>
          </div>

          <div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Usuń użytkownika
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Potwierdź usunięcie:</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Usuwanie...' : 'Tak, usuń'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
