"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Search, Loader2, Trash2, BookOpenCheck, Save } from "lucide-react";
import { PokemonCard, EuryxCard } from "@/components/PokemonCard";
import { VariantModal } from "@/components/VariantModal";

type DeckEntry = EuryxCard & { uid: string; variant: string };

export default function DeckBuilderPage() {
  const [query, setQuery] = useState("charizard");
  const [results, setResults] = useState<EuryxCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EuryxCard | null>(null);
  const [deck, setDeck] = useState<DeckEntry[]>([]);
  const [deckName, setDeckName] = useState("Untitled Deck");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function doSearch(q: string) {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/pokemon/search?search=${encodeURIComponent(q)}&limit=40`);
      const data = await res.json();
      setResults(data.cards || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function addCard(card: EuryxCard, variant: string) {
    if (deck.length >= 60) {
      setSavedMsg("Deck is at 60-card maximum.");
      setTimeout(() => setSavedMsg(null), 2200);
      return;
    }
    setDeck((d) => [
      ...d,
      { ...card, variant, uid: `${card.id}-${variant}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    ]);
    setSelected(null);
  }

  function removeCard(uid: string) {
    setDeck((d) => d.filter((c) => c.uid !== uid));
  }

  async function saveDeck() {
    setSavedMsg(null);
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deckName,
          cards: deck.map((c) => ({
            apiId: c.apiId,
            name: c.name,
            imageUrl: c.imageUrl,
            setCode: c.setCode,
            variant: c.variant,
            quantity: 1,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSavedMsg(`Saved "${data.deck.name}" · ${data.deck.cards.length} cards`);
    } catch (e: any) {
      setSavedMsg(`Save failed: ${e.message}. Sign in first.`);
    }
    setTimeout(() => setSavedMsg(null), 3500);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, { card: DeckEntry; count: number }>();
    for (const c of deck) {
      const key = `${c.id}-${c.variant}`;
      if (map.has(key)) map.get(key)!.count++;
      else map.set(key, { card: c, count: 1 });
    }
    return Array.from(map.values());
  }, [deck]);

  return (
    <LayoutGroup>
      <div className="min-h-screen pt-28 px-6 pb-16 max-w-[1500px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-slate-500">
              Vault · Deck Forge
            </div>
            <h1 className="font-heading text-4xl font-black tracking-tight text-white mt-1" data-testid="deck-builder-title">
              Deck Builder
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="input-euryx w-56"
              placeholder="Deck name"
              data-testid="deck-name-input"
            />
            <button onClick={saveDeck} className="btn-neon btn-neon-fuchsia" data-testid="deck-save-btn">
              <Save className="w-4 h-4" />
              Save Deck
            </button>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-4 text-xs font-mono text-euryx-cyan glass rounded-lg px-4 py-2 inline-flex" data-testid="deck-save-msg">
            {savedMsg}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Active deck (left) */}
          <div className="col-span-12 lg:col-span-7 glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <BookOpenCheck className="w-5 h-5 text-euryx-cyan" />
                <h2 className="font-heading font-bold text-white tracking-wide">Active Deck</h2>
              </div>
              <div className="flex items-center gap-3" data-testid="deck-counter">
                <div className="font-mono text-xs text-slate-400 tracking-wider">CARDS</div>
                <div className={`font-heading text-2xl font-black ${deck.length === 60 ? "text-euryx-cyan neon-cyan" : "text-white"}`}>
                  {deck.length}
                  <span className="text-slate-500 text-base"> / 60</span>
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-900 overflow-hidden mb-5">
              <div
                className="h-full bg-gradient-to-r from-euryx-cyan to-euryx-fuchsia transition-all duration-300"
                style={{ width: `${Math.min(100, (deck.length / 60) * 100)}%` }}
              />
            </div>

            {deck.length === 0 ? (
              <div className="py-20 text-center font-mono text-sm text-slate-500" data-testid="deck-empty-state">
                Empty deck. Search a card on the right and pick a printing.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3" data-testid="deck-grid">
                <AnimatePresence>
                  {grouped.map(({ card, count }) => (
                    <motion.div
                      key={`${card.id}-${card.variant}`}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="relative"
                    >
                      <PokemonCard card={card} variant={card.variant} size="md" testId={`deck-card-${card.id}-${card.variant}`} />
                      {count > 1 && (
                        <div className="absolute -top-2 -left-2 z-20 w-7 h-7 rounded-full bg-euryx-fuchsia text-white font-heading font-black text-xs flex items-center justify-center border border-white/30 shadow-[0_0_15px_rgba(255,0,255,0.6)]">
                          ×{count}
                        </div>
                      )}
                      <button
                        onClick={() => removeCard(card.uid)}
                        className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-slate-900 border border-white/10 text-fuchsia-300 hover:bg-fuchsia-900/60 transition flex items-center justify-center opacity-0 group-hover:opacity-100"
                        data-testid={`deck-remove-${card.uid}`}
                        aria-label="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Search (right) */}
          <div className="col-span-12 lg:col-span-5 glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-euryx-fuchsia" />
              <h2 className="font-heading font-bold text-white tracking-wide">Search Vault</h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-euryx-cyan ml-auto" />}
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-euryx"
              placeholder="charizard, mewtwo, full art..."
              data-testid="deckbuilder-search-input"
            />

            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500 mt-4 mb-2">
              {results.length} results
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2">
              <AnimatePresence>
                {results.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <PokemonCard
                      card={c}
                      size="md"
                      onClick={() => setSelected(c)}
                      testId={`search-result-${c.id}`}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {!loading && results.length === 0 && (
                <div className="col-span-3 py-12 text-center text-xs font-mono text-slate-500">
                  No results.
                </div>
              )}
            </div>
          </div>
        </div>

        <VariantModal card={selected} onClose={() => setSelected(null)} onAdd={addCard} />
      </div>
    </LayoutGroup>
  );
}
