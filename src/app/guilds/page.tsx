'use client';
import React, { useState, useEffect } from 'react';
import { Users, Shield, Lock, Search, Plus, X, UserPlus, Home, Settings, MessageSquare, ExternalLink } from 'lucide-react';
import GuildFeed from '@/components/GuildFeed';

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [myGuilds, setMyGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinPrivate, setShowJoinPrivate] = useState<string | null>(null); // guildId
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  
  // Dashboard state
  const [activeGuild, setActiveGuild] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchGuilds = () => {
    setLoading(true);
    fetch('/api/guilds')
      .then(res => res.json())
      .then(data => {
        if (data.guilds) {
          setGuilds(data.guilds);
          setMyGuilds(data.myGuilds || []);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setCurrentUserId(data.user.id); });
    fetchGuilds();
  }, []);

  const handleCreate = async () => {
    const res = await fetch('/api/guilds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE', name, description: desc, isPrivate, inviteCode })
    });
    if (res.ok) {
      setShowCreate(false);
      setName(''); setDesc(''); setIsPrivate(false); setInviteCode('');
      fetchGuilds();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to create');
    }
  };

  const handleJoin = async (guildId: string, code?: string) => {
    const res = await fetch('/api/guilds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'JOIN', guildId, inviteCode: code })
    });
    if (res.ok) {
      setShowJoinPrivate(null);
      setInviteCodeInput('');
      fetchGuilds();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to join');
    }
  };

  const handleLeave = async (guildId: string) => {
    if (!confirm('Leave this guild?')) return;
    const res = await fetch('/api/guilds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LEAVE', guildId })
    });
    if (res.ok) {
      if (activeGuild && activeGuild.id === guildId) setActiveGuild(null);
      fetchGuilds();
    }
  };

  const isMember = (guildId: string) => {
    return myGuilds.some(g => g.id === guildId);
  };

  if (activeGuild) {
    // GUILD DASHBOARD
    return (
      <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Users size={200}/></div>
            <div className="relative z-10">
              <button onClick={() => setActiveGuild(null)} className="text-slate-400 hover:text-white mb-6 flex items-center gap-2 text-sm font-bold uppercase"><X size={16}/> Close Dashboard</button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/50">
                  <Shield size={32} className="text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">{activeGuild.name}</h1>
                    {activeGuild.isPrivate && <span className="bg-fuchsia-500/20 text-fuchsia-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Lock size={12}/> Private</span>}
                  </div>
                  <p className="text-slate-400 mt-2 max-w-2xl">{activeGuild.description || 'Welcome to our guild!'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Sidebar */}
            <div className="md:col-span-1 space-y-6">
              {/* Invite Bar */}
              {activeGuild.isPrivate && (
                <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><UserPlus size={16}/> Invite Members</h3>
                  <div className="bg-slate-950 p-3 rounded-lg border border-white/10 flex items-center justify-between">
                    <code className="text-cyan-400 font-bold">{activeGuild.inviteCode || 'N/A'}</code>
                    <button onClick={() => navigator.clipboard.writeText(activeGuild.inviteCode)} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-white transition-colors">Copy</button>
                  </div>
                </div>
              )}
              
              {/* Members List */}
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={16}/> Roster ({activeGuild.members?.length || 0})</h3>
                <div className="space-y-3">
                  {activeGuild.members?.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-xs">
                          {m.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            {m.username}
                            {m.id === activeGuild.ownerId && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">ADMIN</span>}
                          </div>
                          <div className="text-[10px] text-emerald-400">Rep: {m.reputationScore}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleLeave(activeGuild.id)} className="w-full mt-6 py-3 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all text-sm">
                  Leave Guild
                </button>
              </div>
            </div>

            {/* Main Area */}
            <div className="md:col-span-2 space-y-6">
              <GuildFeed guildId={activeGuild.id} currentUserId={currentUserId} isOwner={activeGuild.ownerId === currentUserId} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GUILDS DIRECTORY
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">Guilds</h1>
            <p className="text-slate-400">Join forces. Build communities. Dominate the meta.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all">
            <Plus size={18} /> Create Guild
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cyan-400 animate-pulse">Loading Guilds...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guilds.map(g => (
              <div key={g.id} className="bg-slate-900 border border-white/5 hover:border-indigo-500/50 rounded-2xl p-6 transition-all group shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="text-indigo-400" />
                  </div>
                  {g.isPrivate && <Lock size={16} className="text-fuchsia-400" />}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{g.name}</h2>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2 h-10">{g.description}</p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                    <Users size={14} /> {g.members?.length || 0} Members
                  </div>
                  
                  {isMember(g.id) ? (
                    <button onClick={() => setActiveGuild(g)} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                      Dashboard <ExternalLink size={14}/>
                    </button>
                  ) : g.isPrivate ? (
                    <button onClick={() => setShowJoinPrivate(g.id)} className="bg-fuchsia-600/20 hover:bg-fuchsia-600/40 text-fuchsia-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                      Enter Code
                    </button>
                  ) : (
                    <button onClick={() => handleJoin(g.id)} className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                      Join Guild
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {guilds.length === 0 && (
              <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-3xl border border-white/5 border-dashed">
                <Shield size={48} className="text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No Guilds Found</h3>
                <p className="text-slate-500">Be the first to forge a guild and gather your allies.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white">Forge Guild</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X size={24}/></button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Guild Name</label>
                <input className="w-full bg-slate-950 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-indigo-500" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. The Akatsuki" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">Manifesto</label>
                <textarea className="w-full bg-slate-950 border border-white/10 text-white rounded-xl p-4 outline-none focus:border-indigo-500 resize-none h-24" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What is your guild about?" />
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-950 border border-white/5 rounded-xl">
                <input type="checkbox" id="privateCheck" checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                <div>
                  <label htmlFor="privateCheck" className="text-sm font-bold text-white cursor-pointer block">Private Guild</label>
                  <p className="text-xs text-slate-500">Require an invite code to join</p>
                </div>
              </div>
              
              {isPrivate && (
                <div>
                  <label className="text-xs text-fuchsia-500 font-bold uppercase mb-1 block">Secret Invite Code</label>
                  <input className="w-full bg-slate-950 border border-fuchsia-500/30 text-white rounded-xl p-4 outline-none focus:border-fuchsia-500" value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="e.g. SECRET123" />
                </div>
              )}
            </div>
            
            <button onClick={handleCreate} disabled={!name} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50">
              Found Guild
            </button>
          </div>
        </div>
      )}

      {/* JOIN PRIVATE MODAL */}
      {showJoinPrivate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center">
            <Lock className="text-fuchsia-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Private Guild</h2>
            <p className="text-slate-400 text-sm mb-6">You need an invite code from the guild master to join.</p>
            
            <input 
              className="w-full bg-slate-950 border border-white/10 text-center text-white rounded-xl p-4 mb-4 outline-none focus:border-fuchsia-500 font-mono tracking-widest" 
              value={inviteCodeInput} 
              onChange={e=>setInviteCodeInput(e.target.value)} 
              placeholder="ENTER CODE" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => setShowJoinPrivate(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
              <button onClick={() => handleJoin(showJoinPrivate, inviteCodeInput)} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-xl transition-all">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
