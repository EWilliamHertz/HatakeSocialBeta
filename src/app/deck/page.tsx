'use client';

import React, { useState, useEffect } from 'react';
import { Swords, Plus, Play, Sparkles, TrendingUp, Layers, Filter, Globe, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HatakeDeckBuilder } from "./../components/HatakeDeckBuilder";
import { DeckViewer } from '@/components/DeckViewer';

type GameType = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO' | 'LORCANA' | 'RIFTBOUND';
type TabType = 'META' | 'COMMUNITY' | 'YOURS';

export default function DeckHubPage() {
  const [selectedGame, setSelectedGame] = useState<GameType>('MAGIC');
  const [activeTab, setActiveTab] = useState<TabType>('YOURS');
  
  // State for deck builder
  const [isBuilding, setIsBuilding] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingDeck, setEditingDeck] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewingDeck, setViewingDeck] = useState<any>(null);

  // Data state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myDecks, setMyDecks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [communityDecks, setCommunityDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch My Decks
  useEffect(() => {
    if (activeTab === 'YOURS') {
      setLoading(true);
      fetch(`/api/decks/my?game=${selectedGame}`)
        .then(res => res.json())
        .then(data => {
          if (data.decks) setMyDecks(data.decks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab, selectedGame]);

  // Fetch Community Decks
  useEffect(() => {
    if (activeTab === 'COMMUNITY') {
      setLoading(true);
      fetch(`/api/decks?game=${selectedGame}`)
        .then(res => res.json())
        .then(data => {
          if (data.decks) setCommunityDecks(data.decks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab, selectedGame]);

  // Fetch Meta Decks
  const [metaDecks, setMetaDecks] = useState<any[]>([]);
  useEffect(() => {
    if (activeTab === 'META') {
      setLoading(true);
      fetch(`/api/decks/meta?game=${selectedGame}`) // Wait, I need an endpoint for this. Let's create it. Or just use /api/decks?meta=true
        .then(res => res.json())
        .then(data => {
          if (data.decks) setMetaDecks(data.decks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab, selectedGame]);

  const handleCreateNew = () => {
    setEditingDeck({ id: null, name: 'New Deck', game: selectedGame, format: 'Standard', cards: [], isPublic: false });
    setIsBuilding(true);
  };

  if (isBuilding) {
    return (
      <HatakeDeckBuilder 
        initialDeck={editingDeck}
        onBack={() => {
          setIsBuilding(false);
          // Refresh list on return
          if (activeTab === 'YOURS') {
             fetch(`/api/decks/my?game=${selectedGame}`).then(res=>res.json()).then(data=>setMyDecks(data.decks||[]));
          }
        }} 
      />
    );
  }

  if (isViewing) {
    return (
      <DeckViewer
        deck={viewingDeck}
        onClose={() => setIsViewing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
      <div className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        

        {/* Game Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center bg-slate-900/50 p-2 rounded-2xl border border-white/5 w-fit">
          {(['MAGIC', 'POKEMON', 'ONE_PIECE', 'LORCANA', 'RIFTBOUND', 'NARUTO'] as GameType[]).map(game => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-6 py-3 rounded-xl text-sm font-black tracking-wider uppercase transition-all flex items-center gap-2 ${
                selectedGame === game 
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {game === 'MAGIC' ? 'MTG' : game === 'NARUTO' ? 'Naruto Mythos' : game.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('META')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'META' ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-white/5'}`}
          >
            <TrendingUp size={18} /> Meta Decks
          </button>
          <button 
            onClick={() => setActiveTab('COMMUNITY')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'COMMUNITY' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-white/5'}`}
          >
            <Globe size={18} /> Community Decks
          </button>
          <button 
            onClick={() => setActiveTab('YOURS')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'YOURS' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-white/5'}`}
          >
            <Layers size={18} /> Your Decks
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + selectedGame}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'YOURS' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-white">Your {selectedGame === 'MAGIC' ? 'MTG' : selectedGame.replace('_', ' ')} Decks</h3>
                  <button 
                    onClick={handleCreateNew}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus size={18} /> Create New Deck
                  </button>
                </div>
                
                {/* Filters */}
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl mb-6 flex gap-4">
                  <select className="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none">
                    <option>All Formats</option>
                    <option>Standard</option>
                    <option>Modern</option>
                    <option>Commander</option>
                  </select>
                  <button className="px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-sm text-white hover:bg-white/5 flex items-center gap-2">
                    <Filter size={14} /> More Filters
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20 text-cyan-500"><Loader2 className="animate-spin" size={32} /></div>
                ) : myDecks.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl">
                    <Layers size={48} className="mx-auto mb-4 opacity-20" />
                    <h4 className="text-lg font-bold text-white mb-2">No decks found</h4>
                    <p className="text-slate-400 mb-6">You haven't created any {selectedGame} decks yet.</p>
                    <button onClick={handleCreateNew} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg">Start Building</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myDecks.map(deck => {
                      // Calculate cards
                      const totalCards = Array.isArray(deck.cards) ? deck.cards.reduce((acc: number, c: any) => acc + (c.count || 0), 0) : 0;
                      
                      return (
                      <div key={deck.id} onClick={() => { setEditingDeck(deck); setIsBuilding(true); }} className="bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-cyan-500/50 cursor-pointer group transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{deck.name}</h4>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-white/5">{deck.format || 'Casual'}</span>
                          </div>
                          <div className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-all">
                            <Play size={16} className="text-cyan-400 ml-1" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cards</p>
                            <p className="text-white font-bold">{totalCards}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Status</p>
                            <p className={`font-black text-sm ${deck.isPublic ? 'text-indigo-400' : 'text-slate-500'}`}>{deck.isPublic ? 'Public' : 'Private'}</p>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'META' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Sparkles className="text-fuchsia-400" /> Top {selectedGame === 'MAGIC' ? 'MTG' : selectedGame.replace('_', ' ')} Meta Decks</h3>
                    <p className="text-slate-400 text-sm mt-1">Curated list of high-performing tournament decks.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20 text-fuchsia-500"><Loader2 className="animate-spin" size={32} /></div>
                ) : metaDecks.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl border-dashed">
                    <Sparkles size={48} className="mx-auto mb-4 text-fuchsia-500/30" />
                    <h4 className="text-lg font-bold text-white mb-2">No Meta Decks found</h4>
                    <p className="text-slate-400 mb-6 max-w-md mx-auto">No tournament decks have been cataloged for {selectedGame} yet. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {metaDecks.map(deck => {
                      const deckPrice = Array.isArray(deck.cards) ? deck.cards.reduce((acc: number, c: any) => acc + (c.price || 0) * (c.count || 1), 0) : 0;
                      
                      return (
                      <div key={deck.id} onClick={() => { setViewingDeck(deck); setIsViewing(true); }} className="bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-fuchsia-500/50 cursor-pointer group transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl group-hover:bg-fuchsia-500/20 transition-all z-0"></div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-bold text-white group-hover:text-fuchsia-400 transition-colors">{deck.name}</h4>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-white/5">{deck.format}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-end border-t border-white/5 pt-4">
                            <div>
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Author</p>
                              <p className="text-emerald-400 font-black">{deck.metaAuthor || 'Unknown'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Deck Value</p>
                              <p className="text-emerald-400 font-black">€{deckPrice.toFixed(2)}</p>
                            </div>
                          </div>
                          <button className="w-full mt-4 py-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                            <Layers size={14} /> View Deck
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'COMMUNITY' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Globe className="text-indigo-400" /> Community Decks</h3>
                    <p className="text-slate-400 text-sm mt-1">Discover creative builds from HatakeSocial members.</p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20 text-indigo-500"><Loader2 className="animate-spin" size={32} /></div>
                ) : communityDecks.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl">
                    <Globe size={48} className="mx-auto mb-4 opacity-20" />
                    <h4 className="text-lg font-bold text-white mb-2">No public decks found</h4>
                    <p className="text-slate-400 mb-6">Be the first to share your {selectedGame} deck with the community!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {communityDecks.map(deck => {
                      const totalCards = Array.isArray(deck.cards) ? deck.cards.reduce((acc: number, c: any) => acc + (c.count || 0), 0) : 0;
                      
                      return (
                      <div key={deck.id} onClick={() => { setViewingDeck(deck); setIsViewing(true); }} className="bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-indigo-500/50 cursor-pointer group transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all z-0"></div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{deck.name}</h4>
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-white/5">{deck.format || 'Casual'}</span>
                            </div>
                            {deck.owner?.profilePictureUrl ? (
                              <img src={deck.owner.profilePictureUrl} className="w-8 h-8 rounded-full border border-white/10" alt="Avatar" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">{deck.owner?.name?.[0]}</div>
                            )}
                          </div>
                          <div className="flex justify-between items-end border-t border-white/5 pt-4">
                            <div>
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cards</p>
                              <p className="text-indigo-400 font-black">{totalCards}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Author</p>
                              <p className="text-white font-black text-sm">@{deck.owner?.handle}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
