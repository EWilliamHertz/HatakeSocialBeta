import React from 'react';
import { X, Layers } from 'lucide-react';

export function DeckViewer({ deck, onClose }: { deck: any, onClose: () => void }) {
  if (!deck) return null;

  const cards = Array.isArray(deck.cards) ? deck.cards : [];
  
  const mainboard = cards.filter(c => !c.isSideboard);
  const sideboard = cards.filter(c => c.isSideboard);

  const mainCount = mainboard.reduce((a, c) => a + (c.count || 1), 0);
  const sideCount = sideboard.reduce((a, c) => a + (c.count || 1), 0);
  const totalPrice = cards.reduce((a, c) => a + ((c.price || 0) * (c.count || 1)), 0);

  const getCardImage = (c: any) => {
    let url = c.imageUrl || c.apiPayload?.image_uris?.normal || c.apiPayload?.card_faces?.[0]?.image_uris?.normal;
    if (url) return `/api/proxy?url=${encodeURIComponent(url)}`;
    return 'https://i.imgur.com/B06rBhI.png';
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-32 pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={onClose} className="w-12 h-12 flex-shrink-0 bg-slate-900 rounded-full flex items-center justify-center hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white shadow-xl transition-all">
            <X size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-white bg-transparent outline-none w-full">{deck.name}</h1>
            <div className="flex gap-4 mt-2 items-center">
              <span className="text-sm font-bold text-slate-400">{deck.format || 'Standard'}</span>
              {deck.isMeta && deck.metaAuthor && (
                <span className="text-sm font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded">by {deck.metaAuthor}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-right">
           <div>
             <p className="text-xs font-bold text-slate-500 uppercase">Total Value</p>
             <p className="text-xl font-black text-emerald-400">
               {deck.game === 'NARUTO' ? (
                 <span className="text-slate-500 font-bold text-sm">N/A</span>
               ) : (
                 `€${totalPrice.toFixed(2)}`
               )}
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Mainboard */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <Layers className="text-cyan-400" /> Mainboard ({mainCount})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mainboard.map((c, i) => (
                <div key={i} className="relative group bg-slate-950 border border-white/5 rounded-2xl overflow-hidden p-2 flex flex-col">
                  <div className="relative aspect-[2.5/3.5] rounded-xl overflow-hidden mb-2">
                    <img src={getCardImage(c)} alt={c.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 backdrop-blur-md px-2 py-1 rounded text-xs font-black text-white border z-10 bg-black/80 border-white/20">
                      {c.count}x
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white truncate px-1">{c.name}</p>
                </div>
              ))}
            </div>
            {mainboard.length === 0 && <p className="text-slate-500 text-sm">No mainboard cards.</p>}
          </div>
        </div>

        {/* Sideboard */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl shadow-xl">
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
              <Layers className="text-fuchsia-400" /> Sideboard ({sideCount})
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {sideboard.map((c, i) => (
                <div key={i} className="relative group bg-slate-950 border border-white/5 rounded-2xl overflow-hidden p-2 flex flex-col">
                  <div className="relative aspect-[2.5/3.5] rounded-xl overflow-hidden mb-2">
                    <img src={getCardImage(c)} alt={c.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 backdrop-blur-md px-1 py-0.5 rounded text-[10px] font-black text-white border z-10 bg-black/80 border-white/20">
                      {c.count}x
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-white truncate px-1">{c.name}</p>
                </div>
              ))}
            </div>
            {sideboard.length === 0 && <p className="text-slate-500 text-sm">No sideboard cards.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
