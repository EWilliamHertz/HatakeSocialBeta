'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Minus, X, Check, Save, ClipboardPaste } from 'lucide-react';
import { useDeckStore, DeckCard } from '@/store/deckStore';
import { LegalityEngine } from '@/lib/LegalityEngine';
import { GAME_FORMATS } from '@/lib/formats';

export function HatakeDeckBuilder({ initialDeck, onBack }: { initialDeck?: any, onBack?: () => void }) {
  const { 
    activeGame, setActiveGame, 
    deckName, setDeckName, 
    deckFormat, setDeckFormat, 
    mainDeck, sideboard, 
    addCardToMain, removeCardFromMain, 
    addCardToSideboard, removeCardFromSideboard,
    setInitialDeck 
  } = useDeckStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DeckCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', messages: string[] } | null>(null);

  useEffect(() => {
    if (initialDeck) {
      setInitialDeck(
        initialDeck.cards || [], 
        initialDeck.sideboard || [], 
        initialDeck.name || 'New Deck', 
        initialDeck.format || 'Standard', 
        initialDeck.game || 'MAGIC'
      );
    }
  }, [initialDeck, setInitialDeck]);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery, activeGame]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await fetch(`/api/collection/search?game=${activeGame}&q=${encodeURIComponent(searchQuery)}&page=1`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.cards.map((c: any) => ({
          id: c.apiId,
          name: c.name,
          imageUrl: c.imageUrl,
          price: c.price || 0,
          count: 1,
          maxAvailable: 0,
          apiPayload: c.apiPayload
        }));
        setSearchResults(mapped);
      }
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  const handleSave = async () => {
    const result = LegalityEngine.validate(activeGame, deckFormat, mainDeck, sideboard);
    
    if (!result.isValid) {
      setToast({ type: 'error', messages: result.errors });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    setToast({ type: 'success', messages: ['Deck validated successfully! Saving to server...'] });
    
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initialDeck?.id,
          name: deckName,
          game: activeGame,
          format: deckFormat,
          isPublic: isPublic,
          cards: mainDeck,
          sideboard: sideboard
        })
      });
      if (res.ok) {
        setToast({ type: 'success', messages: ['Deck saved successfully!'] });
      } else {
        setToast({ type: 'error', messages: ['Failed to save deck to server.'] });
      }
    } catch (e) {
      setToast({ type: 'error', messages: ['Network error saving deck.'] });
    }
    setTimeout(() => setToast(null), 5000);
  };

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleBulkImport = async () => {
    setImporting(true);
    const lines = importText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedLines: { count: number; name: string; isSideboard: boolean }[] = [];
    let isSideboard = false;
    for (const line of lines) {
      if (line.toLowerCase() === 'sideboard') {
        isSideboard = true;
        continue;
      }
      const match = line.match(/^(\d+)[xX]?\s+(.+)$/);
      if (match) {
        const count = parseInt(match[1], 10);
        let rawName = match[2].trim();
        rawName = rawName.replace(/(?:\[.*?\]|\(.*?\))\s*\d*$/, '').trim();
        rawName = rawName.replace(/\b[A-Z0-9]{3}\b\s+\d+$/, '').trim();
        parsedLines.push({ count, name: rawName, isSideboard });
      }
    }

    try {
      const res = await fetch('/api/collection/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game: activeGame, lines: parsedLines.map(l => ({ name: l.name })) })
      });
      if (res.ok) {
        const data = await res.json();
        parsedLines.forEach(pl => {
          const cardData = data.cards.find((c: any) => c.name.toLowerCase() === pl.name.toLowerCase());
          if (cardData) {
            const dc = {
              id: cardData.apiId,
              name: cardData.name,
              imageUrl: cardData.imageUrl,
              price: cardData.price,
              count: 1,
              maxAvailable: 0,
              apiPayload: cardData.apiPayload
            };
            if (pl.isSideboard) {
              for(let i=0; i<pl.count; i++) addCardToSideboard(dc);
            } else {
              for(let i=0; i<pl.count; i++) addCardToMain(dc);
            }
          }
        });
        setToast({ type: 'success', messages: ['Imported deck successfully!'] });
        setShowImportModal(false);
        setImportText('');
      } else {
        setToast({ type: 'error', messages: ['Failed to import deck.'] });
      }
    } catch (e) {
      setToast({ type: 'error', messages: ['Network error during import.'] });
    }
    setImporting(false);
    setTimeout(() => setToast(null), 5000);
  };

  const games = ['MAGIC', 'POKEMON', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'];
  const hasSideboard = activeGame === 'MAGIC' || activeGame === 'RIFTBOUND';

  const getCardImage = (card: DeckCard) => {
    let url = card.imageUrl || card.apiPayload?.image_uris?.normal || card.apiPayload?.card_faces?.[0]?.image_uris?.normal;
    if (url) return `/api/proxy?url=${encodeURIComponent(url)}`;
    return 'https://i.imgur.com/B06rBhI.png';
  };

  const [isPublic, setIsPublic] = useState(initialDeck?.isPublic || false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#121212', color: '#E0E0E0' }}>
      
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 border-b border-gray-700 bg-[#121212]/90 backdrop-blur px-4 py-3 flex flex-wrap items-center justify-between gap-y-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-gray-400 hover:text-white mr-2 border border-gray-700 p-2 rounded">
              <X size={16} />
            </button>
          )}
          <h1 className="text-lg hidden md:block font-black tracking-widest uppercase" style={{ color: '#00E5FF', textShadow: '0 0 10px rgba(0, 229, 255, 0.3)' }}>
            Hatake Builder
          </h1>
          <div className="flex gap-2">
            {games.map(g => (
              <button 
                key={g} 
                onClick={() => setActiveGame(g)}
                className={`px-3 py-1 text-xs font-bold uppercase transition-all border ${activeGame === g ? 'border-[#00E5FF] text-[#00E5FF] shadow-[0_0_10px_rgba(0,229,255,0.2)] bg-[#00E5FF]/10' : 'border-gray-700 text-gray-500 hover:text-gray-300'}`}
              >
                {g.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input 
            type="text" 
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            className="bg-black/50 border border-gray-700 px-4 py-2 text-sm outline-none focus:border-[#00E5FF] text-white max-w-[200px]"
          />
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-3 py-2 border font-bold text-xs whitespace-nowrap transition-all ${isPublic ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-gray-700 bg-black/50 text-gray-500'}`}
          >
            {isPublic ? 'Public Deck' : 'Private Deck'}
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-white border border-gray-700 bg-gray-800 font-bold transition-all hover:bg-gray-700 whitespace-nowrap text-sm"
          >
            <ClipboardPaste size={16} /> Import Deck
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 text-black font-bold transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#00E5FF', boxShadow: '0 0 15px rgba(0,229,255,0.4)' }}
          >
            <Save size={16} /> Save Deck
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#121212] border border-gray-700 w-full max-w-2xl flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ClipboardPaste size={20} className="text-[#00E5FF]" />
                Import Deck
              </h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1">
              <p className="text-sm text-gray-400 mb-2">
                Paste your decklist here. Format: <code>4 Silvergill Adept</code> or <code>1 Minamo, School at Water's Edge</code>. Use <code>Sideboard</code> on its own line to separate.
              </p>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder="4 Brainstorm&#10;4 Ponder&#10;...&#10;Sideboard&#10;2 Echoing Truth"
                className="w-full h-64 bg-black border border-gray-700 text-white p-4 font-mono text-sm outline-none focus:border-[#00E5FF] custom-scrollbar"
              />
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkImport}
                disabled={importing || !importText.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-[#00E5FF] text-black font-bold hover:bg-[#00E5FF]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Import Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 p-4 border shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4" style={{ 
          borderColor: toast.type === 'error' ? '#FF2A55' : '#00E5FF',
          backgroundColor: toast.type === 'error' ? 'rgba(255, 42, 85, 0.1)' : 'rgba(0, 229, 255, 0.1)'
        }}>
          <h3 className="font-bold mb-2 uppercase" style={{ color: toast.type === 'error' ? '#FF2A55' : '#00E5FF' }}>
            {toast.type === 'error' ? 'Legality Error' : 'Success'}
          </h3>
          <ul className="text-sm space-y-1">
            {toast.messages.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        </div>
      )}

      {/* Main Split Pane Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        
        {/* Left Pane - Search & Results */}
        <div className="w-1/3 border-r border-gray-700 bg-black/20 flex flex-col">
          {/* Search Inputs */}
          <div className="relative mb-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeGame.replace('_', ' ')} cards...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 py-3 pl-12 pr-4 rounded-xl outline-none focus:border-[#00E5FF] transition-all text-white placeholder-gray-500"
            />
            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#00E5FF]" size={18} />}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(card => (
                <div key={card.id} className="relative group border border-gray-700 hover:border-[#00E5FF] transition-all bg-[#121212] p-2 flex flex-col shadow-[2px_2px_0px_#111] hover:shadow-[4px_4px_0px_#00E5FF] hover:-translate-y-1">
                  <div className="aspect-[2.5/3.5] relative overflow-hidden mb-2">
                    <img src={getCardImage(card)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                      <button onClick={() => addCardToMain(card)} className="px-3 py-1 bg-[#00E5FF] text-black font-bold text-xs">Add to Main</button>
                      {hasSideboard && <button onClick={() => addCardToSideboard(card)} className="px-3 py-1 border border-[#00E5FF] text-[#00E5FF] bg-black/50 font-bold text-xs">Add to Side</button>}
                    </div>
                  </div>
                  <div className="mt-1 px-1 flex flex-col">
                    <p className="text-[10px] font-bold truncate text-gray-300" title={card.name}>{card.name}</p>
                    <div className="flex justify-between items-center text-[9px] text-gray-500 mt-0.5">
                      <span className="text-[#00E5FF]">€{card.price.toFixed(2)}</span>
                      <span>#{card.apiPayload?.collector_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane - Active Deck */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="mb-8 flex justify-between items-end border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-2">{deckName}</h2>
              <div className="flex items-center gap-4">
                <span className="text-[#00E5FF] text-sm font-bold">{mainDeck.reduce((s,c) => s+c.count, 0)} Cards</span>
                <select 
                  value={deckFormat} 
                  onChange={e => setDeckFormat(e.target.value)}
                  className="bg-[#121212] border border-gray-700 text-xs px-2 py-1 outline-none text-[#E0E0E0]"
                >
                  {GAME_FORMATS[activeGame]?.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-12">
            {mainDeck.map(card => (
              <div key={card.id} className="relative group border border-gray-700 bg-[#121212] p-2 flex flex-col">
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#00E5FF] text-black font-black flex items-center justify-center rounded-full z-20 shadow-lg border-2 border-[#121212]">
                  {card.count}
                </div>
                <div className="aspect-[2.5/3.5] relative overflow-hidden mb-2">
                  <img src={getCardImage(card)} className="w-full h-full object-cover group-hover:opacity-30 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeCardFromMain(card.id)} className="w-8 h-8 bg-black border border-gray-500 hover:border-white rounded-full flex items-center justify-center text-white"><Minus size={14} /></button>
                    <button onClick={() => addCardToMain(card)} className="w-8 h-8 bg-[#00E5FF] rounded-full flex items-center justify-center text-black font-bold"><Plus size={14} /></button>
                  </div>
                </div>
                <p className="text-[10px] font-bold truncate text-gray-300">{card.name}</p>
              </div>
            ))}
          </div>

          {hasSideboard && (
            <div>
              <div className="mb-4 flex justify-between items-end border-b border-gray-700 pb-2">
                <h3 className="text-xl font-bold text-gray-400">Sideboard</h3>
                <span className="text-gray-500 text-sm font-bold">{sideboard.reduce((s,c) => s+c.count, 0)} Cards</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 opacity-75">
                {sideboard.map(card => (
                  <div key={card.id} className="relative group border border-gray-700 bg-[#121212] p-2 flex flex-col">
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 text-white font-black flex items-center justify-center rounded-full z-20 shadow-lg border-2 border-[#121212]">
                      {card.count}
                    </div>
                    <div className="aspect-[2.5/3.5] relative overflow-hidden mb-2">
                      <img src={getCardImage(card)} className="w-full h-full object-cover group-hover:opacity-30 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => removeCardFromSideboard(card.id)} className="w-8 h-8 bg-black border border-gray-500 hover:border-white rounded-full flex items-center justify-center text-white"><Minus size={14} /></button>
                        <button onClick={() => addCardToSideboard(card)} className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold"><Plus size={14} /></button>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold truncate text-gray-400">{card.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
