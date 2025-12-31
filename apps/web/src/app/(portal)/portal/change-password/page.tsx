'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength checks
  const passwordChecks = {
    length: newPassword.length >= 6,
    hasNumber: /\d/.test(newPassword),
    hasLetter: /[a-zA-Z]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isPasswordValid) {
      setError('Hasło nie spełnia wymagań');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('portal_token');

      const response = await fetch('/api/portal/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd zmiany hasła');
      }

      // Update customer info (remove firstLogin flag)
      const customer = JSON.parse(localStorage.getItem('portal_customer') || '{}');
      customer.firstLogin = false;
      localStorage.setItem('portal_customer', JSON.stringify(customer));

      // Redirect to portal dashboard
      router.push('/portal');
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas zmiany hasła');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500 shadow-lg shadow-yellow-500/30 mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Zmiana hasła</h1>
          <p className="text-gray-500 mt-1">
            Przy pierwszym logowaniu musisz zmienić tymczasowe hasło
          </p>
        </div>

        {/* Form */}
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl border border-white/20 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Old password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obecne hasło (tymczasowe)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Hasło otrzymane SMS"
                  className="
                    w-full pl-12 pr-12 py-3.5 rounded-xl
                    bg-gray-50 border border-gray-200
                    focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200 outline-none
                  "
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nowe hasło
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 znaków"
                  className="
                    w-full pl-12 pr-12 py-3.5 rounded-xl
                    bg-gray-50 border border-gray-200
                    focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200 outline-none
                  "
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potwierdź nowe hasło
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Powtórz nowe hasło"
                  className="
                    w-full pl-12 pr-4 py-3.5 rounded-xl
                    bg-gray-50 border border-gray-200
                    focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200 outline-none
                  "
                  required
                />
              </div>
            </div>

            {/* Password requirements */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-700 mb-2">Wymagania hasła:</p>
              <PasswordCheck passed={passwordChecks.length} text="Minimum 6 znaków" />
              <PasswordCheck passed={passwordChecks.hasLetter} text="Zawiera literę" />
              <PasswordCheck passed={passwordChecks.hasNumber} text="Zawiera cyfrę" />
              <PasswordCheck passed={passwordChecks.match} text="Hasła są identyczne" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="
                w-full py-3.5 rounded-xl font-semibold
                bg-primary text-white
                hover:bg-primary-600 active:bg-primary-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-lg shadow-primary/25
              "
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Zmieniam hasło...
                </div>
              ) : (
                'Zmień hasło i kontynuuj'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function PasswordCheck({ passed, text }: { passed: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600' : 'text-gray-400'}`}>
      <CheckCircle2 className={`w-4 h-4 ${passed ? 'text-green-500' : 'text-gray-300'}`} />
      {text}
    </div>
  );
}
