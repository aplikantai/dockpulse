
import React, { useState, useEffect } from 'react';
import { INITIAL_MODULES } from '../constants.tsx';
import { ModuleState } from '../types.ts';
import Logo from './Logo.tsx';

interface AppDemoProps {
  onBack: () => void;
}

type DemoStep = 'onboarding' | 'analyzing' | 'dashboard';

const AppDemo: React.FC<AppDemoProps> = ({ onBack }) => {
  const [step, setStep] = useState<DemoStep>('onboarding');
  const [modules, setModules] = useState<ModuleState[]>(INITIAL_MODULES);
  const [url, setUrl] = useState('');
  const [accentColor, setAccentColor] = useState('#0071e3');
  const [brandName, setBrandName] = useState('Twoja Firma');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  const startAnalysis = () => {
    if (!url) return;
    setStep('analyzing');
    
    setTimeout(() => {
      const colors = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff3b30', '#5856d6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setAccentColor(randomColor);
      
      const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
      const domainParts = cleanUrl.split('.');
      const name = domainParts[0] || 'Moja Firma';
      
      setBrandName(name.charAt(0).toUpperCase() + name.slice(1));
      setBrandLogo(`https://logo.clearbit.com/${cleanUrl}`);
      
      setStep('dashboard');
    }, 2500);
  };

  const toggleModule = (id: string) => {
    setModules(modules.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  const activeModulesCount = modules.filter(m => m.active).length;

  if (step === 'onboarding') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 md:py-20">
        <div className="max-w-xl w-full glass-ios p-6 md:p-12 rounded-[32px] md:rounded-[40px] apple-shadow space-y-8 md:space-y-10 border border-white/40">
          <div className="text-center space-y-4">
            <Logo className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6" />
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1d1d1f]">Skonfiguruj swój system</h2>
            <p className="text-slate-500 text-sm md:text-lg leading-relaxed">Wprowadź adres URL swojej strony, a nasze AI automatycznie pobierze kolory marki, logo i zaproponuje moduły.</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="np. twojadomena.pl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startAnalysis()}
                className="w-full px-5 py-4 md:px-8 md:py-5 bg-white/80 rounded-2xl md:rounded-3xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none text-lg md:text-xl transition-all font-medium placeholder:text-slate-300"
              />
            </div>
            
            <button 
              onClick={startAnalysis}
              disabled={!url}
              className="w-full py-4 md:py-5 bg-[#1d1d1f] text-white rounded-2xl md:rounded-3xl font-bold text-lg md:text-xl hover:bg-black transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-xl shadow-black/10"
            >
              Kontynuuj z AI
            </button>
            <button onClick={onBack} className="w-full py-2 text-slate-400 font-medium hover:text-slate-600 transition-colors text-xs md:text-sm">
              Anuluj i wróć
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-6 md:space-y-10 animate-float">
          <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-600/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-4 glass-ios rounded-full flex items-center justify-center">
              <Logo className="w-8 h-8 md:w-12 md:h-12" />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1d1d1f]">AI analizuje markę...</h2>
            <p className="text-slate-500 text-sm md:text-lg">Pobieranie palety kolorów i zasobów dla <span className="font-bold text-slate-900">{url}</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 md:pt-12 pb-16 md:pb-24 px-4 md:px-12 max-w-[1400px] mx-auto space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8 border-b border-slate-200/50 pb-8 md:pb-10">
        <div className="space-y-3 w-full">
          <button 
            onClick={() => setStep('onboarding')}
            className="text-xs md:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            Zmień stronę firmy
          </button>
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[22px] glass-ios flex items-center justify-center p-2 apple-shadow border border-white/50 shrink-0">
              {brandLogo ? (
                <img src={brandLogo} alt="Brand" className="w-full h-full object-contain rounded-lg" onError={() => setBrandLogo(null)} />
              ) : (
                <Logo className="w-full h-full" />
              )}
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[#1d1d1f] truncate max-w-[200px] sm:max-w-none">{brandName} Panel</h1>
              <p className="text-slate-500 text-xs md:text-sm font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Modular Workspace 2026
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="glass-ios px-5 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-3xl apple-shadow flex items-center gap-6 md:gap-8 border border-white/50 w-full md:w-auto justify-between md:justify-start">
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-400">Aktywne Moduły</span>
              <span className="text-xl md:text-2xl font-black text-slate-900">{activeModulesCount}</span>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-white transition-colors shadow-lg" style={{ backgroundColor: accentColor }}>
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path></svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 md:gap-12">
        <aside className="lg:col-span-1 space-y-6 md:space-y-10">
          <div className="glass-ios p-6 md:p-8 rounded-[32px] md:rounded-[40px] apple-shadow space-y-6 md:space-y-8 border border-white/50">
            <div className="space-y-4 md:space-y-6">
               <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f]">Stylizacja Marki</h3>
               <div className="space-y-3">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kolor Akcentu</label>
                 <div className="flex flex-wrap gap-2 md:gap-3">
                   {['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff3b30', '#5856d6', '#1d1d1f'].map(color => (
                     <button 
                       key={color}
                       onClick={() => setAccentColor(color)}
                       className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 transition-all ${accentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                       style={{ backgroundColor: color }}
                     />
                   ))}
                 </div>
               </div>
            </div>

            <div className="pt-6 md:pt-8 border-t border-slate-200/50 space-y-4 md:space-y-6">
              <h3 className="text-lg md:text-xl font-bold text-[#1d1d1f]">Szablony Branżowe</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                {['Usługi', 'Produkcja', 'Handel B2B'].map(item => (
                  <button key={item} className="w-full text-left px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl bg-white/40 text-slate-700 font-bold border border-transparent hover:border-blue-200 hover:bg-white transition-all flex justify-between items-center group shadow-sm">
                    <span className="text-xs md:text-sm">{item}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 hidden md:inline">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-3 space-y-8 md:space-y-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {modules.map(m => (
              <div 
                key={m.id}
                onClick={() => toggleModule(m.id)}
                className={`p-5 md:p-7 rounded-[28px] md:rounded-[36px] border cursor-pointer transition-all duration-500 group relative overflow-hidden ${
                  m.active 
                  ? 'bg-white apple-shadow' 
                  : 'bg-white/30 border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-sm transition-all duration-500 ${m.active ? 'scale-110' : ''}`} style={{ backgroundColor: m.active ? `${accentColor}10` : '#f4f4f7', color: m.active ? accentColor : '#94a3b8' }}>
                    {m.active ? '✦' : '✧'}
                  </div>
                  
                  <div className={`w-10 h-6 md:w-12 md:h-7 rounded-full relative transition-colors duration-300 p-1 ${m.active ? '' : 'bg-slate-200'}`} style={{ backgroundColor: m.active ? accentColor : undefined }}>
                    <div className={`w-4 h-4 md:w-5 md:h-5 bg-white rounded-full shadow-md transition-transform duration-300 transform ${m.active ? 'translate-x-4 md:translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <h4 className="text-base md:text-lg font-bold text-[#1d1d1f] mb-1">{m.name}</h4>
                <p className="text-[10px] md:text-sm text-slate-500 leading-relaxed font-medium">{m.description}</p>
              </div>
            ))}
          </div>

          <div className="glass-ios rounded-[32px] md:rounded-[48px] p-1 md:p-2 apple-shadow border border-white/50 overflow-hidden h-[400px] md:h-[550px] flex flex-col">
            <div className="px-6 md:px-8 py-3 md:py-5 border-b border-slate-100/50 flex items-center justify-between bg-white/20 shrink-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
              </div>
              <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Live Interface Preview: {brandName} OS
              </div>
              <div className="w-8 md:w-10"></div>
            </div>
            
            <div className="flex-1 bg-white p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 overflow-y-auto">
               <div className="w-20 h-20 md:w-28 md:h-28 rounded-[24px] md:rounded-[32px] glass-ios flex items-center justify-center p-4 md:p-5 apple-shadow border border-slate-50 animate-float shrink-0">
                  {brandLogo ? <img src={brandLogo} className="w-full h-full object-contain" /> : <Logo className="w-full h-full" />}
               </div>
               <div className="space-y-2 md:space-y-3">
                 <h5 className="text-xl md:text-3xl font-bold tracking-tight text-[#1d1d1f]">System Gotowy</h5>
                 <p className="text-slate-500 max-w-md text-sm md:text-lg leading-relaxed font-medium px-4">Twój modułowy ekosystem dla <span className="text-slate-900 font-bold">{brandName}</span> został przygotowany z {activeModulesCount} aktywnymi funkcjami.</p>
               </div>
               <button 
                className="px-8 py-3 md:px-12 md:py-4 rounded-full font-bold text-white shadow-2xl transition-all active:scale-95 hover:brightness-110 text-sm md:text-base"
                style={{ backgroundColor: accentColor }}
               >
                 Uruchom Aplikację
               </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppDemo;
