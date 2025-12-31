'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Eye, EyeOff, Building2, ArrowRight } from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Format as Polish phone number
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Normalize phone number
      const normalizedPhone = '+48' + phone.replace(/\D/g, '');

      const response = await fetch('/api/portal/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'demo', // Will be replaced with actual tenant from subdomain
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Błąd logowania');
      }

      // Store token
      localStorage.setItem('portal_token', data.access_token);
      localStorage.setItem('portal_customer', JSON.stringify(data.customer));

      // Check if first login - redirect to change password
      if (data.customer.firstLogin) {
        router.push('/portal/change-password');
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg shadow-primary/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Klienta</h1>
          <p className="text-gray-500 mt-1">Zaloguj się do swojego konta</p>
        </div>

        {/* Login Form */}
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl border border-white/20 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Phone input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numer telefonu
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                  <Phone className="w-5 h-5" />
                  <span className="text-gray-900 font-medium">+48</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="500 123 456"
                  className="
                    w-full pl-24 pr-4 py-3.5 rounded-xl
                    bg-gray-50 border border-gray-200
                    focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200 outline-none
                    text-gray-900 placeholder-gray-400
                  "
                  maxLength={11}
                  required
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasło
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Wprowadź hasło"
                  className="
                    w-full pl-12 pr-12 py-3.5 rounded-xl
                    bg-gray-50 border border-gray-200
                    focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20
                    transition-all duration-200 outline-none
                    text-gray-900 placeholder-gray-400
                  "
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => router.push('/portal/reset-password')}
                className="text-sm text-primary hover:text-primary-600 font-medium"
              >
                Zapomniałeś hasła?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-3.5 rounded-xl font-semibold
                bg-primary text-white
                hover:bg-primary-600 active:bg-primary-700
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
                shadow-lg shadow-primary/25
              "
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logowanie...
                </>
              ) : (
                <>
                  Zaloguj się
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Potrzebujesz pomocy?{' '}
          <a href="tel:+48123456789" className="text-primary font-medium hover:text-primary-600">
            Zadzwoń do nas
          </a>
        </p>
      </div>
    </div>
  );
}
