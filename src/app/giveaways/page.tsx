'use client';
import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Circle, Users, Trophy, Mail, Loader2, Calendar } from 'lucide-react';

export default function GiveawaysPage() {
  const [giveaways, setGiveaways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    fetch('/api/giveaways')
      .then(r => r.json())
      .then(data => {
        setGiveaways(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const [progress, setProgress] = useState({
    cardsAdded: 0,
    friendsInvited: 0,
    deckCreated: 0,
    tradesCompleted: 0,
  });

  useEffect(() => {
    fetch('/api/giveaways/progress')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) setProgress(data);
      });
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsSending(true);
    setInviteStatus('IDLE');
    
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail })
      });
      
      if (res.ok) {
        setInviteStatus('SUCCESS');
        setInviteEmail('');
      } else {
        setInviteStatus('ERROR');
      }
    } catch {
      setInviteStatus('ERROR');
    }
    
    setIsSending(false);
  };

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'WINNERS'>('ACTIVE');

  const activeGiveaways = giveaways.filter(g => g.isActive);
  const pastGiveaways = giveaways.filter(g => !g.isActive);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pb-32">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="w-20 h-20 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-fuchsia-500/30">
            <Gift size={40} className="text-fuchsia-400" />
          </div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-500">
            Hatake Giveaways
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Complete criteria to enter our weekly raffles. Winners are selected entirely at random among eligible entries!
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'ACTIVE' ? 'bg-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'}`}
            >
              Active Raffles
            </button>
            <button 
              onClick={() => setActiveTab('WINNERS')}
              className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'WINNERS' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5'}`}
            >
              Past Winners
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        
        {loading ? (
          <div className="flex justify-center py-20 text-fuchsia-500"><Loader2 className="animate-spin" size={48} /></div>
        ) : activeTab === 'ACTIVE' ? (
          activeGiveaways.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No active giveaways at this time. Check back later!</div>
          ) : (
            activeGiveaways.map(giveaway => {
            const isComplete = progress.cardsAdded >= giveaway.cardsRequired && 
                               progress.friendsInvited >= giveaway.invitesRequired && 
                               progress.deckCreated >= giveaway.decksRequired && 
                               progress.tradesCompleted >= giveaway.tradesRequired;

            return (
              <div key={giveaway.id} className={`bg-slate-900 border ${isComplete ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-white/10 shadow-xl'} rounded-3xl p-8 relative overflow-hidden transition-all`}>
                {isComplete && (
                  <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Trophy size={150} className="text-emerald-500" />
                  </div>
                )}
                
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-1/3 aspect-[4/3] bg-slate-950 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                    {giveaway.tag && <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg z-10">{giveaway.tag}</div>}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {giveaway.imageUrl && <img src={giveaway.imageUrl} alt={giveaway.title} className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all" />}
                  </div>
                  
                  <div className="flex-1 w-full space-y-6">
                    <div>
                      <h2 className="text-3xl font-black text-white mb-2">{giveaway.title}</h2>
                      <p className="text-slate-400">{giveaway.description}</p>
                    </div>

                    <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-cyan-400" /> Entrance Criteria
                        </h3>
                        <div className="text-xs font-bold text-fuchsia-400 flex items-center gap-1">
                          <Calendar size={14} /> Ends {new Date(giveaway.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {giveaway.cardsRequired > 0 && (
                        <div className="flex items-center gap-4">
                          {progress.cardsAdded >= giveaway.cardsRequired ? <CheckCircle2 className="text-emerald-500 shrink-0" size={24} /> : <Circle className="text-slate-600 shrink-0" size={24} />}
                          <div className="flex-1">
                            <p className={`font-bold ${progress.cardsAdded >= giveaway.cardsRequired ? 'text-slate-300' : 'text-white'}`}>Add {giveaway.cardsRequired} cards to your collection vault</p>
                            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                              <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (progress.cardsAdded / giveaway.cardsRequired) * 100)}%` }}></div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-500">{progress.cardsAdded} / {giveaway.cardsRequired}</span>
                        </div>
                      )}

                      {giveaway.decksRequired > 0 && (
                        <div className="flex items-center gap-4">
                          {progress.deckCreated >= giveaway.decksRequired ? <CheckCircle2 className="text-emerald-500 shrink-0" size={24} /> : <Circle className="text-slate-600 shrink-0" size={24} />}
                          <div className="flex-1">
                            <p className={`font-bold ${progress.deckCreated >= giveaway.decksRequired ? 'text-slate-300' : 'text-white'}`}>Build and save {giveaway.decksRequired} custom Deck{giveaway.decksRequired > 1 ? 's' : ''}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-500">{progress.deckCreated} / {giveaway.decksRequired}</span>
                        </div>
                      )}

                      {giveaway.tradesRequired > 0 && (
                        <div className="flex items-center gap-4">
                          {progress.tradesCompleted >= giveaway.tradesRequired ? <CheckCircle2 className="text-emerald-500 shrink-0" size={24} /> : <Circle className="text-slate-600 shrink-0" size={24} />}
                          <div className="flex-1">
                            <p className={`font-bold ${progress.tradesCompleted >= giveaway.tradesRequired ? 'text-slate-300' : 'text-white'}`}>Complete {giveaway.tradesRequired} Trade or Marketplace Deal{giveaway.tradesRequired > 1 ? 's' : ''}</p>
                          </div>
                          <span className="text-sm font-bold text-slate-500">{progress.tradesCompleted} / {giveaway.tradesRequired}</span>
                        </div>
                      )}

                      {giveaway.invitesRequired > 0 && (
                        <div className="flex items-center gap-4">
                          {progress.friendsInvited >= giveaway.invitesRequired ? <CheckCircle2 className="text-emerald-500 shrink-0" size={24} /> : <Circle className="text-slate-600 shrink-0" size={24} />}
                          <div className="flex-1">
                            <p className={`font-bold ${progress.friendsInvited >= giveaway.invitesRequired ? 'text-slate-300' : 'text-white'}`}>Successfully invite {giveaway.invitesRequired} friend{giveaway.invitesRequired > 1 ? 's' : ''} to Hatake.Social</p>
                          </div>
                          <span className="text-sm font-bold text-slate-500">{progress.friendsInvited} / {giveaway.invitesRequired}</span>
                        </div>
                      )}
                    </div>

                    {isComplete ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-center gap-3">
                        <Trophy className="text-emerald-500" size={24} />
                        <span className="text-emerald-400 font-bold">You are successfully entered into this giveaway!</span>
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-center gap-3">
                        <span className="text-amber-500 font-bold text-sm">Complete all criteria to enter.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
          )
        ) : (
          pastGiveaways.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No past winners yet! The first raffle draw is coming soon.</div>
          ) : (
            pastGiveaways.map(giveaway => (
              <div key={giveaway.id} className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/4 aspect-[4/3] bg-slate-950 rounded-2xl border border-white/5 p-4 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                  {giveaway.tag && <div className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg z-10">{giveaway.tag}</div>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {giveaway.imageUrl && <img src={giveaway.imageUrl} alt={giveaway.title} className="w-full h-full object-cover opacity-60 mix-blend-luminosity" />}
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <h2 className="text-2xl font-black text-white">{giveaway.title}</h2>
                  <p className="text-slate-400">{giveaway.description}</p>
                  
                  <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl inline-block w-full md:w-auto">
                    <p className="text-sm font-bold text-emerald-500 uppercase mb-2">🏆 Official Winners</p>
                    {giveaway.winners && giveaway.winners.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {giveaway.winners.map((winner: string, idx: number) => (
                          <span key={idx} className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-black shadow-lg">
                            @{winner}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-300">Winners are being processed...</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* Invite System */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-4">
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Users className="text-cyan-400" /> Invite Friends
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Help us grow the community! Inviting friends gets you giveaway entries and unlocks future Hatake Premium rewards. 
              Send a personalized email invite instantly.
            </p>
          </div>
          
          <div className="flex-1 w-full bg-slate-950 p-6 rounded-2xl border border-white/5 shadow-inner">
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Friend&apos;s Email Address</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-slate-500" />
                    </div>
                    <input 
                      type="email" 
                      required
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSending}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-all shadow-lg min-w-[120px] flex items-center justify-center"
                  >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : 'Send Invite'}
                  </button>
                </div>
              </div>
              
              {inviteStatus === 'SUCCESS' && (
                <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} /> Invite sent successfully!
                </p>
              )}
              {inviteStatus === 'ERROR' && (
                <p className="text-red-400 text-sm font-bold">Failed to send invite. Please try again.</p>
              )}
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
