import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Sparkles, Star, PackageOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PackOpenerProps {
  pulls: any[];
  productName?: string;
  onClose: () => void;
  onSave?: () => Promise<void>; // if provided, shows the "Save to Vault" button
}

export default function PackOpener({ pulls, productName = "Booster Pack", onClose, onSave }: PackOpenerProps) {
  const [revealIndex, setRevealIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true); // Flip over
      
      // Optional: trigger mini confetti for high rarity
      const currentCard = pulls[revealIndex];
      const isRare = currentCard.rarity === 'Legendary' || currentCard.rarity === 'Secret' || currentCard.rarity === 'Mythic Rare';
      if (isRare) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#ec4899', '#06b6d4']
        });
      }
    } else {
      setIsFlipped(false); // Reset flip
      setTimeout(() => setRevealIndex(prev => prev + 1), 300); // Move to next card precisely halfway through the 600ms flip
    }
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  if (!pulls || pulls.length === 0) return null;

  const isComplete = revealIndex >= pulls.length;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[500px] relative z-10">
      
      {!isComplete ? (
        <div className="flex flex-col items-center w-full">
          <div className="text-cyan-400 font-bold tracking-widest text-xs uppercase mb-8 flex items-center gap-2 bg-cyan-950/50 px-4 py-2 rounded-full border border-cyan-500/20">
            <Sparkles size={14} /> Card {revealIndex + 1} of {pulls.length}
          </div>
          
          {/* 3D Flip Container */}
          <div 
            className="relative w-64 h-80 sm:w-80 sm:h-[450px] cursor-pointer group" 
            style={{ perspective: '1000px' }}
            onClick={handleCardClick}
          >
            <motion.div 
              className="w-full h-full relative transition-all duration-300 group-hover:scale-105"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front of Card (Face Down / Card Back) */}
              <div className="absolute inset-0 w-full h-full bg-slate-800 rounded-2xl border-2 border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center backface-hidden overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 opacity-80" />
                <img src="https://i.imgur.com/B06rBhI.png" alt="Card Back" className="w-full h-full object-cover rounded-xl opacity-60" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-slate-950/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-2xl flex items-center gap-2 transform transition-transform group-hover:scale-110">
                    <span className="text-white font-black tracking-widest text-sm shadow-black drop-shadow-md">CLICK TO REVEAL</span>
                  </div>
                </div>
              </div>
              
              {/* Back of Card (Face Up / Revealed) */}
              <div className="absolute inset-0 w-full h-full rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.4)] backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-emerald-500 rounded-2xl opacity-50 blur-md"></div>
                <img 
                  src={pulls[revealIndex].imageUrl || 'https://i.imgur.com/B06rBhI.png'} 
                  alt={pulls[revealIndex].name} 
                  className="relative w-full h-full object-cover rounded-2xl border-2 border-white/20"
                />
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
                  transition={{ delay: 0.3 }}
                  className="absolute -bottom-20 left-0 right-0 text-center"
                >
                  <h3 className="text-white font-black text-2xl drop-shadow-lg line-clamp-1 px-4">{pulls[revealIndex].name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {pulls[revealIndex].setCode && (
                      <span className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-slate-300 font-black uppercase text-[10px]">
                        {pulls[revealIndex].setCode} {pulls[revealIndex].collectorNumber ? `· ${pulls[revealIndex].collectorNumber}` : ''}
                      </span>
                    )}
                    <span className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-emerald-400 font-bold text-sm">
                      €{(pulls[revealIndex].price || 0).toFixed(2)}
                    </span>
                    {pulls[revealIndex].rarity && (
                       <span className="bg-slate-900/80 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-fuchsia-400 font-bold uppercase text-xs flex items-center gap-1">
                         <Star size={12} /> {pulls[revealIndex].rarity}
                       </span>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        // End of Pack Summary
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center w-full max-w-4xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-cyan-500/20 rounded-full mb-4">
              <PackageOpen size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2">Pack Complete!</h2>
            <p className="text-slate-400 text-lg">Here is your haul from {productName}</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-h-[50vh] overflow-y-auto p-4 border border-white/5 rounded-3xl bg-slate-900/50 shadow-inner">
            <AnimatePresence>
              {pulls.map((c, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-slate-800 rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/50 flex flex-col items-center p-3 relative hover:-translate-y-1 transition-all shadow-lg hover:shadow-cyan-500/20"
                >
                  <img src={c.imageUrl || 'https://i.imgur.com/B06rBhI.png'} alt={c.name} className="w-full aspect-[2.5/3.5] object-cover rounded-xl mb-3 shadow-md" />
                  
                  {/* Rarity pip */}
                  {c.rarity && (
                    <div className="absolute top-2 left-2 right-2 flex justify-center">
                      <span className="bg-black/80 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/10 shadow-xl line-clamp-1">
                        {c.rarity}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col items-center mb-1">
                    <p className="text-white font-bold text-xs text-center line-clamp-2 w-full">{c.name}</p>
                    {(c.setCode || c.collectorNumber) && (
                      <span className="text-[9px] text-slate-500 font-black uppercase mt-0.5">
                        [{c.setCode}{c.setCode && c.collectorNumber ? ' · ' : ''}{c.collectorNumber ? `#${c.collectorNumber}` : ''}]
                      </span>
                    )}
                  </div>
                  <p className="text-emerald-400 font-black text-xs bg-emerald-400/10 px-2 py-1 rounded-lg">€{(c.price || 0).toFixed(2)}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-xl">
            <button 
              onClick={onClose} 
              className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-colors border border-white/5"
            >
              Close Summary
            </button>
            {onSave && (
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} 
                {saving ? 'Saving to Vault...' : 'Add Pulls to Have List'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
