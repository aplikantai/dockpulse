'use client';

import Link from 'next/link';
import { useTheme } from '@/providers/ThemeProvider';
import { Menu, X, Settings, LogOut, Home, Package, Users, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

export function NavBar() {
  const { branding } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logo = branding?.logoUrl || '/assets/default-logo.png';
  const companyName = branding?.companyName || 'DockPulse';
  const primaryColor = branding?.colors?.primary || '#2B579A';

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Company Name */}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={logo}
              alt={companyName}
              className="h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default-logo.png';
              }}
            />
            <span
              className="text-xl font-semibold hidden sm:block"
              style={{ color: primaryColor }}
            >
              {companyName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink href="/dashboard" icon={Home}>
              Dashboard
            </NavLink>
            <NavLink href="/orders" icon={ShoppingCart}>
              Zamowienia
            </NavLink>
            <NavLink href="/customers" icon={Users}>
              Klienci
            </NavLink>
            <NavLink href="/products" icon={Package}>
              Produkty
            </NavLink>

            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Ustawienia"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </Link>
              <button
                onClick={() => {
                  /* logout */
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Wyloguj"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-gray-100 animate-fade-in">
            <MobileNavLink href="/dashboard" icon={Home}>
              Dashboard
            </MobileNavLink>
            <MobileNavLink href="/orders" icon={ShoppingCart}>
              Zamowienia
            </MobileNavLink>
            <MobileNavLink href="/customers" icon={Users}>
              Klienci
            </MobileNavLink>
            <MobileNavLink href="/products" icon={Package}>
              Produkty
            </MobileNavLink>
            <MobileNavLink href="/settings" icon={Settings}>
              Ustawienia
            </MobileNavLink>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
              <LogOut className="w-5 h-5" />
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

function NavLink({ href, children, icon: Icon }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium"
    >
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, icon: Icon }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <Icon className="w-5 h-5" />
      {children}
    </Link>
  );
}
