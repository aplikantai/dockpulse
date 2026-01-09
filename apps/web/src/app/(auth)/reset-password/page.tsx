'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Brak tokenu resetowania hasła. Link może być nieprawidłowy.');
    }
  }, [token]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return 'Hasło musi mieć co najmniej 8 znaków';
    }
    return '';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setValidationError(validatePassword(newPassword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Brak tokenu resetowania hasła');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    const validation = validatePassword(password);
    if (validation) {
      setError(validation);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Wystąpił błąd');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl border border-white/30 shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hasło zmienione!</h1>
            <p className="text-gray-600">
              Twoje hasło zostało pomyślnie zmienione. Możesz się teraz zalogować używając nowego hasła.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-center hover:bg-indigo-700 transition-all"
          >
            Przejdź do logowania
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="backdrop-blur-xl bg-white/70 rounded-3xl border border-white/30 shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Ustaw nowe hasło</h1>
          <p className="text-gray-600 mt-2">
            Wprowadź nowe hasło do swojego konta
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nowe hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder="••••••••"
                required
                disabled={!token}
              />
            </div>
            {validationError && (
              <p className="text-xs text-red-600 mt-1">{validationError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Minimum 8 znaków</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Potwierdź hasło
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder="••••••••"
                required
                disabled={!token}
              />
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Hasła nie są identyczne</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isLoading || !token || !!validationError}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetowanie...
              </>
            ) : (
              'Ustaw nowe hasło'
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Pamiętasz hasło?{' '}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl border border-white/30 shadow-2xl p-8">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
