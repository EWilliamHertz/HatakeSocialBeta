import React from 'react';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export default function Footer() {
  return (
    <footer className="w-full bg-slate-950 border-t border-white/5 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Brand & Copyright */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-wider">
            HATAKE SOCIAL
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Hatake Network. All rights reserved.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-sm font-bold tracking-wider text-slate-400">
          <Link href="/vision" className="hover:text-cyan-400 transition-colors uppercase">
            Vision
          </Link>
          <Link href="/partners" className="hover:text-cyan-400 transition-colors uppercase">
            Partners
          </Link>
          <Link href="/resources" className="hover:text-cyan-400 transition-colors uppercase">
            Resources
          </Link>
        </div>

        {/* Language Switcher */}
        <div>
          <LanguageSwitcher />
        </div>

      </div>
    </footer>
  );
}
