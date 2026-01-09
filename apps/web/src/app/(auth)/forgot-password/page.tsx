'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email wysłany!</h1>
            <p className="text-gray-600">
              Jeśli konto z adresem <strong>{email}</strong> istnieje, wysłaliśmy na nie
              link do resetowania hasła.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Link jest ważny przez 1 godzinę.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold text-center hover:bg-indigo-700 transition-all"
          >
            Wróć do logowania
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
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Wróć do logowania
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Zapomniałeś hasła?</h1>
          <p className="text-gray-600 mt-2">
            Podaj swój adres email, a wyślemy Ci link do resetowania hasła
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                placeholder="jan@firma.pl"
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 px-6 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/25 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              'Wyślij link resetujący'
            )}
          </motion.button>
        </form>
      </div>

      {/* Bottom text */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Pamiętasz hasło?{' '}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Zaloguj się
        </Link>
      </p>
    </motion.div>
  );
}
