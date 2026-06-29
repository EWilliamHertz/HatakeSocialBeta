'use client';

import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
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