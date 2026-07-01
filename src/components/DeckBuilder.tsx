'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Layers, Plus, Minus, Search, BarChart3, PieChart, FileText, Loader2, Globe, X, Check, Filter, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DeckCard = {
  id: string; // cardReferenceId or apiId
  name: string;
  imageUrl: string;
  price: number;
  cmc?: number;
  maxAvailable: number; // in inventory
};

export function DeckBuilder({ initialDeck, onBack }: { initialDeck: any, onBack: () => void }) {
  const [selectedGames, setSelectedGames] = useState<string[]>([initialDeck?.game || 'MAGIC']);
  
  // Deck Metadata
  const [deckName, setDeckName] = useState(initialDeck?.name || 'New Deck');
  const [deckFormat, setDeckFormat] = useState(initialDeck?.format || 'Standard');
  const [isPublic, setIsPublic] = useState(initialDeck?.isPublic || false);
  const [saving, setSaving] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState(true);
  const [searchingGlobal, setSearchingGlobal] = useState(false);
  
  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    oracle: '',
    power: '',
    toughness: '',
    colors: '',
    weakness: '',
    language: ''
  });
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [availableCards, setAvailableCards] = useState<Record<string, DeckCard>>({});
  const [deckCounts, setDeckCounts] = useState<Record<string, number>>({});
  
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importing, setImporting] = useState(false);

  // Fetch user's inventory initially
  useEffect(() => {
    async function fetchInventory() {
      try {
        const res = await fetch('/api/collection/my');
        if (res.ok) {
          const data = await res.json();
          const counts: Record<string, DeckCard> = {};
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.instances.forEach((inst: any) => {
            if (!selectedGames.includes(inst.cardReference.game)) return;
            const refId = inst.cardReferenceId;
            if (!counts[refId]) {
              counts[refId] = { 
                id: refId, 
                name: inst.cardReference.name,
                imageUrl: inst.cardReference.imageUrl,
                price: inst.cardReference.price || 0,
                cmc: inst.cardReference.apiPayload?.cmc || 0,
                maxAvailable: 0 
              };
            }
            counts[refId].maxAvailable += 1;
          });
          // Now load initial deck cards
          if (initialDeck?.cards) {
            const initCounts: Record<string, number> = {};
            const initCards = { ...counts }; // Start with what we found in inventory
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialDeck.cards.forEach((c: any) => {
              initCounts[c.id] = c.count;
              // If we didn't have it in inventory, we still need a visual placeholder
              if (!initCards[c.id]) {
                initCards[c.id] = {
                  id: c.id,
                  name: c.name,
                  imageUrl: c.imageUrl || '',
                  price: c.price || 0,
                  cmc: c.cmc || 0,
                  maxAvailable: 0
                };
              }
            });
            setDeckCounts(initCounts);
            setAvailableCards(initCards);
          } else {
             setAvailableCards(counts);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchInventory();
  }, [selectedGames, initialDeck]);

  const toggleGame = (game: string) => {
    if (selectedGames.includes(game)) {
      if (selectedGames.length > 1) {
        setSelectedGames(selectedGames.filter(g => g !== game));
      }
    } else {
      setSelectedGames([...selectedGames, game]);
    }
  };

  const handleGlobalSearch = async (append: boolean = false) => {
    if (!append && !globalSearch) return;
    
    setSearchingGlobal(true);
    
    if (!append) {
      setPage(1);
      setHasMore(true);
    }
    const currentPage = append ? page + 1 : 1;

    try {
      let allFoundCards: Record<string, DeckCard> = append ? { ...availableCards } : {};
      const selectedGame = selectedGames[0] || 'MAGIC';
      
      let url = `/api/collection/search?game=${selectedGame}&q=${encodeURIComponent(searchQuery)}&page=${currentPage}`;
      
      if (selectedGame === 'MAGIC') {
         if (advancedFilters.oracle) url += `&oracle=${encodeURIComponent(advancedFilters.oracle)}`;
         if (advancedFilters.power) url += `&power=${encodeURIComponent(advancedFilters.power)}`;
         if (advancedFilters.toughness) url += `&toughness=${encodeURIComponent(advancedFilters.toughness)}`;
         if (advancedFilters.colors) url += `&colors=${encodeURIComponent(advancedFilters.colors)}`;
         if (advancedFilters.language) url += `&language=${encodeURIComponent(advancedFilters.language)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.cards && data.cards.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.cards.forEach((c: any) => {
            if (!allFoundCards[c.apiId]) {
              allFoundCards[c.apiId] = {
                id: c.apiId,
                name: c.name,
                imageUrl: c.imageUrl,
                price: c.price,
                cmc: c.cmc,
                maxAvailable: 0
              };
            }
          });
          if (append) setPage(currentPage);
          if (data.cards.length < 50) setHasMore(false);
        } else {
          setHasMore(false);
        }
      }
      setAvailableCards(allFoundCards);
    } catch (err) {
      console.error(err);
    }
    setSearchingGlobal(false);
  };

  const handleImport = async () => {
    if (!pasteText) return;
    setImporting(true);
    
    const lines = pasteText.split('\n').filter(l => l.trim().length > 0 && l.trim().toLowerCase() !== 'sideboard' && l.trim().toLowerCase() !== 'deck');
    const parsed = lines.map(line => {
      const match = line.trim().match(/^(\d+)x?\s+(.+)$/i);
      if (match) return { count: parseInt(match[1]), name: match[2].trim() };
      return { count: 1, name: line.trim() };
    });

    try {
      // For simplicity, use the first selected game for import if multiple selected
      const game = selectedGames[0] || 'MAGIC';
      const res = await fetch('/api/collection/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, lines: parsed })
      });
      const data = await res.json();
      
      if (data.cards) {
        const newCards = { ...availableCards };
        const newDeckCounts = { ...deckCounts };
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.cards.forEach((c: any) => {
          // Look for an owned version of this card name in availableCards
          const ownedVariant = Object.values(availableCards).find(ac => ac.name.toLowerCase() === c.name.toLowerCase() && ac.maxAvailable > 0);
          
          const targetApiId = ownedVariant ? ownedVariant.id : c.apiId;

          if (!newCards[targetApiId]) {
            newCards[targetApiId] = {
              id: targetApiId,
              name: c.name,
              imageUrl: c.imageUrl,
              price: c.price,
              cmc: c.cmc,
              maxAvailable: 0
            };
          }
          
          const requested = parsed.find(p => p.name.toLowerCase() === c.name.toLowerCase());
          if (requested) {
             newDeckCounts[targetApiId] = (newDeckCounts[targetApiId] || 0) + requested.count;
          }
        });
        
        setAvailableCards(newCards);
        setDeckCounts(newDeckCounts);
        setShowPasteModal(false);
        setPasteText('');
      } else {
        alert('Could not import some cards.');
      }
    } catch (err) {
      console.error(err);
      alert('Import failed due to a network error.');
    }
    setImporting(false);
  };

  const handleAdd = (id: string) => {
    const current = deckCounts[id] || 0;
    setDeckCounts({ ...deckCounts, [id]: current + 1 });
  };

  const handleRemove = (id: string) => {
    const current = deckCounts[id] || 0;
    if (current > 0) {
      const updated = { ...deckCounts, [id]: current - 1 };
      if (updated[id] === 0) delete updated[id];
      setDeckCounts(updated);
    }
  };

  const totalCardsInDeck = Object.values(deckCounts).reduce((a, b) => a + b, 0);
  const totalDeckPrice = Object.entries(deckCounts).reduce((sum, [id, count]) => {
    return sum + (availableCards[id]?.price || 0) * count;
  }, 0);

  const displayedCards = Object.values(availableCards).filter(c => {
    if (deckCounts[c.id] && deckCounts[c.id] > 0) return true;
    if (!searchQuery && !globalSearch) return c.maxAvailable > 0;
    if (!searchQuery && globalSearch) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      <div className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Header / Announcement */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={onBack} className="w-12 h-12 flex-shrink-0 bg-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white shadow-xl transition-all">
              <X size={24} />
            </button>
            <div className="flex-1">
              <input 
                type="text" 
                value={deckName}
                onChange={e => setDeckName(e.target.value)}
                className="text-3xl md:text-4xl font-black text-white bg-transparent outline-none w-full placeholder:text-slate-700" 
                placeholder="Deck Name..."
              />
              <div className="flex gap-4 mt-2">
                <select value={deckFormat} onChange={e => setDeckFormat(e.target.value)} className="bg-slate-950 border border-white/10 text-slate-300 text-sm rounded-lg px-2 py-1 outline-none">
                  <option value="Standard">Standard</option>
                  <option value="Modern">Modern</option>
                  <option value="Commander">Commander</option>
                  <option value="Pioneer">Pioneer</option>
                  <option value="Casual">Casual</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-indigo-500" />
                  <span className="text-sm font-bold text-slate-300">Public (Community)</span>
                </label>
              </div>
            </div>
          </div>
          <button 
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                // Prepare cards JSON
                const cardsPayload = Object.entries(deckCounts).filter(([_, count]) => count > 0).map(([id, count]) => ({
                   id, count, 
                   name: availableCards[id]?.name,
                   imageUrl: availableCards[id]?.imageUrl,
                   price: availableCards[id]?.price,
                   cmc: availableCards[id]?.cmc
                }));

                const res = await fetch('/api/decks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: initialDeck?.id,
                    name: deckName,
                    game: selectedGames[0],
                    format: deckFormat,
                    isPublic,
                    cards: cardsPayload
                  })
                });
                if (res.ok) alert('Deck saved successfully!');
                else alert('Error saving deck.');
              } catch (e) { console.error(e); }
              setSaving(false);
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Save Deck
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Deck List & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-white">Current Deck</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Cards</p>
                  <p className="text-2xl font-black text-white">{totalCardsInDeck}</p>
                </div>
                <div className="bg-slate-950 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-slate-500 font-bold uppercase mb-1">Value</p>
                  <p className="text-2xl font-black text-emerald-400">
                    {selectedGames[0] === 'NARUTO' ? (
                      <span className="text-slate-500 font-bold text-sm">N/A</span>
                    ) : (
                      `$${totalDeckPrice.toFixed(2)}`
                    )}
                  </p>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(deckCounts).map(([id, count]) => {
                  if (count === 0) return null;
                  const card = availableCards[id];
                  const isMissing = count > (card?.maxAvailable || 0);
                  return (
                    <div key={id} className={`flex justify-between items-center py-2 border-b border-white/5 last:border-0 group ${isMissing ? 'bg-red-900/10 -mx-2 px-2 rounded' : ''}`}>
                      <span className="text-slate-300 text-sm font-bold flex-1 truncate pr-4 flex items-center gap-2">
                        <span className="text-indigo-400 w-4">{count}x</span> 
                        <span className={isMissing ? 'text-red-400' : ''}>{card?.name}</span>
                        {isMissing && <span className="text-[9px] bg-red-500/20 text-red-400 px-1 rounded uppercase">Missing {count - (card?.maxAvailable||0)}</span>}
                      </span>
                      <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleRemove(id)} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-slate-400 hover:text-white"><Minus size={12} /></button>
                        <button onClick={() => handleAdd(id)} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-slate-400 hover:text-white"><Plus size={12} /></button>
                        <button onClick={() => {
                          const updated = { ...deckCounts };
                          delete updated[id];
                          setDeckCounts(updated);
                        }} className="w-6 h-6 bg-red-900/40 rounded flex items-center justify-center text-red-400 hover:text-white"><X size={12} /></button>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(deckCounts).length === 0 && (
                  <div className="text-center text-slate-500 py-8 text-sm">No cards added yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* Search & Vault */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl flex flex-col gap-6">
              
              {/* Controls */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
                
                {/* Multi-Game Select */}
                <div className="flex flex-wrap gap-2">
                  {['MAGIC', 'POKEMON', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'].map(game => (
                    <button 
                      key={game}
                      onClick={() => toggleGame(game)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedGames.includes(game) ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                    >
                      {game === 'MAGIC' ? 'MTG' : game}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPasteModal(true)}
                    className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-fuchsia-500/20"
                  >
                    <FileText size={16} /> Import Decklist
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search for any card..."
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch(false)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-cyan-500 shadow-inner" 
                    />
                    {searchingGlobal && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 animate-spin" />}
                  </div>
                  <button onClick={() => setShowAdvanced(!showAdvanced)} className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-bold transition-colors ${showAdvanced ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'}`}>
                    <Filter size={18} /> Filters
                  </button>
                  <button onClick={() => handleGlobalSearch(false)} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-cyan-500/20">
                    Search
                  </button>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="bg-slate-950 p-4 rounded-xl border border-white/5 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Oracle Text</label>
                          <input type="text" value={advancedFilters.oracle} onChange={e => setAdvancedFilters({...advancedFilters, oracle: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="e.g. Draw a card" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Power</label>
                          <input type="text" value={advancedFilters.power} onChange={e => setAdvancedFilters({...advancedFilters, power: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="e.g. >=4" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Toughness</label>
                          <input type="text" value={advancedFilters.toughness} onChange={e => setAdvancedFilters({...advancedFilters, toughness: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="e.g. 5" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weakness</label>
                          <input type="text" value={advancedFilters.weakness} onChange={e => setAdvancedFilters({...advancedFilters, weakness: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="e.g. Fire" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Language</label>
                          <select value={advancedFilters.language} onChange={e => setAdvancedFilters({...advancedFilters, language: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none">
                            <option value="">Any</option>
                            <option value="English">English</option>
                            <option value="Japanese">Japanese</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colors</label>
                          <input type="text" value={advancedFilters.colors} onChange={e => setAdvancedFilters({...advancedFilters, colors: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="e.g. WUBRG" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayedCards.map(data => {
                  const countInDeck = deckCounts[data.id] || 0;
                  const isMissing = countInDeck > data.maxAvailable;
                  
                  return (
                    <div key={data.id} className="relative group bg-slate-950 border border-white/5 rounded-2xl overflow-hidden p-2 flex flex-col hover:border-cyan-500/50 transition-colors">
                      <div className="relative aspect-[2.5/3.5] rounded-xl overflow-hidden mb-2">
                        <img src={data.imageUrl ? `/api/proxy?url=${encodeURIComponent(data.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png'} alt={data.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        
                        <div className={`absolute top-2 right-2 backdrop-blur-md px-2 py-1 rounded text-xs font-black text-white border z-10 ${isMissing ? 'bg-red-500/80 border-red-400' : 'bg-black/80 border-white/20'}`}>
                          {countInDeck}/{data.maxAvailable}
                        </div>
  
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                          <button onClick={() => handleRemove(data.id)} disabled={countInDeck === 0} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white flex items-center justify-center shadow-xl"><Minus size={20} /></button>
                          <button onClick={() => handleAdd(data.id)} className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-xl"><Plus size={20} /></button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                        <p className="text-xs font-bold text-white truncate max-w-[70%]" title={data.name}>{data.name}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">${(data.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
                {displayedCards.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                    <Search size={48} className="mb-4 opacity-30" />
                    <p>No cards match your search.</p>
                  </div>
                )}
              </div>
              
              {globalSearch && hasMore && displayedCards.length >= 50 && (
                <button onClick={() => handleGlobalSearch(true)} className="w-full mt-6 py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-cyan-400 font-bold rounded-xl transition-colors text-sm">
                  {searchingGlobal ? 'Loading...' : 'Load More Cards'}
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-xl w-full flex flex-col shadow-2xl relative"
            >
              <button onClick={() => setShowPasteModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2"><FileText /> Import Decklist</h2>
              <p className="text-slate-400 text-sm mb-6">Paste your decklist below. Format: "4 Lightning Bolt".</p>

              <textarea 
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="4 Brainstorm&#10;4 Force of Will&#10;..."
                className="w-full h-64 bg-slate-950 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-fuchsia-500 font-mono mb-6 resize-none"
              />

              <button 
                onClick={handleImport}
                disabled={importing || !pasteText}
                className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex justify-center items-center gap-2"
              >
                {importing ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Create & Import
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
