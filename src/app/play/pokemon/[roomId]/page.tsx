"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  Shield, Layers, Trash2, ArrowLeft, Swords, MessageSquare, Send,
  Zap, Flag, Trophy, X, Hourglass,
} from "lucide-react";
import { PokemonCard, EuryxCard } from "@/components/PokemonCard";

// ============================== Game state types ==============================

type Zone = "hand" | "active" | "bench" | "discard" | "prize" | "deck";
type Seat = "player1" | "player2";

type PlayedCard = EuryxCard & {
  uid: string;
  zone: Zone;
  benchIndex?: number;
  maxHp: number;
  hp: number;
  energy: number;
  attackDamage: number;
};

type Side = {
  active: PlayedCard | null;
  bench: (PlayedCard | null)[];
  discard: PlayedCard[];
  deck: number;
  hand: number;
  prizes: number;
};

const INITIAL_SIDE = (): Side => ({
  active: null,
  bench: [null, null, null, null, null],
  discard: [],
  deck: 50,
  hand: 7,
  prizes: 6,
});

const DEMO_NAMES = ["Charizard ex", "Pikachu", "Mewtwo", "Bulbasaur", "Snorlax", "Gengar VMAX", "Eevee", "Lucario V", "Garchomp V", "Greninja ex", "Umbreon VMAX", "Rayquaza VMAX"];

async function fetchDemoCards(): Promise<EuryxCard[]> {
  const picks: EuryxCard[] = [];
  await Promise.all(
    DEMO_NAMES.slice(0, 8).map(async (n) => {
      try {
        const r = await fetch(`/api/pokemon/search?search=${encodeURIComponent(n)}&limit=2`);
        const d = await r.json();
        if (d.cards?.[0]) picks.push(d.cards[0]);
      } catch {}
    })
  );
  return picks;
}

const uid = (p = "c") => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function buildPlayed(c: EuryxCard, variant = "EN"): PlayedCard {
  // Synthesize HP & attack from rarity/price (since Hatake doesn't return these).
  const price = c.price ?? 30;
  const tier = price > 200 ? 3 : price > 60 ? 2 : 1;
  const maxHp = tier === 3 ? 220 : tier === 2 ? 150 : 90;
  const attackDamage = tier === 3 ? 90 : tier === 2 ? 60 : 40;
  return {
    ...c,
    uid: uid("h"),
    zone: "hand",
    variant,
    maxHp,
    hp: maxHp,
    energy: 0,
    attackDamage,
  };
}

// =================================== Page ====================================

