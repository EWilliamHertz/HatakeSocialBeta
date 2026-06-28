'use client';

import React, { useEffect, useState } from 'react';
import { Package, Clock, DollarSign, Tag, X, Edit, Trash, CheckSquare, Square, Settings2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';

export default function SalesDashboard() {
  const { t } = useI18n();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filters
  const [showBuyNow, setShowBuyNow] = useState(true);
  const [showAuction, setShowAuction] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editType, setEditType] = useState<'FIXED_PRICE' | 'AUCTION'>('FIXED_PRICE');
  const [editAuctionDays, setEditAuctionDays] = useState(7);
  const [editingIds, setEditingIds] = useState<string[]>([]);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const res = await fetch('/api/market/my', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleFilter = (type: 'BUY_NOW' | 'AUCTION') => {
    if (type === 'BUY_NOW') {
      if (showBuyNow && !showAuction) return; // Prevent disabling both
      setShowBuyNow(!showBuyNow);
    } else {
      if (!showBuyNow && showAuction) return; // Prevent disabling both
      setShowAuction(!showAuction);
    }
  };

  const filteredListings = listings.filter(l => {
    if (l.type === 'FIXED_PRICE' && !showBuyNow) return false;
    if (l.type === 'AUCTION' && !showAuction) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredListings.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredListings.map(l => l.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} listings?`)) return;
    
    const idsString = Array.from(selectedIds).join(',');
    try {
      const res = await fetch(`/api/market/my?ids=${idsString}`, { method: 'DELETE' });
      if (res.ok) {
        setListings(listings.filter(l => !selectedIds.has(l.id)));
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (ids: string[]) => {
    setEditingIds(ids);
    setEditPrice('');
    setEditType('FIXED_PRICE');
    setEditAuctionDays(7);
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    if (!editPrice || isNaN(Number(editPrice))) return alert('Invalid price');
    
    let auctionEndsAt = undefined;
    if (editType === 'AUCTION') {
      const date = new Date();
      date.setDate(date.getDate() + editAuctionDays);
      auctionEndsAt = date.toISOString();
    }

    try {
      const res = await fetch('/api/market/my', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: editingIds,
          price: editPrice,
          type: editType,
          auctionEndsAt
        })
      });

      if (res.ok) {
        setShowEditModal(false);
        setSelectedIds(new Set());
        fetchListings(); // reload
      } else {
        alert('An error occurred during update');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin text-cyan-500"><Tag size={40} /></div></div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 pb-40">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/5 pb-8 gap-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2">{t('sales.title')}</h1>
            <p className="text-slate-400">{t('sales.subtitle')}</p>
          </div>
          
          <div className="flex gap-4 items-center w-full md:w-auto">
            <div className="bg-slate-900 border border-white/10 px-6 py-3 rounded-2xl shadow-lg flex gap-4">
              <div>
                <p className="text-sm font-bold text-slate-500">{t('sales.selected')}</p>
                <p className="text-2xl font-black text-cyan-400">{selectedIds.size}</p>
              </div>
              <div className="w-px bg-white/10 mx-2"></div>
              <div>
                <p className="text-sm font-bold text-slate-500">{t('sales.active')}</p>
                <p className="text-2xl font-black text-white">{listings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => toggleFilter('BUY_NOW')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border ${showBuyNow ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800'}`}
          >
            <DollarSign size={16} /> {t('sales.buyNow')}
          </button>
          <button 
            onClick={() => toggleFilter('AUCTION')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border ${showAuction ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-500 hover:bg-slate-800'}`}
          >
            <Clock size={16} /> {t('sales.auction')}
          </button>
        </div>

        {/* Action Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900 border border-cyan-500/30 p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_20px_rgba(6,182,212,0.1)] sticky top-4 z-40"
            >
              <div className="flex items-center gap-3">
                <button onClick={toggleSelectAll} className="p-2 hover:bg-white/5 rounded-lg text-slate-300">
                  <CheckSquare size={20} className="text-cyan-400" />
                </button>
                <span className="font-bold text-white">{selectedIds.size} {t('sales.selected').toLowerCase()}</span>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => openEditModal(Array.from(selectedIds))}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Settings2 size={18} /> {t('sales.editSelected')}
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold flex items-center gap-2 transition-colors"
                >
                  <Trash size={18} /> {t('sales.deleteAll')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        {filteredListings.length > 0 && (
          <div className="flex justify-between items-center mb-6 px-2">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm transition-colors">
              {selectedIds.size === filteredListings.length ? <CheckSquare size={18} className="text-cyan-400" /> : <Square size={18} />} 
              {t('sales.selectAll')}
            </button>
          </div>
        )}

        {filteredListings.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl">
            <Package size={64} className="mx-auto text-slate-700 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t('sales.noListings')}</h2>
            <p className="text-slate-400 max-w-md mx-auto">{t('sales.noListingsDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((l: any) => {
              const isSelected = selectedIds.has(l.id);
              return (
                <motion.div 
                  key={l.id} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all flex flex-col group cursor-pointer ${isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/50' : 'border-white/10 hover:border-white/30'}`}
                  onClick={() => toggleSelect(l.id)}
                >
                  <div className="h-48 bg-slate-800 relative overflow-hidden">
                    <img src={l.isPackage ? (l.packageImageUrl || 'https://i.imgur.com/B06rBhI.png') : (l.cardInstance?.customImageUrl || l.cardInstance?.cardReference?.imageUrl || 'https://i.imgur.com/B06rBhI.png')} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                    
                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white border border-white/20 flex items-center gap-1">
                        {l.type === 'AUCTION' ? <><Clock size={12} className="text-amber-400"/> {t('sales.auction')}</> : <><DollarSign size={12} className="text-emerald-400"/> {t('sales.buyNow')}</>}
                      </span>
                      {l.isPackage && <span className="px-3 py-1 bg-fuchsia-500/20 backdrop-blur-md rounded-full text-xs font-bold text-fuchsia-300 border border-fuchsia-500/20 flex items-center gap-1"><Package size={12}/> {t('sales.package')}</span>}
                    </div>

                    <div className="absolute top-4 right-4 z-10 bg-black/50 rounded-lg p-1 backdrop-blur-md">
                      {isSelected ? <CheckSquare size={24} className="text-cyan-400" /> : <Square size={24} className="text-white/50 group-hover:text-white" />}
                    </div>

                    {l.type === 'AUCTION' && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 z-10">
                        <p className="text-xs text-amber-400 font-bold flex items-center gap-1"><Clock size={12} /> {t('sales.ends')} {new Date(l.auctionEndsAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col relative z-20 bg-slate-900">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {l.isPackage ? l.packageTitle : l.cardInstance?.cardReference?.name}
                    </h3>
                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{l.type === 'AUCTION' ? t('sales.startingBid') : t('sales.price')}</p>
                        <p className="text-2xl font-black text-emerald-400">€{l.price}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal([l.id]); }} 
                          className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-xl transition-colors border border-cyan-500/20" 
                          title="Redigera annons"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"><X size={20}/></button>
              
              <h2 className="text-2xl font-black text-white mb-2">{t('sales.editModal.title')}</h2>
              <p className="text-slate-400 mb-6">{t('sales.editModal.desc')}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">{t('sales.editModal.type')}</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setEditType('FIXED_PRICE')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-colors border-2 ${editType === 'FIXED_PRICE' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-slate-800 text-slate-400'}`}
                    >
                      {t('sales.editModal.fixed')}
                    </button>
                    <button 
                      onClick={() => setEditType('AUCTION')}
                      className={`flex-1 py-3 rounded-xl font-bold transition-colors border-2 ${editType === 'AUCTION' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-white/5 bg-slate-800 text-slate-400'}`}
                    >
                      {t('sales.editModal.auction')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-2">{editType === 'AUCTION' ? t('sales.startingBid') : t('sales.price')} (€)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                    <input 
                      type="number" 
                      value={editPrice}
                      onChange={e => setEditPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-bold focus:border-cyan-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {editType === 'AUCTION' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">{t('sales.editModal.duration')}</label>
                    <input 
                      type="number" 
                      value={editAuctionDays}
                      onChange={e => setEditAuctionDays(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white font-bold focus:border-cyan-500 outline-none"
                      min="1"
                      max="14"
                    />
                  </div>
                )}

                <button 
                  onClick={submitEdit}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-lg transition-colors shadow-lg"
                >
                  {t('sales.editModal.save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
