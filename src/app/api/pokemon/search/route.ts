import { NextRequest, NextResponse } from "next/server";

const HATAKE_BASE = process.env.HATAKE_API_BASE || "https://www.hatake.social/api/v1";
const HATAKE_KEY = process.env.HATAKE_API_KEY || "";

// Offline fallback dataset — used when Hatake upstream is 5xx so the deckbuilder
// and game engine remain fully playable. Real Pokémon TCG card images are sourced
// from pokemontcg.io public CDN (free, no auth required).
type FallbackEntry = {
  id: string;
  apiId: string;
  name: string;
  imageUrl: string;
  setCode: string;
  rarity?: string;
  price?: number;
  number?: string;
  cardType?: string;
};
const FALLBACK: FallbackEntry[] = [
  { id: "fb-charizard-ex", apiId: "p-charizard-ex", name: "Charizard ex", imageUrl: "https://images.pokemontcg.io/sv3pt5/199.png", setCode: "MEW", rarity: "Hyper Rare", price: 280, number: "199/165", cardType: "Pokémon ex" },
  { id: "fb-charizard-base", apiId: "p-charizard-base", name: "Charizard", imageUrl: "https://images.pokemontcg.io/base1/4.png", setCode: "BS", rarity: "Holo Rare", price: 450, number: "4/102", cardType: "Pokémon" },
  { id: "fb-pikachu", apiId: "p-pikachu", name: "Pikachu", imageUrl: "https://images.pokemontcg.io/base1/58.png", setCode: "BS", rarity: "Common", price: 12, number: "58/102", cardType: "Pokémon" },
  { id: "fb-pikachu-vmax", apiId: "p-pikachu-vmax", name: "Pikachu VMAX", imageUrl: "https://images.pokemontcg.io/swsh4/44.png", setCode: "VIV", rarity: "VMAX", price: 95, number: "44/185", cardType: "Pokémon VMAX" },
  { id: "fb-mewtwo", apiId: "p-mewtwo", name: "Mewtwo", imageUrl: "https://images.pokemontcg.io/base1/10.png", setCode: "BS", rarity: "Holo Rare", price: 80, number: "10/102", cardType: "Pokémon" },
  { id: "fb-mewtwo-ex", apiId: "p-mewtwo-ex", name: "Mewtwo ex", imageUrl: "https://images.pokemontcg.io/sv3pt5/150.png", setCode: "MEW", rarity: "Ultra Rare", price: 65, number: "150/165", cardType: "Pokémon ex" },
  { id: "fb-bulbasaur", apiId: "p-bulbasaur", name: "Bulbasaur", imageUrl: "https://images.pokemontcg.io/base1/44.png", setCode: "BS", rarity: "Common", price: 8, number: "44/102", cardType: "Pokémon" },
  { id: "fb-blastoise", apiId: "p-blastoise", name: "Blastoise", imageUrl: "https://images.pokemontcg.io/base1/2.png", setCode: "BS", rarity: "Holo Rare", price: 220, number: "2/102", cardType: "Pokémon" },
  { id: "fb-venusaur", apiId: "p-venusaur", name: "Venusaur", imageUrl: "https://images.pokemontcg.io/base1/15.png", setCode: "BS", rarity: "Holo Rare", price: 180, number: "15/102", cardType: "Pokémon" },
  { id: "fb-snorlax", apiId: "p-snorlax", name: "Snorlax", imageUrl: "https://images.pokemontcg.io/jungle/11.png", setCode: "JU", rarity: "Holo Rare", price: 45, number: "11/64", cardType: "Pokémon" },
  { id: "fb-gengar", apiId: "p-gengar", name: "Gengar VMAX", imageUrl: "https://images.pokemontcg.io/swsh8/157.png", setCode: "FST", rarity: "VMAX", price: 110, number: "157/264", cardType: "Pokémon VMAX" },
  { id: "fb-eevee", apiId: "p-eevee", name: "Eevee", imageUrl: "https://images.pokemontcg.io/swsh45/29.png", setCode: "SHF", rarity: "Common", price: 6, number: "29/72", cardType: "Pokémon" },
  { id: "fb-lucario", apiId: "p-lucario", name: "Lucario V", imageUrl: "https://images.pokemontcg.io/swsh10/78.png", setCode: "AST", rarity: "Ultra Rare", price: 35, number: "78/189", cardType: "Pokémon V" },
  { id: "fb-garchomp", apiId: "p-garchomp", name: "Garchomp V", imageUrl: "https://images.pokemontcg.io/swsh11/91.png", setCode: "LOR", rarity: "Ultra Rare", price: 28, number: "91/196", cardType: "Pokémon V" },
  { id: "fb-greninja", apiId: "p-greninja", name: "Greninja ex", imageUrl: "https://images.pokemontcg.io/sv1/106.png", setCode: "SVI", rarity: "Ultra Rare", price: 42, number: "106/198", cardType: "Pokémon ex" },
  { id: "fb-rayquaza", apiId: "p-rayquaza", name: "Rayquaza VMAX", imageUrl: "https://images.pokemontcg.io/swsh7/111.png", setCode: "EVS", rarity: "VMAX", price: 130, number: "111/203", cardType: "Pokémon VMAX" },
  { id: "fb-mew", apiId: "p-mew", name: "Mew ex", imageUrl: "https://images.pokemontcg.io/sv3pt5/151.png", setCode: "MEW", rarity: "Ultra Rare", price: 70, number: "151/165", cardType: "Pokémon ex" },
  { id: "fb-arceus", apiId: "p-arceus", name: "Arceus VSTAR", imageUrl: "https://images.pokemontcg.io/swsh9/123.png", setCode: "BRS", rarity: "VSTAR", price: 90, number: "123/172", cardType: "Pokémon VSTAR" },
  { id: "fb-zekrom", apiId: "p-zekrom", name: "Zekrom", imageUrl: "https://images.pokemontcg.io/bw1/47.png", setCode: "BLW", rarity: "Holo Rare", price: 22, number: "47/114", cardType: "Pokémon" },
  { id: "fb-reshiram", apiId: "p-reshiram", name: "Reshiram", imageUrl: "https://images.pokemontcg.io/bw1/26.png", setCode: "BLW", rarity: "Holo Rare", price: 24, number: "26/114", cardType: "Pokémon" },
  { id: "fb-umbreon", apiId: "p-umbreon", name: "Umbreon VMAX", imageUrl: "https://images.pokemontcg.io/swsh7/95.png", setCode: "EVS", rarity: "Alt Art VMAX", price: 480, number: "95/203", cardType: "Pokémon VMAX" },
  { id: "fb-sylveon", apiId: "p-sylveon", name: "Sylveon VMAX", imageUrl: "https://images.pokemontcg.io/swsh7/75.png", setCode: "EVS", rarity: "VMAX", price: 30, number: "75/203", cardType: "Pokémon VMAX" },
  { id: "fb-glaceon", apiId: "p-glaceon", name: "Glaceon VMAX", imageUrl: "https://images.pokemontcg.io/swsh7/41.png", setCode: "EVS", rarity: "VMAX", price: 32, number: "41/203", cardType: "Pokémon VMAX" },
  { id: "fb-leafeon", apiId: "p-leafeon", name: "Leafeon VMAX", imageUrl: "https://images.pokemontcg.io/swsh7/9.png", setCode: "EVS", rarity: "VMAX", price: 28, number: "9/203", cardType: "Pokémon VMAX" },
];

