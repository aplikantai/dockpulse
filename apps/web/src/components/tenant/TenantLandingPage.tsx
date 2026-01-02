'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { ArrowRight, Package, ShoppingCart, Users, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function TenantLandingPage() {
  const { tenant, isLoading } = useTenant();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Strona nie istnieje</h1>
          <p className="text-gray-600 mb-6">Ta subdomena nie została skonfigurowana.</p>
          <Link
            href="https://dockpulse.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Przejdź do DockPulse
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = tenant.branding?.colors?.primary || '#2563eb';
  const secondaryColor = tenant.branding?.colors?.secondary || '#1e40af';
  const logoUrl = tenant.branding?.logoUrl;
  const companyName = tenant.companyData?.name || tenant.name;
  const slogan = tenant.branding?.slogan || tenant.companyData?.slogan;
  const description = tenant.branding?.description || tenant.companyData?.description;
  const email = tenant.companyData?.email;
  const phone = tenant.companyData?.phone;
  const address = tenant.companyData?.address;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-lg border-b shadow-sm"
        style={{
          backgroundColor: `${primaryColor}10`,
          borderColor: `${primaryColor}20`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
              <span className="text-xl font-bold text-gray-900">{companyName}</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/portal/login"
                className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Portal klienta
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 4px 6px -1px ${primaryColor}40`
                }}
              >
                Panel administracyjny
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
          }}
        />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={companyName}
                className="h-24 w-auto object-contain mx-auto mb-8"
              />
            )}

            <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 leading-tight">
              {companyName}
            </h1>

            {slogan && (
              <p className="text-2xl md:text-3xl font-semibold mb-6" style={{ color: primaryColor }}>
                {slogan}
              </p>
            )}

            {description && (
              <p className="text-lg text-gray-600 mb-12 leading-relaxed">
                {description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/portal/new-order"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: `0 10px 15px -3px ${primaryColor}40`
                }}
              >
                <ShoppingCart className="w-5 h-5" />
                Złóż zamówienie
                <ArrowRight className="w-5 h-5" />
              </Link>

              <Link
                href="/portal/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold border-2 rounded-xl transition-all hover:shadow-lg"
                style={{
                  borderColor: primaryColor,
                  color: primaryColor
                }}
              >
                Zaloguj się do portalu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Jak możemy Ci pomóc?
            </h2>
            <p className="text-lg text-gray-600">
              Oferujemy kompleksową obsługę zamówień online
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor
                }}
              >
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Szeroki asortyment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sprawdź naszą pełną ofertę produktów i usług dostosowanych do Twoich potrzeb.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor
                }}
              >
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Łatwe zamówienia online
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Złóż zamówienie w kilka minut i śledź jego status w czasie rzeczywistym.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor
                }}
              >
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Wsparcie dla klientów
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Nasz zespół jest zawsze gotowy, aby pomóc Ci w realizacji zamówienia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      {(email || phone || address?.city) && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Skontaktuj się z nami
              </h2>
              <p className="text-lg text-gray-600">
                Jesteśmy do Twojej dyspozycji
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {email && (
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Mail className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Email</p>
                  <a
                    href={`mailto:${email}`}
                    className="font-semibold hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {email}
                  </a>
                </div>
              )}

              {phone && (
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Phone className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Telefon</p>
                  <a
                    href={`tel:${phone}`}
                    className="font-semibold hover:underline"
                    style={{ color: primaryColor }}
                  >
                    {phone}
                  </a>
                </div>
              )}

              {address?.city && (
                <div className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Adres</p>
                  <p className="font-semibold text-gray-900">
                    {address.street && <>{address.street}<br /></>}
                    {address.postalCode} {address.city}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        className="border-t py-12 px-4 sm:px-6 lg:px-8"
        style={{ borderColor: `${primaryColor}20` }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} {companyName}. Wszelkie prawa zastrzeżone.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Powered by <a href="https://dockpulse.com" className="hover:underline">DockPulse</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
