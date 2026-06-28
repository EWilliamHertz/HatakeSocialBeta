'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const payload = isRegistering ? { email, username, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success
      router.push('/feed');
      router.refresh(); // Refresh state to pick up cookie
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans text-white p-6 relative overflow-hidden pb-32">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-xl w-full bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 shadow-2xl relative z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)] rotate-12">
            <Sparkles size={40} className="text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-4 tracking-tight">
          {isRegistering ? 'Join the Enterprise' : 'Welcome back'}
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          {isRegistering 
            ? 'Create your Neural Link ID to join elite collectors across Europe.' 
            : 'Initialize connection to access your digital binder and the arena.'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-8 text-left">
          <AnimatePresence>
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Collector Alias (Username)</label>
                <input 
                  type="text" 
                  required={isRegistering}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="EuroMage22" 
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Neural Link ID (Email)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="collector@europe.com" 
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Access Code (Password)</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 text-white font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center gap-2 group"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Register' : 'Initialize Connection')}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
        
        <p className="text-xs text-slate-600 font-medium">
          {isRegistering ? 'Already part of the enterprise? ' : 'New to the enterprise? '}
          <span 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }} 
            className="text-cyan-400 cursor-pointer hover:underline"
          >
            {isRegistering ? 'Login here' : 'Request access here'}
          </span>.
        </p>
      </motion.div>
    </div>
  );
}
