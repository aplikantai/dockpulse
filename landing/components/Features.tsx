
import React from 'react';

const FEATURE_CARDS = [
  {
    title: "Izolowane bazy danych",
    desc: "Każdy klient posiada dedykowaną bazę PostgreSQL. Bezpieczeństwo klasy korporacyjnej dla małych i średnich firm.",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
  },
  {
    title: "No-Code Config",
    desc: "Włączaj i wyłączaj moduły jak przełączniki w iPhone. Bez wdrażania kodu, bez przestojów, czysta wydajność.",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
  },
  {
    title: "Auto-Branding AI",
    desc: "System automatycznie pobiera Twoje logo i kolory z Twojej strony internetowej. System staje się częścią Twojej marki.",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
  },
  {
    title: "Asystent Konfiguracji",
    desc: "Wbudowana logika AI analizuje Twoją branżę i sugeruje optymalne workflow oraz pola danych.",
    icon: "M13 10V3L4 14h7v7l9-11h-7z"
  },
  {
    title: "Event Bus (Real-time)",
    desc: "Dzięki PostgreSQL LISTEN/NOTIFY dane synchronizują się na wszystkich urządzeniach w czasie rzeczywistym.",
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
  },
  {
    title: "Design iOS Glass",
    desc: "Przepiękny interfejs z głębokim rozmyciem i precyzyjną typografią sprawia, że praca staje się przyjemnością.",
    icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-24 space-y-6">
        <h2 className="text-5xl font-black text-[#1d1d1f] tracking-tighter">Wszystko, czego potrzebujesz. <br/> Nic, co zbędne.</h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-xl font-medium">DockPulse został zaprojektowany z precyzją high-endowego hardware'u. Skalowalny, bezpieczny i po prostu piękny.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {FEATURE_CARDS.map((f, idx) => (
          <div key={idx} className="glass-ios p-10 rounded-[40px] border border-white/50 apple-shadow apple-shadow-hover transition-all duration-500 group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform text-blue-600">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={f.icon}></path>
               </svg>
            </div>
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-4">{f.title}</h3>
            <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
