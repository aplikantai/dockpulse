'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout';
import { GlassCard, GlassCardTitle } from '@/components/ui/GlassCard';
import { createUser, type UserRole, type CreateUserDto, getPermissionsByModule, type PermissionsByModule } from '@/lib/api/users';
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'OWNER', label: 'Właściciel', description: 'Pełne uprawnienia w tenantcie' },
  { value: 'ADMIN', label: 'Administrator', description: 'Zarządza systemem i użytkownikami' },
  { value: 'MANAGER', label: 'Manager', description: 'Zarządza zespołem i projektami' },
  { value: 'EMPLOYEE', label: 'Pracownik', description: 'Podstawowe uprawnienia operacyjne' },
  { value: 'VIEWER', label: 'Podgląd', description: 'Tylko odczyt danych' },
];

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    phone: '',
    password: '',
    firstName: '',
    lastName: '',
    name: '',
    avatar: '',
    role: 'EMPLOYEE',
    permissions: [],
    customRole: '',
    mustChangePw: true,
    active: true,
  });

  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    loadPermissions();
  }, []);

  // Auto-generate name from firstName + lastName
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const generatedName = [formData.firstName, formData.lastName].filter(Boolean).join(' ');
      if (generatedName) {
        setFormData((prev) => ({ ...prev, name: generatedName }));
      }
    }
  }, [formData.firstName, formData.lastName]);

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

    // Validation
    if (!formData.email || !formData.password || !formData.name) {
      setError('Email, hasło i nazwa są wymagane');
      return;
    }

    if (formData.password !== passwordConfirm) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (formData.password.length < 8) {
      setError('Hasło musi mieć minimum 8 znaków');
      return;
    }

    setLoading(true);

    try {
      // Clean up empty optional fields
      const dto: CreateUserDto = {
        ...formData,
        phone: formData.phone || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        avatar: formData.avatar || undefined,
        customRole: formData.customRole || undefined,
      };

      await createUser(dto);
      router.push('/settings/users');
    } catch (err: any) {
      setError(err.message || 'Nie udało się utworzyć użytkownika');
    } finally {
      setLoading(false);
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
        // Deselect all module permissions
        return {
          ...prev,
          permissions: currentPermissions.filter((p) => !modulePermissions.includes(p)),
        };
      } else {
        // Select all module permissions
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

  return (
    <>
      <PageHeader
        title="Nowy użytkownik"
        description="Utwórz nowe konto użytkownika"
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

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

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
                placeholder="Automatycznie generowana z imienia i nazwiska"
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

        {/* Password */}
        <GlassCard className="mb-6">
          <GlassCardTitle>Hasło</GlassCardTitle>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasło <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 8 znaków</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potwierdź hasło <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.mustChangePw}
                onChange={(e) => setFormData({ ...formData, mustChangePw: e.target.checked })}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">Wymuś zmianę hasła przy pierwszym logowaniu</span>
            </label>
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
              Dodatkowe uprawnienia (opcjonalne)
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
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Tworzenie...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Utwórz użytkownika
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
      </form>
    </>
  );
}
