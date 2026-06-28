'use client';

import React, { useState } from 'react';
import { Search, PenTool, TrendingUp, Filter, Image as ImageIcon, Video, Send, X, Trash2, Edit3, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18nContext';

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState<'SOCIAL' | 'COLLECTORS'>('SOCIAL');
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Header & Tabs */}
        <div className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-8">
            {t('feed.title')}
          </h1>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('SOCIAL')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'SOCIAL' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
            >
              {t('feed.tab.social')}
            </button>
            <button 
              onClick={() => setActiveTab('COLLECTORS')}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === 'COLLECTORS' ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
            >
              {t('feed.tab.collectors')}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'SOCIAL' ? <SocialFeed /> : <CollectorsFeed />}
          </motion.div>
        </AnimatePresence>
        
      </div>
    </div>
  );
}

// ─── Social Feed Component ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SocialFeed() {
  const [postContent, setPostContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [youtubeId, setYoutubeId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('?');
  const [myGuilds, setMyGuilds] = useState<any[]>([]);
  const [feedScope, setFeedScope] = useState('PUBLIC');
  const { t } = useI18n();

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { 
        if (data.user) {
          setCurrentUserId(data.user.id);
          setCurrentUsername(data.user.username);
        }
      })
      .catch(console.error);

    fetch(`/api/feed?guildId=${feedScope === 'PUBLIC' ? '' : feedScope}`)
      .then(res => res.json())
      .then(data => {
        if (data.posts) setPosts(data.posts);
        setLoading(false);
      });
      
    fetch('/api/guilds')
      .then(res => res.json())
      .then(data => {
        if (data.myGuilds) setMyGuilds(data.myGuilds);
      })
      .catch(console.error);
  }, [feedScope]);

  const handlePost = async () => {
    if (!postContent.trim()) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent, imageUrls: uploadedImages, youtubeId, guildId: feedScope })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts([data.post, ...posts]);
        setPostContent('');
        setUploadedImages([]);
        setYoutubeId('');
      } else {
        const errData = await res.json().catch(() => null);
        alert(errData?.error || 'Failed to post. Are you logged in?');
      }
    } catch (e) {
      console.error(e);
    }
    setIsPosting(false);
  };

  // Handle ImgBB Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=b2492f987920d3e2a7903861b72ae3a4`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          return data.data.url;
        }
        return null;
      });
      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter(url => url !== null) as string[];
      setUploadedImages(prev => [...prev, ...validUrls]);
    } catch (err) {
      console.error('ImgBB upload failed', err);
    }
    setIsUploading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Feed Column */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Post Creator / Rich Text Editor */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500 bg-slate-800 flex items-center justify-center font-bold text-cyan-500 uppercase">
              {currentUsername.charAt(0)}
            </div>
            <div className="flex-1">
              <textarea 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={t('feed.post.placeholder')}
                className="w-full bg-transparent text-white placeholder-slate-500 resize-none outline-none text-lg min-h-[80px]"
              />
              
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="Uploaded" className="h-40 rounded-xl border border-white/10 object-cover" />
                      <button onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {youtubeId && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 bg-red-500/10 text-red-400 p-2 rounded-lg text-sm border border-red-500/20">
                    <Video size={16} /> Attached YouTube: {youtubeId}
                    <button onClick={() => setYoutubeId('')} className="ml-auto hover:text-white"><X size={16}/></button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-2">
                <div className="flex flex-wrap gap-3 items-center">
                  <select 
                    value={feedScope} 
                    onChange={e => setFeedScope(e.target.value)}
                    className="bg-slate-800 text-xs font-bold text-slate-300 border border-white/10 rounded-full px-4 py-2 outline-none focus:border-cyan-500 cursor-pointer appearance-none"
                  >
                    <option value="PUBLIC">🌍 Public Feed</option>
                    <option value="GUILDS_FRIENDS">🛡️ Guilds + Friends</option>
                    {myGuilds.map(g => (
                       <option key={g.id} value={g.id}>⚔️ {g.name}</option>
                    ))}
                  </select>
                  <label className="p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer text-cyan-400 transition-colors">
                    <ImageIcon size={20} />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                  <button 
                    onClick={() => {
                      const id = prompt('Enter YouTube Video ID (e.g. dQw4w9WgXcQ)');
                      if (id) setYoutubeId(id);
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-red-400 transition-colors"
                  >
                    <Video size={20} />
                  </button>
                </div>
                <button 
                  onClick={handlePost} 
                  disabled={isPosting || isUploading || (!postContent.trim() && uploadedImages.length === 0)}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold rounded-full flex items-center gap-2 transition-colors"
                >
                  <Send size={16} /> {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No posts yet. Be the first!</div>
        ) : (
          posts.map(post => (
            <PostItem 
              key={post.id} 
              post={post} 
              currentUserId={currentUserId}
              onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
              onUpdate={(updatedPost) => setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))}
            />
          ))
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">{t('feed.activeCollectors')}</h3>
          <div className="flex flex-col gap-3">
            <div className="text-slate-500 text-sm">More collectors joining soon...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collectors Feed Component ───────────────────────────────────────
function CollectorsFeed() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { t } = useI18n();

  React.useEffect(() => {
    fetch('/api/market')
      .then(res => res.json())
      .then(data => {
        if (data.listings) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPosts(data.listings.map((l: any) => ({
            id: l.id,
            user: l.seller?.username || 'Unknown',
            action: 'Selling',
            price: `€${parseFloat(l.price).toFixed(2)}`,
            cardName: l.cardInstance.cardReference.name,
            game: l.cardInstance.cardReference.game,
            illustrator: 'Unknown', // The API might not have illustrator in the subset
            signed: l.cardInstance.isSigned,
            foil: l.cardInstance.isFoil,
            condition: l.cardInstance.condition.replace('_', ' '),
            imageUrl: l.cardInstance.cardReference.imageUrl || 'https://i.imgur.com/B06rBhI.png',
            time: new Date(l.createdAt).toLocaleDateString(),
          })));
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Feed Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder={t('feed.searchMarket')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>
          <button className="px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl flex items-center gap-2 transition-colors font-bold text-slate-300">
            <Filter size={20} />
            Filters
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading market feed...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-500 py-10">No recent market activity.</div>
        ) : posts.filter(p => p.cardName.toLowerCase().includes(search.toLowerCase()) || p.illustrator.toLowerCase().includes(search.toLowerCase())).map(post => (
          <div key={post.id} className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            {/* Background glow on hover */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-cyan-400">
                  {post.user.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-bold">{post.user}</h3>
                  <p className="text-slate-500 text-xs">{post.time}</p>
                </div>
              </div>
              
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${post.action === 'Selling' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {post.action}
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 relative z-10">
              <div className="w-full md:w-1/3">
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-lg relative bg-slate-800 aspect-[2.5/3.5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`/api/proxy?url=${encodeURIComponent(post.imageUrl)}`} 
                    alt={post.cardName}
                    className="w-full h-full object-cover"
                  />
                  {post.signed && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-xl flex items-center gap-1">
                      <PenTool size={14} className="text-amber-400" />
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Signed</span>
                    </div>
                  )}
                  {post.foil && (
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md p-2 rounded-lg border border-fuchsia-500/50 shadow-xl flex items-center gap-1">
                      <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 uppercase tracking-widest">Foil</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full md:w-2/3 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">{post.cardName}</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-300">
                      {post.game}
                    </span>
                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-300">
                      {post.condition}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-4">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Price</p>
                    <p className="text-xl font-black text-emerald-400">{post.price}</p>
                  </div>
                  <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-cyan-900/50">
                    {post.action === 'Selling' ? 'Buy Now' : 'Make Offer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-cyan-400" />
            {t('feed.trendingSignatures')}
          </h3>
          <ul className="space-y-3">
            <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-slate-300 font-semibold">Christopher Rush</span>
              <span className="text-xs text-slate-500 border border-white/10 px-2 py-1 rounded">MTG</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
              <span className="text-slate-300 font-semibold">Mitsuhiro Arita</span>
              <span className="text-xs text-slate-500 border border-white/10 px-2 py-1 rounded">PKMN</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PostItem({ post, currentUserId, onDelete, onUpdate }: { post: any, currentUserId: string | null, onDelete: (id: string) => void, onUpdate: (p: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{id: string, username: string} | null>(null);
  
  const [reactions, setReactions] = useState<any[]>(post.reactions || []);
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const isAuthor = currentUserId === post.authorId;
  const REACTIONS = ['👍', '❤️', '😂', '🔥', '💀'];

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      const res = await fetch(`/api/feed?id=${post.id}`, { method: 'DELETE' });
      if (res.ok) onDelete(post.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch('/api/feed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: editContent })
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...post, content: data.post.content });
        setIsEditing(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReact = async (type: string, targetType: 'POST' | 'COMMENT', targetId: string) => {
    try {
      const res = await fetch('/api/feed/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reactionType: type })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedReaction = { type, userId: currentUserId, user: { username: 'You' } };
        
        if (targetType === 'POST') {
          let newReactions = [...reactions];
          const existingIdx = newReactions.findIndex(r => r.userId === currentUserId);
          if (data.action === 'removed') newReactions.splice(existingIdx, 1);
          else if (data.action === 'updated') newReactions[existingIdx].type = type;
          else newReactions.push(updatedReaction);
          setReactions(newReactions);
          setShowReactionPicker(false);
        } else {
           const updateCommentReactions = (commentList: any[]) => {
             return commentList.map(c => {
               if (c.id === targetId) {
                 let newReacts = [...(c.reactions || [])];
                 const idx = newReacts.findIndex(r => r.userId === currentUserId);
                 if (data.action === 'removed') newReacts.splice(idx, 1);
                 else if (data.action === 'updated') newReacts[idx].type = type;
                 else newReacts.push(updatedReaction);
                 return { ...c, reactions: newReacts };
               }
               if (c.replies) {
                 return { ...c, replies: updateCommentReactions(c.replies) };
               }
               return c;
             });
           };
           setComments(updateCommentReactions(comments));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: commentText, parentId: replyingTo?.id })
      });
      if (res.ok) {
        const data = await res.json();
        data.comment.replies = [];
        data.comment.reactions = [];
        
        if (replyingTo) {
          setComments(comments.map(c => c.id === replyingTo.id ? { ...c, replies: [...(c.replies || []), data.comment] } : c));
        } else {
          setComments([...comments, data.comment]);
        }
        setCommentText('');
        setReplyingTo(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const reactionCounts = reactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const myPostReaction = reactions.find(r => r.userId === currentUserId);

  const renderComment = (comment: any, isReply = false) => {
    const cReactions = comment.reactions || [];
    const cReactCounts = cReactions.reduce((acc: any, curr: any) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {});
    const myCReaction = cReactions.find((r: any) => r.userId === currentUserId);

    return (
      <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-10 mt-3 border-l-2 border-white/5 pl-4' : 'mt-4'}`}>
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-500 text-xs shrink-0">
          {comment.author?.username?.charAt(0) || '?'}
        </div>
        <div className="flex-1">
          <div className="bg-slate-950 rounded-xl p-3 border border-white/5">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-bold text-white text-sm">{comment.author?.username}</span>
              <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-slate-300 text-sm">{comment.content}</p>
          </div>
          
          <div className="flex gap-4 mt-2 px-2 text-xs text-slate-400 font-bold items-center relative">
            <div className="group relative flex items-center">
              <button className={`hover:text-cyan-400 transition-colors ${myCReaction ? 'text-cyan-500' : ''}`}>
                {myCReaction ? myCReaction.type : 'React'} 
              </button>
              {Object.keys(cReactCounts).length > 0 && (
                <span className="ml-2 bg-slate-800 px-2 py-0.5 rounded-full text-[10px]">
                  {Object.entries(cReactCounts).map(([k, v]) => `${k} ${v}`).join(' ')}
                </span>
              )}
              
              {/* Comment Reaction Picker */}
              <div className="absolute left-0 bottom-full mb-2 bg-slate-800 border border-white/10 rounded-full p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity flex gap-1 shadow-xl z-20">
                {REACTIONS.map(emoji => (
                  <button key={emoji} onClick={() => handleReact(emoji, 'COMMENT', comment.id)} className="hover:scale-125 transition-transform px-2">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {!isReply && (
              <button 
                onClick={() => setReplyingTo({ id: comment.id, username: comment.author?.username || 'User' })} 
                className="hover:text-cyan-400 transition-colors"
              >
                Reply
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.map((reply: any) => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-xl mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center font-bold text-cyan-500">
            {post.author?.username?.charAt(0) || '?'}
          </div>
          <div>
            <h3 className="text-white font-bold">{post.author?.username || 'Unknown'}</h3>
            <p className="text-slate-500 text-xs">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
        </div>
        {isAuthor && (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors">
              <Edit3 size={16} />
            </button>
            <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="mb-6">
          <textarea 
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-slate-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-cyan-500 min-h-[80px]"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleUpdate} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-colors">Save</button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="text-slate-200 mb-6 text-lg">{post.content}</p>
      )}
      
      {post.images && post.images.length > 0 && (
        <div className={`mb-6 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-2xl overflow-hidden border border-white/10`}>
          {post.images.map((img: string, idx: number) => (
            <img key={idx} src={img} alt="Post media" className="w-full max-h-96 object-contain bg-slate-950" />
          ))}
        </div>
      )}

      {post.youtubeId && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 aspect-video">
          <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${post.youtubeId}`} 
            title="YouTube video player" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}
      
      {/* Reactions Summary */}
      {Object.keys(reactionCounts).length > 0 && (
        <div className="flex gap-2 mb-4">
          {Object.entries(reactionCounts).map(([emoji, count]) => (
            <span key={emoji} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-sm flex items-center gap-1 text-slate-300">
              {emoji} {count}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 pt-4 border-t border-white/5 text-slate-400 font-bold text-sm relative">
        <div className="relative">
          <button 
            onMouseEnter={() => setShowReactionPicker(true)}
            onClick={() => {
              if (myPostReaction) handleReact(myPostReaction.type, 'POST', post.id); // Toggle off
              else setShowReactionPicker(!showReactionPicker);
            }}
            className={`hover:text-cyan-400 flex items-center gap-2 transition-colors ${myPostReaction ? 'text-cyan-500' : ''}`}
          >
            {myPostReaction ? myPostReaction.type : 'React'}
          </button>

          {/* Hover Reaction Picker */}
          {showReactionPicker && (
            <div 
              onMouseLeave={() => setShowReactionPicker(false)}
              className="absolute left-0 bottom-full mb-2 bg-slate-800 border border-white/10 rounded-full p-2 flex gap-2 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2"
            >
              {REACTIONS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReact(emoji, 'POST', post.id)}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => setShowComments(!showComments)} className="hover:text-cyan-400 flex items-center gap-2 transition-colors">
          <MessageSquare size={16} /> {comments.length + comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0)} Comments
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-white/5">
          {comments.map((comment: any) => renderComment(comment))}
          
          <div className="mt-4">
            {replyingTo && (
              <div className="flex items-center justify-between bg-white/5 text-cyan-400 text-xs px-4 py-2 rounded-t-xl border border-white/10 border-b-0">
                <span>Replying to <strong>{replyingTo.username}</strong></span>
                <button onClick={() => setReplyingTo(null)} className="hover:text-white"><X size={14}/></button>
              </div>
            )}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                className={`flex-1 bg-slate-950 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors ${replyingTo ? 'rounded-b-xl rounded-tr-xl' : 'rounded-full'}`}
              />
              <button onClick={handleComment} className="px-4 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white transition-colors">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
