'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

export default function PhaseEngineFrame() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [iframeSrc, setIframeSrc] = useState('');
  const [matchmakingStatus, setMatchmakingStatus] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const internalPath = pathname.replace('/play/mtg', '') || '/';
    const qs = searchParams.toString();
    const fullPath = `${internalPath}${qs ? `?${qs}` : ''}`;
    
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5173' 
      : '/phase';
      
    setIframeSrc(`${baseUrl}${fullPath}`);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Connect to Hatake's Matchmaking Server
    const socket = io({ path: '/phase/socket.io' });
    socketRef.current = socket;

    socket.on('match-found', (data) => {
      setMatchmakingStatus('Match Found! Preparing room...');
      if (data.isHost) {
        // We are the host! Tell the iframe to create a room.
        iframeRef.current?.contentWindow?.postMessage({ type: 'MATCH_HOST' }, '*');
      } else {
        // We are the guest! The server should give us the roomCode.
        if (data.roomCode) {
          iframeRef.current?.contentWindow?.postMessage({ type: 'MATCH_JOIN', roomCode: data.roomCode }, '*');
          setMatchmakingStatus(null);
        }
      }
    });

    socket.on('match-ready', (data) => {
       // Guest receives this when the host has successfully created the room.
       setMatchmakingStatus('Joining match...');
       iframeRef.current?.contentWindow?.postMessage({ type: 'MATCH_JOIN', roomCode: data.roomCode }, '*');
       setTimeout(() => setMatchmakingStatus(null), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'FIND_MATCH') {
        setMatchmakingStatus('Searching for opponent...');
        socketRef.current?.emit('queue:join', { userId: 'player', username: 'Player' }); // Would pass real user info here
      } else if (e.data?.type === 'HOST_CREATED') {
        setMatchmakingStatus('Waiting for opponent to join...');
        socketRef.current?.emit('room:created', { roomCode: e.data.roomCode });
        setTimeout(() => setMatchmakingStatus(null), 2000);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!iframeSrc) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white">Loading Engine...</div>;

  return (
    <div className="h-screen w-full bg-slate-950 relative">
      {matchmakingStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-cyan-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg animate-pulse">
          {matchmakingStatus}
        </div>
      )}
      <iframe 
        ref={iframeRef}
        src={iframeSrc} 
        className="w-full h-full border-0"
        allow="fullscreen; clipboard-read; clipboard-write; display-capture"
      />
    </div>
  );
}
