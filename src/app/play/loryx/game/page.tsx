'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoryxEngine } from '@/lib/loryxEngine';
import HaloNav from '@/components/HaloNav';
import { useSocket } from '@/hooks/useSocket';

const IMG = (uri: string) => {
  if (!uri) return 'https://i.imgur.com/B06rBhI.png';
  if (uri.startsWith('http')) return `/api/proxy?url=${encodeURIComponent(uri)}`;
  return uri;
};

function LoryxGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = searchParams?.get('gameId');
  const urlPlayerId = searchParams?.get('playerId');
  
  const { socket, isConnected } = useSocket();
  const [engine] = useState(() => new LoryxEngine('1v0'));
  const [gameState, setGameState] = useState<any>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [shiftingCardId, setShiftingCardId] = useState<string | null>(null);

  // Local Game Initialization (Goldfish Mode)
  useEffect(() => {
    if (gameId) return; // Skip if multiplayer
    
    const initGame = async () => {
      let deck = [];
      try {
        const res = await fetch('/api/decks?game=LORCANA');
        if (res.ok) {
          const data = await res.json();
          const firstDeck = data.decks?.[0]; // Use the most recently saved Lorcana deck
          if (firstDeck && firstDeck.cards && firstDeck.cards.length > 0) {
            firstDeck.cards.forEach((c: any) => {
              for (let i = 0; i < c.count; i++) {
                deck.push({
                   ...c,
                   apiPayload: c.apiPayload || c.card?.apiPayload || {}
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch custom deck:", err);
      }

      if (deck.length < 60) {
        // Fallback to mock deck if no valid custom deck found
        deck = Array(60).fill(null).map((_, i) => ({
          id: `c-${i}`,
          name: `Glimmer Character ${i}`,
          imageUrl: 'https://i.imgur.com/B06rBhI.png',
          apiPayload: {
            cost: Math.floor(Math.random() * 4) + 1,
            lore: Math.floor(Math.random() * 2) + 1,
            strength: Math.floor(Math.random() * 3) + 1,
            willpower: Math.floor(Math.random() * 3) + 2,
            inkwell: true
          }
        }));
      }

      setGameState({ ...engine.setupGame(deck) });
      setMyPlayerId(engine.state.players[0].id);
    };

    initGame();
  }, [engine, gameId]);

  // Multiplayer Game Sync
  useEffect(() => {
    if (!socket || !gameId || !urlPlayerId) return;
    
    setMyPlayerId(urlPlayerId);
    
    if (isConnected) {
      socket.emit('join-game', { gameId, playerId: urlPlayerId });
    }

    const onGameUpdate = (state: any) => setGameState(state);
    const onError = (err: string) => alert('Error: ' + err);

    socket.on('game-update', onGameUpdate);
    socket.on('error', onError);

    return () => {
      socket.off('game-update', onGameUpdate);
      socket.off('error', onError);
    };
  }, [socket, isConnected, gameId, urlPlayerId]);

  if (!gameState || !myPlayerId) return <div className="text-white p-8">Loading Game...</div>;

  const player = gameState.players.find((p: any) => p.id === myPlayerId) || gameState.players[0];
  const opponent = gameState.players.find((p: any) => p.id !== myPlayerId);

  const handleAction = (type: string, payload: any) => {
    if (gameId && socket) {
      socket.emit('game-action', { gameId, playerId: myPlayerId, type, ...payload });
    } else {
      try {
        const pIndex = gameState.players.findIndex((p: any) => p.id === myPlayerId);
        engine.processAction(pIndex, { type, ...payload });
        setGameState({ ...engine.state });
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const activeInkCount = player.inkwell.filter((i: any) => !i.isExerted).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col overflow-hidden">
      <HaloNav />
      
      {/* Top Bar: Stats & Opponent Mock */}
      <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 pt-16">
        <div className="flex gap-4">
          <div className="px-4 py-1 bg-indigo-900/50 rounded-full border border-indigo-500/30 text-indigo-200">
            Lore: <span className="font-bold text-white">{player.lore}</span> / 20
          </div>
          <div className="px-4 py-1 bg-cyan-900/50 rounded-full border border-cyan-500/30 text-cyan-200">
            Ink: <span className="font-bold text-white">{activeInkCount}</span> / {player.inkwell.length}
          </div>
        </div>
        
        {opponent && (
          <div className="flex gap-4 opacity-70">
            <div className="px-4 py-1 bg-red-900/30 rounded-full border border-red-500/30 text-red-200">
              Opponent Lore: <span className="font-bold text-white">{opponent.lore}</span> / 20
            </div>
          </div>
        )}
        
        <button 
          onClick={() => handleAction('pass_turn', {})}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          disabled={gameState.players[gameState.activePlayer]?.id !== player.id}
        >
          {gameState.players[gameState.activePlayer]?.id !== player.id ? "Opponent's Turn" : "Pass Turn"}
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Opponent Play Area (Multiplayer or Dummy) */}
        {opponent && (
          <div className="h-56 border-b border-indigo-900/40 bg-gradient-to-b from-slate-950 to-slate-900 p-4 flex gap-4 overflow-hidden relative shadow-inner">
            <div className="absolute top-2 left-4 text-xs font-black tracking-widest text-indigo-500/50 uppercase">Opponent Battlefield</div>
            <div className="flex-1 flex gap-3 pt-6 items-center">
              {opponent.battlefield.map((c: any) => (
                <div 
                  key={c.instanceId} 
                  className={`relative w-24 h-36 rounded-xl border-2 transition-all duration-300 ${c.isExerted ? 'border-red-800 rotate-90 opacity-80 scale-95' : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'} cursor-crosshair hover:scale-105 overflow-hidden group bg-slate-800`}
                  title={`Cost: ${c.cost} | Str: ${c.strength} | Will: ${c.willpower} | Lore: ${c.lore}`}
                  onClick={() => handleAction('challenge', { 
                    attackerId: player.battlefield.find((p:any) => !p.isExerted)?.instanceId,
                    defenderId: c.instanceId 
                  })}
                >
                  <img src={IMG(c.image_uri || c.imageUrl)} alt={c.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-red-900/40 to-transparent" />
                  
                  <div className="absolute top-0 left-0 w-full p-1 text-center text-[10px] font-bold text-red-100 drop-shadow-md truncate px-2">
                    {c.name}
                  </div>
                  
                  <div className="absolute bottom-1 right-1 flex items-center justify-center w-8 h-6 bg-slate-900/90 border border-red-500/50 rounded text-xs font-black text-red-400 backdrop-blur-sm">
                    {c.strength}/{c.willpower - c.damage}
                  </div>
                  <div className="absolute inset-0 border-2 border-red-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded border border-red-400 uppercase tracking-widest shadow-lg shadow-red-900/50">Target</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex">
          {/* Player Play Area */}
          <div className="flex-1 flex flex-col p-4 gap-4 relative">
          
          {/* Battlefield */}
          <div className="flex-1 border-2 border-indigo-900/30 rounded-2xl p-6 flex gap-4 flex-wrap items-center bg-slate-900/40 shadow-inner relative overflow-hidden">
            <div className="absolute top-3 right-5 text-indigo-500/30 text-8xl font-black italic pointer-events-none select-none tracking-tighter">GLIMMER</div>
            
            {player.battlefield.length === 0 && <span className="text-indigo-400/50 m-auto font-bold uppercase tracking-widest">Awaiting Summons</span>}
            {player.battlefield.map((c: any) => (
              <div 
                key={c.instanceId} 
                className={`relative w-28 h-40 rounded-xl bg-slate-800 border-2 cursor-pointer transition-all duration-300 overflow-hidden shadow-xl ${c.isExerted ? 'border-slate-600 rotate-90 opacity-80 grayscale-[30%]' : 'border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:scale-[1.05] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] z-10 hover:z-20'} ${shiftingCardId ? 'animate-pulse border-fuchsia-500' : ''}`}
                onClick={() => {
                  if (shiftingCardId) {
                    handleAction('shift_card', { instanceId: shiftingCardId, targetId: c.instanceId });
                    setShiftingCardId(null);
                  } else if (!c.isExerted) {
                    handleAction('quest', { instanceId: c.instanceId });
                  }
                }}
                title={`Cost: ${c.cost} | Str: ${c.strength} | Will: ${c.willpower} | Lore: ${c.lore}`}
              >
                <img src={IMG(c.image_uri || c.imageUrl)} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
                
                <div className="absolute bottom-1 right-1 flex items-center justify-center w-8 h-6 bg-slate-900/90 border border-slate-600 rounded text-xs font-black text-white backdrop-blur-sm">
                  {c.strength}/{c.willpower - c.damage}
                </div>
                
                {/* Lore Diamond */}
                <div className="absolute bottom-1 left-1 flex items-center justify-center gap-1 bg-indigo-900/90 border border-indigo-500 rounded px-1.5 h-6 text-xs font-black text-indigo-200 backdrop-blur-sm">
                  <span>{c.lore}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"/></svg>
                </div>
                
                {/* Hover overlay for questing or shifting */}
                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  {shiftingCardId ? (
                    <span className="bg-fuchsia-600 text-white text-xs font-black px-2 py-1 rounded border border-fuchsia-400 uppercase tracking-widest shadow-lg">Shift Here</span>
                  ) : !c.isExerted ? (
                    <span className="bg-indigo-600 text-white text-xs font-black px-2 py-1 rounded border border-indigo-400 uppercase tracking-widest shadow-lg">Quest</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Inkwell */}
          <div className="h-32 border-2 border-dashed border-cyan-900/50 rounded-xl p-2 flex gap-2 overflow-x-auto bg-cyan-950/20 items-center">
            {player.inkwell.length === 0 && <span className="text-cyan-900/50 m-auto font-bold uppercase tracking-widest">Inkwell Empty</span>}
            {player.inkwell.map((c: any, i: number) => (
              <div key={i} className={`w-16 h-24 rounded bg-cyan-800 border-2 ${c.isExerted ? 'border-slate-700 opacity-50 rotate-90' : 'border-cyan-400'}`}>
                <div className="w-full h-full flex items-center justify-center bg-[url('/cardback-lorcana.jpg')] bg-cover bg-center" />
              </div>
            ))}
          </div>

          {/* Hand */}
          <div className="h-56 border-t border-slate-800 pt-6 flex justify-center gap-[-20px] overflow-visible relative z-30">
            {player.hand.map((c: any, i: number) => (
              <div 
                key={c.instanceId}
                className="w-36 h-52 rounded-xl bg-slate-800 border-2 border-slate-600 hover:border-indigo-400 transition-all cursor-pointer relative group overflow-hidden shadow-2xl hover:z-40"
                style={{ 
                  transform: `rotate(${(i - player.hand.length/2) * 3}deg) translateY(${Math.abs(i - player.hand.length/2) * 5}px)`, 
                  transformOrigin: 'bottom center',
                  marginLeft: i === 0 ? '0' : '-1rem'
                }}
              >
                <img src={IMG(c.image_uri || c.imageUrl)} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                
                {/* Cost hexagon */}
                <div className="absolute top-1 left-1 w-8 h-8 flex items-center justify-center drop-shadow-md z-10">
                  <svg className="absolute inset-0 w-full h-full text-amber-500 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 7l-5 10H7L2 7l10-5z"/></svg>
                  <span className="relative z-10 text-xs font-black text-white">{c.cost}</span>
                </div>

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 z-20 transition-opacity rounded-xl backdrop-blur-sm">
                  <span className="text-xs font-bold text-white text-center px-2 mb-2">{c.name}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction('play_card', { instanceId: c.instanceId, exertOnPlay: false }); }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-xs font-bold rounded shadow-lg shadow-indigo-600/50 hover:from-indigo-500 hover:to-blue-500 w-24 border border-indigo-400"
                  >
                    Play ({c.cost})
                  </button>
                  {c.keywords && c.keywords.includes('Bodyguard') && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAction('play_card', { instanceId: c.instanceId, exertOnPlay: true }); }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-xs font-bold rounded shadow-lg shadow-amber-600/50 hover:from-amber-500 hover:to-orange-500 w-24 border border-amber-400 leading-tight"
                    >
                      Bodyguard
                    </button>
                  )}
                  {c.shiftCost !== undefined && c.shiftCost !== null && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShiftingCardId(shiftingCardId === c.instanceId ? null : c.instanceId); }}
                      className={`px-4 py-2 bg-gradient-to-r ${shiftingCardId === c.instanceId ? 'from-fuchsia-600 to-pink-600 border-fuchsia-300 ring-2 ring-fuchsia-400' : 'from-fuchsia-700 to-purple-700 border-fuchsia-500 hover:from-fuchsia-600 hover:to-purple-600'} text-xs font-bold rounded shadow-lg shadow-fuchsia-600/50 w-24 border transition-all`}
                    >
                      {shiftingCardId === c.instanceId ? 'Cancel' : `Shift (${c.shiftCost})`}
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction('ink_card', { cardId: c.id }); }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-700 to-teal-600 text-xs font-bold rounded shadow-lg shadow-cyan-600/50 hover:from-cyan-600 hover:to-teal-500 w-24 border border-cyan-400 disabled:opacity-50 disabled:grayscale"
                    disabled={player.hasInkedThisTurn}
                  >
                    Ink
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Logs */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-800 font-black text-slate-300">
            Game Log
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 text-xs text-slate-400 font-mono">
            {gameState.logs.map((log: string, i: number) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function LoryxGameWrapper() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <LoryxGameContent />
    </Suspense>
  );
}
