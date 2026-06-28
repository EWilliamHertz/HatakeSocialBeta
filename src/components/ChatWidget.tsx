'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Plus, ChevronLeft, Globe, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';

type ChatMessage = {
  id: string;
  senderId: string;
  sender: { username: string };
  receiverId?: string;
  receiver?: { username: string };
  content: string;
  createdAt: string;
};

export default function ChatWidget() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Navigation State
  // 'LIST' = showing global + private threads
  // 'GLOBAL' = inside global chat
  // 'PRIVATE' = inside private chat
  const [view, setView] = useState<'LIST' | 'GLOBAL' | 'PRIVATE'>('LIST');
  const [privateRecipient, setPrivateRecipient] = useState<{id: string, username: string} | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view, privateRecipient]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUserId(data.user.id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchMessages = async () => {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (isOpen) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: any = {
      id: tempId,
      senderId: userId || 'me',
      sender: { username: 'You' },
      receiverId: view === 'PRIVATE' && privateRecipient ? privateRecipient.id : null,
      receiver: view === 'PRIVATE' && privateRecipient ? { username: privateRecipient.username } : null,
      content: input,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: optimisticMsg.content, receiverId: optimisticMsg.receiverId })
      });
      if (!res.ok) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else {
        const serverData = await res.json();
        // Update temp msg if needed, but next poll will fix it anyway
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const startNewChat = async () => {
    if (!newChatUsername.trim()) return;
    
    try {
      const res = await fetch(`/api/users?username=${encodeURIComponent(newChatUsername.trim())}`);
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        const found = data.users.find((u: any) => u.username.toLowerCase() === newChatUsername.toLowerCase());
        if (found) {
          setPrivateRecipient({ id: found.id, username: found.username });
          setView('PRIVATE');
          setShowNewChat(false);
          setNewChatUsername('');
          return;
        }
      }
      alert('User not found!');
    } catch(e) {
      alert('Error finding user');
    }
  };

  // Compute unique private threads
  const privateThreads = new Map<string, {id: string, username: string, lastMessage: string, lastTime: string}>();
  if (userId) {
    messages.forEach(msg => {
      if (msg.receiverId && (msg.senderId === userId || msg.receiverId === userId)) {
        const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
        const otherUsername = msg.senderId === userId ? msg.receiver?.username : msg.sender.username;
        if (otherUserId && otherUsername) {
          if (!privateThreads.has(otherUserId)) {
            privateThreads.set(otherUserId, {
              id: otherUserId,
              username: otherUsername,
              lastMessage: msg.content,
              lastTime: msg.createdAt
            });
          }
        }
      }
    });
  }

  const threadList = Array.from(privateThreads.values());

  const displayMessages = messages.filter(msg => {
    if (view === 'PRIVATE' && privateRecipient) {
      return (
        (msg.receiverId === privateRecipient.id && msg.senderId === userId) ||
        (msg.receiverId === userId && msg.senderId === privateRecipient.id)
      );
    }
    if (view === 'GLOBAL') {
      return !msg.receiverId;
    }
    return false;
  }).reverse(); // Assume messages come from API desc, we might need them asc for chat

  // Actually, wait, let's just make sure they are sorted ascending for chat view
  const sortedMessages = [...displayMessages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-r from-cyan-600 to-fuchsia-600 shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:scale-110 transition-all z-50 text-white"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-slate-800/80 flex justify-between items-center relative">
              {view !== 'LIST' ? (
                <button onClick={() => setView('LIST')} className="text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft size={24} />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageCircle size={20} className="text-cyan-400" />
                  <h3 className="text-white font-bold">Messages</h3>
                </div>
              )}

              {view !== 'LIST' && (
                <h3 className="text-white font-bold flex-1 text-center truncate px-2">
                  {view === 'GLOBAL' ? 'Global Chat' : privateRecipient?.username}
                </h3>
              )}

              {view === 'LIST' && (
                <button onClick={() => setShowNewChat(!showNewChat)} className="text-slate-400 hover:text-cyan-400 transition-colors p-1 bg-slate-800 rounded-full">
                  <Plus size={20} />
                </button>
              )}
              {view !== 'LIST' && <div className="w-6"></div> /* Spacer */}
            </div>

            {/* List View */}
            {view === 'LIST' && (
              <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3">
                {showNewChat && (
                  <div className="bg-slate-800 rounded-xl p-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" 
                      placeholder="Enter username..." 
                      value={newChatUsername}
                      onChange={e => setNewChatUsername(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && startNewChat()}
                      className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button onClick={startNewChat} className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg px-3 text-sm font-bold">Go</button>
                  </div>
                )}

                {/* Global Chat Box */}
                <div 
                  onClick={() => setView('GLOBAL')}
                  className="bg-gradient-to-r from-cyan-600/20 to-fuchsia-600/20 hover:from-cyan-600/30 hover:to-fuchsia-600/30 border border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <Globe className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">Global Chat</h4>
                    <p className="text-slate-400 text-xs">Join the community discussion</p>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 mt-4 mb-2">Direct Messages</div>

                {threadList.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm mt-8">No active conversations.<br/>Click + to start one.</div>
                ) : (
                  threadList.map(thread => (
                    <div 
                      key={thread.id}
                      onClick={() => {
                        setPrivateRecipient({ id: thread.id, username: thread.username });
                        setView('PRIVATE');
                      }}
                      className="bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                        <User className="text-slate-300" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{thread.username}</h4>
                        <p className="text-slate-400 text-xs truncate">{thread.lastMessage}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat View */}
            {view !== 'LIST' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {sortedMessages.length === 0 && (
                    <div className="text-center text-slate-500 mt-10 text-sm">
                      {view === 'GLOBAL' ? 'Be the first to send a message...' : `Say hello to ${privateRecipient?.username}!`}
                    </div>
                  )}
                  {sortedMessages.map(msg => {
                    const isMe = msg.senderId === userId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span 
                          className={`text-[10px] text-slate-500 mb-1 pl-1 ${!isMe && view === 'GLOBAL' ? 'cursor-pointer hover:text-cyan-400' : ''}`}
                          onClick={() => {
                            if (!isMe && view === 'GLOBAL' && msg.senderId) {
                              setPrivateRecipient({ id: msg.senderId, username: msg.sender?.username || 'Unknown' });
                              setView('PRIVATE');
                            }
                          }}
                        >
                          {isMe ? 'You' : msg.sender?.username}
                        </span>
                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                          isMe 
                            ? 'bg-cyan-600 text-white rounded-tr-none' 
                            : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-slate-800/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder={view === 'PRIVATE' ? `Message ${privateRecipient?.username}...` : t('chat.placeholder')}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      className="p-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex shrink-0"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
