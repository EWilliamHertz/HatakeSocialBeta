'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingCart, Search, Box, Tag, X, Check, Loader2, Mail, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Checkout Modal State
  const [checkoutProduct, setCheckoutProduct] = useState<any | null>(null);
  const [viewProduct, setViewProduct] = useState<any | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/shop')
      .then(res => res.json())
      .then(data => {
        if (data.products) setProducts(data.products);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const submitOrder = async () => {
    if (!buyerEmail) {
      alert("Please provide an email address so we can contact you regarding your order.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: checkoutProduct.id,
          buyerName,
          buyerEmail,
          shippingAddress
        })
      });
      const data = await res.json();
      
      if (res.ok && data.order) {
        setOrderComplete(data.order);
      } else {
        alert(data.error || 'Failed to submit order.');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating order.');
    }
    setIsSubmitting(false);
  };

  const closeCheckout = () => {
    setCheckoutProduct(null);
    setOrderComplete(null);
    setBuyerEmail('');
    setShippingAddress('');
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/10 pb-8">
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500 mb-2">
              Official Shop
            </h1>
            <p className="text-slate-400">Exclusive Hatake Merchandise & Admin Products</p>
          </div>

          <div className="relative w-full md:w-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full md:w-80 bg-slate-900 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-slate-500">
            <Box className="animate-spin mr-3" /> Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-slate-500 py-20 bg-slate-900/50 rounded-3xl border border-white/5">
            <Tag size={48} className="mx-auto mb-4 opacity-30" />
            <h2 className="text-xl font-bold text-white mb-2">No Products Found</h2>
            <p>Check back later for new exclusive drops.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col group hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] hover:border-fuchsia-500/30 transition-all relative">
                <div 
                  className="aspect-square bg-slate-950 relative overflow-hidden cursor-pointer"
                  onClick={() => setViewProduct(product)}
                >
                  <img 
                    src={(product.images && product.images.length > 0) ? product.images[0] : (product.imageUrl || 'https://i.imgur.com/B06rBhI.png')} 
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                  />
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                      Only {product.stock} left!
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-300 shadow-lg border border-white/10">
                      Out of Stock
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-2xl font-black text-white">
                      €{parseFloat(product.price).toFixed(2)}
                    </span>
                    <button 
                      onClick={() => setCheckoutProduct(product)}
                      disabled={product.stock === 0}
                      className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(217,70,239,0.4)]"
                    >
                      <ShoppingCart size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto"
            >
              <button 
                onClick={closeCheckout} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-2 z-10 transition-colors"
              >
                <X size={20} />
              </button>
              
              {!orderComplete ? (
                <>
                  <div className="p-8 border-b border-white/5 bg-slate-800/30">
                    <h2 className="text-2xl font-black text-white mb-2">Checkout</h2>
                    <div className="flex items-center gap-4">
                      <img src={checkoutProduct.imageUrl || 'https://i.imgur.com/B06rBhI.png'} className="w-16 h-16 rounded-xl object-cover bg-slate-950" />
                      <div>
                        <p className="font-bold text-white text-lg leading-tight">{checkoutProduct.name}</p>
                        <div className="flex gap-4 mt-1 text-sm font-bold">
                          <p className="text-emerald-400">Item: €{parseFloat(checkoutProduct.price).toFixed(2)}</p>
                          <p className="text-fuchsia-400">Shipping: €{(checkoutProduct.shippingPrice || 0).toFixed(2)}</p>
                        </div>
                        <p className="text-white font-black mt-1 text-xl">Total: €{(parseFloat(checkoutProduct.price) + (checkoutProduct.shippingPrice || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <p className="text-slate-400 text-sm">Please provide your details below. Once confirmed, you will receive payment instructions.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-300 font-bold text-sm mb-2 flex items-center gap-2">
                          <Tag size={16} className="text-indigo-400" /> Full Name *
                        </label>
                        <input 
                          type="text" 
                          value={buyerName}
                          onChange={e => setBuyerName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold text-sm mb-2 flex items-center gap-2">
                          <Mail size={16} className="text-cyan-400" /> Email Address *
                        </label>
                        <input 
                          type="email" 
                          value={buyerEmail}
                          onChange={e => setBuyerEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold text-sm mb-2 flex items-center gap-2">
                        <MapPin size={16} className="text-fuchsia-400" /> Shipping Details (Optional)
                      </label>
                      <textarea 
                        value={shippingAddress}
                        onChange={e => setShippingAddress(e.target.value)}
                        placeholder="Street, City, Zip, Country"
                        rows={3}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-slate-950 border-t border-white/5 flex justify-end gap-3">
                    <button 
                      onClick={closeCheckout}
                      className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitOrder}
                      disabled={isSubmitting || !buyerEmail}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                      {isSubmitting ? 'Processing...' : 'Place Order'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-10 text-center flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                    <Check size={40} className="text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">Order Reserved!</h2>
                  <p className="text-slate-400 mb-8">Please complete your payment to finalize the purchase.</p>
                  
                  <div className="w-full bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Payment Reference Code</p>
                    <p className="text-4xl font-black text-white tracking-widest">{orderComplete.referenceCode}</p>
                    <p className="text-emerald-400 font-bold mt-2 text-xl">Amount: €{orderComplete.totalAmount.toFixed(2)}</p>
                  </div>
                  
                  <div className="text-left bg-slate-800/50 p-6 rounded-2xl w-full text-sm text-slate-300 space-y-4">
                    <p><strong>Step 1:</strong> Transfer the exact amount via Bank Transfer, Swish, or PayPal.</p>
                    <p><strong>Step 2:</strong> Include your <span className="text-emerald-400 font-bold">Reference Code ({orderComplete.referenceCode})</span> in the payment message.</p>
                    <p><strong>Step 3:</strong> Once we receive the funds, we will ship your order or process your digital goods.</p>
                  </div>
                  
                  <button 
                    onClick={closeCheckout}
                    className="mt-8 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Image Gallery Modal */}
      <AnimatePresence>
        {viewProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-screen flex flex-col items-center justify-center"
            >
              <button 
                onClick={() => setViewProduct(null)} 
                className="absolute top-4 right-4 text-white hover:text-cyan-400 bg-slate-900/50 rounded-full p-3 z-10 transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="w-full h-[80vh] flex items-center justify-center bg-slate-950/50 rounded-3xl overflow-hidden relative group">
                <img 
                  src={(viewProduct.images && viewProduct.images.length > 0) ? viewProduct.images[0] : (viewProduct.imageUrl || 'https://i.imgur.com/B06rBhI.png')} 
                  alt={viewProduct.name}
                  className="max-w-full max-h-full object-contain"
                />
                
                {viewProduct.images && viewProduct.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto p-2 bg-black/50 backdrop-blur-md rounded-2xl max-w-[90%]">
                    {viewProduct.images.map((img: string, idx: number) => (
                      <button 
                        key={idx}
                        onClick={(e) => {
                          // Very simple swap - we just set the main image to be the clicked one for now
                          // In a full implementation, we'd have a currentImageIndex state
                          const newProduct = { ...viewProduct };
                          // swap index 0 and clicked index
                          const temp = newProduct.images[0];
                          newProduct.images[0] = img;
                          newProduct.images[idx] = temp;
                          setViewProduct(newProduct);
                        }}
                        className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${viewProduct.images[0] === img ? 'border-cyan-500 scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-black text-white">{viewProduct.name}</h3>
                <p className="text-slate-400 mt-2 max-w-2xl mx-auto">{viewProduct.description}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
