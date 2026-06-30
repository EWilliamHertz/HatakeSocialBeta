'use client';
export const dynamic = 'force-dynamic';
import React, { useState } from 'react';
import { Search, Sparkles, SlidersHorizontal, ShoppingCart, Package, Clock, Gavel, X, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import ReputationStars from '@/components/ReputationStars';

type Game = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO';

export default function MarketPage() {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  
  React.useEffect(() => {
    const saved = localStorage.getItem('market_games');
    if (saved) {
      setActiveGames(JSON.parse(saved));
    } else {
      setActiveGames(['MAGIC']);
    }
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { t } = useI18n();
  
  // Advanced Filters
  const [mtgColors, setMtgColors] = useState<string[]>([]);
  const [pokemonTypes, setPokemonTypes] = useState<string[]>([]);
  
  // Modifier Filters
  const [isFoil, setIsFoil] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isAltered, setIsAltered] = useState(false);
  const [condition, setCondition] = useState('ALL');
  
  // Modals
  const [showStatsFilter, setShowStatsFilter] = useState(false);
  const [showModifierFilter, setShowModifierFilter] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auction Modal
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [placingBid, setPlacingBid] = useState(false);

  React.useEffect(() => {
    let url = '/api/market?';
    if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
    if (activeGames.length > 0) url += `games=${activeGames.join(',')}&`;
    if (mtgColors.length > 0) url += `mtgColors=${mtgColors.join(',')}&`;
    if (pokemonTypes.length > 0) url += `pokemonTypes=${pokemonTypes.join(',')}&`;
    if (isFoil) url += `isFoil=true&`;
    if (isSigned) url += `isSigned=true&`;
    if (isAltered) url += `isAltered=true&`;
    if (condition !== 'ALL') url += `condition=${condition}&`;

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.listings) setListings(data.listings);
        setLoading(false);
      });
  }, [searchQuery, activeGames, mtgColors, pokemonTypes, isFoil, isSigned, isAltered, condition]);

  const toggleGame = (game: Game) => {
    setActiveGames(prev => {
      const newGames = prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game];
      localStorage.setItem('market_games', JSON.stringify(newGames));
      return newGames;
    });
  };

  const toggleMtgColor = (color: string) => {
    setMtgColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const togglePokemonType = (type: string) => {
    setPokemonTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBuy = async (listing: any) => {
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id })
      });
      
      const data = await res.json();
      if (res.ok) {
        router.push(`/deals/${data.deal.id}`);
      } else {
        alert(data.error || 'Failed to initialize deal.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error initializing deal');
    }
  };

  const handleBidSubmit = async () => {
    if (!selectedAuction || !bidAmount || isNaN(Number(bidAmount))) return;
    const amount = Number(bidAmount);
    
    if (amount <= (selectedAuction.currentBid || selectedAuction.price)) {
      alert('Budet måste vara högre än nuvarande bud/startbud!');
      return;
    }

    setPlacingBid(true);
    // Simulate bid placed successfully (Wait for real backend implementation)
    setTimeout(() => {
      setListings(listings.map(l => l.id === selectedAuction.id ? { ...l, currentBid: amount } : l));
      setSelectedAuction({ ...selectedAuction, currentBid: amount });
      setBidAmount('');
      setPlacingBid(false);
      alert('Ditt bud har lagts!');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32 pt-20 px-4 md:px-8">
      
      {/* Header & Game Selector D-Pad */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 mb-12">
        <div className="flex-1 text-center md:text-left flex items-center gap-6">
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-4">
              {t('market.title')}
            </h1>
            <p className="text-slate-400 text-lg">{t('market.subtitle')}</p>
          </div>
          
          <button 
            onClick={() => router.push('/shop')}
            className="hidden md:flex ml-4 px-8 py-4 bg-gradient-to-tr from-fuchsia-600 to-cyan-600 hover:scale-105 transition-transform text-white font-black rounded-3xl shadow-xl items-center gap-3"
          >
            <ShoppingCart size={24} /> ENTER SHOP
          </button>
        </div>

        {/* Mobile Shop Button */}
        <button 
          onClick={() => router.push('/shop')}
          className="md:hidden w-full mb-4 px-8 py-4 bg-gradient-to-tr from-fuchsia-600 to-cyan-600 hover:scale-105 transition-transform text-white font-black rounded-3xl shadow-xl flex justify-center items-center gap-3"
        >
          <ShoppingCart size={24} /> ENTER SHOP
        </button>

        {/* D-Pad Game Selector */}
        <div className="relative w-48 h-48 flex-shrink-0 bg-slate-900/50 rounded-full border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          {/* Top: MAGIC */}
          <button 
            onClick={() => toggleGame('MAGIC')}
            className={`absolute top-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${activeGames.includes('MAGIC') ? 'bg-gradient-to-tr from-fuchsia-600 to-fuchsia-400 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-fuchsia-500/50 grayscale hover:grayscale-0'}`}
          >
            <span className="font-black text-[9px] text-white">MTG</span>
          </button>

          {/* Bottom: POKEMON */}
          <button 
            onClick={() => toggleGame('POKEMON')}
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${activeGames.includes('POKEMON') ? 'bg-gradient-to-tr from-yellow-500 to-yellow-300 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-yellow-500/50 grayscale hover:grayscale-0'}`}
          >
            <span className="font-black text-[9px] text-black">PKMN</span>
          </button>

          {/* Left: ONE PIECE */}
          <button 
            onClick={() => toggleGame('ONE_PIECE')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${activeGames.includes('ONE_PIECE') ? 'bg-gradient-to-tr from-red-600 to-red-400 border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-red-500/50 grayscale hover:grayscale-0'}`}
          >
            <span className="font-black text-[9px] text-white">OPCG</span>
          </button>

          {/* Right: NARUTO */}
          <button 
            onClick={() => toggleGame('NARUTO')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${activeGames.includes('NARUTO') ? 'bg-gradient-to-tr from-orange-600 to-orange-400 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-slate-800 border-slate-700 hover:border-orange-500/50 grayscale hover:grayscale-0'}`}
          >
            <span className="font-black text-[9px] text-white">NRT</span>
          </button>

          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-cyan-400" />
            </div>
            <input 
              type="text" 
              placeholder={t('market.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-lg text-lg"
            />
          </div>
          <button 
            onClick={() => setShowStatsFilter(!showStatsFilter)}
            className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 border transition-all ${showStatsFilter || mtgColors.length > 0 || pokemonTypes.length > 0 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-900 border-white/10 hover:bg-slate-800 text-white'}`}
          >
            <SlidersHorizontal size={20} /> {t('market.gameStats')} {(mtgColors.length > 0 || pokemonTypes.length > 0) && `(${(mtgColors.length + pokemonTypes.length)})`}
          </button>
          <button 
            onClick={() => setShowModifierFilter(!showModifierFilter)}
            className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 border transition-all ${showModifierFilter || isFoil || isSigned || isAltered || condition !== 'ALL' ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400' : 'bg-slate-900 border-white/10 hover:bg-slate-800 text-white'}`}
          >
            <Sparkles size={20} /> {t('market.condition')}
          </button>
        </div>

        {/* Expandable Stats Filter Menu */}
        {showStatsFilter && (
          <div className="mt-4 p-6 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-xl flex flex-wrap gap-12">
            
            {/* Magic Stats */}
            {activeGames.includes('MAGIC') && (
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500"></span> Magic Colors
                </p>
                <div className="flex gap-4">
                  {['W', 'U', 'B', 'R', 'G', 'C'].map(c => (
                    <button
                      key={c}
                      onClick={() => toggleMtgColor(c)}
                      className={`w-10 h-10 rounded-full font-black flex items-center justify-center border-2 transition-all ${mtgColors.includes(c) ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.3)]' : 'bg-slate-950 border-white/10 text-slate-500 hover:border-white/30'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pokemon Stats */}
            {activeGames.includes('POKEMON') && (
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pokemon Energy
                </p>
                <div className="flex flex-wrap gap-3 max-w-sm">
                  {['Colorless', 'Darkness', 'Dragon', 'Fairy', 'Fighting', 'Fire', 'Grass', 'Lightning', 'Metal', 'Psychic', 'Water'].map(t => (
                    <button
                      key={t}
                      onClick={() => togglePokemonType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${pokemonTypes.includes(t) ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-slate-950 border-white/10 text-slate-500 hover:border-white/30'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Expandable Modifier Filter Menu */}
        {showModifierFilter && (
          <div className="mt-4 p-6 bg-slate-900 border border-fuchsia-500/30 rounded-2xl shadow-xl flex gap-12">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">General</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isSigned} onChange={e => setIsSigned(e.target.checked)} className="accent-fuchsia-500" /> Artist Signed</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isAltered} onChange={e => setIsAltered(e.target.checked)} className="accent-fuchsia-500" /> Altered Art</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={isFoil} onChange={e => setIsFoil(e.target.checked)} className="accent-fuchsia-500" /> Foil / Holo / Reverse</label>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase mb-3 tracking-wider">Condition</p>
              <select value={condition} onChange={e => setCondition(e.target.value)} className="bg-slate-950 border border-white/10 rounded px-4 py-2 text-white outline-none">
                <option value="ALL">Any Condition</option>
                <option value="MINT">Mint</option>
                <option value="NEAR_MINT">Near Mint</option>
                <option value="LIGHTLY_PLAYED">Lightly Played</option>
                <option value="MODERATELY_PLAYED">Moderately Played</option>
                <option value="HEAVILY_PLAYED">Heavily Played</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Market Results */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 border-b border-white/5 pb-4">{t('market.recent')}</h2>
        
        {loading ? (
          <div className="text-center text-slate-500 py-20 font-bold">Loading market data...</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-slate-500 py-20 font-bold">No active listings match your criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {listings.map((listing: any) => (
              <div key={listing.id} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-cyan-500/30 transition-all group">
                <div className="h-64 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={listing.isPackage ? (listing.packageImageUrl || 'https://i.imgur.com/B06rBhI.png') : (listing.cardInstance?.customImageUrl || (listing.cardInstance?.cardReference?.imageUrl ? `/api/proxy?url=${encodeURIComponent(listing.cardInstance?.cardReference?.imageUrl)}` : 'https://i.imgur.com/B06rBhI.png'))} alt={listing.isPackage ? listing.packageTitle : listing.cardInstance?.cardReference?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                      {listing.type === 'AUCTION' ? <><Clock size={10} className="text-amber-400"/> {t('market.auction')}</> : <><ShoppingCart size={10} className="text-emerald-400"/> {t('market.buyNow')}</>}
                    </span>
                    {listing.isPackage && (
                      <span className="bg-fuchsia-500/80 backdrop-blur-md px-2 py-1 rounded border border-fuchsia-400/50 text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                        <Package size={10}/> {t('market.package')}
                      </span>
                    )}
                    {!listing.isPackage && listing.cardInstance?.condition && (
                      <span className="bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/20 text-[10px] font-black uppercase text-white tracking-wider">
                        {listing.cardInstance?.condition.replace('_', ' ')}
                      </span>
                    )}
                    {!listing.isPackage && listing.cardInstance?.isFoil && (
                      <span className="bg-gradient-to-r from-amber-200 to-amber-500 px-2 py-1 rounded border border-amber-200/50 text-[10px] font-black uppercase text-black tracking-wider shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                        FOIL
                      </span>
                    )}
                    {listing.cardInstance?.isSigned && (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-1 rounded border border-pink-500/50 text-[10px] font-black uppercase text-white tracking-wider shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                        SIGNED
                      </span>
                    )}
                    {listing.cardInstance?.isAltered && (
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 rounded border border-orange-500/50 text-[10px] font-black uppercase text-white tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                        ALTERED
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg line-clamp-1">
                      {listing.isPackage ? listing.packageTitle : listing.cardInstance?.cardReference?.name}
                    </h3>
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded uppercase">
                      {listing.isPackage ? 'Mixed' : listing.cardInstance?.cardReference?.game}
                    </span>
                  </div>
                  <div className="flex flex-col mb-4">
                    <p className="text-slate-400 text-xs">{t('market.seller')}: {listing.seller?.username || 'Okänd'}</p>
                    <ReputationStars score={listing.seller?.reputationScore} totalReviews={listing.seller?.totalReviews || 0} size={12} className="mt-1" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">{listing.type === 'AUCTION' ? t('market.currentBid') : t('sales.price')}</p>
                      <p className="text-2xl font-black text-fuchsia-400">€{(listing.type === 'AUCTION' ? (listing.currentBid || listing.price) : listing.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                    
                    {listing.type === 'AUCTION' ? (
                      <button 
                        onClick={() => setSelectedAuction(listing)}
                        className="px-4 py-2 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-lg hover:scale-110 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] text-white font-bold flex items-center gap-2"
                      >
                        <Gavel size={18} /> {t('market.bid')}
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBuy(listing)}
                        className="px-4 py-2 bg-gradient-to-tr from-cyan-600 to-fuchsia-600 rounded-lg hover:scale-110 transition-all shadow-lg text-white font-bold flex items-center gap-2"
                      >
                        <ShoppingCart size={18} /> {t('market.buy')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auction Modal */}
      <AnimatePresence>
        {selectedAuction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedAuction(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-2xl w-full shadow-2xl flex flex-col md:flex-row gap-8 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedAuction(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full z-10"><X size={20}/></button>
              
              <div className="w-full md:w-1/2 flex flex-col">
                <div className="rounded-2xl overflow-hidden border border-white/10 mb-4 bg-black aspect-auto relative">
                  <img src={selectedAuction.isPackage ? (selectedAuction.packageImageUrl || 'https://i.imgur.com/B06rBhI.png') : (selectedAuction.cardInstance?.customImageUrl || selectedAuction.cardInstance?.cardReference?.imageUrl || 'https://i.imgur.com/B06rBhI.png')} alt="" className="w-full h-auto object-contain max-h-[300px]" />
                  <div className="absolute top-2 left-2 px-3 py-1 bg-amber-500/90 text-black font-black text-xs rounded uppercase flex items-center gap-1 shadow-lg">
                    <Clock size={12} /> {t('market.ends')}: {new Date(selectedAuction.auctionEndsAt).toLocaleDateString()}
                  </div>
                </div>
                <h2 className="text-2xl font-black text-white mb-1">
                  {selectedAuction.isPackage ? selectedAuction.packageTitle : selectedAuction.cardInstance?.cardReference?.name}
                </h2>
                <p className="text-slate-400 text-sm mb-4">{t('market.seller')}: <span className="text-cyan-400 font-bold">@{selectedAuction.seller?.username}</span></p>
                
                {selectedAuction.isPackage && selectedAuction.packageDesc && (
                  <p className="text-slate-300 text-sm bg-white/5 p-3 rounded-xl mb-4 italic">"{selectedAuction.packageDesc}"</p>
                )}

                <div className="mt-auto">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t('market.currentBid')}</p>
                  <p className="text-4xl font-black text-emerald-400 mb-6">€{(selectedAuction.currentBid || selectedAuction.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                      <input 
                        type="number" 
                        value={bidAmount}
                        onChange={e => setBidAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-amber-500/30 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-amber-500 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <button 
                      onClick={handleBidSubmit}
                      disabled={placingBid}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-50 transition-all"
                    >
                      {placingBid ? t('market.placingBid') : t('market.placeBid')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Activity size={18} className="text-amber-400" /> {t('market.bidHistory')}</h3>
                
                <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-2xl border border-white/5 p-4 overflow-y-auto min-h-[200px]">
                  <p className="text-slate-500 font-bold text-center">
                    {t('market.noBids')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
