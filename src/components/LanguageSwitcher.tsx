'use client';

import React from 'react';
import { useI18n } from '@/lib/i18nContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();

  const handleSetLang = (newLang: 'en' | 'sv') => {
    setLang(newLang);
    document.cookie = `hatake_lang=${newLang}; path=/; max-age=31536000`; // 1 year
  };

  return (
    <div className="flex gap-3">
      <button 
        onClick={() => handleSetLang('en')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${lang === 'en' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-slate-900 border border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'}`}
      >
        <span className="text-base">🇬🇧</span> EN
      </button>
      <button 
        onClick={() => handleSetLang('sv')}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase transition-all ${lang === 'sv' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-slate-900 border border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'}`}
      >
        <span className="text-base">🇸🇪</span> SV
      </button>
    </div>
  );
}
