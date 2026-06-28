'use client';

import React, { useState } from 'react';
import { Package, RefreshCw, Wand2, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToolsPage() {
  const [openedCards, setOpenedCards] = useState<any[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [selectedGame, setSelectedGame] = useState('NARUTO');
  const [availablePacks, setAvailablePacks] = useState<any[]>([]);
  const [selectedPackId, setSelectedPackId] = useState('');
  const [zoomedCard, setZoomedCard] = useState<string | null>(null);

  React.useEffect(() => {
    fetch(`/api/packs/available?game=${selectedGame}`)
      .then(res => res.json())
      .then(data => {
        if (data.packs) {
          setAvailablePacks(data.packs);
          setSelectedPackId(data.packs[0]?.id || '');
        }
      });
  }, [selectedGame]);

  const handleOpenPack = async () => {
    if (!selectedPackId) return;
    setIsOpening(true);
    setOpenedCards([]);
    
    try {
      const res = await fetch(`/api/packs/${selectedGame.toLowerCase()}?packId=${selectedPackId}`);
      if (res.ok) {
        const data = await res.json();
        // Stagger animation
        setTimeout(() => {
          setOpenedCards(data.pack);
          setIsOpening(false);
        }, 800);
      } else {
        alert("Failed to simulate pack. Check database!");
        setIsOpening(false);
      }
    } catch (e) {
      console.error(e);
      setIsOpening(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-8 pb-40">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-4 flex items-center justify-center gap-4">
            <Wand2 size={48} className="text-cyan-400" /> TCG Tools Hub
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Simulate booster openings and analyze drop rates using our hyper-accurate Slot System algorithms based on real-world pack configurations.
          </p>
        </div>

        {/* Simulator Section */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
            <div>
              <h2 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                <Package className="text-cyan-400" /> Booster Pack Simulator
              </h2>
              <p className="text-slate-400">Choose a game and crack a virtual pack to test your luck!</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <select 
                value={selectedGame}
                onChange={e => setSelectedGame(e.target.value)}
                className="bg-slate-950 text-white font-bold border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-500 cursor-pointer w-full md:w-auto"
              >
                <option value="NARUTO">Naruto Mythos</option>
                <option value="MTG">Magic: The Gathering</option>
                <option value="POKEMON">Pokémon TCG</option>
                <option value="ONE_PIECE">One Piece TCG</option>
              </select>
              
              <select 
                value={selectedPackId}
                onChange={e => setSelectedPackId(e.target.value)}
                className="bg-slate-950 text-white font-bold border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-fuchsia-500 cursor-pointer w-full md:w-auto disabled:opacity-50"
                disabled={availablePacks.length === 0}
              >
                {availablePacks.length === 0 ? <option value="">No packs available</option> : null}
                {availablePacks.map(pack => (
                  <option key={pack.id} value={pack.id}>{pack.name}</option>
                ))}
              </select>

              <button 
                onClick={handleOpenPack}
                disabled={isOpening || !selectedPackId}
                className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-black rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                {isOpening ? <RefreshCw className="animate-spin" /> : <Zap />}
                {isOpening ? 'Generating...' : 'Open Pack'}
              </button>
            </div>
          </div>

          {/* Pack Summary */}
          {!isOpening && openedCards.length > 0 && (
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center bg-slate-950/50 border border-white/5 rounded-2xl p-4 mb-6 shadow-inner">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-sm">Pack Contents: {openedCards.length} Cards</p>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 font-bold text-sm">Estimated Value:</span>
                <span className="text-2xl font-black text-emerald-400">
                  {selectedGame === 'NARUTO' 
                    ? 'N/A' 
                    : `€${openedCards.reduce((acc, c) => acc + (Number(c.price) || 0), 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Opened Cards Grid */}
          <div className="relative z-10 min-h-[400px]">
            {isOpening && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center animate-pulse text-cyan-400">
                  <Package size={64} className="mb-4 animate-bounce" />
                  <p className="font-bold uppercase tracking-widest">Ripping Pack...</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <AnimatePresence>
                {!isOpening && openedCards.map((card, idx) => (
                  <motion.div 
                    key={card.id + idx}
                    initial={{ opacity: 0, scale: 0.8, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, type: "spring" }}
                    className="group relative cursor-pointer"
                    onDoubleClick={() => setZoomedCard(card.imageUrl)}
                  >
                    <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                    <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-[2.5/3.5] bg-slate-800 border border-white/10">
                      <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                      
                      {/* Rarity Badge */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 whitespace-nowrap shadow-xl">
                        {card.rarity === 'Legendary' || card.rarity === 'Secret' || card.rarity === 'Mythic Rare' ? (
                          <Star size={12} className="text-amber-400" />
                        ) : null}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${card.rarity === 'Legendary' ? 'text-amber-400' : card.rarity === 'Secret' ? 'text-fuchsia-400' : 'text-white'}`}>
                          {card.rarity}
                        </span>
                      </div>
                    </div>
                    {/* Price Tag */}
                    <div className="mt-2 text-center">
                      <p className="text-xs font-black text-emerald-400">
                        {selectedGame === 'NARUTO' ? (
                          <span className="text-slate-500">N/A</span>
                        ) : (
                          `€${(Number(card.price) || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {!isOpening && openedCards.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 font-bold uppercase tracking-widest mt-20">
                <Package size={48} className="mb-4 opacity-50" />
                Select a game and crack a pack to see the magic.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomedCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setZoomedCard(null)}
          >
            <motion.img 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={zoomedCard} 
              alt="Zoomed" 
              className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.5)] border border-white/20" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
