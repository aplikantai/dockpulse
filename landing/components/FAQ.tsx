
import React, { useState } from 'react';
import { FAQ_ITEMS } from '../constants.tsx';

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-4xl font-bold text-slate-900">Masz pytania?</h2>
        <p className="text-slate-500">Dowiedz się więcej o tym, jak DockPulse może pomóc Twojej firmie.</p>
      </div>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, idx) => (
          <div 
            key={idx} 
            className="glass-effect rounded-[24px] overflow-hidden border border-white/50 ios-shadow"
          >
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full px-8 py-6 flex justify-between items-center text-left hover:bg-white/40 transition-colors"
            >
              <span className="font-bold text-slate-800 text-lg">{item.question}</span>
              <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </button>
            
            <div className={`px-8 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === idx ? 'max-h-96 pb-8 opacity-100' : 'max-h-0 opacity-0'}`}>
              <p className="text-slate-600 leading-relaxed pt-2 border-t border-slate-200/50">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
