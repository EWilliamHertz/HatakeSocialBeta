// LegalityEngine.ts

export type LegalityResult = {
  isValid: boolean;
  errors: string[];
};

export class LegalityEngine {
  
  static validate(game: string, format: string, mainDeck: any[], sideboard: any[] = []): LegalityResult {
    switch (game) {
      case 'MAGIC':
        return this.validateMTG(mainDeck, sideboard, format);
      case 'POKEMON':
        return this.validatePokemon(mainDeck, format);
      case 'ONE_PIECE':
        return this.validateOnePiece(mainDeck, format);
      case 'LORCANA':
        return this.validateLorcana(mainDeck, format);
      case 'RIFTBOUND':
        return this.validateRiftbound(mainDeck, sideboard);
      case 'NARUTO':
        return this.validateNaruto(mainDeck);
      default:
        return { isValid: true, errors: [] };
    }
  }

  static validateMTG(mainDeck: any[], sideboard: any[], format: string): LegalityResult {
    const errors: string[] = [];
    const mainCount = mainDeck.reduce((sum, c) => sum + c.count, 0);
    const sideCount = sideboard.reduce((sum, c) => sum + c.count, 0);

    const isCommander = format === 'Brawl' || format === 'Commander';

    if (isCommander) {
      if (mainCount !== 100) errors.push(`Commander deck must be exactly 100 cards (currently ${mainCount}).`);
      if (sideCount > 0) errors.push('Commander decks cannot have a sideboard.');
      
      const counts = this.getCounts(mainDeck, sideboard);
      for (const [name, count] of Object.entries(counts)) {
        if (!['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(name) && count > 1) {
          errors.push(`Maximum 1 copy per card in Commander. Found ${count} of ${name}.`);
        }
      }

      const banned = ["Force of Will", "Subtlety", "Wash Away", "Ugin's Labyrinth", "Time Warp", "Temporal Manipulation"];
      for (const card of mainDeck) {
        if (banned.includes(card.name)) errors.push(`${card.name} is banned in Commander/Brawl.`);
      }
    } else {
      if (mainCount < 60) errors.push(`Main deck must be at least 60 cards (currently ${mainCount}).`);
      if (sideCount > 15) errors.push(`Sideboard cannot exceed 15 cards (currently ${sideCount}).`);
      
      const counts = this.getCounts(mainDeck, sideboard);
      for (const [name, count] of Object.entries(counts)) {
        if (!['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes', 'Relentless Rats', 'Shadowborn Apostle'].includes(name) && count > 4) {
          errors.push(`Maximum 4 copies per card. Found ${count} of ${name}.`);
        }
      }

      if (format === 'Legacy') {
        const banned = ["Candelabra of Tawnos", "Undercity Informer"];
        for (const card of [...mainDeck, ...sideboard]) {
          if (banned.includes(card.name)) errors.push(`${card.name} is banned in Legacy.`);
        }
      } else if (format === 'Modern') {
        const banned = ["Phlage, Titan of Fire's Fury", "Lotus Field"];
        for (const card of [...mainDeck, ...sideboard]) {
          if (banned.includes(card.name)) errors.push(`${card.name} is banned in Modern.`);
        }
      } else if (format === 'Pauper') {
        const banned = ["Seeker of Skybreak"];
        for (const card of [...mainDeck, ...sideboard]) {
          if (banned.includes(card.name)) errors.push(`${card.name} is banned in Pauper.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validatePokemon(mainDeck: any[], format: string): LegalityResult {
    const errors: string[] = [];
    const mainCount = mainDeck.reduce((sum, c) => sum + c.count, 0);

    if (mainCount !== 60) errors.push(`Deck must be exactly 60 cards (currently ${mainCount}).`);

    const counts = this.getCounts(mainDeck, []);
    for (const [name, count] of Object.entries(counts)) {
      if (!name.includes('Basic Energy') && count > 4) {
        errors.push(`Maximum 4 copies per card (excluding Basic Energy). Found ${count} of ${name}.`);
      }
    }

    if (format === 'Standard') {
      for (const card of mainDeck) {
        const regMark = card.apiPayload?.regulationMark;
        if (regMark && ['F', 'G'].includes(regMark.toUpperCase())) {
          errors.push(`${card.name} (Regulation ${regMark}) has rotated out of Standard.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateOnePiece(mainDeck: any[], format: string): LegalityResult {
    const errors: string[] = [];
    
    let leaders = 0;
    let don = 0;
    let deckCards = 0;

    for (const card of mainDeck) {
      if (card.apiPayload?.type === 'Leader' || card.name.includes("Leader")) leaders += card.count;
      else if (card.apiPayload?.type === 'DON!!' || card.name.includes("DON!!")) don += card.count;
      else deckCards += card.count;

      if (card.name === 'Charlotte Pudding') {
        errors.push(`Charlotte Pudding is globally banned.`);
      }

      if (format === 'Standard') {
        const block = card.apiPayload?.blockIcon;
        const whitelisted = ["Jewelry Bonney", "Gum-Gum Jet Gatling", "Bad Manners Kick Course"];
        const isEvergreen = card.apiPayload?.rarity === "Super Parallel" || card.apiPayload?.rarity === "Manga Rare";
        
        if (block === 1 && !whitelisted.includes(card.name) && !isEvergreen) {
          errors.push(`${card.name} is Block 1 and has rotated out of Standard.`);
        }
      }
    }

    if (leaders !== 1) errors.push(`Deck must have exactly 1 Leader (currently ${leaders}).`);
    if (don !== 10) errors.push(`Deck must have exactly 10 DON!! cards (currently ${don}).`);
    if (deckCards !== 50) errors.push(`Main deck must have exactly 50 cards (currently ${deckCards}).`);

    const counts = this.getCounts(mainDeck, []);
    for (const [name, count] of Object.entries(counts)) {
      if (count > 4 && !name.includes("DON!!")) {
        errors.push(`Maximum 4 copies per card. Found ${count} of ${name}.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateLorcana(mainDeck: any[], format: string): LegalityResult {
    const errors: string[] = [];
    const mainCount = mainDeck.reduce((sum, c) => sum + c.count, 0);

    if (mainCount < 60) errors.push(`Deck must be at least 60 cards (currently ${mainCount}).`);

    const counts = this.getCounts(mainDeck, []);
    for (const [name, count] of Object.entries(counts)) {
      if (count > 4) errors.push(`Maximum 4 copies per card. Found ${count} of ${name}.`);
    }

    const inks = new Set<string>();
    for (const card of mainDeck) {
      if (card.apiPayload?.ink) inks.add(card.apiPayload.ink);
      
      const banned = ["Hiram Flaversham - Toymaker", "Fortisphere"];
      if (banned.includes(card.name)) {
        errors.push(`${card.name} is globally banned.`);
      }
    }

    if (inks.size > 2) {
      errors.push(`Deck cannot contain more than 2 Ink colors (found ${Array.from(inks).join(', ')}).`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateRiftbound(mainDeck: any[], sideboard: any[]): LegalityResult {
    const errors: string[] = [];
    
    let mainCards = 0;
    let runes = 0;
    let legends = 0;
    let champions = 0;
    let battlefields = 0;
    let signatureCount = 0;

    let allowedDomains: string[] = [];

    for (const card of mainDeck) {
      if (card.apiPayload?.type === 'Rune') runes += card.count;
      else if (card.apiPayload?.type === 'Legend') {
        legends += card.count;
        if (card.apiPayload?.domains) allowedDomains = card.apiPayload.domains;
      }
      else if (card.apiPayload?.type === 'Champion') champions += card.count;
      else if (card.apiPayload?.type === 'Battlefield') battlefields += card.count;
      else mainCards += card.count;

      if (card.apiPayload?.isSignature) signatureCount += card.count;
    }

    const sideCount = sideboard.reduce((sum, c) => sum + c.count, 0);

    if (mainCards !== 40) errors.push(`Must have exactly 40 Main Deck cards (currently ${mainCards}).`);
    if (runes !== 12) errors.push(`Must have exactly 12 Rune cards (currently ${runes}).`);
    if (legends !== 1) errors.push(`Must have exactly 1 Champion Legend (currently ${legends}).`);
    if (champions !== 1) errors.push(`Must have exactly 1 Chosen Champion (currently ${champions}).`);
    if (battlefields !== 3) errors.push(`Must have exactly 3 Battlefields (currently ${battlefields}).`);
    if (sideCount > 8) errors.push(`Sideboard cannot exceed 8 cards (currently ${sideCount}).`);
    if (signatureCount > 3) errors.push(`Maximum 3 Signature cards allowed (found ${signatureCount}).`);

    const banned = ["Called Shot", "Draven, Vanquisher", "Fight or Flight", "Scrapheap", "The Dreaming Tree", "Obelisk of Power", "Reaver's Row"];
    
    for (const card of [...mainDeck, ...sideboard]) {
      if (banned.includes(card.name)) errors.push(`${card.name} is banned in Standard Constructed.`);
      
      if (allowedDomains.length > 0 && card.apiPayload?.domain) {
        if (!allowedDomains.includes(card.apiPayload.domain)) {
          errors.push(`${card.name} violates Domain Identity (must be ${allowedDomains.join(' or ')}).`);
        }
      }
    }

    const counts = this.getCounts(mainDeck, sideboard);
    for (const [name, count] of Object.entries(counts)) {
      if (count > 3 && name !== 'Rune') {
        errors.push(`Maximum 3 copies per card. Found ${count} of ${name}.`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateNaruto(mainDeck: any[]): LegalityResult {
    const errors: string[] = [];
    const mainCount = mainDeck.reduce((sum, c) => sum + c.count, 0);

    if (mainCount < 30) errors.push(`Deck must be at least 30 cards (currently ${mainCount}).`);

    const countsByNumber: Record<string, number> = {};
    for (const card of mainDeck) {
      const colNum = card.apiPayload?.collection_number || card.name;
      countsByNumber[colNum] = (countsByNumber[colNum] || 0) + card.count;
    }

    for (const [id, count] of Object.entries(countsByNumber)) {
      if (count > 2) errors.push(`Maximum 2 copies per card ID. Found ${count} copies of ID ${id}.`);
    }

    return { isValid: errors.length === 0, errors };
  }

  private static getCounts(main: any[], side: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const card of [...main, ...side]) {
      counts[card.name] = (counts[card.name] || 0) + card.count;
    }
    return counts;
  }
}
