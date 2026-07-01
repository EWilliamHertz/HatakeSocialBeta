'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Check, Lock, Trash2, Edit, Plus, Users, ShoppingCart, Layers, Sparkles, X } from 'lucide-react';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'DECKS' | 'USERS' | 'PRODUCTS' | 'GIVEAWAYS'>('DECKS');

  // Create/Edit Meta Deck State
  const [name, setName] = useState('');
  const [game, setGame] = useState('MAGIC');
  const [format, setFormat] = useState('Standard');
  const [metaAuthor, setMetaAuthor] = useState('');
  const [metaWinRate, setMetaWinRate] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal State
  const [editingDeck, setEditingDeck] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingGiveaway, setEditingGiveaway] = useState<any>(null);

  // Data State
  const [decks, setDecks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Deck Filters
  const [deckFilter, setDeckFilter] = useState<'ALL' | 'META' | 'USER'>('ALL');

  const fetchDecks = () => {
    setLoading(true);
    fetch('/api/admin/decks').then(r => r.json()).then(d => { setDecks(d.decks || []); setLoading(false); });
  };

  // Fetch Data on Tab Change
  useEffect(() => {
    if (!authed) return;
    
    if (activeTab === 'DECKS') {
      fetchDecks();
    } else if (activeTab === 'USERS') {
      setLoading(true);
      fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); });
    } else if (activeTab === 'PRODUCTS') {
      setLoading(true);
      fetch('/api/admin/products').then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
    } else if (activeTab === 'GIVEAWAYS') {
      setLoading(true);
      fetch('/api/giveaways').then(r => r.json()).then(d => { setGiveaways(Array.isArray(d) ? d : []); setLoading(false); });
    }
  }, [activeTab, authed]);

  const handleSaveMetaDeck = async () => {
    setSaving(true);
    try {
      let isSideboard = false;
      const lines = pasteText.split('\n').filter(l => l.trim().length > 0);
      const parsed = lines.map(line => {
        const t = line.trim();
        if (t.toLowerCase() === 'sideboard') {
          isSideboard = true;
          return null;
        }
        const match = t.match(/^(\d+)x?\s+(.+)$/i);
        if (match) return { count: parseInt(match[1]), name: match[2].trim(), isSideboard };
        return { count: 1, name: t, isSideboard };
      }).filter(Boolean);
      
      const res = await fetch('/api/collection/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game, lines: parsed })
      });
      const data = await res.json();
      
      if (data.cards) {
        const finalCards = data.cards.map((c: any) => {
           const requested = parsed.find((p: any) => c.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(c.name.toLowerCase()));
           return {
             id: c.apiId,
             count: requested?.count || 1,
             name: c.name,
             imageUrl: c.imageUrl,
             price: c.price,
             cmc: c.cmc,
             isSideboard: requested?.isSideboard || false
           };
        });
        
        const saveRes = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, game, format, isPublic: true, isMeta: true, metaAuthor, metaWinRate, cards: finalCards
          })
        });
        if (saveRes.ok) {
           alert('Meta Deck Saved!');
           setName(''); setPasteText('');
           setIsCreating(false);
           fetchDecks();
        } else alert('Error saving meta deck');
      } else {
        alert('Could not resolve cards');
      }
    } catch(e) {
      console.error(e);
      alert('Network Error');
    }
    setSaving(false);
  };

  const handleUpdateDeck = async () => {
    if (!editingDeck) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/decks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDeck.id,
          name: editingDeck.name,
          format: editingDeck.format,
          metaAuthor: editingDeck.metaAuthor,
          metaWinRate: editingDeck.metaWinRate,
          isMeta: editingDeck.isMeta
        })
      });
      if (res.ok) {
        alert('Deck updated successfully!');
        setEditingDeck(null);
        fetchDecks();
      } else {
        alert('Error updating deck');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
    setSaving(false);
  };

  const deleteDeck = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;
    const res = await fetch(`/api/admin/decks?id=${id}`, { method: 'DELETE' });
    if (res.ok) setDecks(decks.filter(d => d.id !== id));
    else alert('Error deleting deck');
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      if (res.ok) {
        alert('Product updated successfully!');
        setEditingProduct(null);
        fetch('/api/admin/products').then(r => r.json()).then(d => { setProducts(d.products || []); });
      } else {
        alert('Error updating product');
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) setProducts(products.filter(p => p.id !== id));
    else alert('Error deleting product');
  };

  const handleDeleteGiveaway = async (id: string) => {
    if (!confirm('Are you sure you want to delete this giveaway?')) return;
    try {
      const res = await fetch(`/api/giveaways/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGiveaways(giveaways.filter(g => g.id !== id));
      } else {
        alert('Failed to delete giveaway');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGiveaway = async () => {
    if (!editingGiveaway) return;
    setSaving(true);
    const isNew = !editingGiveaway.id;
    try {
      const res = await fetch('/api/giveaways', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGiveaway)
      });
      if (res.ok) {
        alert(`Giveaway ${isNew ? 'created' : 'updated'} successfully!`);
        setEditingGiveaway(null);
        fetch('/api/giveaways').then(r => r.json()).then(d => { setGiveaways(Array.isArray(d) ? d : []); });
      } else {
        alert(`Error ${isNew ? 'creating' : 'updating'} giveaway`);
      }
    } catch (e) {
      console.error(e);
      alert('Network Error');
    }
    setSaving(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-3xl max-w-sm w-full border border-white/5 shadow-2xl text-center">
          <div className="w-16 h-16 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="text-fuchsia-400" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-6">Admin Access</h2>
          <input 
            type="password" 
            placeholder="Enter Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (password === 'Yb07tw44!') setAuthed(true);
                else alert('Incorrect password');
              }
            }}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-center text-white outline-none focus:border-fuchsia-500 mb-6"
          />
          <button 
            onClick={() => {
              if (password === 'Yb07tw44!') setAuthed(true);
              else alert('Incorrect password');
            }} 
            className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl transition-all"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  const displayedDecks = decks.filter(d => {
    if (deckFilter === 'META') return d.isMeta;
    if (deckFilter === 'USER') return !d.isMeta;
    return true;
  });
  
  return (
     <div className="min-h-screen bg-slate-950 p-8">
       <div className="max-w-6xl mx-auto">
         <div className="flex justify-between items-end mb-8">
           <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Admin Dashboard</h1>
         </div>

         {/* Tabs */}
         <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
           <button onClick={() => setActiveTab('DECKS')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'DECKS' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
             <Layers size={18} /> Decks Hub
           </button>
           <button onClick={() => setActiveTab('USERS')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
             <Users size={18} /> Users
           </button>
           <a href="/admin/products" className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30`}>
             <ShoppingCart size={18} /> Dropship Dashboard
           </a>
           <button onClick={() => setActiveTab('GIVEAWAYS')} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'GIVEAWAYS' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
             <Sparkles size={18} /> Giveaways
           </button>
         </div>

         {/* Manage Decks */}
         {activeTab === 'DECKS' && (
           <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
             {!isCreating ? (
               <>
                 <div className="flex justify-between items-center mb-6">
                   <div className="flex bg-slate-950 rounded-lg p-1 border border-white/5">
                     <button onClick={() => setDeckFilter('ALL')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${deckFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>All</button>
                     <button onClick={() => setDeckFilter('META')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${deckFilter === 'META' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>Meta Decks</button>
                     <button onClick={() => setDeckFilter('USER')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${deckFilter === 'USER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>User Decks</button>
                   </div>
                   <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-fuchsia-500/20"><Plus size={16}/> Create Meta Deck</button>
                 </div>
                 
                 {loading ? <div className="text-indigo-500 flex justify-center py-10"><Loader2 className="animate-spin" /></div> : (
                   <table className="w-full text-left text-sm text-slate-300">
                     <thead>
                       <tr className="border-b border-white/10 text-slate-500 uppercase text-xs tracking-wider">
                         <th className="py-3 font-bold">Deck Name</th>
                         <th className="py-3 font-bold">Game</th>
                         <th className="py-3 font-bold">Type</th>
                         <th className="py-3 font-bold">Owner / Author</th>
                         <th className="py-3 font-bold text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {displayedDecks.map(deck => (
                         <tr key={deck.id} className="border-b border-white/5 hover:bg-slate-950/50 transition-colors">
                           <td className="py-4 font-bold text-white">{deck.name}</td>
                           <td className="py-4 text-xs font-bold text-indigo-300">{deck.game}</td>
                           <td className="py-4">{deck.isMeta ? <span className="text-fuchsia-400 font-bold bg-fuchsia-500/10 px-2 py-1 rounded text-xs">META</span> : (deck.isPublic ? <span className="text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded text-xs font-bold">Public</span> : <span className="text-slate-500 bg-slate-800 px-2 py-1 rounded text-xs font-bold">Private</span>)}</td>
                           <td className="py-4">{deck.isMeta ? deck.metaAuthor || 'MTGTop8' : deck.owner?.username || 'Unknown'}</td>
                           <td className="py-4 flex justify-end gap-2">
                             <button onClick={() => setEditingDeck({...deck})} className="p-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-slate-400 transition-colors"><Edit size={16} /></button>
                             <button onClick={() => deleteDeck(deck.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"><Trash2 size={16} /></button>
                           </td>
                         </tr>
                       ))}
                       {displayedDecks.length === 0 && (
                         <tr><td colSpan={5} className="py-12 text-center text-slate-500">No decks found.</td></tr>
                       )}
                     </tbody>
                   </table>
                 )}
               </>
             ) : (
               <div className="max-w-2xl mx-auto py-4">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="text-fuchsia-400"/> Add Meta Deck</h2>
                   <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Deck Name</label>
                     <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none" value={name} onChange={e=>setName(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Game</label>
                     <select className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none" value={game} onChange={e=>setGame(e.target.value)}>
                       <option value="MAGIC">MTG</option>
                       <option value="POKEMON">Pokemon</option>
                       <option value="ONE_PIECE">One Piece</option>
                       <option value="NARUTO">Naruto</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Format</label>
                     <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none" value={format} onChange={e=>setFormat(e.target.value)} />
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Author</label>
                     <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none" value={metaAuthor} onChange={e=>setMetaAuthor(e.target.value)} />
                   </div>
                 </div>
                 
                 <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Decklist Paste</label>
                 <textarea className="w-full bg-slate-950 border border-white/10 text-white rounded-xl p-4 h-48 mb-6 font-mono text-sm outline-none resize-none" value={pasteText} onChange={e=>setPasteText(e.target.value)} />
                 
                 <button onClick={handleSaveMetaDeck} disabled={saving} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 w-full transition-all">
                   {saving ? <Loader2 className="animate-spin" /> : <Check />} Parse & Save Meta Deck
                 </button>
               </div>
             )}
           </div>
         )}

         {/* Edit Deck Modal */}
         {editingDeck && (
           <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
             <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Edit className="text-indigo-400"/> Quick Edit Deck</h2>
                 <button onClick={() => setEditingDeck(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
               </div>
               
               <div className="space-y-4 mb-8">
                 <div>
                   <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Deck Name</label>
                   <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-indigo-500" value={editingDeck.name || ''} onChange={e=>setEditingDeck({...editingDeck, name: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Format</label>
                   <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-indigo-500" value={editingDeck.format || ''} onChange={e=>setEditingDeck({...editingDeck, format: e.target.value})} />
                 </div>
                 <div className="flex items-center gap-2 mb-2 p-3 bg-slate-950 border border-white/5 rounded-lg">
                   <input type="checkbox" id="isMeta" checked={editingDeck.isMeta} onChange={e=>setEditingDeck({...editingDeck, isMeta: e.target.checked})} className="accent-fuchsia-500 w-4 h-4" />
                   <label htmlFor="isMeta" className="text-sm font-bold text-white cursor-pointer select-none">Is Meta Deck</label>
                 </div>
                 {editingDeck.isMeta && (
                   <>
                     <div>
                       <label className="text-xs text-fuchsia-500/70 font-bold uppercase mb-1 block">Meta Author</label>
                       <input className="w-full bg-slate-950 border border-fuchsia-500/20 text-white rounded-lg p-3 outline-none focus:border-fuchsia-500" value={editingDeck.metaAuthor || ''} onChange={e=>setEditingDeck({...editingDeck, metaAuthor: e.target.value})} />
                     </div>
                   </>
                 )}
               </div>
               
               <button onClick={handleUpdateDeck} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 w-full transition-all">
                 {saving ? <Loader2 className="animate-spin" /> : <Check />} Save Changes
               </button>
             </div>
           </div>
         )}

         {/* Edit Product Modal */}
         {editingProduct && (
           <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
             <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2"><Edit className="text-emerald-400"/> Edit Product</h2>
                 <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
               </div>
               
               <div className="space-y-4 mb-8">
                 <div>
                   <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Product Name</label>
                   <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-emerald-500" value={editingProduct.name || ''} onChange={e=>setEditingProduct({...editingProduct, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Price (€)</label>
                     <input type="number" step="0.01" className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-emerald-500" value={editingProduct.price || 0} onChange={e=>setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                   </div>
                   <div>
                     <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Stock</label>
                     <input type="number" className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-emerald-500" value={editingProduct.stock || 0} onChange={e=>setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                   </div>
                 </div>
                 <div>
                   <label className="text-xs text-emerald-500/70 font-bold uppercase mb-1 block">Stripe Product ID</label>
                   <input className="w-full bg-slate-950 border border-emerald-500/20 text-white rounded-lg p-3 outline-none focus:border-emerald-500" value={editingProduct.stripeProductId || ''} onChange={e=>setEditingProduct({...editingProduct, stripeProductId: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs text-emerald-500/70 font-bold uppercase mb-1 block">Stripe Price ID</label>
                   <input className="w-full bg-slate-950 border border-emerald-500/20 text-white rounded-lg p-3 outline-none focus:border-emerald-500" value={editingProduct.stripePriceId || ''} onChange={e=>setEditingProduct({...editingProduct, stripePriceId: e.target.value})} />
                 </div>
                 <div className="flex items-center gap-2 mb-2 p-3 bg-slate-950 border border-white/5 rounded-lg">
                   <input type="checkbox" id="isActive" checked={editingProduct.isActive} onChange={e=>setEditingProduct({...editingProduct, isActive: e.target.checked})} className="accent-emerald-500 w-4 h-4" />
                   <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer select-none">Is Active (Visible in Shop)</label>
                 </div>
               </div>
               
               <button onClick={handleUpdateProduct} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 w-full transition-all">
                 {saving ? <Loader2 className="animate-spin" /> : <Check />} Save Changes
               </button>
             </div>
           </div>
         )}

         {/* Manage Users */}
         {activeTab === 'USERS' && (
           <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
             <h2 className="text-xl font-bold text-white mb-6">Platform Users</h2>
             {loading ? <div className="text-cyan-500 flex justify-center py-10"><Loader2 className="animate-spin" /></div> : (
               <table className="w-full text-left text-sm text-slate-300">
                 <thead>
                   <tr className="border-b border-white/10 text-slate-500 uppercase text-xs tracking-wider">
                     <th className="py-3 font-bold">Username</th>
                     <th className="py-3 font-bold">Email</th>
                     <th className="py-3 font-bold">Role</th>
                     <th className="py-3 font-bold">Reputation</th>
                   </tr>
                 </thead>
                 <tbody>
                   {users.map(u => (
                     <tr key={u.id} className="border-b border-white/5 hover:bg-slate-950/50 transition-colors">
                       <td className="py-4 font-bold text-white">{u.username}</td>
                       <td className="py-4 text-slate-400">{u.email}</td>
                       <td className="py-4">{u.role === 'ADMIN' ? <span className="text-fuchsia-400 font-bold bg-fuchsia-500/10 px-2 py-1 rounded text-xs">ADMIN</span> : <span className="text-slate-500">USER</span>}</td>
                       <td className="py-4 font-mono text-emerald-400">{u.reputationScore}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>
         )}

         {/* Manage Products */}
         {activeTab === 'PRODUCTS' && (
           <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">Shop Products</h2>
               <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 text-sm font-bold"><Plus size={16}/> Add Product</button>
             </div>
             {loading ? <div className="text-emerald-500 flex justify-center py-10"><Loader2 className="animate-spin" /></div> : (
               <table className="w-full text-left text-sm text-slate-300">
                 <thead>
                   <tr className="border-b border-white/10 text-slate-500 uppercase text-xs tracking-wider">
                     <th className="py-3 font-bold">Name</th>
                     <th className="py-3 font-bold">Price</th>
                     <th className="py-3 font-bold">Stock</th>
                     <th className="py-3 font-bold">Status</th>
                     <th className="py-3 font-bold text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {products.length === 0 ? (
                     <tr><td colSpan={5} className="py-12 text-center text-slate-500">No products found.</td></tr>
                   ) : products.map(p => (
                     <tr key={p.id} className="border-b border-white/5 hover:bg-slate-950/50">
                       <td className="py-4 font-bold text-white">{p.name}</td>
                       <td className="py-4 font-mono text-emerald-400">€{p.price}</td>
                       <td className="py-4">{p.stock}</td>
                       <td className="py-4">{p.isActive ? <span className="text-emerald-400">Active</span> : <span className="text-slate-500">Inactive</span>}</td>
                       <td className="py-4 flex justify-end gap-2">
                         <button onClick={() => setEditingProduct({...p})} className="p-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-slate-400 transition-colors"><Edit size={16} /></button>
                         <button onClick={() => deleteProduct(p.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded transition-colors"><Trash2 size={16} /></button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
            </div>
          )}

          {/* Manage Giveaways */}
          {activeTab === 'GIVEAWAYS' && (
            <div className="bg-slate-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Giveaways</h2>
                <button 
                  onClick={() => setEditingGiveaway({ isActive: true, expiresAt: new Date(Date.now() + 7*24*60*60*1000).toISOString() })}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center gap-2 text-sm font-bold"
                >
                  <Plus size={16}/> Add Giveaway
                </button>
              </div>
              {loading ? <div className="text-amber-500 flex justify-center py-10"><Loader2 className="animate-spin" /></div> : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-500 uppercase text-xs tracking-wider">
                      <th className="py-3 font-bold">Title</th>
                      <th className="py-3 font-bold">Expires</th>
                      <th className="py-3 font-bold">Status</th>
                      <th className="py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {giveaways.length === 0 ? (
                      <tr><td colSpan={4} className="py-12 text-center text-slate-500">No giveaways found.</td></tr>
                    ) : giveaways.map(g => (
                      <tr key={g.id} className="border-b border-white/5 hover:bg-slate-950/50">
                        <td className="py-4 font-bold text-white">{g.title}</td>
                        <td className="py-4 text-amber-400">{new Date(g.expiresAt).toLocaleDateString()}</td>
                        <td className="py-4">{g.isActive ? <span className="text-emerald-400">Active</span> : <span className="text-slate-500">Inactive</span>}</td>
                        <td className="py-4 flex justify-end gap-2">
                          <button onClick={() => setEditingGiveaway({...g})} className="p-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-slate-400 transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteGiveaway(g.id)} className="p-2 bg-red-900/30 hover:bg-red-900 hover:text-white rounded text-red-400 transition-colors"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Edit/Create Giveaway Modal */}
          {editingGiveaway && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-2xl w-full shadow-2xl my-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Edit className="text-amber-400"/> {editingGiveaway.id ? 'Edit Giveaway' : 'Create Giveaway'}
                  </h2>
                  <button onClick={() => setEditingGiveaway(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Giveaway Title</label>
                    <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" value={editingGiveaway.title || ''} onChange={e=>setEditingGiveaway({...editingGiveaway, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Description</label>
                    <textarea className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500 min-h-[100px]" value={editingGiveaway.description || ''} onChange={e=>setEditingGiveaway({...editingGiveaway, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Upload Image</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 cursor-pointer" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const formData = new FormData();
                          formData.append('image', file);
                          
                          try {
                            const res = await fetch(`https://api.imgbb.com/1/upload?key=b2492f987920d3e2a7903861b72ae3a4`, {
                              method: 'POST',
                              body: formData
                            });
                            const data = await res.json();
                            if (data.data?.url) {
                              setEditingGiveaway({...editingGiveaway, imageUrl: data.data.url});
                            }
                          } catch (err) {
                            console.error('Upload failed', err);
                          }
                        }} 
                      />
                      {editingGiveaway.imageUrl && (
                        <div className="mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={editingGiveaway.imageUrl} alt="Preview" className="h-20 rounded border border-white/10" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Tag (e.g. Premium Drop)</label>
                      <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" value={editingGiveaway.tag || ''} onChange={e=>setEditingGiveaway({...editingGiveaway, tag: e.target.value})} />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Expires At (ISO Date)</label>
                    <input className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" type="datetime-local" value={new Date(editingGiveaway.expiresAt).toISOString().slice(0,16)} onChange={e=>setEditingGiveaway({...editingGiveaway, expiresAt: new Date(e.target.value).toISOString()})} />
                  </div>

                  <h3 className="text-sm font-bold text-white border-t border-white/10 pt-4 mt-4">Criteria Requirements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Cards Req.</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" value={editingGiveaway.cardsRequired || 0} onChange={e=>setEditingGiveaway({...editingGiveaway, cardsRequired: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Decks Req.</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" value={editingGiveaway.decksRequired || 0} onChange={e=>setEditingGiveaway({...editingGiveaway, decksRequired: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Trades Req.</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" value={editingGiveaway.tradesRequired || 0} onChange={e=>setEditingGiveaway({...editingGiveaway, tradesRequired: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Invites Req.</label>
                      <input type="number" className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 outline-none focus:border-amber-500" value={editingGiveaway.invitesRequired || 0} onChange={e=>setEditingGiveaway({...editingGiveaway, invitesRequired: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 p-3 bg-slate-950 border border-white/5 rounded-lg">
                    <input type="checkbox" id="isGiveawayActive" checked={editingGiveaway.isActive} onChange={e=>setEditingGiveaway({...editingGiveaway, isActive: e.target.checked})} className="accent-amber-500 w-4 h-4" />
                    <label htmlFor="isGiveawayActive" className="text-sm font-bold text-white cursor-pointer select-none">Is Active (Visible on Giveaways page)</label>
                  </div>
                </div>
                
                <button onClick={handleUpdateGiveaway} disabled={saving} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 w-full transition-all">
                  {saving ? <Loader2 className="animate-spin" /> : <Check />} Save Giveaway
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
