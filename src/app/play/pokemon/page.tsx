'use client';

import React, { useState, useEffect } from 'react';
import { usePokemonSocket } from '@/hooks/usePokemonSocket';
import { Loader2, Swords, Trophy, Users, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PokemonEngineLobby() {
  const { socket, connected } = usePokemonSocket();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        router.push('/login?redirectUrl=/play/pokemon');
      }
    });
  }, [router]);

  if (!currentUser) return <div className="min-h-screen bg-slate-950"></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      
      {/* Dynamic Header */}
      <div className="w-full bg-slate-900 border-b border-white/5 py-4 px-8 flex justify-between items-center shadow-xl relative z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 tracking-wider">
            EURYX ARENA
          </h1>
          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded border border-yellow-500/20">
            Pokémon TCG Engine
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {connected ? 'Engine Online' : 'Connecting...'}
            </span>
          </div>
          
          <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <div className="text-right">
              <p className="text-white font-bold text-sm leading-tight">{currentUser.username}</p>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Trainer</p>
            </div>
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-700" />
            ) : (
              <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-slate-700 flex items-center justify-center font-black">
                {currentUser.username[0].toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 pt-12 space-y-12">
        {/* Connection Alert */}
        {!connected && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
            <Loader2 className="text-red-500 animate-spin" />
            <p className="text-red-400 font-bold text-sm">Connecting to Euryx WebSocket Engine...</p>
          </div>
        )}

        {/* Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-5xl font-black text-white mb-4 leading-tight">
              Welcome to <span className="text-amber-400">Euryx.</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              The official Pokémon TCG engine built directly into Hatake. Construct your decks using your collection, queue up against other trainers, and battle in real-time.
            </p>
            <button className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all flex items-center gap-3 hover:scale-105" onClick={() => router.push('/play/pokemon/queue')}>
              <Swords size={24} /> Queue Up
            </button>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-amber-500/30 transition-all group cursor-pointer" onClick={() => router.push(`/play/pokemon/goldfish-${Math.random().toString(36).substring(2, 9)}`)}>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <Users size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Goldfish Mode</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Play against yourself to test out your deck consistency and setups.</p>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-all group cursor-pointer" onClick={() => router.push('/play/pokemon/deck-builder')}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Deck Builder</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Construct your ultimate 60-card deck using cards from your digital binder.</p>
          </div>

          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-fuchsia-500/30 transition-all group cursor-pointer" onClick={() => router.push('/leaderboard?game=POKEMON')}>
            <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center text-fuchsia-500 mb-6 group-hover:scale-110 transition-transform">
              <Trophy size={32} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Leaderboard</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Check your ELO rating and see who the top trainers on the server are.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
