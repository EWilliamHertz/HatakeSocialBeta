"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Sparkles } from "lucide-react";
import { PokemonCard, EuryxCard } from "./PokemonCard";

type Props = {
  card: EuryxCard | null;
  onClose: () => void;
  onAdd: (card: EuryxCard, variantSuffix: string) => void;
};

export function VariantModal({ card, onClose, onAdd }: Props) {
  return (
    <AnimatePresence>
      {card && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
          data-testid="variant-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl glass-strong rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 0 60px rgba(255, 0, 255, 0.18), 0 0 100px rgba(0, 240, 255, 0.12)",
              border: "1px solid rgba(255, 0, 255, 0.3)",
            }}
            data-testid="variant-modal"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-euryx-fuchsia neon-fuchsia" />
                <h3 className="font-heading font-black text-lg tracking-[0.18em] text-white">
                  SELECT PRINTING
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition"
                data-testid="variant-modal-close-btn"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Preview */}
              <div className="flex flex-col items-center justify-center">
                <PokemonCard card={card} size="xl" showVariantBadge={false} testId="variant-modal-preview-card" />
                <div className="mt-4 text-center">
                  <h4 className="font-heading text-xl text-white font-bold">{card.name}</h4>
                  <div className="text-xs font-mono text-slate-400 tracking-wider mt-1">
                    {card.setCode || "—"} {card.number && `· #${card.number}`}
                  </div>
                  {card.cardType && (
                    <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-euryx-cyan/80 mt-2">
                      {card.cardType}
                    </div>
                  )}
                  {card.price != null && (
                    <div className="text-xs font-mono text-slate-300 mt-2">
                      Base · ${card.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Variant List */}
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-400 mb-2">
                  Available Printings
                </div>
                {(card.variants || []).map((v, idx) => {
                  const adjusted = (card.price ?? 0) * v.priceMultiplier;
                  return (
                    <motion.button
                      key={v.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      onClick={() => onAdd(card, v.suffix)}
                      data-testid={`variant-modal-option-${v.suffix.toLowerCase()}`}
                      className="w-full text-left p-4 rounded-xl bg-slate-950/60 border border-white/10 hover:border-euryx-cyan/60 hover:bg-euryx-cyan/5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider " +
                                (v.suffix === "JP"
                                  ? "bg-euryx-fuchsia/80 text-white"
                                  : v.suffix === "CN"
                                  ? "bg-red-500/80 text-white"
                                  : v.suffix === "RH"
                                  ? "bg-gradient-to-r from-euryx-cyan to-euryx-fuchsia text-white"
                                  : "bg-black/70 text-euryx-cyan border border-euryx-cyan/40")
                              }
                            >
                              {v.suffix}
                            </span>
                            <span className="text-white font-mono text-sm">{v.label}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Est. ${adjusted.toFixed(2)}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-euryx-cyan opacity-60 group-hover:opacity-100 transition" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
