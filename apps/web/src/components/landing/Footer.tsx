'use client';

import Link from 'next/link';
import Logo from './Logo';

export function Footer() {
  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white/40 border-t border-slate-200 py-20 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
        <div className="space-y-6">
          <button onClick={handleLogoClick} className="text-left focus:outline-none">
            <Logo className="h-14 w-auto" showText textSize="text-3xl" />
          </button>
          <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-medium">
            Modularna platforma CRM/WMS typu multi-tenant zaprojektowana dla dynamicznych firm B2B. Skalowalnosc bez kompromisow.
          </p>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
            &copy; 2026 DockPulse. Wszelkie prawa zastrzezone.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
          <div className="space-y-6">
            <h4 className="font-black text-[#1d1d1f] text-xs uppercase tracking-[0.2em]">Produkt</h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">
                  Funkcje
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('pricing')} className="hover:text-blue-600 transition-colors">
                  Cennik
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 transition-colors">
                  FAQ
                </button>
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-black text-[#1d1d1f] text-xs uppercase tracking-[0.2em]">Firma</h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <Link href="/about" className="hover:text-blue-600 transition-colors">O nas</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-600 transition-colors">Kontakt</Link>
              </li>
              <li>
                <a href="https://bartoszgaca.pl" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                  Autor
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-6 col-span-2 sm:col-span-1">
            <h4 className="font-black text-[#1d1d1f] text-xs uppercase tracking-[0.2em]">Legal</h4>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors">Prywatnosc</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors">Regulamin</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