export default function PlayRoomPage() {
  const params = useParams<{ roomId: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const roomId = params.roomId;
  const deckIdParam = sp.get("deck");
  const isSpectator = sp.get("spectate") === "1";
  const matchStartRef = useRef<number>(Date.now());
  const damageDealtRef = useRef<number>(0);
  const knockoutsRef = useRef<number>(0);
  const opponentIdRef = useRef<string | null>(null);
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [mySeat, setMySeat] = useState<Seat>("player1");
  const socketRef = useRef<Socket | null>(null);

  // Player state
  const [hand, setHand] = useState<PlayedCard[]>([]);
  const [active, setActive] = useState<PlayedCard | null>(null);
  const [bench, setBench] = useState<(PlayedCard | null)[]>([null, null, null, null, null]);
  const [discard, setDiscard] = useState<PlayedCard[]>([]);
  const [prize, setPrize] = useState<number>(6);
  const [deckCount, setDeckCount] = useState<number>(50);

  // Opponent state (mirrored)
  const [opp, setOpp] = useState<Side>(INITIAL_SIDE());

  // Turn engine
  const [turn, setTurn] = useState<Seat>("player1");
  const [turnNumber, setTurnNumber] = useState(1);
  const [phase, setPhase] = useState<"setup" | "active" | "ended">("active");
  const [winner, setWinner] = useState<{ seat: Seat | null; reason: string } | null>(null);

  // UI state
  const [picking, setPicking] = useState<{ card: PlayedCard } | null>(null);
  const [chat, setChat] = useState<{ text: string; username: string; at: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [floatingMsg, setFloatingMsg] = useState<string | null>(null);

  const myTurn = turn === mySeat && !isSpectator;

  function flash(msg: string, ms = 2200) {
    setFloatingMsg(msg);
    setTimeout(() => setFloatingMsg(null), ms);
  }

  // ----------------------- Boot -----------------------
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUser(d.user || { id: "guest-" + uid("u"), username: "Guest" }));
  }, []);

  useEffect(() => {
    // Try to load a specific deck from ?deck=<id> first. Fall back to demo cards.
    async function loadHand() {
      if (deckIdParam) {
        try {
          const r = await fetch(`/api/decks/${deckIdParam}`, { credentials: "include" });
          if (r.ok) {
            const { deck } = await r.json();
            const playable: EuryxCard[] = (deck.cards || []).map((c: any) => ({
              id: c.id, apiId: c.apiId, name: c.name, imageUrl: c.imageUrl,
              setCode: c.setCode, variant: c.variant || "EN",
            }));
            if (playable.length > 0) {
              setHand(playable.slice(0, 7).map((c) => buildPlayed(c, c.variant || "EN")));
              setDeckCount(Math.max(0, playable.length - 7));
              return;
            }
          }
        } catch {}
      }
      const cards = await fetchDemoCards();
      setHand(cards.slice(0, 7).map((c) => buildPlayed(c, "EN")));
      setDeckCount(50);
    }
    loadHand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckIdParam]);

  // ----------------------- Socket -----------------------
  useEffect(() => {
    if (!user) return;
    const s = io({ path: "/pokemon/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = s;
    s.emit("room:join", { roomId, userId: user.id, username: user.username, spectate: isSpectator });
    s.on("opponent:joined", ({ username, userId }: any) => {
      setOpponentName(username);
      if (userId) opponentIdRef.current = userId;
    });
    s.on("game:move", ({ move }) => applyOpponentMove(move));
    s.on("game:chat", (msg) => setChat((c) => [...c, msg].slice(-30)));
    return () => { s.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, roomId]);

  function emit(move: any) {
    if (isSpectator) return; // spectators never emit
    socketRef.current?.emit("game:move", { roomId, move });
  }

  function applyOpponentMove(move: any) {
    if (move.type === "play-active") {
      setOpp((s) => ({ ...s, active: { ...move.card, zone: "active" }, hand: Math.max(0, s.hand - 1) }));
    } else if (move.type === "play-bench") {
      setOpp((s) => {
        const b = [...s.bench]; b[move.index] = { ...move.card, zone: "bench", benchIndex: move.index };
        return { ...s, bench: b, hand: Math.max(0, s.hand - 1) };
      });
    } else if (move.type === "attach-energy") {
      setOpp((s) => {
        if (move.target === "active" && s.active) return { ...s, active: { ...s.active, energy: s.active.energy + 1 } };
        if (move.target === "bench" && s.bench[move.index]) {
          const b = [...s.bench];
          b[move.index] = { ...b[move.index]!, energy: b[move.index]!.energy + 1 };
          return { ...s, bench: b };
        }
        return s;
      });
    } else if (move.type === "attack") {
      // Opponent attacks me
      setActive((a) => {
        if (!a) return a;
        const newHp = Math.max(0, a.hp - move.damage);
        const nextA = { ...a, hp: newHp };
        if (newHp === 0) {
          setDiscard((d) => [...d, { ...nextA, zone: "discard" }]);
          // Opponent takes a prize
          setOpp((s) => ({ ...s, prizes: Math.max(0, s.prizes - 1) }));
          flash(`${nextA.name} was knocked out!`);
          // Win check
          setOpp((s) => {
            if (s.prizes - 1 <= 0) { setWinner({ seat: turn, reason: "All prizes taken" }); setPhase("ended"); }
            return s;
          });
          return null;
        }
        return nextA;
      });
    } else if (move.type === "end-turn") {
      setTurn(mySeat);
      setTurnNumber((n) => n + 1);
      flash("Your turn", 1500);
    } else if (move.type === "draw") {
      setOpp((s) => ({ ...s, hand: s.hand + 1, deck: Math.max(0, s.deck - 1) }));
    } else if (move.type === "concede") {
      setWinner({ seat: mySeat, reason: "Opponent conceded" });
      setPhase("ended");
    }
  }

  // ----------------------- Actions -----------------------

  function playToActive(card: PlayedCard) {
    if (active) { flash("Active spot already filled."); return; }
    setHand((h) => h.filter((c) => c.uid !== card.uid));
    setActive({ ...card, zone: "active" });
    emit({ type: "play-active", card });
    setPicking(null);
  }

  function playToBench(card: PlayedCard, idx: number) {
    if (bench[idx]) { flash("Bench slot taken."); return; }
    setHand((h) => h.filter((c) => c.uid !== card.uid));
    setBench((b) => { const nb = [...b]; nb[idx] = { ...card, zone: "bench", benchIndex: idx }; return nb; });
    emit({ type: "play-bench", card, index: idx });
    setPicking(null);
  }

  function attachEnergy(target: "active" | "bench", index?: number) {
    if (!myTurn) { flash("Not your turn."); return; }
    if (target === "active") {
      if (!active) { flash("No active Pokémon."); return; }
      setActive({ ...active, energy: active.energy + 1 });
      emit({ type: "attach-energy", target: "active" });
    } else if (target === "bench" && index != null && bench[index]) {
      const b = [...bench];
      b[index] = { ...b[index]!, energy: b[index]!.energy + 1 };
      setBench(b);
      emit({ type: "attach-energy", target: "bench", index });
    }
  }

  function attack() {
    if (!myTurn) { flash("Not your turn."); return; }
    if (!active) { flash("No attacker."); return; }
    if (active.energy < 1) { flash("Needs at least 1 energy."); return; }
    if (!opp.active) { flash("Opponent has no active Pokémon."); return; }
    const dmg = active.attackDamage;
    damageDealtRef.current += dmg;
    // Apply locally to opponent's active
    setOpp((s) => {
      if (!s.active) return s;
      const newHp = Math.max(0, s.active.hp - dmg);
      const nextA = { ...s.active, hp: newHp };
      if (newHp === 0) {
        knockoutsRef.current += 1;
        flash(`Knocked out ${s.active.name}! +1 prize`);
        // I take a prize
        setPrize((p) => {
          const np = Math.max(0, p - 1);
          if (np <= 0) { setWinner({ seat: mySeat, reason: "All prizes taken" }); setPhase("ended"); }
          return np;
        });
        return { ...s, active: null, discard: [...s.discard, { ...nextA, zone: "discard" }] };
      }
      return { ...s, active: nextA };
    });
    emit({ type: "attack", damage: dmg });
    // Auto end-turn after attacking (simple TCG rule simplification)
    setTimeout(() => endTurn(), 700);
  }

  function endTurn() {
    if (!myTurn) return;
    setTurn(mySeat === "player1" ? "player2" : "player1");
    setTurnNumber((n) => n + 1);
    emit({ type: "end-turn" });
    flash("Opponent's turn", 1500);
  }

  function drawCard() {
    if (!myTurn) { flash("Not your turn."); return; }
    if (deckCount <= 0) { flash("Deck is empty."); return; }
    setDeckCount((n) => n - 1);
    fetchDemoCards().then((arr) => {
      const c = arr[Math.floor(Math.random() * arr.length)];
      if (c) setHand((h) => [...h, buildPlayed(c, "EN")]);
    });
    emit({ type: "draw" });
  }

  function concede() {
    emit({ type: "concede" });
    setWinner({ seat: mySeat === "player1" ? "player2" : "player1", reason: "You conceded" });
    setPhase("ended");
  }

  function sendChat() {
    if (!chatInput.trim() || !user) return;
    socketRef.current?.emit("game:chat", { roomId, text: chatInput, username: user.username });
    setChatInput("");
  }

  // Record match results to backend exactly once when game ends.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!winner || recordedRef.current || !user) return;
    recordedRef.current = true;
    const myWon = winner.seat === mySeat;
    fetch("/api/matches/record", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        opponentId: opponentIdRef.current,
        opponentName: opponentName || "Unknown",
        result: myWon ? "win" : "loss",
        reason: winner.reason.toLowerCase().includes("concede") ? "concede" : "prizes",
        turnCount: turnNumber,
        durationSec: Math.round((Date.now() - matchStartRef.current) / 1000),
        damageDealt: damageDealtRef.current,
        knockouts: knockoutsRef.current,
      }),
    }).catch(() => {});
  }, [winner, user, mySeat, turnNumber, roomId, opponentName]);

  return (
    <LayoutGroup>
      <div className="fixed inset-0 bg-black text-white overflow-hidden font-mono select-none" data-testid="game-board">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, rgba(255,0,255,0.18), transparent 45%), radial-gradient(circle at 50% 100%, rgba(0,240,255,0.2), transparent 45%)",
          }}
        />
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

        {/* Top HUD */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-50">
          <button
            onClick={concede}
            className="glass-strong rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-fuchsia-300 hover:text-white flex items-center gap-2"
            data-testid="game-leave-btn"
          >
            <Flag className="w-3 h-3" /> Concede
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`glass-strong rounded-full px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 ${
                myTurn ? "text-euryx-cyan border border-euryx-cyan/60" : "text-slate-400"
              }`}
              data-testid="game-turn-indicator"
            >
              <Hourglass className="w-3 h-3" />
              {myTurn ? "YOUR TURN" : "OPPONENT"} · T{turnNumber}
            </div>
            <div className="glass-strong rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-300" data-testid="game-room-id">
              ROOM · {roomId.slice(0, 8)}
            </div>
          </div>

          <div className="glass-strong rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-slate-300 flex items-center gap-2" data-testid="game-opponent-label">
            <Shield className="w-3 h-3 text-euryx-fuchsia" />
            {opponentName || "Waiting…"}
          </div>
        </div>

        {/* Floating msg */}
        <AnimatePresence>
          {floatingMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-full px-5 py-2 text-xs font-heading font-black tracking-[0.2em] text-white border border-euryx-cyan/60"
              data-testid="game-flash"
            >
              {floatingMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* === OPPONENT HALF (rotated 180) === */}
        <div className="absolute top-0 left-0 right-0 h-1/2 px-6 pt-12 pb-2 rotate-180" data-testid="opponent-half">
          <BoardHalf
            side={opp}
            isOpponent
          />
        </div>

        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-euryx-cyan/40 to-transparent z-10" />

        {/* === PLAYER HALF === */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 px-6 pt-2 pb-36" data-testid="player-half">
          <BoardHalf
            side={{ active, bench, discard, deck: deckCount, hand: hand.length, prizes: prize }}
            isOpponent={false}
            onActiveClick={() => attachEnergy("active")}
            onBenchClick={(i) => bench[i] ? attachEnergy("bench", i) : (picking && playToBench(picking.card, i))}
            onDeckClick={drawCard}
          />
        </div>

        {/* Action bar (player) */}
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-30 flex gap-3" data-testid="action-bar">
          <button
            onClick={attack}
            disabled={!myTurn || !active || active.energy < 1 || !opp.active}
            className="btn-neon btn-neon-fuchsia disabled:opacity-30 disabled:cursor-not-allowed py-2 px-4 text-xs"
            data-testid="action-attack-btn"
          >
            <Swords className="w-4 h-4" /> Attack ({active?.attackDamage || 0})
          </button>
          <button
            onClick={endTurn}
            disabled={!myTurn}
            className="btn-neon btn-neon-cyan disabled:opacity-30 disabled:cursor-not-allowed py-2 px-4 text-xs"
            data-testid="action-end-turn-btn"
          >
            End Turn
          </button>
        </div>

        {/* Player Hand */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 pb-2 pt-8" data-testid="player-hand">
          <div className="flex items-end justify-center -space-x-8 hover:-space-x-1 transition-all duration-300">
            <AnimatePresence>
              {hand.map((card, idx) => (
                <motion.div
                  key={card.uid}
                  layout
                  layoutId={card.uid}
                  initial={{ opacity: 0, y: 80 }}
                  animate={{ opacity: 1, y: 0, rotate: (idx - (hand.length - 1) / 2) * 4 }}
                  exit={{ opacity: 0, y: 80 }}
                  whileHover={{ y: -28, rotate: 0, scale: 1.08, zIndex: 40 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={() => setPicking({ card })}
                  className="cursor-pointer"
                >
                  <PokemonCard card={card} variant={card.variant} size="lg" layoutId={card.uid} testId={`hand-card-${card.uid}`} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Place picker */}
        <AnimatePresence>
          {picking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6"
              onClick={() => setPicking(null)}
              data-testid="card-place-modal"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-strong rounded-2xl p-6 w-full max-w-xl"
              >
                <div className="flex items-center gap-3 mb-5">
                  <Swords className="w-5 h-5 text-euryx-cyan" />
                  <h3 className="font-heading font-black text-lg tracking-wider text-white">Play {picking.card.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!!active}
                    onClick={() => playToActive(picking.card)}
                    className="btn-neon btn-neon-cyan w-full disabled:opacity-40"
                    data-testid="play-active-btn"
                  >
                    {active ? "Active Filled" : "→ Active Spot"}
                  </button>
                  <button onClick={() => setPicking(null)} className="btn-neon btn-neon-ghost w-full" data-testid="play-cancel-btn">
                    Cancel
                  </button>
                </div>
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">Or pick a Bench slot:</div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {bench.map((slot, i) => (
                    <button
                      key={i}
                      disabled={!!slot}
                      onClick={() => playToBench(picking.card, i)}
                      className={`h-16 rounded-lg border ${slot ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50" : "border-euryx-cyan/40 bg-euryx-cyan/5 hover:bg-euryx-cyan/15"} flex items-center justify-center font-mono text-xs text-slate-300 transition`}
                      data-testid={`play-bench-${i}-btn`}
                    >
                      B{i + 1}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Win/lose modal */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center px-6"
              data-testid="game-result-modal"
            >
              <motion.div
                initial={{ scale: 0.7, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="text-center"
              >
                <Trophy className={`w-20 h-20 mx-auto mb-4 ${winner.seat === mySeat ? "text-euryx-cyan" : "text-fuchsia-400"}`} />
                <h1 className="font-heading text-7xl font-black tracking-tighter text-white neon-cyan">
                  {winner.seat === mySeat ? "VICTORY" : "DEFEAT"}
                </h1>
                <EloAfterMatch />
                <div className="text-sm font-mono text-slate-400 mt-3 tracking-wider uppercase">{winner.reason}</div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-neon btn-neon-cyan mt-8"
                  data-testid="game-result-return-btn"
                >
                  Return to Lobby
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat */}
        <ChatPanel chat={chat} input={chatInput} setInput={setChatInput} onSend={sendChat} />
      </div>
    </LayoutGroup>
  );
}

// Polls /api/matches once on mount and shows the latest ELO delta — used after winner appears.
function EloAfterMatch() {
  const [delta, setDelta] = useState<number | null>(null);
  const [newElo, setNewElo] = useState<number | null>(null);
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const r = await fetch("/api/matches?limit=1", { credentials: "include" });
        const d = await r.json();
        const m = d?.matches?.[0];
        if (m) { setDelta(m.eloDelta); setNewElo(m.eloAfter); }
      } catch {}
    }, 600);
    return () => clearTimeout(timer);
  }, []);
  if (delta == null) return null;
  return (
    <div className="mt-4 font-mono text-sm" data-testid="game-result-elo">
      <span className={delta >= 0 ? "text-euryx-cyan" : "text-fuchsia-300"}>
        {delta >= 0 ? "+" : ""}{delta} ELO
      </span>
      <span className="text-slate-500 ml-2">→ {newElo}</span>
    </div>
  );
}

// =============================== BoardHalf ===================================

function BoardHalf({
  side, isOpponent, onActiveClick, onBenchClick, onDeckClick,
}: {
  side: Side;
  isOpponent: boolean;
  onActiveClick?: () => void;
  onBenchClick?: (i: number) => void;
  onDeckClick?: () => void;
}) {
  const prefix = isOpponent ? "opp" : "player";
  return (
    <div className="relative w-full h-full">
      {/* Prize cards */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5" data-testid={`${prefix}-prize-stack`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-1">Prize · {side.prizes}</div>
        {Array.from({ length: side.prizes }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="w-10 h-14 rounded-md border border-euryx-fuchsia/40 bg-gradient-to-br from-fuchsia-950 to-black"
            style={{ boxShadow: "0 0 12px rgba(255,0,255,0.25)" }}
          />
        ))}
      </div>

      {/* Active */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" data-testid={`${prefix}-active-spot`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-euryx-cyan mb-1.5 neon-cyan">ACTIVE</div>
        <div
          onClick={onActiveClick}
          className={`relative w-36 h-48 rounded-xl border-2 ${side.active ? "border-euryx-cyan/70" : "border-dashed border-white/15"} bg-slate-950/40 backdrop-blur-sm flex items-center justify-center`}
          style={side.active ? { boxShadow: "0 0 30px rgba(0,240,255,0.4)" } : undefined}
        >
          {side.active ? <BoardCard card={side.active} size="lg" testId={`${prefix}-active-card`} /> : <span className="text-[10px] font-mono text-slate-500 tracking-[0.3em]">EMPTY</span>}
        </div>
      </div>

      {/* Bench */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2.5" data-testid={`${prefix}-bench`}>
        {side.bench.map((slot, i) => (
          <div
            key={i}
            onClick={() => onBenchClick && onBenchClick(i)}
            className={`relative w-24 h-32 rounded-lg border ${slot ? "border-white/15" : "border-dashed border-white/10"} bg-slate-950/40 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:border-euryx-cyan/50 transition`}
            data-testid={`${prefix}-bench-${i}`}
          >
            {slot ? <BoardCard card={slot} size="md" testId={`${prefix}-bench-card-${i}`} /> : <span className="text-[9px] font-mono text-slate-600 tracking-widest">B{i + 1}</span>}
          </div>
        ))}
      </div>

      {/* Deck */}
      <div className="absolute right-2 bottom-2 flex flex-col items-center" data-testid={`${prefix}-deck`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-1">DECK · {side.deck}</div>
        <div onClick={onDeckClick} className="w-16 h-22 relative cursor-pointer" style={{ height: 88 }}>
          <div className="absolute inset-0 rounded-md border border-euryx-cyan/40 bg-gradient-to-br from-cyan-950 to-black" style={{ transform: "translate(-3px,-3px)" }} />
          <div className="absolute inset-0 rounded-md border border-euryx-cyan/40 bg-gradient-to-br from-cyan-950 to-black" style={{ transform: "translate(-1px,-1px)" }} />
          <div className="absolute inset-0 rounded-md border border-euryx-cyan/60 bg-gradient-to-br from-cyan-950 to-black flex items-center justify-center" style={{ boxShadow: "0 0 16px rgba(0,240,255,0.35)" }}>
            <Layers className="w-5 h-5 text-euryx-cyan" />
          </div>
        </div>
      </div>

      {/* Discard */}
      <div className="absolute right-24 bottom-2 flex flex-col items-center" data-testid={`${prefix}-discard`}>
        <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-slate-500 mb-1">DISCARD · {side.discard.length}</div>
        <div className="w-16 h-22 rounded-md border border-fuchsia-500/30 bg-fuchsia-950/30 flex items-center justify-center" style={{ height: 88 }}>
          {side.discard.length > 0 ? <PokemonCard card={side.discard[side.discard.length - 1]} size="sm" showVariantBadge={false} /> : <Trash2 className="w-4 h-4 text-fuchsia-300/60" />}
        </div>
      </div>

      <div className="absolute top-1 right-2 text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400">
        {isOpponent ? "OPP" : "YOU"} · HAND {side.hand}
      </div>

      {isOpponent && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[140%] flex -space-x-6" data-testid="opp-hand">
          {Array.from({ length: Math.min(side.hand, 7) }).map((_, i) => (
            <div key={i} className="w-12 h-16 rounded-md border border-euryx-fuchsia/40 bg-gradient-to-br from-fuchsia-950 to-black" style={{ boxShadow: "0 0 10px rgba(255,0,255,0.2)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================ Board card with HP/energy =====================

function BoardCard({ card, size, testId }: { card: PlayedCard; size: "md" | "lg"; testId?: string }) {
  const hpPct = (card.hp / card.maxHp) * 100;
  return (
    <div className="relative" data-testid={testId}>
      <PokemonCard card={card} variant={card.variant} size={size} layoutId={card.uid} showVariantBadge={false} />
      {/* HP bar */}
      <div className="absolute -top-2 left-1 right-1 z-20">
        <div className="h-1.5 rounded-full bg-black/70 border border-white/20 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${hpPct}%`,
              background: hpPct > 50 ? "linear-gradient(90deg, #00f0ff, #ffffff)" : hpPct > 20 ? "linear-gradient(90deg, #fbbf24, #f59e0b)" : "linear-gradient(90deg, #ef4444, #ff00ff)",
              boxShadow: `0 0 8px ${hpPct > 20 ? "rgba(0,240,255,0.6)" : "rgba(239,68,68,0.6)"}`,
            }}
          />
        </div>
        <div className="text-[8px] font-mono text-white text-center mt-0.5 tabular-nums tracking-wider">
          {card.hp}/{card.maxHp}
        </div>
      </div>
      {/* Energy badge */}
      {card.energy > 0 && (
        <div className="absolute -bottom-1 -right-1 z-20 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-300/60">
          <Zap className="w-2.5 h-2.5 text-amber-300" />
          <span className="text-[9px] font-mono font-bold text-amber-200">{card.energy}</span>
        </div>
      )}
    </div>
  );
}

// ============================= Chat panel ====================================

function ChatPanel({ chat, input, setInput, onSend }: { chat: any[]; input: string; setInput: (s: string) => void; onSend: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-1/2 right-3 -translate-y-1/2 z-40 flex flex-col items-end gap-2">
      <button onClick={() => setOpen((v) => !v)} className="glass-strong rounded-full p-2.5 hover:bg-white/10 transition relative" data-testid="chat-toggle-btn">
        <MessageSquare className="w-4 h-4 text-euryx-cyan" />
        {chat.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-euryx-fuchsia text-white text-[9px] font-bold flex items-center justify-center">{chat.length}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-strong rounded-xl w-72 h-80 flex flex-col p-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-2">Match Chat</div>
            <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
              {chat.length === 0 && <div className="text-slate-600 font-mono text-[11px]">No messages.</div>}
              {chat.map((m, i) => (
                <div key={i} className="bg-slate-950/60 rounded-md px-2 py-1.5">
                  <span className="text-euryx-cyan text-[10px] uppercase tracking-wider">{m.username}</span>
                  <div className="text-slate-200">{m.text}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend()} className="input-euryx text-xs flex-1 py-2" placeholder="gg" data-testid="chat-input" />
              <button onClick={onSend} className="btn-neon btn-neon-cyan py-2 px-3" data-testid="chat-send-btn"><Send className="w-3 h-3" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
