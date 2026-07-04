'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, AlertCircle, RefreshCw, LayoutGrid, List } from 'lucide-react';

interface DealProposalModalProps {
  onClose: () => void;
}

export function DealProposalModal({ onClose }: DealProposalModalProps) {
  const [step, setStep] = useState(1);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [myCards, setMyCards] = useState<any[]>([]);
  const [theirCards, setTheirCards] = useState<any[]>([]);
  
  const [givingCards, setGivingCards] = useState<any[]>([]);
  const [receivingCards, setReceivingCards] = useState<any[]>([]);
  
  const [euroAmount, setEuroAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [filterQuery, setFilterQuery] = useState('');

  // Fetch my collection
  useEffect(() => {
    fetch('/api/collection/inventory?game=MAGIC') // assuming MAGIC or generic
      .then(res => res.json())
      .then(data => setMyCards(data.cards || []))
      .catch(console.error);
  }, []);

  const handleSearchUser = async (query: string) => {
    setSearchUser(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSearching(false);
  };

  const selectPartner = async (user: any) => {
    setSelectedUser(user);
    try {
      const cRes = await fetch(`/api/collection/public?userId=${user.id}`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setTheirCards(cData.cards || []);
      }
      setStep(2);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePropose = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          offeredCards: givingCards.map(c => c.id),
          requestedCards: receivingCards.map(c => c.id),
          cashOffered: euroAmount,
          notes: note
        })
      });
      if (res.ok) {
        alert('Deal proposed successfully!');
        onClose();
      } else {
        alert('Failed to propose deal');
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const toggleGive = (card: any) => {
    if (givingCards.find(c => c.id === card.id)) {
      setGivingCards(givingCards.filter(c => c.id !== card.id));
    } else {
      setGivingCards([...givingCards, card]);
    }
  };

  const toggleReceive = (card: any) => {
    if (receivingCards.find(c => c.id === card.id)) {
      setReceivingCards(receivingCards.filter(c => c.id !== card.id));
    } else {
      setReceivingCards([...receivingCards, card]);
    }
  };

  const filteredMyCards = myCards.filter(c => c.cardReference.name.toLowerCase().includes(filterQuery.toLowerCase()));
  const filteredTheirCards = theirCards.filter(c => c.cardReference.name.toLowerCase().includes(filterQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white">Propose a Deal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-10 w-full max-w-lg mx-auto">
              <h3 className="text-2xl font-bold text-white mb-6">Who do you want to trade with?</h3>
              <div className="flex gap-2 w-full relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={searchUser}
                  onChange={e => handleSearchUser(e.target.value)}
                  placeholder="Search by username or name..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-lg text-white outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              
              <div className="w-full mt-4 flex flex-col gap-2">
                {isSearching && <p className="text-slate-400 text-center py-4">Searching...</p>}
                {!isSearching && searchUser.length >= 2 && searchResults.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No users found.</p>
                )}
                {searchResults.map((user) => (
                  <div 
                    key={user.id} 
                    onClick={() => selectPartner(user)}
                    className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-xl p-4 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-white font-bold text-lg">{user.username}</p>
                      {user.shippingName && <p className="text-slate-400 text-sm">{user.shippingName}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-medium">Reputation: {user.reputationScore}</span>
                      <Check className="text-slate-500" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedUser && (
            <div className="flex flex-col h-full gap-6">
              <div className="flex gap-4 mb-4 items-center justify-between">
                <p className="text-white font-bold">Trading with <span className="text-emerald-400">{selectedUser.name || selectedUser.username}</span></p>
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Search cards..." value={filterQuery} onChange={e => setFilterQuery(e.target.value)} className="bg-slate-950 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-white outline-none focus:border-emerald-500" />
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400'}`}><List size={16} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                {/* My Collection */}
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col">
                  <h3 className="text-emerald-400 font-bold mb-4 border-b border-white/5 pb-2">Your Collection</h3>
                  <div className={`overflow-y-auto flex-1 custom-scrollbar ${viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-2'}`}>
                    {filteredMyCards.map(c => (
                      <div key={c.id} onClick={() => toggleGive(c)} className={`cursor-pointer rounded-xl border-2 transition-all ${givingCards.find(g => g.id === c.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent bg-slate-900'} ${viewMode === 'grid' ? 'p-1' : 'p-3 flex justify-between items-center'}`}>
                        {viewMode === 'grid' ? (
                           <img src={c.cardReference?.imageUrl || 'https://i.imgur.com/B06rBhI.png'} className="w-full rounded-lg" />
                        ) : (
                           <>
                             <p className="text-sm font-bold text-white">
                               {c.cardReference?.name}
                               {(() => {
                                 const setCode = c.cardReference?.setCode;
                                 const payload: any = c.cardReference?.apiPayload || {};
                                 const collectorNumber = payload.collector_number || payload.collectorNumber || 
                                   (payload.extendedData && Array.isArray(payload.extendedData) ? payload.extendedData.find((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value : null);
                                 if (setCode || collectorNumber) {
                                   return <span className="ml-2 text-[10px] text-slate-500 font-black uppercase">[{setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber ? `#${collectorNumber}` : ''}]</span>;
                                 }
                                 return null;
                               })()}
                             </p>
                             <p className="text-xs text-emerald-400">€{c.cardReference?.price}</p>
                           </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Their Collection */}
                <div className="bg-slate-950 border border-white/5 rounded-2xl p-4 flex flex-col">
                  <h3 className="text-fuchsia-400 font-bold mb-4 border-b border-white/5 pb-2">Their Collection</h3>
                  <div className={`overflow-y-auto flex-1 custom-scrollbar ${viewMode === 'grid' ? 'grid grid-cols-3 gap-3' : 'flex flex-col gap-2'}`}>
                    {filteredTheirCards.map(c => (
                      <div key={c.id} onClick={() => toggleReceive(c)} className={`cursor-pointer rounded-xl border-2 transition-all ${receivingCards.find(r => r.id === c.id) ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-transparent bg-slate-900'} ${viewMode === 'grid' ? 'p-1' : 'p-3 flex justify-between items-center'}`}>
                        {viewMode === 'grid' ? (
                           <img src={c.cardReference?.imageUrl || 'https://i.imgur.com/B06rBhI.png'} className="w-full rounded-lg" />
                        ) : (
                           <>
                             <p className="text-sm font-bold text-white">
                              {c.cardReference?.name}
                              {(() => {
                                const setCode = c.cardReference?.setCode;
                                const payload: any = c.cardReference?.apiPayload || {};
                                const collectorNumber = payload.collector_number || payload.collectorNumber || 
                                  (payload.extendedData && Array.isArray(payload.extendedData) ? payload.extendedData.find((d: any) => d.name === 'Number' || d.name === 'Collector Number')?.value : null);
                                if (setCode || collectorNumber) {
                                  return <span className="ml-2 text-[10px] text-slate-500 font-black uppercase">[{setCode}{setCode && collectorNumber ? ' · ' : ''}{collectorNumber ? `#${collectorNumber}` : ''}]</span>;
                                }
                                return null;
                              })()}
                            </p>
                             <p className="text-xs text-emerald-400">€{c.cardReference?.price}</p>
                           </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deal Summary */}
              <div className="bg-slate-800 border border-white/10 rounded-2xl p-4 mt-auto">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Euro Offer (€)</label>
                    <input type="number" value={euroAmount} onChange={e => setEuroAmount(Number(e.target.value))} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Notes (Optional)</label>
                    <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g., Willing to negotiate!" className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-4">
                   <div className="flex gap-4 text-sm text-slate-300">
                     <p>Offering: <span className="text-emerald-400 font-bold">{givingCards.length} cards + €{euroAmount}</span></p>
                     <p>Receiving: <span className="text-fuchsia-400 font-bold">{receivingCards.length} cards</span></p>
                   </div>
                   <button onClick={handlePropose} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black px-8 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                     {submitting ? 'Sending...' : 'Send Deal Proposal'}
                   </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
