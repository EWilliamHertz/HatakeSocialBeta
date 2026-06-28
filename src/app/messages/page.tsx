'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle, User, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18nContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MessagesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // A simple way to structure conversations by user:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeChat, setActiveChat] = useState<any>(null); // The user we are chatting with
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { t } = useI18n();

  const fetchMessages = async () => {
    try {
      // First get our user ID
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        setUserId(meData.user.id);
      }

      const res = await fetch('/api/messages');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5 seconds for now
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setUserSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(userSearchQuery)}`);
        const data = await res.json();
        setUserSearchResults(data.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [userSearchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChat) return;
    
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeChat.id, content: input })
      });
      if (res.ok) {
        setInput('');
        fetchMessages();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Group messages by conversation partner
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations = new Map<string, any>();
  
  messages.forEach(msg => {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!partnerId) return;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    
    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, {
        partner,
        messages: []
      });
    }
    // prepend to keep chronological order since API returns desc
    conversations.get(partnerId).messages.unshift(msg);
  });

  const convList = Array.from(conversations.values());
  const activeConversation = activeChat ? conversations.get(activeChat.id)?.messages || [] : [];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 pt-24 pb-32 px-4 md:px-8">
      <div className="max-w-6xl mx-auto h-[70vh] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-white/10 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h1 className="text-2xl font-black text-white flex items-center gap-2 mb-4">
              <MessageCircle className="text-cyan-400" /> {t('nav.messages')}
            </h1>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search users to message..."
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {userSearchQuery ? (
              <div>
                {isSearching ? (
                   <div className="flex justify-center p-4"><Loader2 className="animate-spin text-cyan-500" size={20} /></div>
                ) : userSearchResults.length === 0 ? (
                   <div className="p-4 text-slate-500 text-sm text-center">No users found.</div>
                ) : (
                   userSearchResults.map(u => (
                     <div 
                       key={u.id} 
                       onClick={() => {
                         setActiveChat(u);
                         setUserSearchQuery('');
                       }}
                       className="p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 flex items-center gap-3 transition-colors"
                     >
                       <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
                         <User size={16} />
                       </div>
                       <h3 className="font-bold text-white text-sm truncate">{u.username}</h3>
                     </div>
                   ))
                )}
              </div>
            ) : loading && convList.length === 0 ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-cyan-500" /></div>
            ) : convList.length === 0 ? (
              <div className="p-8 text-slate-500 text-center">No conversations yet. Start a deal to chat!</div>
            ) : (
              convList.map((conv, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveChat(conv.partner)}
                  className={`p-4 border-b border-white/5 cursor-pointer transition-all flex items-center gap-4 ${activeChat?.id === conv.partner.id ? 'bg-cyan-900/30 border-l-4 border-l-cyan-500' : 'hover:bg-white/5'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0">
                    <User size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-white truncate">{conv.partner.username}</h3>
                    <p className="text-sm text-slate-400 truncate">{conv.messages[conv.messages.length - 1]?.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-950">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-slate-900 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="font-bold text-white">{activeChat.username}</h2>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {activeConversation.map((msg: any) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl ${isMe ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-slate-800 text-white rounded-tl-sm'}`}>
                        <p>{msg.content}</p>
                        <span className="text-[10px] text-white/50 block mt-2">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-slate-900 border-t border-white/10">
                <form onSubmit={handleSend} className="flex gap-4">
                  <input 
                    type="text" 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    type="submit" 
                    disabled={sending || !input.trim()}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center"
                  >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
              <MessageCircle size={64} className="opacity-20" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
