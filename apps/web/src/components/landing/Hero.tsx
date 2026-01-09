'use client';

import Logo from './Logo';

export function Hero() {
  return (
    <section className="relative pt-12 md:pt-24 pb-16 md:pb-32 px-4 md:px-6 text-center overflow-hidden max-w-7xl mx-auto">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        <div className="flex flex-col items-center animate-float">
          <Logo className="w-16 h-16 md:w-20 md:h-20 mb-6 md:mb-8" />
          <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-blue-600 uppercase bg-blue-50 px-4 py-1.5 rounded-full">
            Nowosc: DockPulse 2026
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-[80px] lg:text-[92px] font-black tracking-tighter text-[#1d1d1f] leading-[1.1] md:leading-[0.95]">
          Prostota to <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400">
            najwyzsza forma modularnosci.
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium px-4">
          Odkryj najbardziej intuicyjna platforme CRM & WMS dla sektora B2B. <br className="hidden md:block" /> Zaprojektowana, by skalowac Twoj biznes z lekkoscia systemu iOS.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 md:pt-10">
          <button
            onClick={() => {
              const element = document.getElementById('onboarding');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 bg-[#1d1d1f] text-white rounded-full font-bold text-lg hover:bg-black transition-all shadow-2xl active:scale-95 hover:shadow-blue-500/20"
          >
            Wyprobuj Demo
          </button>
          <button
            onClick={() => {
              const element = document.getElementById('features');
              element?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-10 py-4 md:px-12 md:py-5 glass-ios text-slate-900 rounded-full font-bold text-lg hover:bg-white transition-all apple-shadow active:scale-95 border border-white/40"
          >
            Dowiedz sie wiecej
          </button>
        </div>

        <div className="mt-16 md:mt-24 relative group px-2 md:px-0">
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10 rounded-[40px] md:rounded-[60px] blur-3xl opacity-50"></div>
          <div className="relative glass-ios rounded-[24px] md:rounded-[48px] p-2 md:p-3 apple-shadow border border-white/60 overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
              alt="DockPulse OS Dashboard"
              className="rounded-[20px] md:rounded-[40px] w-full object-cover h-[300px] sm:h-[450px] md:h-[650px] shadow-inner"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
