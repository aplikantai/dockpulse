'use client';

import { FEATURE_CARDS } from './constants';

export function Features() {
  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-24 space-y-6">
        <h2 className="text-5xl font-black text-[#1d1d1f] tracking-tighter">
          Wszystko, czego potrzebujesz. <br/> Nic, co zbedne.
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto text-xl font-medium">
          DockPulse zostal zaprojektowany z precyzja high-endowego hardware&apos;u. Skalowalny, bezpieczny i po prostu piekny.
        </p>
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
}

export default Features;
