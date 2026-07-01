import { create } from 'zustand';

export type DeckCard = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  cmc?: number;
  count: number;
  maxAvailable: number;
  apiPayload?: any;
};

type DeckStore = {
  activeGame: string;
  setActiveGame: (game: string) => void;

  deckName: string;
  setDeckName: (name: string) => void;
  deckFormat: string;
  setDeckFormat: (format: string) => void;

  mainDeck: DeckCard[];
  sideboard: DeckCard[];

  addCardToMain: (card: DeckCard) => void;
  removeCardFromMain: (id: string) => void;
  
  addCardToSideboard: (card: DeckCard) => void;
  removeCardFromSideboard: (id: string) => void;

  setInitialDeck: (main: DeckCard[], side: DeckCard[], name: string, format: string, game: string) => void;
};

export const useDeckStore = create<DeckStore>((set) => ({
  activeGame: 'MAGIC',
  setActiveGame: (game) => set({ activeGame: game }),
  
  deckName: 'New Deck',
  setDeckName: (name) => set({ deckName: name }),
  deckFormat: 'Standard',
  setDeckFormat: (format) => set({ deckFormat: format }),

  mainDeck: [],
  sideboard: [],

  addCardToMain: (card) => set((state) => {
    const existing = state.mainDeck.find(c => c.id === card.id);
    if (existing) {
      return { mainDeck: state.mainDeck.map(c => c.id === card.id ? { ...c, count: c.count + 1 } : c) };
    }
    return { mainDeck: [...state.mainDeck, { ...card, count: 1 }] };
  }),

  removeCardFromMain: (id) => set((state) => {
    const existing = state.mainDeck.find(c => c.id === id);
    if (existing && existing.count > 1) {
      return { mainDeck: state.mainDeck.map(c => c.id === id ? { ...c, count: c.count - 1 } : c) };
    }
    return { mainDeck: state.mainDeck.filter(c => c.id !== id) };
  }),

  addCardToSideboard: (card) => set((state) => {
    const existing = state.sideboard.find(c => c.id === card.id);
    if (existing) {
      return { sideboard: state.sideboard.map(c => c.id === card.id ? { ...c, count: c.count + 1 } : c) };
    }
    return { sideboard: [...state.sideboard, { ...card, count: 1 }] };
  }),

  removeCardFromSideboard: (id) => set((state) => {
    const existing = state.sideboard.find(c => c.id === id);
    if (existing && existing.count > 1) {
      return { sideboard: state.sideboard.map(c => c.id === id ? { ...c, count: c.count - 1 } : c) };
    }
    return { sideboard: state.sideboard.filter(c => c.id !== id) };
  }),

  setInitialDeck: (main, side, name, format, game) => set({
    mainDeck: main,
    sideboard: side,
    deckName: name,
    deckFormat: format,
    activeGame: game
  })
}));
