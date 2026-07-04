'use client';

import React from 'react';
import HaloNav from '@/components/HaloNav';
import Link from 'next/link';

export default function LoryxLobby() {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col pt-24 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <HaloNav />
      
      <div className="max-w-5xl w-full mx-auto px-6 relative z-10 mt-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-6 drop-shadow-lg tracking-tight">
            LORYX
          </h1>
          <p className="text-xl text-indigo-200/80 max-w-2xl mx-auto font-light">
            The premier Disney Lorcana battle simulator. Assemble your Glimmers, ready your Inkwell, and quest for Lore.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Deck Builder Card */}
          <Link href="/play/loryx/deck-builder" className="group relative block rounded-3xl overflow-hidden transition-transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 z-0" />
            <div className="absolute inset-0 bg-[url('https://i.imgur.com/B06rBhI.png')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:opacity-20 transition-opacity" />
            <div className="absolute inset-0 border border-white/10 rounded-3xl group-hover:border-indigo-400/50 transition-colors z-20" />
            
            <div className="relative z-10 p-10 h-full flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 backdrop-blur border border-white/10 flex items-center justify-center mb-6 shadow-xl text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Deck Builder</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Forge your strategy. Browse the entire Lorcana database, build custom decks, and manage your ink curves seamlessly.
              </p>
              <div className="mt-auto inline-flex items-center gap-2 text-indigo-300 font-bold group-hover:text-indigo-200 transition-colors">
                Enter Forge <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>
          </Link>

          {/* Goldfish Mode Card */}
          <Link href="/play/loryx/game" className="group relative block rounded-3xl overflow-hidden transition-transform hover:-translate-y-2 shadow-2xl shadow-indigo-900/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-950 z-0" />
            <div className="absolute inset-0 bg-[url('https://i.imgur.com/B06rBhI.png')] opacity-10 bg-cover bg-center mix-blend-overlay group-hover:opacity-30 transition-opacity" />
            <div className="absolute inset-0 border border-indigo-500/30 rounded-3xl group-hover:border-amber-400/50 transition-colors z-20" />
            
            <div className="relative z-10 p-10 h-full flex flex-col items-start">
              <div className="w-14 h-14 rounded-2xl bg-indigo-950/80 backdrop-blur border border-indigo-400/20 flex items-center justify-center mb-6 shadow-xl text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Test Engine</h2>
              <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-black rounded-full mb-4 uppercase tracking-wider">
                Goldfish Sandbox
              </div>
              <p className="text-indigo-200/70 mb-8 leading-relaxed">
                Test the Loryx engine. Practice questing, inking, and challenging against an automated Training Dummy.
              </p>
              <div className="mt-auto inline-flex items-center gap-2 text-amber-400 font-bold group-hover:text-amber-300 transition-colors">
                Launch Simulator <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
