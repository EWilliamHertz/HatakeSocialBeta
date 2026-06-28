'use client';
import React, { useState, useEffect } from 'react';
import { Send, Image as ImageIcon, Video, X, Edit3, Trash2, MessageSquare, Pin } from 'lucide-react';

export default function GuildFeed({ guildId, currentUserId, isOwner }: { guildId: string, currentUserId: string | null, isOwner: boolean }) {
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [youtubeId, setYoutubeId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/feed?guildId=${guildId}`)
      .then(res => res.json())
      .then(data => {
        if (data.posts) setPosts(data.posts);
        setLoading(false);
      });
  }, [guildId]);

  const handlePost = async () => {
    if (!postContent.trim() && uploadedImages.length === 0 && !youtubeId) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent, imageUrls: uploadedImages, youtubeId, guildId })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts([data.post, ...posts]);
        setPostContent('');
        setUploadedImages([]);
        setYoutubeId('');
      }
    } catch (e) {
      console.error(e);
    }
    setIsPosting(false);
  };

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

  const handlePin = async (postId: string, isPinned: boolean) => {
    try {
      const res = await fetch('/api/feed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, isPinned })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map(p => p.id === postId ? { ...p, isPinned: data.post.isPinned } : p).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Delete post?')) return;
    try {
      const res = await fetch(`/api/feed?id=${postId}`, { method: 'DELETE' });
      if (res.ok) setPosts(posts.filter(p => p.id !== postId));
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Post Box */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <textarea 
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="Share something with your guild..."
          className="w-full bg-slate-950 text-white border border-white/10 rounded-xl p-4 focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none"
        />
        
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative inline-block">
                <img src={img} alt="Uploaded" className="h-40 rounded-xl border border-white/10 object-cover" />
                <button onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {youtubeId && (
          <div className="mt-4 flex items-center gap-2 bg-red-500/10 text-red-400 p-2 rounded-lg text-sm border border-red-500/20 w-fit">
            <Video size={16} /> Attached YouTube: {youtubeId}
            <button onClick={() => setYoutubeId('')} className="ml-auto hover:text-white"><X size={16}/></button>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-2">
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
            disabled={isPosting || isUploading || (!postContent.trim() && uploadedImages.length === 0 && !youtubeId)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-full flex items-center gap-2 transition-colors"
          >
            <Send size={16} /> {isPosting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading guild feed...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/50 rounded-2xl border border-white/5 border-dashed text-slate-500">
          No posts in this guild yet.
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className={`bg-slate-900 border ${post.isPinned ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-white/5'} rounded-2xl p-6 shadow-xl`}>
            {post.isPinned && (
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Pin size={14} className="fill-amber-500" /> Pinned by Admin
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                  {post.author?.username?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-white font-bold">{post.author?.username || 'Unknown'}</h3>
                  <p className="text-slate-500 text-xs">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isOwner && (
                  <button onClick={() => handlePin(post.id, !post.isPinned)} className={`p-2 transition-colors ${post.isPinned ? 'text-amber-500 hover:text-amber-400' : 'text-slate-500 hover:text-amber-500'}`} title={post.isPinned ? "Unpin Post" : "Pin Post"}>
                    <Pin size={16} />
                  </button>
                )}
                {(currentUserId === post.authorId || isOwner) && (
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
            
            {post.images && post.images.length > 0 && (
              <div className={`mt-4 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} rounded-2xl overflow-hidden border border-white/10`}>
                {post.images.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="Post media" className="w-full max-h-96 object-contain bg-slate-950" />
                ))}
              </div>
            )}

            {post.youtubeId && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 aspect-video">
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
          </div>
        ))
      )}
    </div>
  );
}
