import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload, PackageOpen, Star } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import PackOpener from '@/components/PackOpener';

type CardData = {
  id: string;
  name: string;
  game: string;
  imageUrl: string;
  price: number;
  foilPrice?: number;
  reverseHoloPrice?: number;
  apiId?: string;
  setCode?: string;
  collectorNumber?: string;
  rarity?: string;
  prices?: any;
};

export default function SealedActionModal({ product, onClose, onAddVault }: { product: any, onClose: () => void, onAddVault?: (id: string) => void }) {
  const [cracking, setCracking] = useState(false);
  
  // Extract description if available from TCGCSV payload
  let productDescription = null;
  if (product.apiPayload && Array.isArray(product.apiPayload.extendedData)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const desc = product.apiPayload.extendedData.find((d: any) => d.name === 'Description');
    if (desc && desc.value) {
      productDescription = desc.value.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
    }
  }
  
  // Pack Simulator State
  const [packs, setPacks] = useState<any[][]>([]);
  const [activePackIndex, setActivePackIndex] = useState<number | null>(null);
  const [openedPackIndices, setOpenedPackIndices] = useState<number[]>([]);
  const [boxTotalValue, setBoxTotalValue] = useState(0);
  const [highestValuedCard, setHighestValuedCard] = useState<CardData | null>(null);

  const [savingPulls, setSavingPulls] = useState(false);

  const handleCrack = async () => {
    if (!product.setCode) {
      alert("This product is missing a Set Code, so the simulator doesn't know which cards to pull from.");
      return;
    }
    setCracking(true);
    
    let packCount = 1;
    const pType = (product.type || '').toUpperCase();
    if (pType.includes('BOOSTER_BOX') || pType.includes('DISPLAY')) packCount = 36; // Some displays are 24 but 36 is safe default
    else if (pType.includes('ELITE_TRAINER_BOX')) packCount = 9;
    else if (pType.includes('BUNDLE')) packCount = 6;
    else if (pType.includes('BOX')) packCount = 24;
    
    try {
      const res = await fetch(`/api/sealed/crack?setCode=${product.setCode}&game=${product.game}&packCount=${packCount}`);
      const data = await res.json();
      if (data.packs) {
        setPacks(data.packs);
        if (data.packs.length === 1) {
          setActivePackIndex(0); // auto-open if it's just 1 pack
        }
      } else {
        alert(data.error || 'Failed to connect to pull-rate database.');
      }
    } catch (e) {
      alert('Network error while simulating pack.');
    }
    setCracking(false);
  };

  const handlePackClose = () => {
    if (activePackIndex === null) return;
    
    // Process stats for the pack that was just opened
    const pack = packs[activePackIndex];
    let packValue = 0;
    let newHighest = highestValuedCard;
    
    for (const card of pack) {
      const price = card.price || 0;
      packValue += price;
      if (!newHighest || price > (newHighest.price || 0)) {
        newHighest = card;
      }
    }
    
    setBoxTotalValue(prev => prev + packValue);
    setHighestValuedCard(newHighest);
    
    setOpenedPackIndices(prev => [...prev, activePackIndex]);
    setActivePackIndex(null);
    
    // Auto-close if it was just a single pack
    if (packs.length === 1) {
      setPacks([]);
    }
  };


  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-5xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative my-auto min-h-[500px]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-[100] transition-colors">
          <X size={20} />
        </button>

        {activePackIndex !== null ? (
          // ─── ACTIVE PACK OPENING VIEW ───────────────────────────
          <div className="w-full flex flex-col items-center justify-center min-h-[500px]">
            <PackOpener 
              pulls={packs[activePackIndex]}
              productName={`${product.name} - Pack ${activePackIndex + 1}`}
              onClose={handlePackClose}
            />
          </div>
        ) : packs.length > 1 ? (
          // ─── BOX DASHBOARD VIEW ─────────────────────────────────
          <div className="w-full flex flex-col pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">{product.name}</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Pack Opener Dashboard</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 min-w-[130px]">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Rake Value</p>
                  <p className="text-emerald-400 font-black text-xl md:text-2xl">€{boxTotalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                {product.price && (
                  <div className={`bg-slate-950 border border-white/5 rounded-xl p-4 min-w-[130px]`}>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Net Profit/Loss</p>
                    <p className={`font-black text-xl md:text-2xl ${boxTotalValue >= product.price ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {boxTotalValue >= product.price ? '+' : '-'}€{Math.abs(boxTotalValue - product.price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  </div>
                )}
                <div className="bg-slate-950 border border-white/5 rounded-xl p-4 min-w-[130px]">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Packs Opened</p>
                  <p className="text-white font-black text-xl md:text-2xl">{openedPackIndices.length} / {packs.length}</p>
                </div>
              </div>
            </div>
            
            {highestValuedCard && (
              <div className="mb-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Star className="text-amber-400" size={24} />
                </div>
                <div>
                  <p className="text-amber-400/80 text-xs font-black uppercase tracking-widest">Highest Valued Pull</p>
                  <p className="text-white font-bold">{highestValuedCard.name}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-amber-400 font-black text-xl">€{(highestValuedCard.price || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4 mb-8">
              {packs.map((pack, idx) => {
                const isOpened = openedPackIndices.includes(idx);
                let packValue = 0;
                if (isOpened) {
                  packValue = pack.reduce((acc, card) => acc + (card.price || 0), 0);
                }
                return (
                  <div 
                    key={idx}
                    onClick={() => !isOpened && setActivePackIndex(idx)}
                    className={`relative aspect-[2.5/3.5] rounded-xl flex flex-col items-center justify-center transition-all ${isOpened ? 'bg-slate-950 border border-white/5 opacity-70' : 'bg-slate-800 border-2 border-cyan-500/30 hover:border-cyan-400 cursor-pointer hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] group'}`}
                  >
                    {!isOpened ? (
                      <>
                        <img 
                          src={product.imageUrl || 'https://i.imgur.com/B06rBhI.png'} 
                          className="absolute inset-0 w-full h-full object-cover opacity-30 rounded-xl group-hover:opacity-60 transition-opacity" 
                          alt="Pack"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent rounded-xl pointer-events-none" />
                        <span className="relative text-white drop-shadow-md font-black text-sm z-10 mt-auto mb-4 bg-slate-900/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">Pack {idx + 1}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Pack {idx + 1}</span>
                        <span className="text-emerald-400 font-black text-sm">€{packValue.toFixed(2)}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
          </div>
        ) : (
          // ─── DEFAULT SEALED INFO VIEW ───────────────────
          <>
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-8 border border-white/5 relative group">
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-fuchsia-600/20 text-fuchsia-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-fuchsia-500/30 tracking-widest">
                  {product.game.replace('_', ' ')}
                </span>
                {product.setCode && (
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border border-white/10 tracking-widest">
                    SET: {product.setCode}
                  </span>
                )}
              </div>
              <img 
                src={product.imageUrl || 'https://i.imgur.com/B06rBhI.png'} 
                alt={product.name} 
                className="max-h-[400px] w-auto object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-transform duration-500 group-hover:scale-105" 
              />
            </div>

            <div className="w-full md:w-1/2 flex flex-col justify-between py-2">
              <div>
                <p className="text-fuchsia-400 font-black text-xs uppercase tracking-widest mb-2">{product.type?.replace('_', ' ') || 'Sealed Product'}</p>
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">{product.name}</h2>
                <div className="flex items-end gap-3 mb-8">
                  <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Market Avg:</span>
                  <span className="text-emerald-400 font-black text-3xl">
                    {product.price ? `€${product.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'N/A'}
                  </span>
                </div>
                
                {productDescription && (
                  <div className="mb-4 text-slate-300 text-sm leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-white/10 max-h-48 overflow-y-auto">
                    <p className="font-bold text-fuchsia-400 mb-1 text-xs uppercase tracking-widest">Product Details</p>
                    {productDescription}
                  </div>
                )}
                
                <p className="text-slate-500 text-xs leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-white/5">
                  This global database entry tracks the market price for factory-sealed condition. Add it to your personal vault to track your inventory, or simulate a pack opening based on community pull rates.
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={handleCrack}
                  disabled={cracking}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex justify-center items-center gap-2"
                >
                  {cracking ? <Loader2 className="animate-spin" size={20} /> : <Box size={20} />} 
                  {cracking ? 'Generating Pulls...' : 'Crack Packs (Emulate Opening)'}
                </button>
                {onAddVault && (
                  <div className="flex gap-3">
                    <button onClick={() => onAddVault(product.id)} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <Check size={18} /> Add to Vault
                    </button>
                    <button className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all flex justify-center items-center gap-2 border border-white/5">
                      <Plus size={18} /> Add to Want List
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
