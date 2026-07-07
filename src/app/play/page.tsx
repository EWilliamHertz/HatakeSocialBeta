'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HaloNav from '@/components/HaloNav';
import Footer from '@/components/Footer';
import { Swords, LogOut, ArrowRight, Activity, Zap } from 'lucide-react';
import MatchHistoryDisplay from '@/components/MatchHistoryDisplay';
import Link from 'next/link';

const GAMES = [
  {
    id: 'phase',
    name: 'Phase',
    clientName: 'Magic the Gathering',
    description: 'Based on an engine created by Matt. Play MTG with advanced rules engine, queue, and goldfish mechanics natively hosted.',
    color: 'from-fuchsia-600 to-purple-800',
    shadow: 'shadow-fuchsia-500/50',
    deckUrl: '/play/mtg/deck-builder',
    queueUrl: '/play/mtg',
    image: '/mtg-art.jpg', // Local generated MTG art
  },
  {
    id: 'euryx',
    name: 'Pokémon TCG',
    clientName: 'Euryx',
    description: 'Catch and battle. Fast-paced action with the legacy Euryx client, now native to Hatake.',
    color: 'from-amber-400 to-red-600',
    shadow: 'shadow-amber-500/50',
    deckUrl: '/deck-builder',
    queueUrl: '/play/pokemon',
    image: '/pkm-art.jpg', // Local generated Pokemon art
  },
  {
    id: 'loryx',
    name: 'Disney Lorcana',
    clientName: 'Loryx',
    description: 'Quest for lore. The absolute easiest mechanic TCG, powered by the new Loryx engine.',
    color: 'from-blue-400 to-indigo-600',
    shadow: 'shadow-indigo-500/50',
    deckUrl: '/play/loryx/deck-builder',
    queueUrl: '/play/loryx',
    image: '/lorcana-art.jpg', // Placeholder for now
  }
];

export default function PlayHub() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [matches, setMatches] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [userId, setUserId] = useState('unknown');

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white selection:bg-cyan-500/30 flex flex-col relative overflow-hidden">
      {/* Dynamic Background Orbs based on selection */}
      <div className="absolute top-0 w-full h-[500px] overflow-hidden -z-10 pointer-events-none">
        <div className={`absolute top-[-20%] left-1/4 w-[800px] h-[500px] rounded-[100%] blur-[120px] opacity-20 mix-blend-screen transition-colors duration-1000 ${selectedGame === 'phase' ? 'bg-fuchsia-600' : selectedGame === 'euryx' ? 'bg-amber-500' : 'bg-slate-700'}`} />
      </div>

      <HaloNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-24 relative z-10">
        
        {/* Header */}
        <AnimatePresence mode="wait">
          {!selectedGame && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="text-center mb-16"
            >
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter mb-4">
                Hatake <span className="text-cyan-400">Arena</span>
              </h1>
              <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
                Select your combat interface. The multiverse awaits.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back Button when a game is selected */}
        <AnimatePresence>
          {selectedGame && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-8"
            >
              <button 
                onClick={() => setSelectedGame(null)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <LogOut size={16} className="rotate-180" /> Change Client
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Cards / Selected View */}
        <div className={`grid gap-6 ${selectedGame ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'}`}>
          <AnimatePresence mode="popLayout">
            {GAMES.map((game) => (
              (!selectedGame || selectedGame === game.id) && (
                <motion.div
                  layoutId={`game-card-${game.id}`}
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", bounce: 0.3 }}
                  onClick={() => !selectedGame && setSelectedGame(game.id)}
                  className={`
                    relative group rounded-3xl border border-white/5 bg-slate-900/50 backdrop-blur-xl overflow-hidden
                    ${!selectedGame ? 'cursor-pointer hover:border-white/20 transition-all duration-500 hover:-translate-y-2' : ''}
                  `}
                >
                  {/* Card Header styling */}
                  <div className={`h-48 bg-gradient-to-br ${game.color} opacity-80 group-hover:opacity-100 transition-opacity p-8 flex items-end relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                    
                    {/* Character/Art Image overlay */}
                    {game.image && (
                      <div className="absolute right-0 bottom-0 w-1/2 h-[150%] opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700 pointer-events-none" style={{ backgroundImage: `url(${game.image})`, backgroundSize: 'contain', backgroundPosition: 'bottom right', backgroundRepeat: 'no-repeat' }} />
                    )}

                    <h2 className="text-3xl font-black text-white relative z-10 drop-shadow-xl tracking-tight">
                      {game.name}
                    </h2>
                    <span className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white/90 uppercase tracking-widest border border-white/10 z-10">
                      {game.clientName}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-8">
                    {!selectedGame ? (
                      <div>
                        <p className="text-slate-400 leading-relaxed mb-6 relative z-10">{game.description}</p>
                        <div className="flex items-center text-cyan-400 font-bold text-sm uppercase tracking-widest group-hover:text-cyan-300">
                          Initialize <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Left Side: Actions */}
                        <div className="space-y-6">
                          <p className="text-lg text-slate-300 leading-relaxed">{game.description}</p>
                          
                          <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link href={game.queueUrl} onClick={(e) => e.stopPropagation()} className={`flex-1 py-4 px-6 bg-gradient-to-r ${game.color} text-white font-black rounded-2xl text-center shadow-lg ${game.shadow} hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 text-lg`}>
                              <Swords size={24} /> Enter Client
                            </Link>
                          </div>

                          <div className="p-6 bg-black/40 rounded-2xl border border-white/5 mt-8">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                              <Zap size={16} className="text-yellow-500" /> Active Season
                            </h3>
                            <div className="text-slate-300 text-sm">
                              The Arena is currently open for unranked matchmaking and deck testing. Ranked ladder will initialize in Season 1.
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Elo & Match History */}
                        <div className="bg-black/20 rounded-2xl p-6 border border-white/5">
                           <MatchHistoryDisplay userId={userId} matches={matches} ratings={ratings} />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
