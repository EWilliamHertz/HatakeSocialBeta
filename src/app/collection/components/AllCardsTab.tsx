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

import CardModal from './CardModal';
import { getGameColor } from './SealedTab';

export default function AllCardsTab() {
  const [game, setGame] = useState<Game | 'ALL'>(() => {
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
  const [showFoil, setShowFoil] = useState(false);
  
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
        
        const newCards = filteredCards.map((c: any) => {
          const cNum = c.collectorNumber || 
                       c.apiPayload?.Number || 
                       (c.apiPayload?.extendedData && Array.isArray(c.apiPayload.extendedData) 
                         ? c.apiPayload.extendedData.find((e: any) => e.name === 'Number')?.value 
                         : null);
          return {
            id: c.apiId,
            name: c.name,
            game: c.game,
            imageUrl: c.imageUrl,
            price: c.price || 0,
            foilPrice: c.foilPrice || 0,
            reverseHoloPrice: c.reverseHoloPrice || 0,
            setCode: c.setCode,
            collectorNumber: cNum,
            prices: c.apiPayload?.prices || null  
          };
        });

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
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'POKEMON', 'MAGIC', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'].map(g => {
          const isActive = game === g;
          const baseColor = isActive ? (g === 'ALL' ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' : `${getGameColor(g)} shadow-lg scale-105`) : 'bg-slate-950 border border-white/10 text-slate-400 hover:border-white/30';
          return (
            <button 
              key={g}
              onClick={() => {
                setGame(g as Game | 'ALL');
                if (typeof window !== 'undefined') localStorage.setItem('collection_search_game', g);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${baseColor}`}
            >
              {g.replace('_', ' ')}
            </button>
          );
        })}
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

        {(game === 'ALL' || game === 'MAGIC' || game === 'POKEMON' || game === 'ONE_PIECE' || game === 'LORCANA' || game === 'RIFTBOUND') && (
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
        
        {(game === 'MAGIC' || game === 'POKEMON') && (
          <label className="flex items-center gap-2 cursor-pointer ml-auto border border-white/10 px-4 py-2 rounded-xl bg-slate-950/50 hover:bg-slate-900 transition-colors">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{game === 'POKEMON' ? 'Holo / Reverse' : 'Foil'} Prices</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${showFoil ? 'bg-cyan-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${showFoil ? 'translate-x-4' : ''}`} />
            </div>
            <input type="checkbox" className="hidden" checked={showFoil} onChange={e => setShowFoil(e.target.checked)} />
          </label>
        )}
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
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {(game === 'ALL' || card.game) && (
                    <span className={`${getGameColor(card.game)} text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg backdrop-blur-sm inline-block w-fit`}>
                      {card.game.replace('_', ' ')}
                    </span>
                  )}
                  {card.collectorNumber && (
                    <span className="bg-slate-900/90 text-slate-200 border border-white/20 text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg backdrop-blur-sm inline-block w-fit">
                      #{card.collectorNumber}
                    </span>
                  )}
                </div>
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
                {card.game === 'NARUTO' ? (
                  <span className="text-slate-500 font-bold">No Market Data</span>
                ) : showFoil && (game === 'MAGIC' || game === 'POKEMON') ? (
                  card.foilPrice || card.reverseHoloPrice ? `€${((game === 'POKEMON' && card.reverseHoloPrice ? card.reverseHoloPrice : card.foilPrice) || card.foilPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : (
                    <span className="text-slate-500 font-bold">No {game === 'POKEMON' ? 'Holo' : 'Foil'} Data</span>
                  )
                ) : (card.game === 'POKEMON' && (card.price === 0 || card.price === 0.3)) ? (
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
