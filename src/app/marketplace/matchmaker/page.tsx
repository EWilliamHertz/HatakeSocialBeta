'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, ArrowRightLeft, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

type TradeMatch = {
  user: { id: string, username: string, reputationScore: number };
  theyHaveWhatIWant: any[];
  iHaveWhatTheyWant: any[];
  tradeScore: number;
  equalization: { suggestedAction: string, amount: number } | null;
};

export default function TradeMatchmaker() {
  const [matches, setMatches] = useState<TradeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/marketplace/match')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          setMatches(data.matches);
        }
        if (data.message) {
          setMessage(data.message);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-20">
      
      <div className="max-w-5xl mx-auto pt-24 px-4 sm:px-6 relative">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="mb-12 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-4 tracking-tight">
            Intelligent Trade Matchmaker
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            We scan your Want List and Inventory against the global Hatake network to find the absolute best peer-to-peer trading opportunities.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
            <p className="text-slate-400 font-bold tracking-widest uppercase">Scanning Network...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-12 text-center shadow-xl">
            <Sparkles className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">No Perfect Matches Found</h2>
            <p className="text-slate-400 mb-6">{message || "Add more cards to your Want List or Inventory to discover potential trading partners!"}</p>
            <a href="/collection" className="inline-block px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              Update Want List
            </a>
          </div>
        ) : (
          <div className="space-y-8 relative z-10">
            {matches.map((match, i) => (
              <motion.div 
                key={match.user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-white/5 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-xl font-black text-white shadow-lg">
                      {match.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{match.user.username}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase flex items-center gap-1">
                        <ShieldAlert size={12} className="text-emerald-500" /> Reputation: {match.user.reputationScore.toFixed(1)}/5.0
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-950 border border-white/10 px-4 py-2 rounded-xl text-center flex-shrink-0">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Match Quality</p>
                    <p className="text-cyan-400 font-black text-xl flex items-center gap-1 justify-center">
                      <TrendingUp size={16} /> {match.tradeScore > 100 ? '99' : Math.floor(match.tradeScore)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                  {/* Divider arrow for desktop */}
                  <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-800 rounded-full items-center justify-center border-4 border-slate-900 z-10 shadow-xl">
                    <ArrowRightLeft className="text-cyan-500" size={20} />
                  </div>

                  {/* They Have */}
                  <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                      They Have (You Want)
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs">
                        €{match.theyHaveWhatIWant.reduce((acc, c) => acc + (c.price || 0), 0).toFixed(2)}
                      </span>
                    </h4>
                    <div className="space-y-3">
                      {match.theyHaveWhatIWant.map(card => (
                        <div key={card.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={card.imageUrl ? `/api/proxy?url=${encodeURIComponent(card.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png'} alt={card.name} className="w-8 h-12 object-cover rounded shadow" />
                            <div>
                              <p className="text-sm font-bold text-white line-clamp-1">
                                {card.name}
                                {(() => {
                                  const setCode = card.setCode;
                                  const payload: any = card.apiPayload || {};
                                  const collectorNumber = payload.collector_number || payload.collectorNumber || 
                                    (payload.extendedData && Array.isArray(payload.extendedData) ? payload.extendedData.find((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value : null);
                                  if (setCode || collectorNumber) {
                                    return <span className="ml-1 text-[10px] text-slate-500 font-black uppercase">[{setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber ? `#${collectorNumber}` : ''}]</span>;
                                  }
                                  return null;
                                })()}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase">{card.game}</p>
                            </div>
                          </div>
                          <p className="text-emerald-400 font-bold text-sm shrink-0">€{(card.price || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* You Have */}
                  <div className="bg-slate-950/50 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1 h-full bg-fuchsia-500" />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                      You Have (They Want)
                      <span className="text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded text-xs">
                        €{match.iHaveWhatTheyWant.reduce((acc, c) => acc + (c.price || 0), 0).toFixed(2)}
                      </span>
                    </h4>
                    
                    {match.iHaveWhatTheyWant.length === 0 ? (
                      <div className="h-full flex items-center justify-center min-h-[100px]">
                        <p className="text-slate-500 text-sm font-bold">They haven't wishlisted anything you own.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {match.iHaveWhatTheyWant.map(card => (
                          <div key={card.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={card.imageUrl ? `/api/proxy?url=${encodeURIComponent(card.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png'} alt={card.name} className="w-8 h-12 object-cover rounded shadow" />
                              <div>
                                <p className="text-sm font-bold text-white line-clamp-1">
                                  {card.name}
                                  {(() => {
                                    const setCode = card.setCode;
                                    const payload: any = card.apiPayload || {};
                                    const collectorNumber = payload.collector_number || payload.collectorNumber || 
                                      (payload.extendedData && Array.isArray(payload.extendedData) ? payload.extendedData.find((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value : null);
                                    if (setCode || collectorNumber) {
                                      return <span className="ml-1 text-[10px] text-slate-500 font-black uppercase">[{setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber ? `#${collectorNumber}` : ''}]</span>;
                                    }
                                    return null;
                                  })()}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase">{card.game}</p>
                              </div>
                            </div>
                            <p className="text-fuchsia-400 font-bold text-sm shrink-0">€{(card.price || 0).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Equalization & Action */}
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                  {match.equalization ? (
                    <div className="flex items-center gap-3 bg-slate-950 px-4 py-3 rounded-xl border border-white/10 w-full sm:w-auto">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                        <ArrowRightLeft size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Suggested Equalization</p>
                        {match.equalization.suggestedAction === 'EVEN_TRADE' ? (
                          <p className="text-sm font-black text-cyan-400">Perfectly Even Trade!</p>
                        ) : match.equalization.suggestedAction === 'THEY_PAY' ? (
                          <p className="text-sm font-black text-emerald-400">They add €{match.equalization.amount.toFixed(2)}</p>
                        ) : (
                          <p className="text-sm font-black text-fuchsia-400">You add €{match.equalization.amount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full sm:w-auto"><p className="text-slate-500 text-xs italic">Equalization only calculates for mutual trades.</p></div>
                  )}

                  <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    Propose Trade
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
