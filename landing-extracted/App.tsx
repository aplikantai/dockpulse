
import React, { useState } from 'react';
import Header from './components/Header.tsx';
import Hero from './components/Hero.tsx';
import Features from './components/Features.tsx';
import Pricing from './components/Pricing.tsx';
import FAQ from './components/FAQ.tsx';
import AppDemo from './components/AppDemo.tsx';
import Logo from './components/Logo.tsx';
import { AppView } from './types.ts';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);

  const navigateToSection = (sectionId: string) => {
    if (currentView !== AppView.LANDING) {
      setCurrentView(AppView.LANDING);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoFooterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentView(AppView.LANDING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onNavigate={setCurrentView} currentView={currentView} />
      
      <main className="flex-grow">
        {currentView === AppView.LANDING ? (
          <>
            <Hero onStartDemo={() => setCurrentView(AppView.DEMO)} />
            <Features />
            <Pricing />
            <FAQ />
          </>
        ) : (
          <AppDemo onBack={() => setCurrentView(AppView.LANDING)} />
        )}
      </main>

      <footer className="bg-white/40 border-t border-slate-200 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-16">
          <div className="space-y-6">
            <button onClick={handleLogoFooterClick} className="text-left focus:outline-none">
              <Logo className="h-14 w-auto" showText textSize="text-3xl" />
            </button>
            <p className="text-slate-500 text-sm max-w-xs leading-relaxed font-medium">
              Modularna platforma CRM/WMS typu multi-tenant zaprojektowana dla dynamicznych firm B2B. Skalowalność bez kompromisów.
            </p>
            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">© 2025 DockPulse. Wszelkie prawa zastrzeżone.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-6">
              <h4 className="font-black text-[#1d1d1f] text-xs uppercase tracking-[0.2em]">Produkt</h4>
              <ul className="space-y-3 text-sm font-semibold text-slate-500">
                <li><button onClick={() => navigateToSection('features')} className="hover:text-blue-600 transition-colors">Funkcje</button></li>
                <li><button onClick={() => navigateToSection('pricing')} className="hover:text-blue-600 transition-colors">Cennik</button></li>
                <li><button onClick={() => navigateToSection('faq')} className="hover:text-blue-600 transition-colors">FAQ</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-[#1d1d1f] text-xs uppercase tracking-[0.2em]">Firma</h4>
              <ul className="space-y-3 text-sm font-semibold text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">O nas</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Kontakt</a></li>
                <li><a href="https://bartoszgaca.pl" target="_blank" className="hover:text-blue-600 transition-colors">Autor</a></li>
              </ul>
            </div>
            <div className="space-y-6 col-span-2 sm:col-span-1">
              <h4 className="font-black text-[#1d1d1f] text-xs uppercase tracking-[0.2em]">Legal</h4>
              <ul className="space-y-3 text-sm font-semibold text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Prywatność</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Regulamin</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
