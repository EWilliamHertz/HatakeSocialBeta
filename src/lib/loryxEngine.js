export class LoryxEngine {
  constructor(mode = '1v0') {
    this.state = {
      mode,
      phase: 'ready', // ready, set, draw, main
      activePlayer: 0,
      players: [],
      turn: 1,
      logs: []
    };
  }

  addLog(msg) {
    this.state.logs.push(`[Turn ${this.state.turn}] ${msg}`);
  }

  setupGame(player1Deck, player2Deck = null) {
    this.state.players = [];
    this.state.logs = [];
    this.state.turn = 1;
    this.state.activePlayer = 0;
    this.state.players.push(this._createPlayerState(0, 'Player 1', player1Deck));
    if (this.state.mode === '1v1' && player2Deck) {
      this.state.players.push(this._createPlayerState(1, 'Player 2', player2Deck));
    } else if (this.state.mode === '1v0') {
      // Create a dummy opponent for Goldfish mode
      this.state.players.push(this._createPlayerState(1, 'Training Dummy', []));
    }
    
    // Initial draw
    this.state.players.forEach(p => {
      if (p.library.length > 0) this._drawCards(p, 7);
    });
    
    this.addLog('Game started. Players drew 7 cards.');
    return this.state;
  }

  _createPlayerState(index, name, deck) {
    // Convert generic deck cards into unique game instances
    let instanceIdCounter = 0;
    const library = deck.map(c => {
      // Parse keywords from body_text or abilities
      const text = (c.body_text || c.apiPayload?.body_text || '').toLowerCase();
      const keywords = [];
      if (text.includes('rush')) keywords.push('Rush');
      if (text.includes('evasive')) keywords.push('Evasive');
      if (text.includes('bodyguard')) keywords.push('Bodyguard');
      if (text.includes('reckless')) keywords.push('Reckless');
      
      let shiftCost = null;
      const shiftMatch = text.match(/shift\s+(\d+)/i);
      if (shiftMatch) shiftCost = parseInt(shiftMatch[1], 10);

      let challengerBonus = 0;
      const challengerMatch = text.match(/challenger\s+\+?(\d+)/i);
      if (challengerMatch) challengerBonus = parseInt(challengerMatch[1], 10);

      return {
        ...c,
        instanceId: `p${index}-${instanceIdCounter++}`,
        isExerted: false,
        isDrying: false,
        damage: 0,
        cost: c.apiPayload?.cost || 1, // fallback cost
        shiftCost,
        challengerBonus,
        lore: c.apiPayload?.lore || 1, // fallback lore
        strength: c.apiPayload?.strength || 1, // fallback
        willpower: c.apiPayload?.willpower || 1, // fallback
        inkwell: c.apiPayload?.inkwell || true, // Can it be inked?
        keywords
      };
    }).sort(() => Math.random() - 0.5);

    return {
      index,
      name,
      lore: 0,
      library,
      hand: [],
      inkwell: [],
      battlefield: [],
      discard: [],
      hasInkedThisTurn: false
    };
  }

  _drawCards(player, amount) {
    for (let i = 0; i < amount; i++) {
      if (player.library.length > 0) {
        player.hand.push(player.library.pop());
      } else {
        this.addLog(`${player.name} tried to draw from an empty library!`);
      }
    }
  }

  processAction(playerIndex, action) {
    const player = this.state.players[playerIndex];
    if (this.state.activePlayer !== playerIndex) {
      throw new Error("Not your turn!");
    }

    switch (action.type) {
      case 'ink_card':
        if (player.hasInkedThisTurn) throw new Error("Already inked this turn.");
        const cardIdx = player.hand.findIndex(c => c.id === action.cardId);
        if (cardIdx === -1) throw new Error("Card not found in hand.");
        const [card] = player.hand.splice(cardIdx, 1);
        card.isExerted = false;
        player.inkwell.push(card);
        player.hasInkedThisTurn = true;
        this.addLog(`${player.name} inked a card.`);
        break;

      case 'play_card': {
        const playIdx = player.hand.findIndex(c => c.instanceId === action.instanceId);
        if (playIdx === -1) throw new Error("Card not found in hand.");
        const cardToPlay = player.hand[playIdx];
        
        // Calculate available ink
        const availableInk = player.inkwell.filter(i => !i.isExerted);
        if (availableInk.length < cardToPlay.cost) {
          throw new Error(`Not enough ready ink. Costs ${cardToPlay.cost}, you have ${availableInk.length}.`);
        }
        
        // Exert the required ink
        for (let i = 0; i < cardToPlay.cost; i++) {
          availableInk[i].isExerted = true;
        }

        const [playedCard] = player.hand.splice(playIdx, 1);
        playedCard.isExerted = action.exertOnPlay && playedCard.keywords.includes('Bodyguard') ? true : false;
        playedCard.isDrying = true; // But they enter drying (summoning sickness)
        player.battlefield.push(playedCard);
        this.addLog(`${player.name} exerted ${cardToPlay.cost} ink to play ${playedCard.name}${playedCard.isExerted ? ' (Exerted via Bodyguard)' : ''}.`);
        break;
      }

      case 'shift_card': {
        const shiftIdx = player.hand.findIndex(c => c.instanceId === action.instanceId);
        if (shiftIdx === -1) throw new Error("Card not found in hand.");
        const cardToShift = player.hand[shiftIdx];
        
        if (cardToShift.shiftCost === null || cardToShift.shiftCost === undefined) {
          throw new Error("This card doesn't have a Shift cost.");
        }

        const targetIdx = player.battlefield.findIndex(c => c.instanceId === action.targetId);
        if (targetIdx === -1) throw new Error("Shift target not found on battlefield.");
        const targetCard = player.battlefield[targetIdx];

        // Lorcana Shift rule: Target character must share the same name (excluding subtitles)
        // For simplicity right now, check exact name or prefix (e.g. "Stitch - Carefree Surfer" shifts on "Stitch")
        const shiftNameBase = cardToShift.name.split(' - ')[0];
        const targetNameBase = targetCard.name.split(' - ')[0];
        if (shiftNameBase !== targetNameBase) {
          throw new Error(`Cannot shift ${cardToShift.name} onto ${targetCard.name}. Base names must match.`);
        }

        const availableInk = player.inkwell.filter(i => !i.isExerted);
        if (availableInk.length < cardToShift.shiftCost) {
          throw new Error(`Not enough ready ink to Shift. Costs ${cardToShift.shiftCost}.`);
        }

        for (let i = 0; i < cardToShift.shiftCost; i++) {
          availableInk[i].isExerted = true;
        }

        const [playedCard] = player.hand.splice(shiftIdx, 1);
        
        // Inherit state from target
        playedCard.isExerted = targetCard.isExerted;
        playedCard.isDrying = targetCard.isDrying;
        playedCard.damage = targetCard.damage;
        
        // Remove target and place the shifted card
        player.battlefield.splice(targetIdx, 1, playedCard);
        // Put the old card underneath it (abstracted into discard for now, though officially it stays underneath)
        player.discard.push(targetCard);
        
        this.addLog(`${player.name} shifted ${playedCard.name} for ${cardToShift.shiftCost} ink!`);
        break;
      }

      case 'quest': {
        const quester = player.battlefield.find(c => c.instanceId === action.instanceId);
        if (!quester) throw new Error("Character not found.");
        if (quester.isExerted) throw new Error("Character is already exerted.");
        if (quester.isDrying) throw new Error("Character is drying and cannot quest yet.");
        if (quester.keywords.includes('Reckless')) throw new Error("Character is Reckless and cannot quest.");
        
        quester.isExerted = true;
        const loreGained = quester.lore || 1;
        player.lore += loreGained;
        this.addLog(`${player.name} quested with ${quester.name} for ${loreGained} lore.`);
        if (player.lore >= 20) {
          this.addLog(`${player.name} wins with ${player.lore} Lore!`);
        }
        break;
      }

      case 'challenge': {
        const attacker = player.battlefield.find(c => c.instanceId === action.attackerId);
        if (!attacker) throw new Error("Attacker not found.");
        if (attacker.isExerted) throw new Error("Attacker is already exerted.");
        if (attacker.isDrying && !attacker.keywords.includes('Rush')) {
          throw new Error("Character is drying and doesn't have Rush.");
        }
        
        const opponent = this.state.players.find(p => p.index !== playerIndex);
        if (!opponent) throw new Error("No opponent to challenge.");
        
        const defender = opponent.battlefield.find(c => c.instanceId === action.defenderId);
        if (!defender) throw new Error("Defender not found.");
        if (!defender.isExerted) throw new Error("You can only challenge exerted characters.");
        
        // Bodyguard check: if opponent has any exerted bodyguards, you must challenge one of them
        const activeBodyguards = opponent.battlefield.filter(c => c.isExerted && c.keywords.includes('Bodyguard'));
        if (activeBodyguards.length > 0 && !defender.keywords.includes('Bodyguard')) {
          throw new Error("Opponent has an exerted Bodyguard. You must challenge a Bodyguard.");
        }

        if (defender.keywords.includes('Evasive') && !attacker.keywords.includes('Evasive')) {
          throw new Error("Defender has Evasive. Attacker must have Evasive to challenge them.");
        }

        attacker.isExerted = true;
        
        // Apply Challenger bonus
        const attackerStrength = (attacker.strength || 1) + (attacker.challengerBonus || 0);
        const defenderStrength = (defender.strength || 1);

        attacker.damage += defenderStrength;
        defender.damage += attackerStrength;
        
        this.addLog(`${player.name}'s ${attacker.name} challenged ${defender.name}!`);

        // Check for banishment
        if (attacker.damage >= (attacker.willpower || 1)) {
          this.addLog(`${attacker.name} is banished.`);
          const idx = player.battlefield.findIndex(c => c.instanceId === attacker.instanceId);
          player.discard.push(...player.battlefield.splice(idx, 1));
        }
        if (defender.damage >= (defender.willpower || 1)) {
          this.addLog(`${defender.name} is banished.`);
          const idx = opponent.battlefield.findIndex(c => c.instanceId === defender.instanceId);
          opponent.discard.push(...opponent.battlefield.splice(idx, 1));
        }
        break;
      }

      case 'pass_turn':
        this._passTurn();
        break;

      default:
        throw new Error("Unknown action type.");
    }
    return this.state;
  }

  _passTurn() {
    const nextPlayerIndex = (this.state.activePlayer + 1) % this.state.players.length;
    this.state.activePlayer = nextPlayerIndex;
    const player = this.state.players[nextPlayerIndex];
    
    // Ready phase
    player.hasInkedThisTurn = false;
    player.inkwell.forEach(ink => ink.isExerted = false);
    player.battlefield.forEach(char => {
      char.isExerted = false;
      char.isDrying = false; // Drying wears off at the start of turn
    });
    
    // Draw phase
    if (player.library.length > 0) {
      this._drawCards(player, 1);
    }
    
    this.state.turn++;
    this.addLog(`${player.name}'s turn starts. Ready, Set, Draw.`);

    // If Goldfish Dummy, auto-play a target and pass back
    if (this.state.mode === '1v0' && player.name === 'Training Dummy') {
      player.battlefield.push({
        instanceId: `dummy-${this.state.turn}`,
        name: `Heartless Minion`,
        cost: 2,
        lore: 1,
        strength: 2,
        willpower: 2,
        damage: 0,
        isExerted: true, // Auto exerted so player can challenge it
        isDrying: false,
        keywords: []
      });
      this.addLog(`Training Dummy spawns an exerted Heartless Minion!`);
      this._passTurn(); // Pass back to player 1
    }
  }
}
