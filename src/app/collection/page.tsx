'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, TrendingUp, Filter, X, Check, Box, Loader2, Store, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';
import ListForSaleModal from '@/components/ListForSaleModal';

type Tab = 'ALL_CARDS' | 'YOUR_COLLECTION' | 'SEALED';
type Game = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO';

type CardData = {
  id: string;
  name: string;
  game: string;
  imageUrl: string;
  price: number;
  apiId?: string;
  setCode?: string;
  collectorNumber?: string;
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
  const [showImportModal, setShowImportModal] = useState(false);
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
    mySealedInstances.reduce((sum, inst) => sum + (inst.sealedReference.price || 0), 0);
  
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
              <button onClick={() => setShowImportModal(true)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-white/10 shadow-lg flex items-center gap-2">
                <Download size={18} /> Import CSV
              </button>
              <button 
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-white/10 shadow-lg flex items-center gap-2"
                onClick={() => document.getElementById('import-input')?.click()}
              >
                <Upload size={18} /> Importera CSV
              </button>
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

        <AnimatePresence>
          {showImportModal && (
            <CsvImportModal onClose={() => setShowImportModal(false)} />
          )}
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

  const fetchCards = async (append = false) => {
    if (!append) {
      setCards([]);
      setHasMore(false);
    }
    setLoading(true);
    try {
      const currentPage = append ? page + 1 : 1;
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
        const newCards = data.cards.map((c: any) => ({
          id: c.apiId,
          name: c.name,
          game: c.game,
          imageUrl: c.imageUrl,
          price: c.price || 0,
          setCode: c.setCode,
          collectorNumber: c.collectorNumber,
        }));
        setCards(append ? [...cards, ...newCards] : newCards);
        if (append) setPage(currentPage);
        if (newCards.length < 50) setHasMore(false);
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
        {['MAGIC', 'POKEMON', 'ONE_PIECE', 'NARUTO'].map((g) => (
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

        {(game === 'MAGIC' || game === 'POKEMON' || game === 'ONE_PIECE') && (
          <>
            <select 
              value={setCode}
              onChange={(e) => {
                setSetCode(e.target.value);
                setPage(1);
                setHasMore(true);
              }}
              className="w-48 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
            >
              <option value="">All Sets ({availableSets.length})</option>
              {availableSets.map(s => (
                <option key={s.setCode} value={s.setCode}>{s.setCode} ({s.count})</option>
              ))}
            </select>
            
            <input 
              type="text" 
              placeholder="Collector #" 
              value={collectorNumber}
              onChange={(e) => setCollectorNumber(e.target.value)}
              onKeyDown={handleSearch}
              className="w-24 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-cyan-500" 
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
        <button onClick={() => fetchCards(true)} className="w-full mt-6 py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-cyan-400 font-bold rounded-xl transition-colors">
          {loading ? 'Loading...' : 'Load More Cards'}
        </button>
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

function CsvImportModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [game, setGame] = useState<Game>('MAGIC');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('game', game);

    try {
      const res = await fetch('/api/collection/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (e) {
      alert('Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Import CSV</h2>
        <p className="text-slate-400 text-sm mb-6">Upload an exported CSV from Collectr, ManaBox, or TCGPlayer.</p>

        <div className="space-y-4 mb-6">
          <select 
            value={game} 
            onChange={(e) => setGame(e.target.value as Game)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="MAGIC">Magic: The Gathering</option>
            <option value="POKEMON">Pokemon TCG</option>
            <option value="ONE_PIECE">One Piece CG</option>
            <option value="NARUTO">Naruto Mythos</option>
          </select>
          
          <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-cyan-500/50 transition-colors">
            <input 
              type="file" 
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden" 
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload size={32} className="text-cyan-500" />
              <span className="text-white font-bold">{file ? file.name : 'Click to select CSV file'}</span>
            </label>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${result.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {result.success ? `Successfully imported ${result.count} cards!` : result.error}
          </div>
        )}

        <button 
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} 
          Start Import
        </button>
      </div>
    </div>
  );
}

// ─── Bulk List Modal ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BulkListModal({ instances, onClose, onComplete }: { instances: any[], onClose: () => void, onComplete: () => void }) {
  const [multiplier, setMultiplier] = useState(100);
  const [listings, setListings] = useState(
    instances.map(inst => ({
      ...inst,
      listPrice: Math.round((inst.cardReference.price || 0) * 1.0),
      customImageUrl: inst.customImageUrl || '',
      notes: inst.notes || ''
    }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const applyMultiplier = () => {
    setListings(prev => prev.map(l => ({
      ...l,
      listPrice: Math.round((l.cardReference.price || 0) * (multiplier / 100))
    })));
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, listPrice: newPrice } : l));
  };

  const handleImageChange = (id: string, url: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, customImageUrl: url } : l));
  };

  const handleNotesChange = (id: string, notes: string) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingId(id);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=b2492f987920d3e2a7903861b72ae3a4`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        handleImageChange(id, data.data.url);
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('ImgBB upload failed', err);
      alert('Upload error.');
    }
    setUploadingId(null);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload = listings.map(l => ({
      cardInstanceId: l.id,
      price: l.listPrice,
      customImageUrl: l.customImageUrl || undefined,
      notes: l.notes || undefined
    }));

    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(`Successfully listed ${payload.length} cards!`);
        onComplete();
      } else {
        alert('Failed to list cards.');
      }
    } catch {
      alert('Network error');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-5xl w-full flex flex-col shadow-2xl relative max-h-[90vh] overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10">
          <X size={20} />
        </button>
        
        <h2 className="text-3xl font-black text-white mb-6">Bulk List for Sale</h2>

        {/* Global Multiplier */}
        <div className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl mb-6">
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-300">Set Base Percentage</p>
            <p className="text-xs text-slate-500">Apply a % multiplier to the market price for all cards.</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={multiplier} 
              onChange={e => setMultiplier(Number(e.target.value))} 
              className="w-20 bg-slate-950 border border-white/10 text-white px-3 py-2 rounded-lg text-center font-bold"
            />
            <span className="text-slate-400 font-bold">%</span>
            <button onClick={applyMultiplier} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold transition-colors">Apply</button>
          </div>
        </div>

        {/* Individual Adjustments */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {listings.map(l => (
            <div key={l.id} className="bg-slate-950 border border-white/5 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative w-16 h-24 flex-shrink-0 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.customImageUrl || (l.cardReference.imageUrl ? `/api/proxy?url=${encodeURIComponent(l.cardReference.imageUrl)}` : null) || 'https://i.imgur.com/B06rBhI.png'} className="w-full h-full object-cover rounded-lg border border-white/10" alt={l.cardReference.name} />
                
                {/* Photo Upload Overlay Button */}
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploadingId === l.id ? (
                    <Loader2 className="animate-spin text-white" size={20} />
                  ) : (
                    <span className="text-[10px] text-white font-bold tracking-wider text-center px-1">
                      Upload <br/> Photo
                    </span>
                  )}
                  {/* File input accepting camera on mobile */}
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileUpload(e, l.id)} disabled={uploadingId === l.id} />
                </label>
              </div>
              
              <div className="flex-1 w-full">
                <h3 className="text-white font-bold">{l.cardReference.name}</h3>
                <p className="text-xs text-slate-500 mb-2">Market: ${l.cardReference.price?.toLocaleString('en-US')} | {l.condition.replace('_', ' ')} {l.isSigned && ' | Signed'}</p>
                <div className="flex flex-col md:flex-row gap-2 mt-2">
                  <input 
                    type="text" 
                    placeholder="Custom Image URL (Optional)" 
                    value={l.customImageUrl}
                    onChange={e => handleImageChange(l.id, e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input 
                    type="text" 
                    placeholder="Notes (e.g. signed in blue sharpie)" 
                    value={l.notes}
                    onChange={e => handleNotesChange(l.id, e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              
              <div className="flex flex-col items-end flex-shrink-0">
                <label className="text-xs font-bold text-slate-500 mb-1">Your Price (€)</label>
                <input 
                  type="number" 
                  step="any"
                  value={l.listPrice}
                  onChange={e => handlePriceChange(l.id, Number(e.target.value))}
                  className="w-24 bg-slate-900 border border-emerald-500/30 text-emerald-400 font-black px-3 py-2 rounded-lg text-right focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
          <button 
            disabled={isSubmitting}
            onClick={handleSubmit} 
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Confirm & List {listings.length} Cards
          </button>
        </div>
      </motion.div>
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
            <button 
              onClick={() => setSelectedCards(new Set(processedInstances.map(i => i.id)))}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Select All
            </button>
            <button 
              onClick={() => setSelectedCards(new Set())}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button 
              disabled={selectedCards.size === 0}
              onClick={() => setShowBulkModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <TrendingUp size={16} /> List {selectedCards.size} Selected
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-6 items-center">
          {/* Game Toggles */}
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

// ─── Edit Card Modal ────────────────────────────────────────────────────────
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

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Custom Photo URL</label>
              <input type="text" value={customImageUrl} onChange={(e) => setCustomImageUrl(e.target.value)} placeholder="https://..." className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" />
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

// ─── Sealed Tab ─────────────────────────────────────────────────────────────
function SealedTab() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Search State
  const [game, setGame] = useState<Game>('MAGIC');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // New Reference State
  const [showNewRef, setShowNewRef] = useState(false);
  const [newRef, setNewRef] = useState({ name: '', game: 'MAGIC', type: 'BOOSTER_BOX', setCode: '', edition: 'Unlimited', price: '', imageUrl: '' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingSealed, setEditingSealed] = useState<any | null>(null);

  const [uploadingSealedId, setUploadingSealedId] = useState<string | null>(null);

  const handleSealedFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setUploadingSealedId(id);
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=b2492f987920d3e2a7903861b72ae3a4`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const patchRes = await fetch('/api/sealed/inventory', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, customImageUrl: data.data.url })
        });
        if (patchRes.ok) {
           fetchInventory();
        } else {
           alert('Failed to update image in database');
        }
      } else {
        alert('Image upload failed.');
      }
    } catch (err) {
      console.error('ImgBB upload failed', err);
      alert('Upload error.');
    }
    setUploadingSealedId(null);
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sealed/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/sealed/search?game=${game}&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products);
      }
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleCreateRef = async () => {
    try {
      const res = await fetch('/api/sealed/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newRef, name: `${newRef.name} [${newRef.edition}]` })
      });
      if (res.ok) {
        alert('Product added to Global Database! You can now search for it.');
        setShowNewRef(false);
        handleSearch();
      } else {
        alert('Failed to add product.');
      }
    } catch (e) {
      console.error(e);
    }
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
        setShowSearch(false);
        fetchInventory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2"><Box /> Sealed Product Vault</h2>
          <p className="text-slate-400 text-sm mt-1">Track your booster boxes, ETBs, and blister packs.</p>
        </div>
        <button onClick={() => setShowSearch(!showSearch)} className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2">
          {showSearch ? <X size={18} /> : <Plus size={18} />} {showSearch ? 'Close Search' : 'Add Sealed Product'}
        </button>
      </div>

      <AnimatePresence>
        {editingSealed && (
          <EditSealedProductModal 
            instance={editingSealed} 
            onClose={() => setEditingSealed(null)} 
            onComplete={() => {
              setEditingSealed(null);
              fetchInventory();
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-slate-900 border border-fuchsia-500/30 p-6 rounded-2xl shadow-xl mb-8">
              
              <div className="flex flex-wrap gap-2 mb-6">
                {['MAGIC', 'POKEMON', 'ONE_PIECE'].map(g => (
                  <button key={g} onClick={() => setGame(g as Game)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${game === g ? 'bg-fuchsia-600 text-white' : 'bg-slate-950 text-slate-400 hover:bg-slate-800'}`}>
                    {g.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex gap-4 mb-6">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search for a booster box..." className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500" />
                <button onClick={handleSearch} disabled={searching} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl">
                  {searching ? <Loader2 className="animate-spin" /> : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {searchResults.map(res => (
                    <div key={res.id} className="bg-slate-950 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-fuchsia-500/30 transition-colors">
                      <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 p-1">
                        {res.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={res.imageUrl} alt={res.name} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <Box className="text-slate-700" size={24} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{res.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {res.type.replace('_', ' ')} {res.setCode ? `• Set: ${res.setCode}` : ''} {res.price ? `• €${res.price.toFixed(2)}` : ''}
                        </p>
                      </div>
                      <button onClick={() => handleAddToInventory(res.id)} className="w-10 h-10 shrink-0 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-transform hover:scale-110">
                        <Plus size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <div className="text-center py-6 bg-slate-950 rounded-xl border border-white/5">
                  <p className="text-slate-400 mb-4">Can't find the product? Add it to the global database!</p>
                  <button onClick={() => setShowNewRef(!showNewRef)} className="px-4 py-2 border border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-500/10 rounded-lg text-sm font-bold">
                    Create New Product Definition
                  </button>
                </div>
              )}

              {showNewRef && (
                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-10 flex justify-center text-fuchsia-500"><Loader2 className="animate-spin" size={32} /></div>
        ) : inventory.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-500">
            <Box size={48} className="mx-auto mb-4 opacity-50" />
            <p>Your sealed vault is empty. Search and add products to start tracking.</p>
          </div>
        ) : (
          inventory.map(inst => (
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
          ))
        )}
      </div>
    </div>
  );
}

// ─── Card Action Modal ──────────────────────────────────────────────────────
function CardModal({ card, onClose }: { card: CardData, onClose: () => void }) {
  const [condition, setCondition] = useState('Near Mint');
  const [quantity, setQuantity] = useState(1);
  const [isFoil, setIsFoil] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedByArtist, setSignedByArtist] = useState(false);
  const [signedByElse, setSignedByElse] = useState(false);
  const [isAltered, setIsAltered] = useState(false);
  const [edition, setEdition] = useState('Unlimited / Standard');
  const [adding, setAdding] = useState(false);

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
          condition,
          quantity,
          isFoil,
          isSigned,
          signedByArtist,
          signedByElse,
          isAltered,
          setCode: card.setCode,
          collectorNumber: card.collectorNumber,
          price: card.price,
          notes: edition !== 'Unlimited / Standard' ? edition : undefined
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
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl w-full flex flex-col md:flex-row gap-8 shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2">
          <X size={20} />
        </button>

        {/* Card Image */}
        <div className="w-full md:w-1/3">
          <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-800 aspect-[2.5/3.5]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={card.imageUrl ? `/api/proxy?url=${encodeURIComponent(card.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png'} alt={card.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-2/3 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">{card.name}</h2>
            <p className="text-emerald-400 font-black text-xl mb-6">
              {card.game === 'NARUTO' || (card.game === 'POKEMON' && (card.price === 0 || card.price === 0.3)) ? (
                <span className="text-slate-500">No Market Data</span>
              ) : (
                `Market: €${card.price.toLocaleString('en-US')}`
              )}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Condition</label>
                <select 
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Set / Edition</label>
                <select 
                  value={edition}
                  onChange={e => setEdition(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                >
                  <option value="Unlimited / Standard">Unlimited / Standard</option>
                  <option value="1st Edition">1st Edition</option>
                  <option value="Shadowless">Shadowless</option>
                  <option value="Alpha/Beta">Alpha/Beta</option>
                  <option value="Promo">Promo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-6 mb-8">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input type="checkbox" checked={isFoil} onChange={e => setIsFoil(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                <span className="font-semibold">Foil / Holo</span>
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                  <input type="checkbox" checked={isSigned} onChange={e => setIsSigned(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                  <span className="font-semibold">Signed</span>
                </label>
                {isSigned && (
                  <div className="flex flex-col gap-2 ml-6 p-3 bg-slate-900 border border-white/10 rounded-lg shadow-inner">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-sm">
                      <input type="checkbox" checked={signedByArtist} onChange={e => setSignedByArtist(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-fuchsia-500" />
                      <span className="font-semibold">By artist</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white text-sm">
                      <input type="checkbox" checked={signedByElse} onChange={e => setSignedByElse(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-slate-950 accent-fuchsia-500" />
                      <span className="font-semibold">By else</span>
                    </label>
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input type="checkbox" checked={isAltered} onChange={e => setIsAltered(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-slate-950 accent-cyan-500" />
                <span className="font-semibold">Altered</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
            <button disabled={adding} onClick={handleAddToHave} className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex justify-center items-center gap-2">
              {adding ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Add to Have List
            </button>
            <button className="flex-1 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.3)] flex justify-center items-center gap-2">
              <Plus size={20} /> Add to Want List
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
