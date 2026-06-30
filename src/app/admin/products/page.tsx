'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Mail, Loader2, Save, X, Truck, Weight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  weight: number;
  shippingPrice: number;
  notificationEmails: string | null;
  imageUrl: string | null;
  isActive: boolean;
};

export default function AdminProductsDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    weight: 0,
    shippingPrice: 0,
    notificationEmails: '',
    imageUrl: '',
    isActive: true,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        stock: product.stock,
        weight: product.weight || 0,
        shippingPrice: product.shippingPrice || 0,
        notificationEmails: product.notificationEmails || '',
        imageUrl: product.imageUrl || '',
        images: (product as any).images || [],
        isActive: product.isActive,
      });
    } else {
      setForm({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        weight: 0,
        shippingPrice: 0,
        notificationEmails: '',
        imageUrl: '',
        images: [],
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const saveProduct = async () => {
    const isNew = !editingProduct;
    const url = '/api/admin/products';
    const method = isNew ? 'POST' : 'PUT';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct?.id,
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          weight: Number(form.weight),
          shippingPrice: Number(form.shippingPrice),
        }),
      });

      if (res.ok) {
        fetchProducts();
        setModalOpen(false);
      } else {
        alert('Failed to save product');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving product');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl font-black text-white flex items-center gap-4">
              <Package className="text-cyan-400" size={40} /> Dropshipping & Products
            </h1>
            <p className="text-slate-400 mt-2 text-sm">Manage products, shipping rules, and email dispatch notifications for orders.</p>
          </div>
          <button onClick={() => openModal()} className="relative z-10 flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
            <Plus size={20} /> Add New Product
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 bg-slate-900 border border-white/5 p-4 rounded-2xl">
          <Search className="text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 flex justify-center text-cyan-500"><Loader2 className="animate-spin" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map(p => (
              <div key={p.id} className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative group hover:border-cyan-500/30 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-black text-white line-clamp-1">{p.name}</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openModal(p)} className="p-2 bg-slate-800 hover:bg-cyan-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-400 hover:text-white transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-24 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 p-2 overflow-hidden border border-white/5">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="text-slate-700" size={32} />
                    )}
                  </div>
                  <div className="flex flex-col justify-center space-y-1">
                    <p className="text-2xl font-black text-emerald-400">€{p.price.toFixed(2)}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Stock: {p.stock}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase w-max ${p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Truck size={14} className="text-cyan-400" />
                    <span>Shipping: <strong className="text-white">€{p.shippingPrice.toFixed(2)}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Weight size={14} className="text-cyan-400" />
                    <span>Weight: <strong className="text-white">{p.weight} kg</strong></span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-400">
                    <Mail size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1" title={p.notificationEmails || 'None'}>
                      Notify: <strong className="text-white">{p.notificationEmails || 'None'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative my-8"
              >
                <button onClick={() => setModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10 transition-colors">
                  <X size={20} />
                </button>

                <h2 className="text-3xl font-black text-white mb-8 pr-12">
                  {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2 border-b border-white/5 pb-2">
                      <Package size={18} /> Basic Info
                    </h3>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Product Name</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors" placeholder="e.g. Commander Precon - Azorius" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Price (€)</label>
                        <input type="number" step="any" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Stock</label>
                        <input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Description (Optional)</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors resize-none" placeholder="Product details..." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Main Image URL</label>
                      <input type="text" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Additional Images (Gallery URLs, one per line)</label>
                      <textarea value={(form as any).images?.join('\n') || ''} onChange={e => setForm({...form, images: e.target.value.split('\n').filter(Boolean)})} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors resize-none" placeholder="https://image1.jpg&#10;https://image2.jpg" />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-white/5">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-5 h-5 accent-cyan-500 rounded bg-slate-900 border-white/20" />
                      <label className="text-sm font-bold text-white cursor-pointer" onClick={() => setForm({...form, isActive: !form.isActive})}>Product is active & visible in shop</label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-fuchsia-400 flex items-center gap-2 border-b border-white/5 pb-2">
                      <Truck size={18} /> Fulfillment & Shipping
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Weight (kg)</label>
                        <input type="number" step="0.01" value={form.weight} onChange={e => setForm({...form, weight: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500 transition-colors" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Shipping Price (€)</label>
                        <input type="number" step="any" value={form.shippingPrice} onChange={e => setForm({...form, shippingPrice: Number(e.target.value)})} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Dispatch Notification Emails</label>
                      <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Enter a comma-separated list of emails to automatically notify when this product is ordered (e.g. for dropshipping).</p>
                      <textarea value={form.notificationEmails} onChange={e => setForm({...form, notificationEmails: e.target.value})} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-fuchsia-500 transition-colors resize-none" placeholder="hatake@petdragon.se, ernst@hatake.eu" />
                    </div>
                    
                    {/* Visual Preview */}
                    <div className="mt-8 p-4 bg-slate-950 rounded-xl border border-white/5">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Email Routing Preview</p>
                      <div className="space-y-2">
                        {form.notificationEmails.split(',').map(e => e.trim()).filter(Boolean).map((email, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <Mail size={14} className="text-fuchsia-400" /> &rarr; {email}
                          </div>
                        ))}
                        {(!form.notificationEmails || form.notificationEmails.trim() === '') && (
                          <div className="text-sm text-slate-500 italic">No emails configured.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex justify-end gap-4 border-t border-white/5 pt-6">
                  <button onClick={() => setModalOpen(false)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveProduct} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2">
                    <Save size={20} /> Save Product
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
