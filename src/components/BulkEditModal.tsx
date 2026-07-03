'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BulkEditModal({ 
  selectedIds, 
  onClose, 
  onComplete 
}: { 
  selectedIds: string[]; 
  onClose: () => void; 
  onComplete: () => void; 
}) {
  const [condition, setCondition] = useState('NO_CHANGE');
  const [isFoil, setIsFoil] = useState('NO_CHANGE');
  const [isSigned, setIsSigned] = useState('NO_CHANGE');
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

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

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/collection/edit-bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          ...(condition !== 'NO_CHANGE' && { condition }),
          ...(isFoil !== 'NO_CHANGE' && { isFoil: isFoil === 'TRUE' }),
          ...(isSigned !== 'NO_CHANGE' && { isSigned: isSigned === 'TRUE' }),
          ...(customImageUrl && { customImageUrl }),
        })
      });
      if (res.ok) {
        onComplete();
      } else {
        alert('Failed to update items.');
      }
    } catch {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full flex flex-col shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2">
          <X size={16} />
        </button>

        <h3 className="text-2xl font-black text-white mb-2">Bulk Edit ({selectedIds.length}) Items</h3>
        <p className="text-xs text-slate-400 mb-6">Fields left as "No Change" will preserve their current individual values.</p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Bulk Custom Photo</label>
            <label className={`relative w-full cursor-pointer group block ${isUploading ? 'opacity-50' : ''}`}>
              <div className="rounded-xl overflow-hidden border border-dashed border-white/20 bg-slate-950 h-32 flex flex-col items-center justify-center transition-all hover:bg-slate-800">
                {customImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customImageUrl} alt="Bulk Upload" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                      {isUploading ? 'Uploading...' : 'Upload Photo for All'}
                    </span>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
            </label>
            {customImageUrl && (
              <button onClick={() => setCustomImageUrl('')} className="w-full mt-2 py-2 bg-red-500/20 text-red-400 font-bold rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors text-xs">
                Remove Photo
              </button>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500">
              <option value="NO_CHANGE">— No Change ────────</option>
              <option value="MINT">Mint</option>
              <option value="NEAR_MINT">Near Mint</option>
              <option value="LIGHTLY_PLAYED">Lightly Played</option>
              <option value="MODERATELY_PLAYED">Moderately Played</option>
              <option value="HEAVILY_PLAYED">Heavily Played</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Finish Variant</label>
            <select value={isFoil} onChange={(e) => setIsFoil(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500">
              <option value="NO_CHANGE">— No Change ────────</option>
              <option value="TRUE">Foil / Holo Finish</option>
              <option value="FALSE">Non-Foil Standard</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Autograph Status</label>
            <select value={isSigned} onChange={(e) => setIsSigned(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500">
              <option value="NO_CHANGE">— No Change ────────</option>
              <option value="TRUE">Mark as Signed (+€8 Premium)</option>
              <option value="FALSE">Unsigned Standard</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-bold text-sm">Cancel</button>
          <button onClick={handleBulkSave} className="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-black text-sm flex justify-center items-center gap-2">
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Apply Updates
          </button>
        </div>
      </motion.div>
    </div>
  );
}