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

export default function CardModal({ card, onClose }: { card: CardData, onClose: () => void }) {
  const [condition, setCondition] = useState('Near Mint');
  const [quantity, setQuantity] = useState(1);
  const [isFoil, setIsFoil] = useState(false);
  const [isHolo, setIsHolo] = useState(false);
  const [isReverseHolo, setIsReverseHolo] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signedByArtist, setSignedByArtist] = useState(false);
  const [signedByElse, setSignedByElse] = useState(false);
  const [isAltered, setIsAltered] = useState(false);
  
  const [notes, setNotes] = useState('');
  const [pileTogether, setPileTogether] = useState(true);
  
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
          price: estimatedPrice,
          notes,
          pileTogether
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
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
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
                <p className="text-cyan-500 text-xs font-bold uppercase tracking-wider mb-1">Price Per Unit (PPU)</p>
                <p className="text-cyan-400 font-black text-2xl">
                  {card.game === 'NARUTO' || (card.game === 'POKEMON' && (card.price === 0 || card.price === 0.3)) ? (
                    <span className="text-slate-500 text-lg">N/A</span>
                  ) : (
                    `€${estimatedPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                  )}
                </p>
              </div>
              <div className="text-right ml-4 border-l border-white/10 pl-4">
                <p className="text-fuchsia-500 text-xs font-bold uppercase tracking-wider mb-1">Total Value</p>
                <p className="text-fuchsia-400 font-black text-2xl">
                  {card.game === 'NARUTO' || (card.game === 'POKEMON' && (card.price === 0 || card.price === 0.3)) ? (
                    <span className="text-slate-500 text-lg">N/A</span>
                  ) : (
                    `€${(estimatedPrice * quantity).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
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
              <h3 className="text-white font-black mb-4 uppercase tracking-wider text-sm border-b border-white/10 pb-2">Customizations</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                
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

              <div className="mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Notes / Markings</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. 'Signed in black marker' or 'Has a slight crease on top left'"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 resize-none h-20"
                  />
              </div>

              <AnimatePresence>
                {isSigned && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex gap-4 mb-4 pt-3 border-t border-white/10">
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

          <div className="mt-8 flex gap-4 pt-6 border-t border-white/10 flex-col md:flex-row">
            {quantity > 1 && (
              <div className="flex-1 bg-slate-950 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer" onClick={() => setPileTogether(!pileTogether)}>
                <div>
                  <p className="text-white font-bold text-sm">Group as Single Pile</p>
                  <p className="text-slate-500 text-xs">Keep these {quantity} items together in one stack.</p>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative ${pileTogether ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${pileTogether ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            )}
            
            <button 
              onClick={handleAddToHave}
              disabled={adding || isUploading}
              className={`flex-1 py-4 px-6 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 
                ${(adding || isUploading) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white shadow-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'}`}
            >
              {adding ? <Loader2 className="animate-spin" /> : <Plus />}
              Add {quantity} to Collection
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
