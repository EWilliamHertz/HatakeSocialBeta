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

export default function EditSealedProductModal({ instance, onClose, onComplete }: { instance: any, onClose: () => void, onComplete: () => void }) {
  const [condition, setCondition] = useState(instance.condition || 'FACTORY_SEALED');
  const [purchasePrice, setPurchasePrice] = useState(instance.purchasePrice || '');
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
      const res = await fetch('/api/sealed/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: instance.id, condition, purchasePrice, notes, customImageUrl })
      });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to update sealed product.');
      }
    } catch {
      alert('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this sealed product from your vault?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sealed/inventory?id=${instance.id}`, { method: 'DELETE' });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to delete sealed product.');
      }
    } catch (err: any) {
      console.error('Delete Sealed Product Error:', err);
      alert('Network error or server crash occurred while deleting. If this persists, the database may have locked the record.');
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
            <img src={customImageUrl || instance.sealedReference.imageUrl || 'https://i.imgur.com/B06rBhI.png'} alt={instance.sealedReference.name} className="w-full rounded-2xl shadow-lg border border-white/10 group-hover:opacity-75 transition-opacity object-contain aspect-square bg-slate-950 p-4" />
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
          <h2 className="text-3xl font-black text-white mb-1">{instance.sealedReference.name}</h2>
          <p className="text-sm text-slate-400 mb-2">{instance.sealedReference.type.replace('_', ' ')} • {instance.sealedReference.game.replace('_', ' ')}</p>
          <p className="text-emerald-400 font-black text-xl mb-6">€{(instance.sealedReference.price || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>

          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500">
                <option value="FACTORY_SEALED">Factory Sealed</option>
                <option value="DAMAGED_BOX">Damaged Box</option>
                <option value="OPEN_BOX">Open Box (Packs Sealed)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Purchase Price (€)</label>
              <input type="number" step="any" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Personal Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none" placeholder="Add personal notes..." />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={handleDelete} disabled={deleting || saving} className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/30">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
            <button onClick={handleSave} disabled={saving || deleting} className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
