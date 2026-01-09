'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  type User,
  type UpdateUserDto,
  type ChangePasswordDto,
} from '@/lib/api/users';
import { Save, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, User as UserIcon } from 'lucide-react';

const roleLabels: Record<string, string> = {
  OWNER: 'Właściciel',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  EMPLOYEE: 'Pracownik',
  VIEWER: 'Podgląd',
  PLATFORM_ADMIN: 'Super Admin',
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateUserDto>({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    name: '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState<ChangePasswordDto>({
    oldPassword: '',
    newPassword: '',
  });
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

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
      const userData = await getCurrentUser();
      setUser(userData);
      setFormData({
        email: userData.email,
        phone: userData.phone || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        name: userData.name,
        avatar: userData.avatar || '',
      });
    } catch (err: any) {
      setError(err.message || 'Nie udało się załadować profilu');
    } finally {
      setLoading(false);
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
      };

      await updateCurrentUser(dto);
      setSuccess('Profil został zaktualizowany');
      await loadUser();
    } catch (err: any) {
      setError(err.message || 'Nie udało się zaktualizować profilu');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setError('Podaj stare i nowe hasło');
      return;
    }

    if (passwordData.newPassword !== passwordConfirm) {
      setError('Nowe hasła nie są identyczne');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Nowe hasło musi mieć minimum 8 znaków');
      return;
    }

    setChangingPassword(true);

    try {
      await changePassword(passwordData);
      setSuccess('Hasło zostało zmienione');
      setPasswordData({ oldPassword: '', newPassword: '' });
      setPasswordConfirm('');
    } catch (err: any) {
      setError(err.message || 'Nie udało się zmienić hasła');
    } finally {
      setChangingPassword(false);
    }
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
        <p className="text-red-600">Nie udało się załadować profilu</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Mój profil"
        description="Zarządzaj swoimi danymi osobowymi i ustawieniami konta"
      />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 flex items-start gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Account Overview */}
      <GlassCard className="mb-6">
        <div className="flex items-start gap-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-primary" />
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-gray-600 mt-1">{user.email}</p>

            <div className="flex items-center gap-4 mt-4">
              <div>
                <span className="text-sm text-gray-500">Rola:</span>{' '}
                <span className="font-medium text-gray-900">
                  {user.customRole || roleLabels[user.role] || user.role}
                </span>
              </div>

              {user.lastLogin && (
                <div>
                  <span className="text-sm text-gray-500">Ostatnie logowanie:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {new Date(user.lastLogin).toLocaleString('pl-PL')}
                  </span>
                </div>
              )}
            </div>

            {user.mustChangePw && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Wymagana zmiana hasła przy następnym logowaniu
                </p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Basic Info Form */}
      <form onSubmit={handleSubmit}>
        <GlassCard className="mb-6">
          <GlassCardTitle>Dane osobowe</GlassCardTitle>
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
              <p className="mt-1 text-xs text-gray-500">
                Automatycznie generowana z imienia i nazwiska
              </p>
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

          <div className="mt-6">
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
          </div>
        </GlassCard>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handlePasswordChange}>
        <GlassCard>
          <GlassCardTitle>Zmiana hasła</GlassCardTitle>
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obecne hasło <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nowe hasło <span className="text-red-500">*</span>
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 znaków</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potwierdź nowe hasło <span className="text-red-500">*</span>
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Zmiana hasła...
                </>
              ) : (
                'Zmień hasło'
              )}
            </button>
          </div>
        </GlassCard>
      </form>

      {/* Permissions (read-only) */}
      {user.permissions && user.permissions.length > 0 && (
        <GlassCard className="mt-6">
          <GlassCardTitle>Moje uprawnienia</GlassCardTitle>
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
    </>
  );
}
