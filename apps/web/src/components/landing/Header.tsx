'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-[100] w-full glass-ios px-4 md:px-8 py-3 apple-shadow border-b border-white/20">
      <div className="max-w-7xl mx-auto flex justify-between items-center h-12">
        {/* Logo Section */}
        <div
          className="cursor-pointer group flex items-center z-[110] shrink-0"
          onClick={handleLogoClick}
        >
          <Logo className="h-9 w-auto" showText textSize="text-lg md:text-xl" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <button
            onClick={handleLogoClick}
            className="hover:text-blue-600 transition-colors"
          >
            Strona glowna
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-blue-600 transition-colors"
          >
            Funkcje
          </button>
          <button
            onClick={() => scrollToSection('pricing')}
            className="hover:text-blue-600 transition-colors"
          >
            Cennik
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="hover:text-blue-600 transition-colors"
          >
            FAQ
          </button>
        </nav>

        {/* Action Buttons & Hamburger */}
        <div className="flex items-center gap-3 z-[110]">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Zaloguj sie
          </Link>
          <button
            onClick={() => scrollToSection('onboarding')}
            className="hidden sm:block px-5 py-2 text-sm font-bold rounded-full bg-[#1d1d1f] text-white hover:bg-black transition-all shadow-md active:scale-95"
          >
            Darmowe Demo
          </button>

          {/* Hamburger Icon */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-slate-900 focus:outline-none"
          >
            <div className="w-6 h-5 relative flex flex-col justify-between overflow-hidden">
              <span className={`w-full h-0.5 bg-current transition-all duration-300 transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-full h-0.5 bg-current transition-all duration-300 ${isMenuOpen ? 'opacity-0 translate-x-4' : ''}`}></span>
              <span className={`w-full h-0.5 bg-current transition-all duration-300 transform ${isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-[100] lg:hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
          <button onClick={handleLogoClick} className="text-2xl font-bold text-slate-900">Strona glowna</button>
          <button onClick={() => scrollToSection('features')} className="text-2xl font-bold text-slate-900">Funkcje</button>
          <button onClick={() => scrollToSection('pricing')} className="text-2xl font-bold text-slate-900">Cennik</button>
          <button onClick={() => scrollToSection('faq')} className="text-2xl font-bold text-slate-900">FAQ</button>
          <button
            onClick={() => { scrollToSection('onboarding'); setIsMenuOpen(false); }}
            className="w-full max-w-xs mt-4 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-xl active:scale-95 text-center"
          >
            Darmowe Demo
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
