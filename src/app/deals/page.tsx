'use client';

import React, { useState, useEffect } from 'react';
import { Handshake, ArrowUpRight, ArrowDownLeft, History, Bell, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DealProposalModal } from './components/DealProposalModal';

export default function DealsPage() {
  const [deals, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        router.push('/login');
      }
    });
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;
    fetch('/api/deals').then(r => r.json()).then(data => {
      if (data.deals) setDecks(data.deals);
      setLoading(false);
    });
  }, [currentUser]);

  const handleUpdateDeal = async (dealId: string, status: string) => {
    try {
      const res = await fetch('/api/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, status })
      });
      if (res.ok) {
        setDecks(deals.map(d => d.id === dealId ? { ...d, status } : d));
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update deal');
      }
    } catch (e) {
      alert('Network Error');
    }
  };

  if (!currentUser) return <div className="min-h-screen bg-slate-950"></div>;

  const activeDeals = deals.filter(d => ['PENDING_PAYMENT', 'ACCEPTED', 'PAID', 'SHIPPED'].includes(d.status) || d.status === 'PENDING');
  const incomingOffers = deals.filter(d => d.sellerId === currentUser.id && (d.status === 'PENDING' || d.status === 'PENDING_PAYMENT'));
  const outgoingOffers = deals.filter(d => d.buyerId === currentUser.id && (d.status === 'PENDING' || d.status === 'PENDING_PAYMENT'));

  const filteredDeals = deals.filter(d => {
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return ['PENDING_PAYMENT', 'PENDING', 'ACCEPTED', 'PAID', 'SHIPPED'].includes(d.status);
    if (filter === 'COMPLETED') return ['DELIVERED', 'CANCELLED'].includes(d.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 p-8 pb-40">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2 flex items-center gap-4">
              <Handshake size={48} className="text-emerald-400" /> Deals & Trades
            </h1>
            <p className="text-slate-400 text-lg">Manage your active, incoming, and outgoing offers from the market.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowProposalModal(true)} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black rounded-xl shadow-lg transition-all flex items-center gap-2">
              Deal With Someone
            </button>
            {incomingOffers.length > 0 && (
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                <div className="bg-emerald-500/20 p-3 rounded-full relative">
                  <Bell size={24} className="text-emerald-400 animate-pulse" />
                  <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </div>
                <div>
                  <p className="text-white font-bold">New Offer!</p>
                  <p className="text-xs text-slate-500">You have {incomingOffers.length} pending offer(s).</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trade Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Active Deals</p>
                <p className="text-4xl font-black text-white">{activeDeals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Handshake size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
            <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Incoming</p>
                <p className="text-4xl font-black text-white">{incomingOffers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ArrowDownLeft size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
            <div className="absolute -inset-2 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500"></div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Outgoing</p>
                <p className="text-4xl font-black text-white">{outgoingOffers.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <ArrowUpRight size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Deals Overview List */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <History className="text-slate-500" /> Recent Activity
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'ALL' ? 'bg-cyan-600 border border-cyan-500 text-white shadow-lg' : 'bg-slate-950 border border-white/10 text-slate-400 hover:text-white'}`}>All</button>
              <button onClick={() => setFilter('PENDING')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'PENDING' ? 'bg-cyan-600 border border-cyan-500 text-white shadow-lg' : 'bg-slate-950 border border-white/10 text-slate-400 hover:text-white'}`}>Pending</button>
              <button onClick={() => setFilter('COMPLETED')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${filter === 'COMPLETED' ? 'bg-cyan-600 border border-cyan-500 text-white shadow-lg' : 'bg-slate-950 border border-white/10 text-slate-400 hover:text-white'}`}>Completed</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-10 text-slate-500 font-bold">No deals found.</div>
            ) : filteredDeals.map(deal => {
              const isIncoming = deal.sellerId === currentUser.id;
              const cardName = deal.listing?.cardInstance?.cardReference?.name || deal.listing?.cardInstance?.sealedReference?.name || 'Unknown Item';
              const price = deal.price;
              const otherUser = isIncoming ? deal.buyer?.username : deal.seller?.username;

              return (
                <div key={deal.id} className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-6 hover:bg-slate-900 transition-colors">
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isIncoming ? 'bg-cyan-500/20 text-cyan-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {isIncoming ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {isIncoming ? 'Incoming from ' : 'Outgoing to '}
                        <span className={isIncoming ? 'text-cyan-400' : 'text-amber-400'}>@{otherUser}</span>
                      </p>
                      <p className="text-xs text-slate-500">{new Date(deal.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full lg:w-auto flex items-center justify-center gap-4 bg-slate-900/50 rounded-xl p-3">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Item</p>
                      <span className="text-sm text-white font-bold px-3 py-1 bg-white/5 rounded border border-white/10">{cardName}</span>
                    </div>
                    <Handshake size={16} className="text-slate-600 shrink-0" />
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Price</p>
                      <span className="text-sm text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">€{price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full lg:w-auto shrink-0 justify-end">
                    {deal.status === 'PENDING' || deal.status === 'PENDING_PAYMENT' ? (
                      isIncoming ? (
                        <>
                          <button onClick={() => handleUpdateDeal(deal.id, 'ACCEPTED')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">Accept</button>
                          <button onClick={() => handleUpdateDeal(deal.id, 'CANCELLED')} className="px-4 py-2 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors">Decline</button>
                        </>
                      ) : (
                        <span className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold whitespace-nowrap">Waiting for response</span>
                      )
                    ) : (
                      <span className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
                        deal.status === 'ACCEPTED' || deal.status === 'PAID' || deal.status === 'SHIPPED' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        deal.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {deal.status}
                      </span>
                    )}
                    
                    {deal.status === 'ACCEPTED' && !isIncoming && (
                      <button onClick={() => handleUpdateDeal(deal.id, 'PAID')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">Mark Paid</button>
                    )}
                    {deal.status === 'PAID' && isIncoming && (
                      <button onClick={() => handleUpdateDeal(deal.id, 'SHIPPED')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">Mark Shipped</button>
                    )}
                    {deal.status === 'SHIPPED' && !isIncoming && (
                      <button onClick={() => handleUpdateDeal(deal.id, 'DELIVERED')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors">Mark Delivered</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showProposalModal && <DealProposalModal onClose={() => setShowProposalModal(false)} />}
    </div>
  );
}
