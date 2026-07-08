'use client';

import React, { useState, useEffect } from 'react';
import { Swords, Plus, Play, Sparkles, TrendingUp, Layers, Filter, Globe, Loader2, Heart, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HatakeDeckBuilder } from '@/components/HatakeDeckBuilder';
import { DeckViewer } from '@/components/DeckViewer';
import { GAME_FORMATS } from '@/lib/formats';
import { useSocket } from '@/hooks/useSocket';

type GameType = 'MAGIC' | 'POKEMON' | 'ONE_PIECE' | 'NARUTO' | 'LORCANA' | 'RIFTBOUND';
type TabType = 'META' | 'COMMUNITY' | 'YOURS';

const fetchWithRetry = async (url: string, retries = 3, delay = 1500) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn(`Fetch failed (${i + 1}/${retries}):`, err);
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  return null;
};

export default function DeckHubPage() {
  const [selectedGame, setSelectedGame] = useState<GameType>('MAGIC');
  const [activeTab, setActiveTab] = useState<TabType>('YOURS');
  const { socket } = useSocket();
  
  // State for deck builder
  const [isBuilding, setIsBuilding] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingDeck, setEditingDeck] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewingDeck, setViewingDeck] = useState<any>(null);
  const [playModalDeck, setPlayModalDeck] = useState<any>(null);
  const [launching, setLaunching] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setCurrentUser(d.user);
    }).catch(() => {});
  }, []);

  const router = useRouter();

  const handlePlay = (deck: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayModalDeck(deck);
  };

  const handleStartSolo = () => {
    if (!playModalDeck) return;

    const gameType = playModalDeck.game?.toLowerCase();
    
    // For Loryx and Euryx, they run a completely client-side goldfish engine so we don't need a socket lobby.
    if (gameType === 'lorcana') {
       router.push(`/play/loryx/game?deckId=${playModalDeck.id}`);
       return;
    } else if (gameType === 'pokemon') {
       alert('Pokemon engine is under construction!');
       return;
    }

    // For MTG, we need the socket server to host the engine logic
    if (!socket) return;
    setLaunching(true);

    const playerName = currentUser?.username || 'Player';
    
    socket.emit('create-lobby', {
      name: `${playerName}'s Solo Practice`,
      mode: '1v0',
      playerName,
      deckId: playModalDeck.id
    });
    
    const onLobbyCreated = ({ lobbyId }: { lobbyId: string }) => {
      socket.off('lobby-created', onLobbyCreated);
      socket.emit('ready', { lobbyId });
    };
    
    const onGameStart = ({ gameId, playerId }: { gameId: string, playerId: string }) => {
      socket.off('game-start', onGameStart);
      router.push(`/play/mtg/game?gameId=${gameId}&playerId=${playerId}`);
    };

    socket.on('lobby-created', onLobbyCreated);
    socket.on('game-start', onGameStart);
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this deck?')) return;
    try {
      const res = await fetch(`/api/decks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyDecks(myDecks.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayMeta = async (deck: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: deck.name + ' (Imported)',
          game: deck.game,
          format: deck.format,
          isPublic: false,
          cards: deck.cards,
          sideboard: deck.sideboard || []
        })
      });
      if (res.ok) {
        handlePlay(deck, e);
      } else {
        alert('Failed to import deck');
      }
    } catch (err) {
      alert('Network error');
    }
  };

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
      setMyDecks([]); // Clear old data
      fetchWithRetry(`/api/decks/my?game=${selectedGame}`)
        .then(data => {
          if (data && data.decks) setMyDecks(data.decks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab, selectedGame]);

  // Fetch Community Decks
  useEffect(() => {
    if (activeTab === 'COMMUNITY') {
      setLoading(true);
      setCommunityDecks([]); // Clear old data
      fetchWithRetry(`/api/decks?game=${selectedGame}`)
        .then(data => {
          if (data && data.decks) setCommunityDecks(data.decks);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [activeTab, selectedGame]);

  // Fetch Meta Decks
  const [metaDecks, setMetaDecks] = useState<any[]>([]);
  const [metaFormatFilter, setMetaFormatFilter] = useState<string>('All Formats');
  
  useEffect(() => {
    if (activeTab === 'META') {
      setLoading(true);
      setMetaDecks([]); // Clear old data
      fetchWithRetry(`/api/decks/meta?game=${selectedGame}`)
        .then(data => {
          if (data && data.decks) setMetaDecks(data.decks);
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
             fetchWithRetry(`/api/decks/my?game=${selectedGame}`).then(data=>{
               if (data && data.decks) setMyDecks(data.decks);
             });
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
                
                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl mb-6 flex gap-4">
                  <select className="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none">
                    <option>All Formats</option>
                    {GAME_FORMATS[selectedGame]?.map(fmt => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
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
                      const mainboardCount = Array.isArray(deck.cards) ? deck.cards.filter((c: any) => !c.isSideboard && !c.is_sideboard).reduce((acc: number, c: any) => acc + (c.count || c.quantity || 0), 0) : 0;
                      const sideboardCount = Array.isArray(deck.cards) ? deck.cards.filter((c: any) => c.isSideboard || c.is_sideboard).reduce((acc: number, c: any) => acc + (c.count || c.quantity || 0), 0) : 0;
                      const hasSb = sideboardCount > 0;
                      
                      return (
                      <div key={deck.id} className="bg-slate-900 border border-white/5 p-6 rounded-3xl hover:border-cyan-500/50 group transition-all flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{deck.name}</h4>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-950 px-2 py-1 rounded-md border border-white/5">{deck.format || 'Casual'}</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); setEditingDeck(deck); setIsBuilding(true); }} className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 hover:bg-slate-800 transition-all text-slate-400 hover:text-white">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={(e) => handlePlay(deck, e)} className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all text-cyan-400">
                              <Play size={16} className="ml-1" />
                            </button>
                            <button onClick={(e) => handleDeleteDeck(deck.id, e)} className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center border border-white/5 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-red-400">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-end mt-auto">
                          <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cards</p>
                            <p className="text-white font-bold">{mainboardCount} MB {hasSb && <span className="text-slate-500 ml-1">+ {sideboardCount} SB</span>}</p>
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

                <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <Play className="text-fuchsia-400 mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="text-white font-bold">Pro-tip!</p>
                    <p className="text-sm text-slate-300">You can playtest these meta decks instantly in our game client. Just click the Play button on any deck to add it to your library and launch the client.</p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/5 p-4 rounded-xl mb-6 flex gap-4">
                  <select 
                    value={metaFormatFilter} 
                    onChange={(e) => setMetaFormatFilter(e.target.value)} 
                    className="bg-slate-950 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none"
                  >
                    <option>All Formats</option>
                    {GAME_FORMATS[selectedGame]?.map(fmt => (
                      <option key={fmt} value={fmt}>{fmt}</option>
                    ))}
                  </select>
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
                    {(metaFormatFilter === 'All Formats' ? metaDecks : metaDecks.filter(d => d.format.toLowerCase() === metaFormatFilter.toLowerCase())).map(deck => {
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
                          <div className="flex gap-2 mt-4">
                            <button className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-white/10 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                              <Layers size={14} /> View Deck
                            </button>
                            <button onClick={(e) => handlePlayMeta(deck, e)} className="w-10 h-10 shrink-0 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg">
                              <Play size={16} className="ml-0.5" />
                            </button>
                          </div>
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
                      // Calculate cards
                      const mainboardCount = Array.isArray(deck.cards) ? deck.cards.filter((c: any) => !c.isSideboard && !c.is_sideboard).reduce((acc: number, c: any) => acc + (c.count || c.quantity || 0), 0) : 0;
                      const sideboardCount = Array.isArray(deck.cards) ? deck.cards.filter((c: any) => c.isSideboard || c.is_sideboard).reduce((acc: number, c: any) => acc + (c.count || c.quantity || 0), 0) : 0;
                      const hasSb = sideboardCount > 0;
                      
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
                              <p className="text-white font-bold">{mainboardCount} MB {hasSb && <span className="text-slate-500 ml-1">+ {sideboardCount} SB</span>}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Author</p>
                              <p className="text-white font-black text-sm">@{deck.owner?.handle}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5 text-slate-400">
                            <div className="flex gap-4">
                              <button className="flex items-center gap-1 hover:text-rose-400 transition-colors">
                                <Heart size={14} /> <span className="text-xs font-bold">{Math.floor(Math.random() * 100) + 1}</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                                <MessageCircle size={14} /> <span className="text-xs font-bold">{Math.floor(Math.random() * 30)}</span>
                              </button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setPlayModalDeck(deck); }} className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30 hover:bg-indigo-500 hover:text-white transition-all text-indigo-400">
                              <Play size={12} className="ml-0.5" />
                            </button>
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

      {playModalDeck && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-6 text-center">Select Game Mode</h2>
            <div className="space-y-4">
              <button disabled={launching} onClick={() => { 
                if (playModalDeck.game === 'MAGIC') {
                  const phaseDeck = {
                    main: playModalDeck.cards.filter((c: any) => !c.isSideboard && !c.is_sideboard).map((c: any) => ({ count: c.count || c.quantity || 1, name: c.name })),
                    sideboard: playModalDeck.cards.filter((c: any) => c.isSideboard || c.is_sideboard).map((c: any) => ({ count: c.count || c.quantity || 1, name: c.name }))
                  };
                  localStorage.setItem(`phase-deck:${playModalDeck.name}`, JSON.stringify(phaseDeck));
                  localStorage.setItem('phase-active-deck', playModalDeck.name);
                  router.push(`/play/mtg/play/queue`);
                } else {
                  alert('Ranked Queue coming soon!');
                }
              }} className="w-full p-4 bg-slate-800 hover:bg-fuchsia-600 border border-white/5 rounded-2xl font-bold text-white transition-all flex justify-between items-center group">
                <span className="flex items-center gap-3"><Swords className="text-fuchsia-400 group-hover:text-white" /> Ranked Queue</span>
                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-fuchsia-200">Phase Matchmaking</span>
              </button>

              <button disabled={launching} onClick={() => { 
                if (playModalDeck.game === 'MAGIC') {
                  const phaseDeck = {
                    main: playModalDeck.cards.filter((c: any) => !c.isSideboard && !c.is_sideboard).map((c: any) => ({ count: c.count || c.quantity || 1, name: c.name })),
                    sideboard: playModalDeck.cards.filter((c: any) => c.isSideboard || c.is_sideboard).map((c: any) => ({ count: c.count || c.quantity || 1, name: c.name }))
                  };
                  localStorage.setItem(`phase-deck:${playModalDeck.name}`, JSON.stringify(phaseDeck));
                  localStorage.setItem('phase-active-deck', playModalDeck.name);
                  router.push(`/play/mtg/lobby`);
                } else {
                  router.push(`/play/${playModalDeck.game.toLowerCase()}/lobby?deckId=${playModalDeck.id}`);
                }
              }} className="w-full p-4 bg-slate-800 hover:bg-cyan-600 border border-white/5 rounded-2xl font-bold text-white transition-all flex justify-between items-center group">
                <span className="flex items-center gap-3"><Globe className="text-cyan-400 group-hover:text-white" /> Custom Lobby</span>
                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-cyan-200">Phase Multiplayer</span>
              </button>

              <button disabled={launching} onClick={() => {
                if (playModalDeck.game === 'MAGIC') {
                  const phaseDeck = {
                    main: playModalDeck.cards.filter((c: any) => !c.isSideboard && !c.is_sideboard).map((c: any) => ({ count: c.count || c.quantity || 1, name: c.name })),
                    sideboard: playModalDeck.cards.filter((c: any) => c.isSideboard || c.is_sideboard).map((c: any) => ({ count: c.count || c.quantity || 1, name: c.name }))
                  };
                  localStorage.setItem(`phase-deck:${playModalDeck.name}`, JSON.stringify(phaseDeck));
                  localStorage.setItem('phase-active-deck', playModalDeck.name);
                  router.push(`/play/mtg/goldfish`);
                } else {
                  handleStartSolo();
                }
              }} className="w-full p-4 bg-slate-800 hover:bg-emerald-600 border border-white/5 rounded-2xl font-bold text-white transition-all flex justify-between items-center group">
                <span className="flex items-center gap-3"><Layers className="text-emerald-400 group-hover:text-white" /> {launching ? 'Starting...' : 'Solo Goldfish'}</span>
                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-emerald-200">Phase Sandbox</span>
              </button>
            </div>
            <button disabled={launching} onClick={() => setPlayModalDeck(null)} className="w-full mt-6 py-3 bg-slate-950 border border-white/10 rounded-xl text-slate-400 hover:text-white font-bold transition-all">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
