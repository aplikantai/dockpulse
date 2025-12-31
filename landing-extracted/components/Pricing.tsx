
import React from 'react';
import { PRICING_PLANS } from '../constants.tsx';

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-40 px-6 bg-[#f5f5f7]/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24 space-y-6">
          <h2 className="text-5xl font-black text-[#1d1d1f] tracking-tighter">Przejrzysty cennik. <br/> Bez ukrytych kosztów.</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-xl font-medium">Wybierz plan idealnie dopasowany do wielkości Twojego zespołu.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {PRICING_PLANS.map((plan, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col p-12 rounded-[48px] transition-all duration-700 bg-white apple-shadow apple-shadow-hover relative overflow-hidden ${
                plan.recommended ? 'scale-105 z-10 border-4 border-blue-600/10' : 'border border-slate-100'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-3xl font-bold text-xs uppercase tracking-widest">
                  Polecany
                </div>
              )}
              
              <div className="mb-10">
                <h3 className="text-3xl font-bold text-[#1d1d1f] mb-3">{plan.name}</h3>
                <p className="text-slate-500 text-lg leading-relaxed font-medium">{plan.description}</p>
              </div>

              <div className="mb-12">
                <span className="text-6xl font-black text-[#1d1d1f]">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-slate-400 font-bold text-xl ml-2">/ m-sc</span>}
              </div>

              <ul className="space-y-6 mb-12 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-5 text-lg text-slate-600 font-medium">
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-6 rounded-3xl font-bold text-xl transition-all active:scale-95 ${
                plan.recommended 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xl shadow-blue-500/20' 
                  : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-slate-200'
              }`}>
                {plan.recommended ? 'Zacznij Okres Próbny' : 'Wybierz Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
