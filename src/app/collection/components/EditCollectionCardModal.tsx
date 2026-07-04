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

export default function EditCollectionCardModal({ instance, onClose, onComplete }: { instance: any, onClose: () => void, onComplete: () => void }) {
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
          <div className="flex justify-between items-start gap-4 mb-2">
            <h2 className="text-3xl font-black text-white">{instance.cardReference.name}</h2>
            {(() => {
              const setCode = instance.cardReference.setCode;
              const payload: any = instance.cardReference.apiPayload || {};
              const collectorNumber = payload.collector_number || payload.collectorNumber || 
                (payload.extendedData && Array.isArray(payload.extendedData) ? payload.extendedData.find((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value : null);
              
              if (setCode || collectorNumber) {
                return (
                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-950 px-2 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                    {setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber ? `#${collectorNumber}` : ''}
                  </span>
                );
              }
              return null;
            })()}
          </div>
          <p className="text-emerald-400 font-black text-xl mb-6">
            {(() => {
              const cr = instance.cardReference;
              if (cr.game === 'NARUTO' || (cr.game === 'POKEMON' && (cr.price === 0 || cr.price === 0.3))) {
                return <span className="text-slate-500">No Market Data</span>;
              }
              let currentPrice = cr.price || 0;
              if (isFoil || instance.isHolo) currentPrice = cr.foilPrice || currentPrice;
              if (instance.isReverseHolo) currentPrice = cr.reverseHoloPrice || cr.foilPrice || currentPrice;
              
              let conditionMultiplier = 1.0;
              if (condition === 'MINT') conditionMultiplier = 1.2;
              if (condition === 'LIGHTLY_PLAYED') conditionMultiplier = 0.8;
              if (condition === 'MODERATELY_PLAYED') conditionMultiplier = 0.65;
              if (condition === 'HEAVILY_PLAYED') conditionMultiplier = 0.45;
              if (condition === 'DAMAGED') conditionMultiplier = 0.25;

              let calculated = currentPrice * conditionMultiplier;
              if (isSigned) calculated += 8.00;

              return `€${calculated.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            })()}
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
