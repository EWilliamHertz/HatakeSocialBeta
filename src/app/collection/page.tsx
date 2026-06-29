'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';
import ListForSaleModal from '@/components/ListForSaleModal';
import BulkEditModal from '@/components/BulkEditModal';

type Tab = 'ALL_CARDS' | 'YOUR_COLLECTION' | 'SEALED';
type Game = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO' | 'LORCANA' | 'RIFTBOUND';

type CardData = {
  id: string;
  name: string;
  game: string;
  imageUrl: string;
  price: number;
  apiId?: string;
  setCode?: string;
  collectorNumber?: string;
  prices?: any;
};

export default function CollectionPage() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab === 'ALL_CARDS' || tab === 'SEALED') {
        return tab as Tab;
      }
    }
    return 'YOUR_COLLECTION';
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myInstances, setMyInstances] = useState<any[]>([]);
  const [mySealedInstances, setMySealedInstances] = useState<any[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    async function fetchMyCollection() {
      try {
        const res = await fetch('/api/collection/my');
        if (res.ok) {
          const data = await res.json();
          setMyInstances(data.instances || []);
          setMySealedInstances(data.sealedInstances || []);
        }
      } catch {
        // ignore
      }
    }
    fetchMyCollection();
  }, []);

  const totalValue = 
    myInstances.reduce((sum, inst) => sum + (inst.cardReference.price || 0), 0) +
    mySealedInstances.reduce((sum, inst) => sum + (inst.sealedReference?.price || 0), 0);
  
  const cardsOwnedCount = myInstances.length;
  const activeListingsCount = myInstances.filter(inst => 
    inst.marketListing && (inst.marketListing.status === 'ACTIVE' || inst.marketListing.status === 'IN_DEAL')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Header & Stats */}
        <div className="mb-12 border-b border-white/10 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2">
                {t('collection.title')}
              </h1>
              <p className="text-slate-400 text-lg">{t('collection.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/sales" className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2">
                <TrendingUp size={18} /> Handle Sales
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-colors">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{t('profile.value')}</p>
                <p className="text-3xl font-black text-emerald-400">€{totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-colors" onClick={() => setActiveTab('YOUR_COLLECTION')}>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{t('profile.inventory')}</p>
                <p className="text-3xl font-black text-white">{cardsOwnedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Box size={24} />
              </div>
            </div>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer hover:border-fuchsia-500/30 transition-colors">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{t('profile.listings')}</p>
                <p className="text-3xl font-black text-cyan-400">{activeListingsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
                <Check size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => setActiveTab('YOUR_COLLECTION')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'YOUR_COLLECTION' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            {t('collection.tab.yours')}
          </button>
          <button 
            onClick={() => setActiveTab('ALL_CARDS')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'ALL_CARDS' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            {t('collection.tab.all')}
          </button>
          <button 
            onClick={() => setActiveTab('SEALED')}
            className={`px-8 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'SEALED' ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            <Box size={16} /> {t('collection.tab.sealed')}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'ALL_CARDS' && <AllCardsTab />}
            {activeTab === 'YOUR_COLLECTION' && <YourCollectionTab instances={myInstances} sealedInstances={mySealedInstances} />}
            {activeTab === 'SEALED' && <SealedTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── All Cards Tab ──────────────────────────────────────────────────────────
function AllCardsTab() {
  const [game, setGame] = useState<Game>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('collection_search_game') as Game) || 'MAGIC';
    }
    return 'MAGIC';
  });
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [setCode, setSetCode] = useState('');
  const [collectorNumber, setCollectorNumber] = useState('');
  const [narutoChakra, setNarutoChakra] = useState('');
  const [opcgColor, setOpcgColor] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [availableSets, setAvailableSets] = useState<{setCode: string, count: number}[]>([]);

  useEffect(() => {
    fetch(`/api/collection/sets?game=${game}`)
      .then(res => res.json())
      .then(data => {
        if (data.sets) setAvailableSets(data.sets.sort((a: any, b: any) => b.count - a.count));
      });
  }, [game]);

  const fetchCards = async (append = false, overridePage?: number) => {
    if (!append) {
      setCards([]);
    }
    setLoading(true);
    try {
      const currentPage = overridePage ?? (append ? page + 1 : 1);
      const params = new URLSearchParams();
      params.append('game', game);
      params.append('page', currentPage.toString());
      if (searchQuery) params.append('q', searchQuery);
      if (setCode) params.append('setCode', setCode);
      if (collectorNumber) params.append('collectorNumber', collectorNumber);
      if (narutoChakra) params.append('chakra', narutoChakra);
      if (opcgColor) params.append('color', opcgColor);

      const res = await fetch(`/api/collection/search?${params.toString()}`);
      const data = await res.json();

      if (data.cards) {
        // Massive frontend hygiene filter to aggressively block sealed products
        const sealedKeywords = [
          'booster box', 'elite trainer box', 'etb', 'booster pack', 'blister', 'theme deck', 
          'display case', 'premium collection', 'bundle', 'tin', 'sleeved booster', 'master carton',
          'build & battle', 'fat pack', 'commander deck', 'display', 'ultra-premium', 'collection box'
        ];
        
        // Exceptions for genuine gameplay cards that share sealed keywords
        const whitelistExceptions = ['booster energy', 'ancient booster', 'future booster', 'trainer\'s toolkit'];

        const filteredCards = data.cards.filter((c: any) => {
          const nameStr = c.name.toLowerCase();
          const isException = whitelistExceptions.some(ex => nameStr.includes(ex));
          if (isException) return true; // Keep genuine cards
          const isSealed = sealedKeywords.some(kw => nameStr.includes(kw));
          return !isSealed; // Block anything that matches sealed keywords
        });
        
        const newCards = filteredCards.map((c: any) => ({
          id: c.apiId,
          name: c.name,
          game: c.game,
          imageUrl: c.imageUrl,
          price: c.price || 0,
          setCode: c.setCode,
          collectorNumber: c.collectorNumber,
          prices: c.apiPayload?.prices || null  
      }));

        setCards(prev => (append ? [...prev, ...newCards] : newCards));
        setPage(currentPage);
        setHasMore(newCards.length >= 50);
      } else {
        if (!append) setCards([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchCards(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]); // Fetch automatically when game changes

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      setHasMore(true);
      fetchCards(false);
    }
  };

  return (
    <div>
      {/* Game Selector */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {['MAGIC', 'POKEMON', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'].map((g) => (
          <button 
            key={g}
            onClick={() => {
              setGame(g as Game);
              localStorage.setItem('collection_search_game', g);
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase border transition-all ${
              game === g 
                ? 'bg-white/10 border-cyan-400 text-cyan-400' 
                : 'bg-transparent border-white/10 text-slate-500 hover:border-white/30'
            }`}
          >
            {g.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Dynamic Filters */}
      <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl mb-8 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search card name or illustrator... (Press Enter)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" 
          />
        </div>

        {(game === 'MAGIC' || game === 'POKEMON' || game === 'ONE_PIECE' || game === 'LORCANA' || game === 'RIFTBOUND') && (
          <>
            <input 
              type="text" 
              placeholder="Set Code (e.g. LOR)" 
              value={setCode}
              onChange={(e) => setSetCode(e.target.value.toUpperCase())}
              onKeyDown={handleSearch}
              className="w-36 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500 font-bold placeholder:text-slate-600 placeholder:font-normal" 
            />
            
            <input 
              type="text" 
              placeholder="Collector #" 
              value={collectorNumber}
              onChange={(e) => setCollectorNumber(e.target.value)}
              onKeyDown={handleSearch}
              className="w-36 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500 font-bold placeholder:text-slate-600 placeholder:font-normal" 
            />
          </>
        )}

        {game === 'NARUTO' && (
          <select 
            value={narutoChakra}
            onChange={(e) => setNarutoChakra(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="">Any Chakra</option>
            <option value="Fire">Fire</option>
            <option value="Wind">Wind</option>
            <option value="Lightning">Lightning</option>
            <option value="Earth">Earth</option>
            <option value="Water">Water</option>
          </select>
        )}

        {game === 'ONE_PIECE' && (
          <select 
            value={opcgColor}
            onChange={(e) => setOpcgColor(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="">Any Color</option>
            <option value="Red">Red</option>
            <option value="Green">Green</option>
            <option value="Blue">Blue</option>
            <option value="Purple">Purple</option>
            <option value="Black">Black</option>
            <option value="Yellow">Yellow</option>
          </select>
        )}

        <button onClick={() => { setPage(1); setHasMore(true); fetchCards(false); }} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl transition-colors">
          Search
        </button>
      </div>

      {/* Card Grid */}
      {game === 'NARUTO' && (
        <p className="text-yellow-500 text-xs text-center mb-4 bg-yellow-500/10 py-2 rounded-lg border border-yellow-500/20">
          * Naruto Mythos market pricing is not currently tracked by TCGplayer.
        </p>
      )}

      {loading && cards.length === 0 ? (
        <div className="flex justify-center items-center py-20 text-cyan-500">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {cards.map(card => (
            <div 
              key={card.id} 
              onClick={() => setSelectedCard(card)}
              className="group cursor-pointer"
            >
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-900 aspect-[2.5/3.5] mb-3 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.imageUrl ? `/api/proxy?url=${encodeURIComponent(card.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png'} alt={card.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-white truncate text-sm flex-1">{card.name}</h3>
                {(card.setCode || card.collectorNumber) && (
                  <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap">
                    {card.setCode}{card.setCode && card.collectorNumber ? ' · ' : ''}{card.collectorNumber}
                  </span>
                )}
              </div>
              <p className="text-emerald-400 font-black text-xs">
                {card.game === 'NARUTO' || (card.game === 'POKEMON' && (card.price === 0 || card.price === 0.3)) ? (
                  <span className="text-slate-500 font-bold">No Market Data</span>
                ) : (
                  `€${card.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                )}
              </p>
            </div>
          ))}
          {cards.length === 0 && !loading && (
            <div className="col-span-full text-center py-20 text-slate-500">
              <p>No cards found. Try adjusting your search.</p>
            </div>
          )}
        </div>
      )}

      {cards.length > 0 && hasMore && (
        <button
          data-testid="load-more-cards-btn"
          onClick={() => fetchCards(true)}
          disabled={loading}
          className="w-full mt-6 py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-cyan-400 font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? `Loading page ${page + 1}…` : `Load More Cards (page ${page + 1})`}
        </button>
      )}
      {cards.length > 0 && !hasMore && !loading && (
        <p className="text-center text-slate-500 text-xs mt-6">
          End of results — showing all {cards.length} cards across {page} page{page > 1 ? 's' : ''}.
        </p>
      )}

      {/* Add Card Modal */}
      <AnimatePresence>
        {selectedCard && (
          <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Your Collection Tab ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function YourCollectionTab({ instances, sealedInstances = [] }: { instances: any[], sealedInstances?: any[] }) {
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

  // Sort instances
  processedInstances.sort((a, b) => {
    const priceA = a.cardReference.price || 0;
    const priceB = b.cardReference.price || 0;
    
    if (sortBy === 'PRICE_DESC') return priceB - priceA;
    if (sortBy === 'PRICE_ASC') return priceA - priceB;
    if (sortBy === 'NAME_ASC') return a.cardReference.name.localeCompare(b.cardReference.name);
    return 0; 
  });

  const totalDeltaDollar = processedInstances.reduce((acc, inst) => {
    const price = inst.cardReference.price || 0;
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
                    <span className="bg-gradient-to-r from-amber-200 to-amber-500 px-2 py-1 rounded border border-amber-200/50 text-[10px] font-black uppercase text-black tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                      FOIL
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const payload: any = inst.cardReference.apiPayload;
                  if (!payload) return null;
                  
                  const setCode = payload.setCode;
                  const collectorNumber = payload.collectorNumber;
                  
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
              
              <div className="flex justify-between items-center mt-1">
                <div className="flex flex-col">
                  <p className="text-emerald-400 font-black text-sm">
                    {inst.cardReference.game === 'NARUTO' || (inst.cardReference.game === 'POKEMON' && (inst.cardReference.price === 0 || inst.cardReference.price === 0.3)) ? <span className="text-slate-500">N/A</span> : `€${(inst.cardReference.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
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
// ─── Edit Collection Card Modal ─────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EditCollectionCardModal({ instance, onClose, onComplete }: { instance: any, onClose: () => void, onComplete: () => void }) {
  const [condition, setCondition] = useState(instance.condition);
  const [isFoil, setIsFoil] = useState(instance.isFoil);
  const [isSigned, setIsSigned] = useState(instance.isSigned);
  const [notes, setNotes] = useState(instance.notes || '');
  const [customImageUrl, setCustomImageUrl] = useState(instance.customImageUrl || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=b2492f987920d3e2a7903861b72ae3a4`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCustomImageUrl(data.data.url);
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('ImgBB upload failed', err);
      alert('Upload failed');
    }
    setIsUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/collection/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: instance.id, condition, isFoil, isSigned, notes, customImageUrl })
      });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to update card.');
      }
    } catch {
      alert('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this card from your collection?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/collection/edit?id=${instance.id}`, { method: 'DELETE' });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to delete card.');
      }
    } catch {
      alert('Network error');
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">
          <X size={20} />
        </button>

        <div className="w-full md:w-1/2 flex flex-col items-center">
          <label className={`relative w-full cursor-pointer group ${isUploading ? 'opacity-50' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={customImageUrl || (instance.cardReference.imageUrl ? `/api/proxy?url=${encodeURIComponent(instance.cardReference.imageUrl)}` : null) || 'https://i.imgur.com/B06rBhI.png'} alt={instance.cardReference.name} className="w-full rounded-2xl shadow-lg border border-white/10 group-hover:opacity-75 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-2xl">
              <span className="text-white font-bold bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                {isUploading ? 'Uploading...' : 'Click to Replace Image'}
              </span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </label>
          <div className="mt-4 flex gap-2 w-full">
             <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-center py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors border border-white/10 shadow-lg">
                {isUploading ? 'Uploading...' : '+ Upload Custom Image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
             </label>
             {customImageUrl && (
                <button onClick={() => setCustomImageUrl('')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 px-4 rounded-xl text-xs font-bold transition-colors border border-red-500/30">
                  Reset
                </button>
             )}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col">
          <h2 className="text-3xl font-black text-white mb-2">{instance.cardReference.name}</h2>
          <p className="text-emerald-400 font-black text-xl mb-6">
            {instance.cardReference.game === 'NARUTO' || (instance.cardReference.game === 'POKEMON' && (instance.cardReference.price === 0 || instance.cardReference.price === 0.3)) ? (
              <span className="text-slate-500">No Market Data</span>
            ) : (
              `€${(instance.cardReference.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
            )}
          </p>

          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500">
                <option value="MINT">Mint</option>
                <option value="NEAR_MINT">Near Mint</option>
                <option value="LIGHTLY_PLAYED">Lightly Played</option>
                <option value="MODERATELY_PLAYED">Moderately Played</option>
                <option value="HEAVILY_PLAYED">Heavily Played</option>
                <option value="DAMAGED">Damaged</option>
              </select>
            </div>

            <div className="flex gap-4">
              <label className="flex-1 flex items-center gap-2 cursor-pointer bg-slate-950 px-4 py-3 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-colors">
                <input type="checkbox" checked={isFoil} onChange={e => setIsFoil(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                <span className="text-sm font-bold text-slate-300">Foil</span>
              </label>
              <label className="flex-1 flex items-center gap-2 cursor-pointer bg-slate-950 px-4 py-3 rounded-xl border border-white/10 hover:border-fuchsia-500/50 transition-colors">
                <input type="checkbox" checked={isSigned} onChange={e => setIsSigned(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-fuchsia-500" />
                <span className="text-sm font-bold text-slate-300">Signed</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. graded 9.5, or blue sharpie signature" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div className="mt-8 flex gap-4 pt-4 border-t border-white/10">
            <button 
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold py-3 rounded-xl transition-colors"
            >
              {deleting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Delete'}
            </button>
            <button 
              disabled={saving}
              onClick={handleSave} 
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Edit Sealed Product Modal ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EditSealedProductModal({ instance, onClose, onComplete }: { instance: any, onClose: () => void, onComplete: () => void }) {
  const [condition, setCondition] = useState(instance.condition || 'FACTORY_SEALED');
  const [purchasePrice, setPurchasePrice] = useState(instance.purchasePrice || '');
  const [notes, setNotes] = useState(instance.notes || '');
  const [customImageUrl, setCustomImageUrl] = useState(instance.customImageUrl || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=b2492f987920d3e2a7903861b72ae3a4`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCustomImageUrl(data.data.url);
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('ImgBB upload failed', err);
      alert('Upload failed');
    }
    setIsUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/sealed/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: instance.id, condition, purchasePrice, notes, customImageUrl })
      });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to update sealed product.');
      }
    } catch {
      alert('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sealed product from your vault?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sealed/inventory?id=${instance.id}`, { method: 'DELETE' });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to delete sealed product.');
      }
    } catch {
      alert('Network error');
    }
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">
          <X size={20} />
        </button>

        <div className="w-full md:w-1/2 flex flex-col items-center">
          <label className={`relative w-full cursor-pointer group ${isUploading ? 'opacity-50' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={customImageUrl || instance.sealedReference.imageUrl || 'https://i.imgur.com/B06rBhI.png'} alt={instance.sealedReference.name} className="w-full rounded-2xl shadow-lg border border-white/10 group-hover:opacity-75 transition-opacity object-contain aspect-square bg-slate-950 p-4" />
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-2xl">
              <span className="text-white font-bold bg-slate-900/80 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                {isUploading ? 'Uploading...' : 'Click to Replace Image'}
              </span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </label>
          <div className="mt-4 flex gap-2 w-full">
             <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-center py-2 rounded-xl text-xs font-bold text-white cursor-pointer transition-colors border border-white/10 shadow-lg">
                {isUploading ? 'Uploading...' : '+ Upload Custom Image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
             </label>
             {customImageUrl && (
                <button onClick={() => setCustomImageUrl('')} className="bg-red-500/20 hover:bg-red-500/40 text-red-400 py-2 px-4 rounded-xl text-xs font-bold transition-colors border border-red-500/30">
                  Reset
                </button>
             )}
          </div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col">
          <h2 className="text-3xl font-black text-white mb-1">{instance.sealedReference.name}</h2>
          <p className="text-sm text-slate-400 mb-2">{instance.sealedReference.type.replace('_', ' ')} • {instance.sealedReference.game.replace('_', ' ')}</p>
          <p className="text-emerald-400 font-black text-xl mb-6">€{(instance.sealedReference.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>

          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500">
                <option value="FACTORY_SEALED">Factory Sealed</option>
                <option value="DAMAGED_BOX">Damaged Box</option>
                <option value="OPEN_BOX">Open Box (Packs Sealed)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Purchase Price (€)</label>
              <input type="number" step="any" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Personal Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none" placeholder="Add personal notes..." />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={handleDelete} disabled={deleting || saving} className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/30">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={handleSave} disabled={saving || deleting} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sealed Action Modal (High-Res & Pack Cracking) ─────────────────────────
function SealedActionModal({ product, onClose, onAddVault }: { product: any, onClose: () => void, onAddVault: (id: string) => void }) {
  const [cracking, setCracking] = useState(false);
  
  // Pack Simulator State
  const [pulls, setPulls] = useState<any[]>([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [savingPulls, setSavingPulls] = useState(false);

  const handleCrack = async () => {
    if (!product.setCode) {
      alert("This product is missing a Set Code, so the simulator doesn't know which cards to pull from.");
      return;
    }
    setCracking(true);
    try {
      const res = await fetch(`/api/sealed/crack?setCode=${product.setCode}&game=${product.game}`);
      const data = await res.json();
      if (data.pulls) {
        setPulls(data.pulls);
        setRevealIndex(0);
        setIsFlipped(false);
      } else {
        alert(data.error || 'Failed to connect to pull-rate database.');
      }
    } catch (e) {
      alert('Network error while simulating pack.');
    }
    setCracking(false);
  };

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true); // Flip over
    } else {
      setIsFlipped(false); // Reset flip
      setTimeout(() => setRevealIndex(prev => prev + 1), 150); // Move to next card
    }
  };

  const savePullsToVault = async () => {
    setSavingPulls(true);
    try {
      // Loop the additions (Bulk logic can be used here too, but simple loop is fine for 10 cards)
      await Promise.all(pulls.map(c => 
        fetch('/api/collection/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cardId: c.id, game: c.game, name: c.name, imageUrl: c.imageUrl, 
            condition: 'Mint', quantity: 1, price: c.price, 
            setCode: c.setCode, collectorNumber: c.collectorNumber 
          })
        })
      ));
      alert(`Added ${pulls.length} cards to your Have List!`);
      onClose();
    } catch (e) {
      alert('Failed to save some pulls.');
    }
    setSavingPulls(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-5xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-[100] transition-colors">
          <X size={20} />
        </button>

        {pulls.length > 0 ? (
          // ─── PACK OPENING SIMULATOR VIEW ───────────────────────────
          <div className="w-full flex flex-col items-center justify-center min-h-[500px]">
            {revealIndex < pulls.length ? (
              <div className="flex flex-col items-center">
                <div className="text-slate-400 font-bold tracking-widest text-xs uppercase mb-8">
                  Card {revealIndex + 1} of {pulls.length}
                </div>
                
                {/* 3D Flip Container */}
                <div 
                  className="relative w-64 h-80 sm:w-80 sm:h-[450px] cursor-pointer group" 
                  style={{ perspective: '1000px' }}
                  onClick={handleCardClick}
                >
                  <motion.div 
                    className="w-full h-full relative"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front of Card (Face Down / Card Back) */}
                    <div className="absolute inset-0 w-full h-full bg-slate-800 rounded-xl border-2 border-white/10 shadow-xl flex items-center justify-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                      {/* Generic Hatake Back or Game Back */}
                      <img src="https://i.imgur.com/B06rBhI.png" alt="Card Back" className="w-full h-full object-cover rounded-lg opacity-50" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg group-hover:bg-black/20 transition-colors">
                        <span className="text-white font-black tracking-widest text-sm bg-slate-900/80 px-4 py-2 rounded-full border border-white/20">CLICK TO REVEAL</span>
                      </div>
                    </div>
                    
                    {/* Back of Card (Face Up / Revealed) */}
                    <div className="absolute inset-0 w-full h-full rounded-xl shadow-[0_0_40px_rgba(217,70,239,0.3)] backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                      <img 
                        src={pulls[revealIndex].imageUrl || 'https://i.imgur.com/B06rBhI.png'} 
                        alt={pulls[revealIndex].name} 
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute -bottom-16 left-0 right-0 text-center">
                        <h3 className="text-white font-black text-xl">{pulls[revealIndex].name}</h3>
                        <p className="text-emerald-400 font-bold">€{(pulls[revealIndex].price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              // End of Pack Summary
              <div className="flex flex-col items-center w-full">
                <h2 className="text-3xl font-black text-white mb-2">Pack Complete!</h2>
                <p className="text-slate-400 mb-8">Here is what you pulled from {product.name}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 w-full max-h-[400px] overflow-y-auto p-2 border border-white/5 rounded-2xl bg-slate-950/50">
                  {pulls.map((c, i) => (
                    <div key={i} className="bg-slate-900 rounded-xl overflow-hidden border border-white/10 flex flex-col items-center p-2">
                      <img src={c.imageUrl || 'https://i.imgur.com/B06rBhI.png'} alt={c.name} className="w-full h-auto rounded-lg mb-2" />
                      <p className="text-white font-bold text-[10px] text-center truncate w-full">{c.name}</p>
                      <p className="text-emerald-400 font-black text-xs">€{(c.price || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-8 w-full max-w-md">
                  <button onClick={() => { setPulls([]); setRevealIndex(0); setIsFlipped(false); }} className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">
                    Close Pack
                  </button>
                  <button onClick={savePullsToVault} disabled={savingPulls} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2">
                    {savingPulls ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Add Pulls to Have List
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ─── DEFAULT SEALED INFO VIEW (Unchanged) ───────────────────
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
                
                <p className="text-slate-400 text-sm leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-white/5">
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
                <div className="flex gap-3">
                  <button onClick={() => onAddVault(product.id)} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Check size={18} /> Add to Vault
                  </button>
                  <button className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all flex justify-center items-center gap-2 border border-white/5">
                    <Plus size={18} /> Add to Want List
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
// ─── Sealed Tab (The Overhaul) ──────────────────────────────────────────────
function SealedTab() {
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
      const gameParam = game === 'ALL' ? '' : game;
      
      const res = await fetch(`/api/sealed/search?game=${gameParam}&q=${encodeURIComponent(searchQuery)}&page=${currentPage}`);
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
      </AnimatePresence>

      {/* GLOBAL DATABASE VIEW */}
      {activeSubTab === 'GLOBAL' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          
          {/* Filters & Search */}
          <div className="bg-slate-900 border border-fuchsia-500/20 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['ALL', 'POKEMON', 'MAGIC', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'].map(g => (
                <button 
                  key={g} 
                  onClick={() => setGame(g as Game | 'ALL')} 
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${game === g ? 'bg-fuchsia-600 text-white shadow-[0_0_10px_rgba(217,70,239,0.3)]' : 'bg-slate-950 border border-white/10 text-slate-400 hover:border-white/30'}`}
                >
                  {g.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            <div className="flex-1 w-full md:min-w-[300px] flex gap-2">
              <input 
                type="text" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                onKeyDown={handleSearch} 
                placeholder={game === 'ALL' ? "Search across all games..." : `Search ${game.replace('_', ' ')} products or set codes...`} 
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500 transition-colors" 
              />
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
                        <span className="bg-fuchsia-600/90 text-white text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg backdrop-blur-sm">
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

// ─── Edit Card Modal ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CardModal({ card, onClose }: { card: CardData, onClose: () => void }) {
  const [condition, setCondition] = useState('Near Mint');
  const [quantity, setQuantity] = useState(1);
  const [isFoil, setIsFoil] = useState(false);
  const [isHolo, setIsHolo] = useState(false);
  const [isReverseHolo, setIsReverseHolo] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedByArtist, setSignedByArtist] = useState(false);
  const [signedByElse, setSignedByElse] = useState(false);
  const [isAltered, setIsAltered] = useState(false);
  
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [adding, setAdding] = useState(false);

 // Dynamic Price Estimator
  const getEstimatedPrice = () => {
    let base = card.price || 0;
    
    // 1. Look for explicit TCGCSV variant pricing
    if (card.prices) {
      if ((isFoil || isHolo) && card.prices.foil) {
        base = card.prices.foil;
      } else if (isReverseHolo && card.prices.reverseHolo) {
        base = card.prices.reverseHolo;
      } else if (!isFoil && !isHolo && !isReverseHolo && card.prices.normal) {
        base = card.prices.normal; // Base standard price
      }
    }

    if (base === 0) return 0;
    
    // 2. Depreciate based on condition
    let conditionMultiplier = 1.0;
    if (condition === 'Mint') conditionMultiplier = 1.2;
    if (condition === 'Lightly Played') conditionMultiplier = 0.8;
    if (condition === 'Moderately Played') conditionMultiplier = 0.65;
    if (condition === 'Heavily Played') conditionMultiplier = 0.45;
    if (condition === 'Damaged') conditionMultiplier = 0.25;

    let calculatedPrice = base * conditionMultiplier;

    // 3. Flat €8 Premium for Signatures (Temporary until Artist DB is built)
    if (isSigned) {
      calculatedPrice += 8.00;
    }
    
    return calculatedPrice;
  };
  const estimatedPrice = getEstimatedPrice();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY || 'b2492f987920d3e2a7903861b72ae3a4';
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (data.success) {
        setCustomImageUrl(data.data.url);
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('ImgBB upload failed', err);
      alert('Upload failed. Check your network or API key.');
    }
    setIsUploading(false);
  };

  const handleAddToHave = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/collection/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: card.id,
          game: card.game,
          name: card.name,
          imageUrl: card.imageUrl,
          customImageUrl: customImageUrl || undefined,
          condition,
          quantity,
          isFoil: isFoil || isHolo, 
          isHolo,
          isReverseHolo,
          isSigned,
          signedByArtist,
          signedByElse,
          isAltered,
          setCode: card.setCode,
          collectorNumber: card.collectorNumber,
          price: estimatedPrice 
        })
      });
      if (res.ok) {
        alert('Added to your collection!');
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Please login first to use the digital binder.');
      }
    } catch {
      alert('Network error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-5xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">
          <X size={20} />
        </button>

        {/* Left Side: Card Image & Upload */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <label className={`relative w-full cursor-pointer group ${isUploading ? 'opacity-50' : ''}`}>
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-800 aspect-[2.5/3.5] transition-transform duration-300 group-hover:scale-[1.02]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={customImageUrl || (card.imageUrl ? `/api/proxy?url=${encodeURIComponent(card.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png')} alt={card.name} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity backdrop-blur-sm">
                <Upload size={32} className="text-white mb-2" />
                <span className="text-white font-black uppercase tracking-wider text-xs px-4 text-center">
                  {isUploading ? 'Uploading...' : 'Upload Specific Card Photo'}
                </span>
              </div>
            </div>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
          </label>
          
          {customImageUrl && (
            <button onClick={() => setCustomImageUrl('')} className="w-full py-2 bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm">
              Remove Custom Photo
            </button>
          )}
        </div>

        {/* Right Side: Controls & Dynamic Pricing */}
        <div className="w-full md:w-2/3 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2 gap-4">
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">{card.name}</h2>
              <div className="flex gap-2 shrink-0">
                <span className="bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-black uppercase px-2 py-1 rounded tracking-widest">{card.setCode || 'NO SET'}</span>
                {card.collectorNumber && <span className="bg-slate-800 text-slate-300 border border-white/10 text-[10px] font-black uppercase px-2 py-1 rounded tracking-widest">#{card.collectorNumber}</span>}
              </div>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 mb-6 flex justify-between items-center">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Base Market Avg</p>
                <p className="text-white text-sm">€{(card.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-500 text-xs font-bold uppercase tracking-wider mb-1">Estimated Attributed Value</p>
                <p className="text-cyan-400 font-black text-2xl">
                  {card.game === 'NARUTO' || (card.game === 'POKEMON' && (card.price === 0 || card.price === 0.3)) ? (
                    <span className="text-slate-500 text-lg">N/A</span>
                  ) : (
                    `€${estimatedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                  )}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Condition</label>
                <select 
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                >
                  <option>Mint</option>
                  <option>Near Mint</option>
                  <option>Lightly Played</option>
                  <option>Moderately Played</option>
                  <option>Heavily Played</option>
                  <option>Damaged</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4 mb-8">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Card Attributes (Affects Value)</label>
              <div className="flex flex-wrap gap-4">
                
                {card.game === 'POKEMON' ? (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors">
                      <input type="checkbox" checked={isHolo} onChange={e => { setIsHolo(e.target.checked); setIsReverseHolo(false); }} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                      <span className="font-bold text-sm text-white">Holo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors">
                      <input type="checkbox" checked={isReverseHolo} onChange={e => { setIsReverseHolo(e.target.checked); setIsHolo(false); }} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                      <span className="font-bold text-sm text-white">Reverse Holo</span>
                    </label>
                  </>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors">
                    <input type="checkbox" checked={isFoil} onChange={e => setIsFoil(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                    <span className="font-bold text-sm text-white">Foil</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-white/10 hover:border-fuchsia-500/50 transition-colors">
                  <input type="checkbox" checked={isSigned} onChange={e => setIsSigned(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-fuchsia-500" />
                  <span className="font-bold text-sm text-white">Signed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-2 rounded-lg border border-white/10 hover:border-cyan-500/50 transition-colors">
                  <input type="checkbox" checked={isAltered} onChange={e => setIsAltered(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                  <span className="font-bold text-sm text-white">Altered Art</span>
                </label>
              </div>

              <AnimatePresence>
                {isSigned && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-xs font-bold">
                        <input type="checkbox" checked={signedByArtist} onChange={e => setSignedByArtist(e.target.checked)} className="w-3 h-3 rounded bg-slate-950 accent-fuchsia-500" />
                        By Artist
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-xs font-bold">
                        <input type="checkbox" checked={signedByElse} onChange={e => setSignedByElse(e.target.checked)} className="w-3 h-3 rounded bg-slate-950 accent-fuchsia-500" />
                        By Other (Player/Pro)
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button disabled={adding} onClick={handleAddToHave} className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex justify-center items-center gap-2">
              {adding ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Add to Have List
            </button>
            <button className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-all border border-white/10 flex justify-center items-center gap-2">
              <Plus size={20} /> Add to Want List
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}