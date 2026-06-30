"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";
import { Swords, X, Sparkles } from "lucide-react";

export default function QueuePage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "queued" | "matching">("idle");
  const [size, setSize] = useState(0);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    const s = io({ path: "/pokemon/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.on("connect", () => console.log("[queue] socket connected", s.id));
    s.on("queue:size", ({ size }) => setSize(size));
    s.on("queue:joined", () => {
      setStatus("queued");
      startedAtRef.current = Date.now();
    });
    s.on("queue:left", () => {
      setStatus("idle");
      startedAtRef.current = null;
    });
    s.on("match-found", ({ roomId }) => {
      setStatus("matching");
      const deck = new URLSearchParams(window.location.search).get("deck");
      const target = deck ? `/play/${roomId}?deck=${deck}` : `/play/${roomId}`;
      setTimeout(() => router.push(target), 700);
    });
    return () => {
      s.disconnect();
    };
  }, [user, router]);

  useEffect(() => {
    const id = setInterval(() => {
      if (startedAtRef.current) setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function joinQueue() {
    if (!user || !socketRef.current) return;
    socketRef.current.emit("queue:join", { userId: user.id, username: user.username });
  }
  function leaveQueue() {
    if (!socketRef.current) return;
    socketRef.current.emit("queue:leave");
  }

  if (authChecked && !user) {
    return (
      <div className="min-h-screen pt-32 px-6 max-w-2xl mx-auto text-center">
        <h1 className="font-heading text-3xl text-white mb-4">Sign in to queue</h1>
        <p className="text-slate-400 font-mono text-sm mb-6">
          You must be authenticated to enter matchmaking.
        </p>
        <a href="/login" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all" data-testid="queue-signin-link">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-6 pb-16 max-w-4xl mx-auto">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-euryx-cyan animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-300">
            Hatake Matchmaking · {size} in pool
          </span>
        </motion.div>
        <h1 className="font-heading text-5xl md:text-6xl font-black tracking-tighter text-white" data-testid="queue-title">
          Live Matchmaking
        </h1>
        <p className="text-slate-400 font-mono text-sm mt-4 max-w-md mx-auto">
          Join the queue. The server pairs the next two trainers and warps you both into the arena.
        </p>
      </div>

      <div className="mt-14">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          className="relative mx-auto w-72 h-72"
        >
          {/* Rotating rings */}
          <div className="absolute inset-0 rounded-full border border-euryx-cyan/30 animate-pulse-glow" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full border-2 border-dashed border-euryx-cyan/40"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
            className="absolute inset-10 rounded-full border border-euryx-fuchsia/40"
          />
          <div className="absolute inset-16 rounded-full glass-strong flex flex-col items-center justify-center" data-testid="queue-status-orb">
            {status === "idle" && (
              <>
                <Swords className="w-7 h-7 text-euryx-cyan mb-2" />
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Stand-by</div>
                <div className="font-heading text-lg font-bold text-white mt-1">Ready</div>
              </>
            )}
            {status === "queued" && (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                  <Sparkles className="w-7 h-7 text-euryx-fuchsia" />
                </motion.div>
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 mt-2">Queued</div>
                <div className="font-heading text-2xl font-black text-white mt-1 tabular-nums" data-testid="queue-elapsed">
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                </div>
              </>
            )}
            {status === "matching" && (
              <>
                <Sparkles className="w-7 h-7 text-euryx-cyan animate-pulse" />
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-euryx-cyan neon-cyan mt-2">Matched</div>
                <div className="font-heading text-lg font-bold text-white mt-1">Warping…</div>
              </>
            )}
          </div>
        </motion.div>

        <div className="mt-10 flex justify-center gap-3">
          {status === "idle" && (
            <button onClick={joinQueue} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all w-full flex items-center justify-center gap-2" data-testid="queue-join-btn">
              <Swords className="w-4 h-4" /> Enter Queue
            </button>
          )}
          {status === "queued" && (
            <button onClick={leaveQueue} className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all w-full" data-testid="queue-leave-btn">
              <X className="w-4 h-4" /> Leave Queue
            </button>
          )}
          {status === "matching" && (
            <div className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl animate-pulse cursor-default text-center" data-testid="queue-matched-state">
              Establishing battle channel…
            </div>
          )}
        </div>

        <p className="text-center mt-8 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500" data-testid="queue-size-text">
          Pool · {size} trainers waiting
        </p>
      </div>
    </div>
  );
}
