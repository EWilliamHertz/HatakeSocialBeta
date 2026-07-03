import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import PackOpener from '@/components/PackOpener';
import ListForSaleModal from '@/components/ListForSaleModal';
import BulkEditModal from '@/components/BulkEditModal';

type Game = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO' | 'LORCANA' | 'RIFTBOUND';
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
  prices?: any;
};

import EditCollectionCardModal from './EditCollectionCardModal';
import EditSealedProductModal from './EditSealedProductModal';

export default function YourCollectionTab({ instances, sealedInstances = [] }: { instances: any[], sealedInstances?: any[] }) {
  const [showFoilOnly, setShowFoilOnly] = useState(false);
  const [showSealedProducts, setShowSealedProducts] = useState(false);
  const [conditionFilter, setConditionFilter] = useState('ALL');
  const [gamesFilter, setGamesFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('PRICE_DESC');
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [statsMode, setStatsMode] = useState(false);
  
  // Mock pseudo-random daily delta (-7.5% to +7.5%) based on card ID
  const getDailyDelta = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
    const val = Math.abs(hash) % 1500;
    return (val / 100) - 7.5;
  };
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingCard, setEditingCard] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSealed, setEditingSealed] = useState<any | null>(null);

  // Available games in collection
  const availableGames = Array.from(new Set(instances.map(inst => inst.cardReference.game)));

  const handleGameToggle = (g: string) => {
    if (gamesFilter.includes(g)) {
      setGamesFilter(gamesFilter.filter(x => x !== g));
    } else {
      setGamesFilter([...gamesFilter, g]);
    }
  };

  const toggleSelectCard = (id: string) => {
    const newSet = new Set(selectedCards);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedCards(newSet);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Warning: Are you completely sure you want to delete all ${selectedCards.size} selected items from your vault? This reset cannot be undone.`)) return;
    try {
      const res = await fetch('/api/collection/delete-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedCards) })
      });
      if (res.ok) {
        alert('Selection permanently deleted from database.');
        setSelectedCards(new Set());
        window.location.reload();
      }
    } catch {
      alert('Failed to process bulk deletion network vector.');
    }
  };

  // Filter instances
  const processedInstances = instances.filter(inst => {
    if (showFoilOnly && !inst.isFoil) return false;
    if (conditionFilter !== 'ALL' && inst.condition !== conditionFilter) return false;
    if (gamesFilter.length > 0 && !gamesFilter.includes(inst.cardReference.game)) return false;
    return true;
  });

  const getPrice = (inst: any) => {
    let p = inst.cardReference.price || 0;
    if (inst.isFoil || inst.isHolo) p = inst.cardReference.foilPrice || p;
    if (inst.isReverseHolo) p = inst.cardReference.reverseHoloPrice || inst.cardReference.foilPrice || p;
    
    let conditionMultiplier = 1.0;
    if (inst.condition === 'MINT') conditionMultiplier = 1.2;
    if (inst.condition === 'LIGHTLY_PLAYED') conditionMultiplier = 0.8;
    if (inst.condition === 'MODERATELY_PLAYED') conditionMultiplier = 0.65;
    if (inst.condition === 'HEAVILY_PLAYED') conditionMultiplier = 0.45;
    if (inst.condition === 'DAMAGED') conditionMultiplier = 0.25;

    let calculated = p * conditionMultiplier;
    if (inst.isSigned) calculated += 8.00;
    
    return calculated;
  };

  // Sort instances
  processedInstances.sort((a, b) => {
    const priceA = getPrice(a) * (a.quantity || 1);
    const priceB = getPrice(b) * (b.quantity || 1);
    
    if (sortBy === 'PRICE_DESC') return priceB - priceA;
    if (sortBy === 'PRICE_ASC') return priceA - priceB;
    if (sortBy === 'NAME_ASC') return a.cardReference.name.localeCompare(b.cardReference.name);
    return 0; 
  });

  const totalDeltaDollar = processedInstances.reduce((acc, inst) => {
    const price = getPrice(inst) * (inst.quantity || 1);
    const pct = getDailyDelta(inst.cardReference.id);
    return acc + (price * (pct / 100));
  }, 0);

  if (instances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Filter size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-white mb-2">No Cards Owned</h2>
        <p>Search &quot;All Cards&quot; and add them to your Have list.</p>
      </div>
    );
  }

  const selectedInstancesData = instances.filter(i => selectedCards.has(i.id));

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {showBulkModal && (
          <ListForSaleModal 
            instances={selectedInstancesData} 
            onClose={() => setShowBulkModal(false)} 
            onList={() => {
              setShowBulkModal(false);
              setSelectedCards(new Set());
              window.location.reload();
            }} 
          />
        )}
        {showBulkEditModal && (
          <BulkEditModal
            selectedIds={Array.from(selectedCards)}
            onClose={() => setShowBulkEditModal(false)}
            onComplete={() => {
              setShowBulkEditModal(false);
              setSelectedCards(new Set());
              window.location.reload();
            }}
          />
        )}
        {editingCard && (
          <EditCollectionCardModal 
            instance={editingCard} 
            onClose={() => setEditingCard(null)} 
            onComplete={() => {
              setEditingCard(null);
              window.location.reload();
            }} 
          />
        )}
        {editingSealed && (
          <EditSealedProductModal 
            instance={editingSealed} 
            onClose={() => setEditingSealed(null)} 
            onComplete={() => {
              setEditingSealed(null);
              window.location.reload();
            }} 
          />
        )}
      </AnimatePresence>

      {/* Filters & Bulk Action Header */}
      <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col gap-6 relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-cyan-400" />
            <span className="text-lg font-black text-white tracking-wider">COLLECTION VAULT FILTERS</span>
          </div>
          
          <div className="flex gap-4 items-center flex-wrap">
            {statsMode && (
              <div className={`text-sm font-black tracking-wider px-3 py-1 rounded bg-slate-950 border border-white/10 ${totalDeltaDollar >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                24H: {totalDeltaDollar >= 0 ? '+' : ''}${Math.abs(totalDeltaDollar).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </div>
            )}
            <button
              onClick={() => setStatsMode(!statsMode)}
              className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${statsMode ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <TrendingUp size={14} className="inline mr-1" /> Stats
            </button>

            {/* Unified Master State Action Bar */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 items-center gap-3">
              <button
                onClick={() => {
                  if (selectedCards.size === processedInstances.length) setSelectedCards(new Set());
                  else setSelectedCards(new Set(processedInstances.map(i => i.id)));
                }}
                className={`w-5 h-5 ml-2 rounded border transition-all flex items-center justify-center ${selectedCards.size === processedInstances.length ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-white/30 bg-slate-900 hover:border-cyan-500'}`}
              >
                {selectedCards.size === processedInstances.length && <Check size={12} />}
              </button>
              
              <button 
                onClick={() => {
                  if (selectedCards.size === processedInstances.length) setSelectedCards(new Set());
                  else setSelectedCards(new Set(processedInstances.map(i => i.id)));
                }}
                className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white pr-2 border-r border-white/10"
              >
                {selectedCards.size === processedInstances.length ? 'Deselect All' : 'Select All'}
              </button>

              <AnimatePresence>
                {selectedCards.size > 0 && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="flex items-center gap-1 overflow-hidden pl-1">
                    <button 
                      onClick={() => setShowBulkEditModal(true)} 
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 font-bold text-xs rounded border border-white/5 whitespace-nowrap"
                    >
                      Edit ({selectedCards.size})
                    </button>
                    <button 
                      onClick={handleBulkDelete} 
                      className="px-3 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold text-xs rounded border border-red-500/20 whitespace-nowrap"
                    >
                      Delete All
                    </button>
                    <button 
                      onClick={() => setShowBulkModal(true)} 
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded shadow whitespace-nowrap"
                    >
                      Sell Selection
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-wrap gap-2 mr-4 items-center">
            {availableGames.map(g => (
              <button
                key={g as string}
                onClick={() => handleGameToggle(g as string)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase border transition-all ${
                  gamesFilter.includes(g as string)
                    ? 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 border-transparent text-white shadow-md'
                    : 'bg-slate-950 border-white/10 text-slate-400 hover:border-white/30'
                }`}
              >
                {String(g).replace('_', ' ')}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-4 py-2 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-colors">
            <input type="checkbox" checked={showFoilOnly} onChange={e => setShowFoilOnly(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
            <span className="text-sm font-bold text-slate-300">Foil Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-4 py-2 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-colors">
            <input type="checkbox" checked={showSealedProducts} onChange={e => setShowSealedProducts(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
            <span className="text-sm font-bold text-slate-300">Include Sealed</span>
          </label>
          
          <select 
            value={conditionFilter}
            onChange={e => setConditionFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Conditions</option>
            <option value="MINT">Mint</option>
            <option value="NEAR_MINT">Near Mint</option>
            <option value="LIGHTLY_PLAYED">Lightly Played</option>
            <option value="MODERATELY_PLAYED">Moderately Played</option>
            <option value="HEAVILY_PLAYED">Heavily Played</option>
            <option value="DAMAGED">Damaged</option>
          </select>

          <div className="ml-auto flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-white/10">
             <span className="text-sm text-slate-400 font-bold">Sort By:</span>
             <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-sm text-white outline-none font-bold cursor-pointer"
            >
              <option value="PRICE_DESC">Highest Price</option>
              <option value="PRICE_ASC">Lowest Price</option>
              <option value="NAME_ASC">Name (A-Z)</option>
              <option value="NEWEST">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {processedInstances.length === 0 ? (
        <div className="text-center text-slate-500 py-10 font-bold">No cards match your filters.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {processedInstances.map((inst) => (
            <div 
              key={inst.id} 
              className={`relative group flex flex-col p-2 rounded-2xl transition-all ${selectedCards.has(inst.id) ? 'bg-cyan-500/10 border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border border-transparent'}`}
            >
              <div 
                className="absolute top-4 right-4 z-10 cursor-pointer" 
                onClick={(e) => { e.stopPropagation(); toggleSelectCard(inst.id); }}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCards.has(inst.id) ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-white/30 bg-black/50 hover:border-cyan-500'}`}>
                  {selectedCards.has(inst.id) && <Check size={14} />}
                </div>
              </div>

              <div 
                onClick={() => setEditingCard(inst)}
                className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-900 aspect-[2.5/3.5] mb-3 transition-all group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inst.customImageUrl || (inst.cardReference.imageUrl ? `/api/proxy?url=${encodeURIComponent(inst.cardReference.imageUrl)}` : null) || 'https://i.imgur.com/B06rBhI.png'} alt={inst.cardReference.name} className="w-full h-full object-cover" />
                
                {/* Overlay Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <span className="bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-[10px] font-black uppercase text-white tracking-wider">
                    {inst.condition.replace('_', ' ')}
                  </span>
                  {inst.isFoil && (
                    <span className="bg-gradient-to-r from-amber-200 to-yellow-500 px-2 py-1 rounded text-[10px] font-black uppercase text-black tracking-wider shadow-lg">
                      FOIL
                    </span>
                  )}
                  {(inst.quantity || 1) > 1 && (
                    <span className="bg-cyan-600 px-2 py-1 rounded text-[10px] font-black uppercase text-white tracking-wider shadow-lg">
                      x{inst.quantity || 1}
                    </span>
                  )}
                  {inst.isSigned && (
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded border border-pink-500/50 text-[10px] font-black uppercase text-white tracking-wider shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                      SIGNED
                    </span>
                  )}
                </div>
                {/* Edit overlay on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white font-bold tracking-widest text-sm uppercase">Click to Edit</span>
                </div>
              </div>
              
              <div className="flex justify-between items-start gap-2 mt-1">
                <h3 className="font-bold text-white truncate text-sm flex-1">{inst.cardReference.name}</h3>
                {(() => {
                  const setCode = inst.cardReference.setCode;
                  // Scryfall payload has collector_number, TCGCSV has collectorNumber (but usually we don't have it for TCGCSV)
                  // For MTG, it's in the payload. But actually, we don't have collectorNumber on the root schema.
                  const payload: any = inst.cardReference.apiPayload || {};
                  const collectorNumber = payload.collector_number || payload.collectorNumber;
                  
                  if (setCode || collectorNumber) {
                    return (
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                        {setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              {inst.notes && (
                <div className="mt-1 text-[10px] text-slate-400 italic line-clamp-1 border-l-2 border-cyan-500/50 pl-2">
                  {inst.notes}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex flex-col">
                  <p className="text-emerald-400 font-black text-sm">
                    {inst.cardReference.game === 'NARUTO' ? (
                      <span className="text-slate-500">N/A</span>
                    ) : (
                      (() => {
                        const finalPrice = getPrice(inst);
                        if (inst.cardReference.game === 'POKEMON' && (finalPrice === 0 || finalPrice === 0.3)) {
                          return <span className="text-slate-500">N/A</span>;
                        }
                        return `€${finalPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                      })()
                    )}
                  </p>
                  {statsMode && inst.cardReference.game !== 'NARUTO' && !(inst.cardReference.game === 'POKEMON' && (inst.cardReference.price === 0 || inst.cardReference.price === 0.3)) && (() => {
                    const delta = getDailyDelta(inst.cardReference.id);
                    const isPos = delta >= 0;
                    return (
                      <p className={`text-[10px] font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                        {isPos ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}%
                      </p>
                    );
                  })()}
                  {(inst.quantity || 1) > 1 && (
                    <p className="text-[9px] text-slate-500 font-bold tracking-wider mt-1">
                      TOTAL: €{(getPrice(inst) * (inst.quantity || 1)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCard(inst);
                    }}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded text-[10px] font-bold text-white transition-colors shadow"
                  >
                    EDIT
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCards(new Set([inst.id]));
                      setShowBulkModal(true);
                    }}
                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-[10px] font-bold text-white transition-colors shadow"
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSealedProducts && sealedInstances.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4 flex items-center gap-2"><Box /> Your Sealed Vault</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sealedInstances.map(inst => (
              <div key={inst.id} onClick={() => setEditingSealed(inst)} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-fuchsia-500/30 transition-all group cursor-pointer relative">
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10 pointer-events-none">
                  <span className="text-white font-bold tracking-widest text-sm uppercase">Click to Edit</span>
                </div>
                <div className="aspect-[4/3] bg-slate-950 relative p-4 flex items-center justify-center">
                  {inst.customImageUrl || inst.sealedReference.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inst.customImageUrl || inst.sealedReference.imageUrl} alt={inst.sealedReference.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                  ) : (
                    <Box size={64} className="text-slate-800" />
                  )}
                  <div className="absolute top-3 left-3 bg-fuchsia-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg">
                    {inst.sealedReference.game.replace('_', ' ')}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white text-sm line-clamp-2 mb-1">{inst.sealedReference.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest mb-3">{inst.sealedReference.type.replace('_', ' ')}</p>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Condition</p>
                      <p className="text-xs text-white">{inst.condition.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Market Price</p>
                      <p className="text-sm text-emerald-400 font-black">
                        {inst.sealedReference.price ? `€${inst.sealedReference.price.toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
