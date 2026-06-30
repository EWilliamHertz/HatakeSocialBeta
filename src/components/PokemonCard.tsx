"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type EuryxCard = {
  id: string;
  apiId: string;
  name: string;
  imageUrl?: string;
  setCode?: string;
  rarity?: string | null;
  price?: number;
  number?: string;
  cardType?: string;
  cardText?: string;
  variant?: string; // selected variant suffix e.g. EN/JP/CN/RH
  variants?: Array<{ id: string; label: string; suffix: string; priceMultiplier: number }>;
};

type Props = {
  card: EuryxCard;
  size?: "sm" | "md" | "lg" | "xl";
  layoutId?: string;
  onClick?: () => void;
  variant?: string;
  showVariantBadge?: boolean;
  faceDown?: boolean;
  rotated?: boolean;
  testId?: string;
  className?: string;
};

const SIZE_MAP: Record<string, string> = {
  sm: "w-16 h-22",
  md: "w-24 h-32",
  lg: "w-32 h-44",
  xl: "w-44 h-60",
};

export function PokemonCard({
  card,
  size = "md",
  layoutId,
  onClick,
  variant,
  showVariantBadge = true,
  faceDown = false,
  rotated = false,
  testId,
  className,
}: Props) {
  const sizeCls = SIZE_MAP[size] || SIZE_MAP.md;
  const vSuffix = variant || card.variant || "EN";

  return (
    <motion.div
      layoutId={layoutId}
      onClick={onClick}
      whileHover={onClick ? { y: -8, scale: 1.04, zIndex: 30 } : undefined}
      whileTap={onClick ? { scale: 0.96 } : undefined}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      data-testid={testId}
      className={cn(
        sizeCls,
        "relative rounded-lg overflow-hidden cursor-pointer shrink-0 card-sheen",
        "border border-white/10 bg-slate-950",
        "shadow-[0_0_18px_rgba(0,240,255,0.08)] hover:shadow-[0_0_28px_rgba(0,240,255,0.45)] hover:border-euryx-cyan/60",
        rotated && "rotate-180",
        className
      )}
      style={{ transformStyle: "preserve-3d" }}
    >
      {faceDown ? (
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950 via-black to-cyan-950 flex items-center justify-center">
          <div className="w-full h-full opacity-60 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 30%, rgba(0,240,255,0.6), transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,0,255,0.5), transparent 50%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-heading text-white font-black tracking-[0.4em] text-xs neon-cyan">
              EURYX
            </div>
          </div>
        </div>
      ) : card.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.imageUrl}
          alt={card.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center px-2">
          <span className="text-[10px] font-mono text-slate-300 text-center">{card.name}</span>
        </div>
      )}

      {!faceDown && showVariantBadge && (
        <div className="absolute top-1 right-1 z-10">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider",
              vSuffix === "JP" && "bg-euryx-fuchsia/80 text-white",
              vSuffix === "CN" && "bg-red-500/80 text-white",
              vSuffix === "RH" && "bg-gradient-to-r from-euryx-cyan to-euryx-fuchsia text-white",
              vSuffix === "EN" && "bg-black/70 text-euryx-cyan border border-euryx-cyan/40"
            )}
          >
            {vSuffix}
          </span>
        </div>
      )}

      {!faceDown && size !== "sm" && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-1.5 z-10">
          <div className="text-[10px] font-mono font-semibold text-white truncate" title={card.name}>
            {card.name}
          </div>
          <div className="text-[8px] font-mono text-slate-400 truncate">
            {card.setCode || "—"} {card.number && `· ${card.number}`}
          </div>
        </div>
      )}
    </motion.div>
  );
}
