import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';
import PackOpener from '@/components/PackOpener';

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

import SealedActionModal from './SealedActionModal';
import EditSealedProductModal from './EditSealedProductModal';

export const getGameColor = (g: string) => {
  switch (g) {
    case 'MAGIC': return 'bg-amber-600 text-white';
    case 'POKEMON': return 'bg-yellow-500 text-black';
    case 'ONE_PIECE': return 'bg-blue-600 text-white';
    case 'NARUTO': return 'bg-orange-500 text-white';
    case 'LORCANA': return 'bg-purple-600 text-white';
    case 'RIFTBOUND': return 'bg-emerald-600 text-white';
    default: return 'bg-fuchsia-600 text-white';
  }
};

export default function SealedTab() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // High-Level State
  const [activeSubTab, setActiveSubTab] = useState<'GLOBAL' | 'VAULT'>('GLOBAL');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [editingSealed, setEditingSealed] = useState<any | null>(null);

  // Search & Pagination State
  const [game, setGame] = useState<Game | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSealed, setGlobalSealed] = useState<any[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // New Reference State
  const [showNewRef, setShowNewRef] = useState(false);
  const [newRef, setNewRef] = useState({ name: '', game: 'MAGIC', type: 'BOOSTER_BOX', setCode: '', edition: 'Unlimited', price: '', imageUrl: '' });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sealed/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchGlobalSealed = async (append = false, overridePage?: number) => {
    if (!append) setGlobalSealed([]);
    setLoadingGlobal(true);
    try {
      const currentPage = overridePage ?? (append ? page + 1 : 1);
      const gameParam = game;
      
      const params = new URLSearchParams();
      params.append('game', gameParam);
      if (searchQuery) params.append('q', searchQuery);
      params.append('page', currentPage.toString());
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(`/api/sealed/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newProducts = data.products || [];
        
        if (game === 'ALL' && !searchQuery && !append) {
           newProducts.sort(() => Math.random() - 0.5);
        }

        setGlobalSealed(prev => append ? [...prev, ...newProducts] : newProducts);
        setPage(currentPage);
        setHasMore(newProducts.length >= 24); 
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingGlobal(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'GLOBAL') {
      setPage(1);
      setHasMore(true);
      fetchGlobalSealed(false, 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, activeSubTab]);

  const handleSearch = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    setPage(1);
    setHasMore(true);
    fetchGlobalSealed(false, 1);
  };

  const handleAddToInventory = async (refId: string) => {
    try {
      const res = await fetch('/api/sealed/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sealedReferenceId: refId, condition: 'FACTORY_SEALED' })
      });
      if (res.ok) {
        alert('Added to your sealed vault!');
        fetchInventory();
        setSelectedProduct(null); 
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateRef = async () => {
    try {
      const res = await fetch('/api/sealed/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRef, name: `${newRef.name} [${newRef.edition}]` })
      });
      if (res.ok) {
        alert('Product added to Global Database!');
        setShowNewRef(false);
        fetchGlobalSealed();
      } else {
        alert('Failed to add product.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Sub-Tabs */}
      <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white flex items-center gap-2"><Box className="text-fuchsia-400" /> Sealed Product Hub</h2>
          <p className="text-slate-400 text-sm mt-1">Thousands of tracked products across 6 major TCGs. Crack packs, track your ETBs, and manage investments.</p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10 relative z-10">
          <button 
            onClick={() => setActiveSubTab('GLOBAL')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'GLOBAL' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Global Database
          </button>
          <button 
            onClick={() => setActiveSubTab('VAULT')}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeSubTab === 'VAULT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Your Vault <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-xs">{inventory.length}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <SealedActionModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddVault={handleAddToInventory} />
        )}
        {editingSealed && (
          <EditSealedProductModal 
            instance={editingSealed} 
            onClose={() => { setEditingSealed(null); fetchInventory(); }} 
            onUpdate={() => { setEditingSealed(null); fetchInventory(); }} 
          />
        )}
      </AnimatePresence>

      {/* GLOBAL DATABASE VIEW */}
      {activeSubTab === 'GLOBAL' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* Filters & Search */}
          <div className="bg-slate-900 border border-fuchsia-500/20 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['ALL', 'POKEMON', 'MAGIC', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'].map(g => {
                const isActive = game === g;
                const baseColor = isActive ? (g === 'ALL' ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.3)]' : `${getGameColor(g)} shadow-lg scale-105`) : 'bg-slate-950 border border-white/10 text-slate-400 hover:border-white/30';
                return (
                  <button 
                    key={g} 
                    onClick={() => setGame(g as Game | 'ALL')} 
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${baseColor}`}
                  >
                    {g.replace('_', ' ')}
                  </button>
                );
              })}
            </div>
            
            <div className="flex-1 w-full md:min-w-[300px] flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search sealed products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">$</span>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-20 bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-fuchsia-500 placeholder:text-slate-600" 
                />
                <span className="text-slate-500 text-sm">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onKeyDown={handleSearch}
                  className="w-20 bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-fuchsia-500 placeholder:text-slate-600" 
                />
              </div>
              <button onClick={() => { setPage(1); fetchGlobalSealed(false, 1); }} className="px-6 py-3 bg-fuchsia-600/20 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white font-black rounded-xl transition-all border border-fuchsia-500/30 shrink-0">
                Search
              </button>
            </div>
          </div>

          {/* Strict Grid Layout (No warped buttons) */}
          {loadingGlobal && globalSealed.length === 0 ? (
            <div className="py-20 flex justify-center text-fuchsia-500"><Loader2 className="animate-spin" size={36} /></div>
          ) : globalSealed.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-white/5">
              <p className="text-slate-400 text-lg font-bold">No products found matching your criteria.</p>
              <button onClick={() => setShowNewRef(!showNewRef)} className="px-4 py-2 mt-4 border border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-lg text-sm font-bold">
                Create New Product Definition
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {globalSealed.map(res => (
                  <div 
                    key={res.id} 
                    onClick={() => setSelectedProduct(res)}
                    className="flex flex-col h-[380px] bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:border-fuchsia-500/50 hover:shadow-[0_0_20px_rgba(217,70,239,0.2)] transition-all cursor-pointer group"
                  >
                    {/* Fixed Height Image Container */}
                    <div className="h-[200px] w-full bg-slate-950 relative p-4 flex items-center justify-center shrink-0 border-b border-white/5">
                      {res.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={res.imageUrl} alt={res.name} className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <Box size={48} className="text-slate-800" />
                      )}
                      
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className={`${getGameColor(res.game)} text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg backdrop-blur-sm`}>
                          {res.game.replace('_', ' ')}
                        </span>
                        {res.setCode && (
                          <span className="bg-slate-800/90 text-slate-300 text-[9px] font-black uppercase px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
                            SET: {res.setCode}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Fixed Flex Content Container */}
                    <div className="p-4 flex flex-col flex-1 bg-slate-900">
                      <p className="text-[10px] text-fuchsia-400 uppercase tracking-widest font-black mb-1 shrink-0">{res.type?.replace('_', ' ') || 'OTHER'}</p>
                      <h3 className="text-white font-bold text-sm line-clamp-2 leading-snug">{res.name}</h3>
                      
                      {/* Pushes price & buttons to the absolute bottom of the card */}
                      <div className="mt-auto pt-3 flex items-end justify-between shrink-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Market</span>
                          <span className="text-emerald-400 font-black text-lg leading-none">
                            {res.price ? `€${res.price.toFixed(2)}` : 'N/A'}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToInventory(res.id); }} 
                          className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center gap-2 transition-colors font-bold text-xs border border-white/10"
                        >
                          <Plus size={16} /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {hasMore && (
                <button
                  onClick={() => fetchGlobalSealed(true)}
                  disabled={loadingGlobal}
                  className="w-full py-4 mt-6 bg-slate-900 border border-white/10 hover:bg-slate-800 text-fuchsia-400 font-black tracking-widest uppercase text-sm rounded-xl transition-colors disabled:opacity-50"
                >
                  {loadingGlobal ? 'Loading More Products...' : 'Load More Products'}
                </button>
              )}
            </>
          )}

          {showNewRef && (
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900 border border-fuchsia-500/30 p-6 rounded-2xl shadow-xl">
              <input type="text" placeholder="Product Name (e.g. Base Set Booster Box)" value={newRef.name} onChange={e => setNewRef({...newRef, name: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
              <select value={newRef.type} onChange={e => setNewRef({...newRef, type: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                <option value="BOOSTER_BOX">Booster Box</option>
                <option value="ELITE_TRAINER_BOX">Elite Trainer Box / Bundle</option>
                <option value="BLISTER">Blister Pack</option>
                <option value="CASE">Sealed Case</option>
                <option value="OTHER">Other</option>
              </select>
              <select value={newRef.edition} onChange={e => setNewRef({...newRef, edition: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
                <option value="Unlimited">Unlimited / Standard</option>
                <option value="1st Edition">1st Edition</option>
                <option value="Shadowless">Shadowless</option>
                <option value="Alpha/Beta">Alpha/Beta</option>
                <option value="Promo">Promo</option>
              </select>
              <input type="text" placeholder="Set Code (e.g. BS)" value={newRef.setCode} onChange={e => setNewRef({...newRef, setCode: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
              <input type="number" step="any" placeholder="Estimated Market Price (€)" value={newRef.price} onChange={e => setNewRef({...newRef, price: e.target.value})} className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
              <button onClick={handleCreateRef} className="md:col-span-2 px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl mt-2">
                Submit to Global Database
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* YOUR VAULT VIEW */}
      {activeSubTab === 'VAULT' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-full py-10 flex justify-center text-emerald-500"><Loader2 className="animate-spin" size={32} /></div>
            ) : inventory.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-2xl border border-white/5 text-slate-500">
                <Box size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">Your sealed vault is empty.</p>
                <p className="text-sm mt-1">Switch to the Global Database tab to search and add products.</p>
              </div>
            ) : (
              inventory.map(inst => (
                <div 
                  key={inst.id} 
                  onClick={() => setEditingSealed && setEditingSealed(inst)} 
                  className="flex flex-col h-[380px] bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/50 transition-all group cursor-pointer relative"
                >
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 pointer-events-none backdrop-blur-sm">
                    <span className="text-white font-black tracking-widest text-sm uppercase px-4 py-2 border-2 border-white/20 rounded-xl">Click to Manage</span>
                  </div>
                  
                  <div className="h-[200px] w-full bg-slate-950 relative p-4 flex items-center justify-center shrink-0 border-b border-white/5">
                    {inst.customImageUrl || inst.sealedReference?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={inst.customImageUrl || inst.sealedReference.imageUrl} alt={inst.sealedReference?.name} className="max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <Box size={48} className="text-slate-800" />
                    )}
                    <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                      {inst.sealedReference?.game.replace('_', ' ') || 'UNKNOWN'}
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1 bg-slate-900">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1 shrink-0">{inst.sealedReference?.type?.replace('_', ' ')}</p>
                    <h3 className="text-white font-bold text-sm line-clamp-2 leading-snug">{inst.sealedReference?.name}</h3>
                    
                    <div className="mt-auto pt-3 flex justify-between items-end border-t border-white/5 shrink-0">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Condition</p>
                        <p className="text-xs text-white font-bold">{inst.condition.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Market Price</p>
                        <p className="text-base text-emerald-400 font-black leading-none">
                          {inst.sealedReference?.price ? `€${inst.sealedReference.price.toFixed(2)}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