function buildVariants(baseId: string, price?: number) {
  return [
    { id: `${baseId}-en`, label: "English (Standard)", suffix: "EN", priceMultiplier: 1 },
    { id: `${baseId}-jp`, label: "Japanese Printing", suffix: "JP", priceMultiplier: 1.35 },
    { id: `${baseId}-cn`, label: "Simplified Chinese", suffix: "CN", priceMultiplier: 0.85 },
    { id: `${baseId}-rev`, label: "Reverse Holo", suffix: "RH", priceMultiplier: 1.8 },
  ];
}

function normalizeHatake(data: any) {
  return (data.data || []).map((c: any) => {
    const extended: any[] = c?.apiPayload?.extendedData || [];
    const number = extended.find((e) => e.name === "Number")?.value;
    const cardType = extended.find((e) => e.name === "Card Type")?.value;
    const cardText = extended.find((e) => e.name === "CardText")?.value;
    return {
      id: c.id,
      apiId: c.apiId,
      name: c.name,
      imageUrl: c.imageUrl,
      setCode: c.setCode,
      rarity: c.rarity || extended.find((e) => e.name === "Rarity")?.value || null,
      price: c.price,
      number,
      cardType,
      cardText,
      variants: buildVariants(c.id, c.price),
    };
  });
}

function filterFallback(search: string, limit: number) {
  const q = (search || "").toLowerCase().trim();
  const matched = q
    ? FALLBACK.filter((c) => c.name.toLowerCase().includes(q))
    : FALLBACK.slice();
  return matched.slice(0, limit).map((c) => ({
    ...c,
    rarity: c.rarity ?? null,
    cardText: undefined,
    variants: buildVariants(c.id, c.price),
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  if (!HATAKE_KEY) {
    const cards = filterFallback(search, limit);
    return NextResponse.json({ count: cards.length, cards, source: "fallback:no-key" });
  }

  const url = `${HATAKE_BASE}/pokemon/cards?search=${encodeURIComponent(search)}&limit=${encodeURIComponent(String(limit))}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${HATAKE_KEY}`, Accept: "application/json" },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      const cards = normalizeHatake(data);
      return NextResponse.json({ count: data.count ?? cards.length, cards, source: "hatake" });
    }
    // Hatake unavailable -> graceful fallback
    const cards = filterFallback(search, limit);
    return NextResponse.json({
      count: cards.length,
      cards,
      source: `fallback:hatake-${res.status}`,
    });
  } catch (e: any) {
    const cards = filterFallback(search, limit);
    return NextResponse.json({
      count: cards.length,
      cards,
      source: "fallback:fetch-error",
      detail: e?.message || String(e),
    });
  }
}
