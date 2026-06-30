'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, UserCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [currentUser, setCurrentUser] = useState<{username: string} | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl');

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (e) {
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const handleRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      router.push('/feed');
      router.refresh();
    }
  };

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

      handleRedirect();
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
        
        {checkingAuth ? (
           <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-cyan-500" size={40} /></div>
        ) : currentUser ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 py-6">
            <div className="flex justify-center mb-4">
               <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-cyan-500/30">
                 <UserCheck size={40} className="text-cyan-400" />
               </div>
            </div>
            <h1 className="text-3xl font-black text-white">Signed in as {currentUser.username}</h1>
            <p className="text-slate-400">You are already authenticated with the Enterprise.</p>
            
            <button 
              onClick={handleRedirect}
              className="w-full py-4 mt-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center gap-2 group"
            >
              Continue as {currentUser.username}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
               onClick={() => {
                 fetch('/api/auth/me', { method: 'POST' }).then(() => setCurrentUser(null));
               }}
               className="mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
               Sign out and use a different account
            </button>
          </motion.div>
        ) : (
          <>
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
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500" size={40} /></div>}>
      <LoginContent />
    </Suspense>
  );
}
