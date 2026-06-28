import React, { useState } from 'react';
import { X, Upload, Package, Clock, DollarSign, Tag, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ListForSaleModal({ instances, onClose, onList }: { instances: any[], onClose: () => void, onList: () => void }) {
  const [isPackage, setIsPackage] = useState(false);
  const [listingType, setListingType] = useState<'FIXED_PRICE' | 'AUCTION'>('FIXED_PRICE');
  const [packageTitle, setPackageTitle] = useState('');
  const [packageDesc, setPackageDesc] = useState('');
  const [packageImageUrl, setPackageImageUrl] = useState('');
  
  const [auctionDays, setAuctionDays] = useState(7);
  const [price, setPrice] = useState(''); // Starting bid or Buy it Now

  // Individual cards configuration
  const [items, setItems] = useState(instances.map(inst => ({
    ...inst,
    listPrice: Math.round((inst.cardReference.price || 0) * 1.0),
    customImageUrl: inst.customImageUrl || '',
    notes: inst.notes || '',
    isFoil: inst.isFoil || false,
    isSigned: inst.isSigned || false,
    isAltered: inst.isAltered || false,
    isGraded: inst.isGraded || false,
    isHolo: inst.isHolo || false,
    isReverseHolo: inst.isReverseHolo || false,
    isManga: inst.isManga || false,
    condition: inst.condition || 'NEAR_MINT'
  })));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const payload = isPackage ? [{
      isPackage: true,
      packageTitle,
      packageDesc,
      packageImageUrl,
      type: listingType,
      auctionDays: listingType === 'AUCTION' ? auctionDays : undefined,
      price: Number(price),
      cardInstanceIds: items.map(i => i.id)
    }] : items.map(item => ({
      isPackage: false,
      cardInstanceId: item.id,
      price: Number(item.listPrice),
      type: listingType,
      auctionDays: listingType === 'AUCTION' ? auctionDays : undefined,
      customImageUrl: item.customImageUrl,
      notes: item.notes,
      condition: item.condition,
      isFoil: item.isFoil,
      isSigned: item.isSigned,
      isAltered: item.isAltered,
      isGraded: item.isGraded,
      isHolo: item.isHolo,
      isReverseHolo: item.isReverseHolo,
      isManga: item.isManga
    }));

    try {
      const res = await fetch('/api/market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onList();
        onClose();
      } else {
        console.error('Failed to list');
      }
    } catch (e) {
      console.error(e);
    }
    setIsSubmitting(false);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-950">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Tag className="text-cyan-400" />
            Create Market Listing
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-900/50">
          
          {/* Listing Strategy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setIsPackage(false)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${!isPackage ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-slate-950 hover:border-white/20'}`}
            >
              <div className={`p-3 rounded-xl ${!isPackage ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Individual Listings</h3>
                <p className="text-sm text-slate-400">List {items.length} cards separately with their own prices.</p>
              </div>
            </div>

            <div 
              onClick={() => setIsPackage(true)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${isPackage ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-white/5 bg-slate-950 hover:border-white/20'}`}
            >
              <div className={`p-3 rounded-xl ${isPackage ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Package size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Package Bundle</h3>
                <p className="text-sm text-slate-400">Group all {items.length} cards into a single cohesive listing.</p>
              </div>
            </div>
          </div>

          {/* Pricing Mode */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white mb-4">Sale Format</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setListingType('FIXED_PRICE')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${listingType === 'FIXED_PRICE' ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/5 bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                Fixed Price (Buy It Now)
              </button>
              <button 
                onClick={() => setListingType('AUCTION')}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${listingType === 'AUCTION' ? 'border-amber-500 bg-amber-500/20 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                eBay-Style Auction
              </button>
            </div>

            {listingType === 'AUCTION' && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex-1">
                  <label className="text-sm font-bold text-slate-400 mb-2 block flex items-center gap-2"><Clock size={16} /> Auction Duration (Days)</label>
                  <input type="range" min="1" max="14" value={auctionDays} onChange={e => setAuctionDays(Number(e.target.value))} className="w-full accent-amber-500" />
                  <div className="flex justify-between text-xs text-slate-500 mt-1 font-bold">
                    <span>1 Day</span>
                    <span className="text-amber-400 text-sm">{auctionDays} Days</span>
                    <span>14 Days</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Package Configuration */}
          {isPackage && (
            <div className="bg-slate-950 p-6 rounded-2xl border border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-lg font-bold text-white mb-2">Package Details</h3>
              <input type="text" placeholder="Awesome Deck Core / Binder Collection" value={packageTitle} onChange={e => setPackageTitle(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none" />
              <textarea placeholder="Describe the condition, specific editions, and value of this bundle..." value={packageDesc} onChange={e => setPackageDesc(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none h-24 resize-none" />
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Upload className="absolute left-4 top-3.5 text-slate-500" size={18} />
                  <input type="text" placeholder="Package Image URL (Imgur etc)" value={packageImageUrl} onChange={e => setPackageImageUrl(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:border-cyan-500 outline-none" />
                </div>
                <div className="w-1/3 relative">
                  <DollarSign className="absolute left-4 top-3.5 text-emerald-500" size={18} />
                  <input type="number" placeholder={listingType === 'AUCTION' ? 'Starting Bid' : 'Price'} value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:border-emerald-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Individual Items Config */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Item Specifics & Conditions</h3>
            <div className="grid grid-cols-1 gap-4">
              {items.map((item, idx) => {
                const game = item.cardReference.game;
                return (
                  <div key={item.id} className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <img src={item.cardReference.imageUrl || 'https://i.imgur.com/B06rBhI.png'} className="w-16 h-24 object-cover rounded-lg shadow-md" alt="" />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{item.cardReference.name}</h4>
                      <p className="text-xs text-slate-500 mb-3">Marknadssnitt: €{(item.cardReference.price || 0).toLocaleString()} • {game}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {/* Global Features */}
                        <label className="flex items-center gap-1 text-xs font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-white/10 cursor-pointer hover:bg-slate-800">
                          <input type="checkbox" checked={item.isGraded} onChange={e => updateItem(item.id, 'isGraded', e.target.checked)} className="rounded bg-slate-800 border-white/20 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900" /> Graded
                        </label>

                        {/* MTG Specifics */}
                        {game === 'MTG' && (
                          <>
                            <label className="flex items-center gap-1 text-xs font-bold text-fuchsia-300 bg-fuchsia-900/20 px-2 py-1 rounded-md border border-fuchsia-500/20 cursor-pointer">
                              <input type="checkbox" checked={item.isFoil} onChange={e => updateItem(item.id, 'isFoil', e.target.checked)} className="rounded bg-slate-800 border-fuchsia-500/20 text-fuchsia-500" /> Foil
                            </label>
                            <label className="flex items-center gap-1 text-xs font-bold text-indigo-300 bg-indigo-900/20 px-2 py-1 rounded-md border border-indigo-500/20 cursor-pointer">
                              <input type="checkbox" checked={item.isSigned} onChange={e => updateItem(item.id, 'isSigned', e.target.checked)} className="rounded bg-slate-800 text-indigo-500" /> Signed
                            </label>
                          </>
                        )}

                        {/* Pokemon Specifics */}
                        {game === 'POKEMON' && (
                          <>
                            <label className="flex items-center gap-1 text-xs font-bold text-yellow-300 bg-yellow-900/20 px-2 py-1 rounded-md border border-yellow-500/20 cursor-pointer">
                              <input type="checkbox" checked={item.isHolo} onChange={e => updateItem(item.id, 'isHolo', e.target.checked)} className="rounded bg-slate-800 text-yellow-500" /> Holo
                            </label>
                            <label className="flex items-center gap-1 text-xs font-bold text-orange-300 bg-orange-900/20 px-2 py-1 rounded-md border border-orange-500/20 cursor-pointer">
                              <input type="checkbox" checked={item.isReverseHolo} onChange={e => updateItem(item.id, 'isReverseHolo', e.target.checked)} className="rounded bg-slate-800 text-orange-500" /> Rev Holo
                            </label>
                          </>
                        )}

                        {/* One Piece Specifics */}
                        {game === 'ONE_PIECE' && (
                          <>
                            <label className="flex items-center gap-1 text-xs font-bold text-red-300 bg-red-900/20 px-2 py-1 rounded-md border border-red-500/20 cursor-pointer">
                              <input type="checkbox" checked={item.isManga} onChange={e => updateItem(item.id, 'isManga', e.target.checked)} className="rounded bg-slate-800 text-red-500" /> Manga Rare
                            </label>
                          </>
                        )}
                        
                        <select value={item.condition} onChange={e => updateItem(item.id, 'condition', e.target.value)} className="text-xs bg-slate-900 border border-white/10 rounded-md px-2 py-1 text-slate-300 outline-none focus:border-cyan-500">
                          <option value="MINT">Mint</option>
                          <option value="NEAR_MINT">Near Mint</option>
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="LIGHT_PLAYED">Light Played</option>
                          <option value="PLAYED">Played</option>
                          <option value="POOR">Poor</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-48">
                      {!isPackage && (
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-2 text-emerald-500" size={14} />
                          <input type="number" placeholder={listingType === 'AUCTION' ? 'Starting Bid' : 'Price'} value={item.listPrice} onChange={e => updateItem(item.id, 'listPrice', e.target.value)} className="w-full bg-slate-900 border border-emerald-500/30 rounded-lg pl-7 pr-3 py-1.5 text-sm text-white font-bold focus:border-emerald-500 outline-none" />
                        </div>
                      )}
                      <div className="relative">
                        <Upload className="absolute left-2.5 top-2 text-slate-500" size={14} />
                        <input type="text" placeholder="Image URL (Opt)" value={item.customImageUrl} onChange={e => updateItem(item.id, 'customImageUrl', e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-lg pl-7 pr-3 py-1.5 text-xs text-white focus:border-cyan-500 outline-none" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 bg-slate-950 flex justify-between items-center">
          <p className="text-slate-500 text-sm font-bold">
            {isPackage ? '1 Package Listing' : `${items.length} Individual Listings`}
          </p>
          <button 
            disabled={isSubmitting || (isPackage && (!packageTitle || !price))}
            onClick={handleSubmit} 
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2"
          >
            {isSubmitting ? 'Processing...' : (
              <>
                <Check size={18} /> Confirm & List on Marketplace
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
