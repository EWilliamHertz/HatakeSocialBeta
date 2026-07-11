'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';

interface HatakeUser {
  id: string;
  username: string;
}

export default function PhaseEngineFrame() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [iframeSrc, setIframeSrc] = useState('');
  const [matchmakingStatus, setMatchmakingStatus] = useState<string | null>(null);
  const [eloToast, setEloToast] = useState<string | null>(null);
  const [inviteRoomCode, setInviteRoomCode] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const userRef = useRef<HatakeUser | null>(null);
  const pendingJoinRef = useRef<string | null>(searchParams.get('join'));

  const postToPhase = useCallback((msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  }, []);

  const sendIdentity = useCallback(() => {
    const user = userRef.current;
    if (user) {
      postToPhase({ type: 'HATAKE_IDENTITY', displayName: user.username, userId: user.id });
    }
  }, [postToPhase]);

  // Load the logged-in Hatake profile so the Phase client uses the real username.
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          userRef.current = { id: data.user.id, username: data.user.username };
          sendIdentity();
        }
      })
      .catch(() => {});
  }, [sendIdentity]);

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

    socket.on('queue:joined', (data) => {
      setMatchmakingStatus(
        data?.elo ? `Searching for opponent… (your Elo: ${data.elo})` : 'Searching for opponent…',
      );
    });

    socket.on('match-found', (data) => {
      const opp = data?.opponent;
      setMatchmakingStatus(
        opp?.username
          ? `Match found vs ${opp.username}${opp.elo ? ` (${opp.elo})` : ''}! Preparing room…`
          : 'Match Found! Preparing room...',
      );
      if (data.isHost) {
        // We are the host! Tell the iframe to create a room.
        postToPhase({ type: 'MATCH_HOST' });
      } else if (data.roomCode) {
        postToPhase({ type: 'MATCH_JOIN', roomCode: data.roomCode });
        setMatchmakingStatus(null);
      }
    });

    socket.on('match-ready', (data) => {
      // Guest receives this when the host has successfully created the room.
      setMatchmakingStatus('Joining match...');
      postToPhase({ type: 'MATCH_JOIN', roomCode: data.roomCode });
      setTimeout(() => setMatchmakingStatus(null), 2000);
    });

    socket.on('elo:update', (data) => {
      const sign = data.delta >= 0 ? '+' : '';
      const label = data.result === 'win' ? 'Victory' : data.result === 'loss' ? 'Defeat' : 'Draw';
      setEloToast(`${label}! Elo ${sign}${data.delta} → ${data.elo}`);
      setTimeout(() => setEloToast(null), 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, [postToPhase]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PHASE_READY') {
        // Phase client booted inside the iframe: hand over identity and any
        // pending friend-invite join code (/play/mtg?join=CODE).
        sendIdentity();
        if (pendingJoinRef.current) {
          const code = pendingJoinRef.current;
          pendingJoinRef.current = null;
          setTimeout(() => postToPhase({ type: 'MATCH_JOIN', roomCode: code }), 500);
        }
      } else if (e.data?.type === 'FIND_MATCH') {
        setMatchmakingStatus('Searching for opponent...');
        socketRef.current?.emit('queue:join', {
          userId: userRef.current?.id,
          username: userRef.current?.username,
        });
      } else if (e.data?.type === 'HOST_CREATED') {
        setMatchmakingStatus('Waiting for opponent to join...');
        socketRef.current?.emit('room:created', { roomCode: e.data.roomCode });
        setInviteRoomCode(e.data.roomCode ?? null);
        setTimeout(() => setMatchmakingStatus(null), 2000);
      } else if (e.data?.type === 'MATCH_RESULT') {
        // Forward the game result for Elo processing.
        socketRef.current?.emit('match:result', { result: e.data.result });
        setInviteRoomCode(null);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postToPhase, sendIdentity]);

  const inviteLink = inviteRoomCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/play/mtg?join=${inviteRoomCode}`
    : '';

  const handleChallenge = async () => {
    if (!inviteRoomCode || !inviteUsername.trim()) return;
    setInviteFeedback('Sending…');
    try {
      const res = await fetch('/api/mtg/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: inviteUsername.trim(), roomCode: inviteRoomCode }),
      });
      const data = await res.json();
      setInviteFeedback(res.ok ? `Challenge sent to ${inviteUsername.trim()}!` : data?.error || 'Failed to send challenge.');
    } catch {
      setInviteFeedback('Failed to send challenge.');
    }
  };

  if (!iframeSrc) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-white">Loading Engine...</div>;

  return (
    <div className="h-screen w-full bg-slate-950 relative">
      {matchmakingStatus && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-cyan-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg animate-pulse">
          {matchmakingStatus}
        </div>
      )}
      {eloToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-fuchsia-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg">
          {eloToast}
        </div>
      )}
      {inviteRoomCode && (
        <div className="absolute bottom-4 right-4 z-50 bg-slate-900/95 border border-white/10 rounded-2xl p-4 w-80 shadow-2xl">
          <p className="text-white font-bold mb-2">Invite a friend</p>
          <p className="text-slate-400 text-xs mb-2 break-all">
            Room code: <span className="text-cyan-400 font-mono">{inviteRoomCode}</span>
          </p>
          <button
            onClick={() => navigator.clipboard?.writeText(inviteLink).then(() => setInviteFeedback('Link copied!'))}
            className="w-full mb-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl px-3 py-2"
          >
            Copy invite link
          </button>
          <div className="flex gap-2">
            <input
              value={inviteUsername}
              onChange={(e) => setInviteUsername(e.target.value)}
              placeholder="Friend's username"
              className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleChallenge}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-xl px-3 py-2"
            >
              Send
            </button>
          </div>
          {inviteFeedback && <p className="text-cyan-400 text-xs mt-2">{inviteFeedback}</p>}
          <button
            onClick={() => setInviteRoomCode(null)}
            className="absolute top-2 right-3 text-slate-500 hover:text-white text-sm"
          >
            ✕
          </button>
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
