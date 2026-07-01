'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, ArrowLeft, Swords } from 'lucide-react';
import Link from 'next/link';

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameQuery = searchParams?.get('game') || 'ALL';
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        router.push('/login?redirectUrl=/leaderboard');
      }
    });
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    fetch(`/api/leaderboard?game=${gameQuery}`)
      .then(r => r.json())
      .then(data => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .finally(() => setLoading(false));
  }, [currentUser, gameQuery]);

  if (!currentUser) return <div className="min-h-screen bg-slate-950"></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 mb-12">
          <button onClick={() => router.back()} className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors border border-white/5">
            <ArrowLeft size={24} className="text-slate-400" />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white flex items-center gap-3">
              <Trophy className="text-amber-400" /> 
              Global Leaderboard
            </h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-1">
              Top Ranked {gameQuery === 'MTG' ? 'Planeswalkers' : gameQuery === 'POKEMON' ? 'Trainers' : 'Players'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Loading Leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-3xl border border-white/5">
            <Swords size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl font-bold">No ranked players found for {gameQuery}.</p>
            <p className="text-sm mt-2">Queue up for a ranked game to get on the board!</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-slate-950/50">
                  <th className="py-4 px-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Rank</th>
                  <th className="py-4 px-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Player</th>
                  <th className="py-4 px-6 font-bold text-slate-400 uppercase text-xs tracking-widest">Game</th>
                  <th className="py-4 px-6 font-bold text-slate-400 uppercase text-xs tracking-widest text-right">Elo Rating</th>
                  <th className="py-4 px-6 font-bold text-slate-400 uppercase text-xs tracking-widest text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isTop3 = index < 3;
                  const winRate = entry.matchesPlayed > 0 ? Math.round((entry.wins / entry.matchesPlayed) * 100) : 0;
                  return (
                    <tr key={entry.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-6">
                        <span className={`font-black text-xl ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs border border-white/10 group-hover:border-amber-400/50 transition-colors">
                          {entry.user?.username?.[0]?.toUpperCase()}
                        </div>
                        {entry.user?.username || 'Unknown'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-bold text-sm tracking-wide">{entry.game}</td>
                      <td className="py-4 px-6 text-right font-black text-lg text-emerald-400">{Math.round(entry.elo)}</td>
                      <td className="py-4 px-6 text-right font-bold text-slate-300">{winRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
