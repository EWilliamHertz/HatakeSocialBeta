import { LoryxEngine } from './loryxEngine.js';
import { db as pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export const lobbies = new Map();
const activeGames = new Map();
const playerSockets = new Map(); // socketId -> {playerId, gameId}

function broadcastLobbies(io) {
  const lobbyList = Array.from(lobbies.values()).filter(l => l.status !== 'in-game');
  io.emit('lobby-list', lobbyList);
}

export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Send current lobbies to newly connected client
    socket.emit('lobby-list', Array.from(lobbies.values()).filter(l => l.status !== 'in-game'));

    // create-lobby: { name, mode, playerName, deckId, game }
    socket.on('create-lobby', ({ name, mode, playerName, deckId, game = 'MAGIC' }) => {
      const lobbyId = uuidv4();
      const playerId = uuidv4();
      
      const lobby = {
        id: lobbyId,
        name,
        mode,
        game,
        hostName: playerName,  // Track host name
        players: [{
          id: playerId,
          name: playerName,
          deckId,
          socketId: socket.id,
          ready: false
        }],
        status: 'waiting'
      };
      
      lobbies.set(lobbyId, lobby);
      socket.join(lobbyId);
      console.log(`✓ Lobby created: ${lobbyId} (${playerName})`);
      socket.emit('lobby-created', { lobbyId, playerId, lobby });
      broadcastLobbies(io);  // Broadcast updated list to all clients
    });

    // join-lobby: { lobbyId, playerName, deckId }
    socket.on('join-lobby', ({ lobbyId, playerName, deckId }) => {
      const lobby = lobbies.get(lobbyId);
      if (!lobby) {
        socket.emit('error', 'Lobby not found');
        return;
      }
      if (lobby.status !== 'waiting') {
        socket.emit('error', 'Lobby is no longer waiting');
        return;
      }
      
      const maxPlayers = lobby.mode === '1v1' ? 2 : 1;
      if (lobby.players.length >= maxPlayers) {
        socket.emit('error', 'Lobby is full');
        return;
      }
      
      const playerId = uuidv4();
      const player = {
        id: playerId,
        name: playerName,
        deckId,
        socketId: socket.id,
        ready: false
      };
      
      lobby.players.push(player);
      socket.join(lobbyId);
      console.log(`✓ Player ${playerName} joined lobby ${lobbyId}`);
      io.to(lobbyId).emit('lobby-update', lobby);
      broadcastLobbies(io);  // Broadcast updated list to all clients
    });

    // leave-lobby: { lobbyId }
    socket.on('leave-lobby', ({ lobbyId }) => {
      const lobby = lobbies.get(lobbyId);
      if (lobby) {
        const leftPlayer = lobby.players.find(p => p.socketId === socket.id);
        lobby.players = lobby.players.filter(p => p.socketId !== socket.id);
        socket.leave(lobbyId);
        
        if (lobby.players.length === 0) {
          lobbies.delete(lobbyId);
          console.log(`✓ Lobby ${lobbyId} deleted (empty)`);
        } else {
          console.log(`✓ Player ${leftPlayer?.name} left lobby ${lobbyId}`);
          io.to(lobbyId).emit('lobby-update', lobby);
        }
        broadcastLobbies(io);  // Broadcast updated list to all clients
      }
    });

    // ready: { lobbyId }
    socket.on('ready', async ({ lobbyId }) => {
      const lobby = lobbies.get(lobbyId);
      if (!lobby) return;

      const player = lobby.players.find(p => p.socketId === socket.id);
      if (player) {
        player.ready = true;
        io.to(lobbyId).emit('lobby-update', lobby);

        const allReady = lobby.players.every(p => p.ready);
        const requiredPlayers = lobby.mode === '1v0' ? 1 : 2;
        if (allReady && lobby.players.length >= requiredPlayers) {
          lobby.status = 'in-game';
          io.to(lobbyId).emit('lobby-update', lobby);
          broadcastLobbies(io);  // Remove from lobby list for other players
          
          try {
            for (const p of lobby.players) {
              const prisma = pool;
              const deckRow = await prisma.deck.findUnique({
                where: { id: p.deckId }
              });

              const mainDeck = [];
              const sideboard = [];

              if (deckRow && deckRow.cards) {
                let parsedCards;
                if (typeof deckRow.cards === 'string') {
                   parsedCards = JSON.parse(deckRow.cards);
                } else {
                   parsedCards = deckRow.cards;
                }
                
                let cardArray = Array.isArray(parsedCards) ? parsedCards : Object.values(parsedCards);
                for (const entry of cardArray) {
                  const targetApiId = entry.cardId || entry.id || entry.apiId;
                  const targetQuantity = entry.quantity || entry.count || 1;
                  
                  if (!targetApiId) continue;

                  const cardRef = await prisma.cardReference.findUnique({
                    where: { apiId: targetApiId }
                  });
                  if (cardRef) {
                    const payload = cardRef.apiPayload;
                    
                    // Extract TCGPlayer extendedData if present
                    let extractedTypeLine = payload.type_line;
                    let extractedOracleText = payload.oracle_text;
                    
                    if (payload.extendedData && Array.isArray(payload.extendedData)) {
                      const typeAttr = payload.extendedData.find(d => d.name === 'SubType');
                      if (typeAttr && !extractedTypeLine) extractedTypeLine = typeAttr.value;
                      
                      const oracleAttr = payload.extendedData.find(d => d.name === 'OracleText');
                      if (oracleAttr && !extractedOracleText) extractedOracleText = oracleAttr.value;
                    }

                    const cardData = {
                      scryfall_id: payload.id || cardRef.id,
                      card_id: payload.id || cardRef.id,
                      name: payload.name || payload.cleanName,
                      mana_cost: payload.mana_cost,
                      cmc: payload.cmc,
                      type_line: extractedTypeLine,
                      oracle_text: extractedOracleText,
                      power: payload.power,
                      toughness: payload.toughness,
                      colors: payload.colors,
                      color_identity: payload.color_identity,
                      keywords: payload.keywords,
                      rarity: payload.rarity || cardRef.rarity,
                      image_uri: cardRef.imageUrl || payload.image_uris?.normal || payload.card_faces?.[0]?.image_uris?.normal,
                      quantity: targetQuantity
                    };
                    for (let i = 0; i < targetQuantity; i++) {
                      if (entry.is_sideboard) sideboard.push(cardData);
                      else mainDeck.push(cardData);
                    }
                  }
                }
              }
              p.deck = mainDeck;
              p.sideboard = sideboard;
            }

            let engine;
            if (lobby.game === 'LORYX') {
              engine = new LoryxEngine(lobby.mode);
              engine.setupGame(lobby.players[0]?.deck || [], lobby.players[1]?.deck || []);
            } else {
              throw new Error('Game not supported by this engine anymore.');
            }

            const gameId = uuidv4();
            activeGames.set(gameId, engine);
            lobby.gameId = gameId;

            for (const p of lobby.players) {
              playerSockets.set(p.socketId, { playerId: p.id, gameId });
              const pSocket = io.sockets.sockets.get(p.socketId);
              if (pSocket) {
                pSocket.join(gameId);
                const state = lobby.game === 'LORYX' ? engine.state : engine.getState(p.id);
                pSocket.emit('game-start', { gameId, playerId: p.id, state });
                pSocket.emit('game-update', state);
              }
            }
          } catch (error) {
            console.error('Failed to start game:', error);
            lobby.status = 'waiting';
            lobby.players.forEach(p => p.ready = false);
            io.to(lobbyId).emit('lobby-update', lobby);
            io.to(lobbyId).emit('error', 'Failed to start game: ' + error.message);
          }
        }
      }
    });

    // ========== FIX #1: ADD MISSING join-game HANDLER ==========
    // join-game: { gameId, playerId }
    socket.on('join-game', ({ gameId, playerId }) => {
      const engine = activeGames.get(gameId);
      if (engine) {
        const player = engine.state.players.find(p => p.id === playerId);
        if (player) {
          player.socketId = socket.id;
          playerSockets.set(socket.id, { playerId, gameId });
          socket.join(gameId);
          console.log(`✓ Player ${playerId} joined game ${gameId} on socket ${socket.id.substring(0, 8)}`);
          // Send both the initial game-start and current game state
          const isLoryx = engine instanceof LoryxEngine;
          const state = isLoryx ? engine.state : engine.getState(playerId);
          socket.emit('game-start', { gameId, playerId, state });
          socket.emit('game-update', state);
        } else {
          console.warn(`❌ Player ${playerId} not found in game ${gameId}`);
          socket.emit('error', 'Player not found in game');
        }
      } else {
        console.warn(`❌ Game ${gameId} not found in activeGames`);
        socket.emit('error', 'Game not found');
      }
    });

    // ========== FIX #2: CORRECT game-action HANDLER ==========
    // game-action: { gameId, playerId, type, ...payload }
    socket.on('game-action', (data) => {
      const gameId = data.gameId;
      const playerId = data.playerId;
      const type = data.type;
      
      const info = playerSockets.get(socket.id);
      if (!info) {
        console.warn(`⚠️  Game action from unknown socket: ${socket.id} for ${type}`);
        socket.emit('error', 'Socket not registered. Rejoin game.');
        return;
      }
      
      const engine = activeGames.get(gameId);
      if (!engine) {
        console.warn(`⚠️  Game action for unknown game: ${gameId}`);
        socket.emit('error', 'Game not found');
        return;
      }

      try {
        const isLoryx = engine instanceof LoryxEngine;
        if (isLoryx) {
          const actualIndex = engine.state.players.findIndex(p => p.id === playerId || p.socketId === socket.id);
          if (actualIndex !== -1) {
            engine.processAction(actualIndex, data);
            io.to(gameId).emit('game-update', engine.state);
          } else {
            console.warn(`Player ${playerId} not found in Loryx game.`);
          }
        } else {
          console.warn(`Game type not supported for action ${type}`);
          socket.emit('error', 'Game not supported');
        }
      } catch (error) {
        console.error(`💥 Error handling action ${type}:`, error.message);
        socket.emit('error', error.message);
      }
    });

    // rejoin-game: { gameId, playerId }
    socket.on('rejoin-game', ({ gameId, playerId }) => {
      const engine = activeGames.get(gameId);
      if (engine) {
        const player = engine.state.players.find(p => p.id === playerId);
        if (player) {
          player.socketId = socket.id;
          player.disconnected = false;
          if (player.disconnectTimeout) {
            clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = null;
          }
          playerSockets.set(socket.id, { playerId, gameId });
          socket.join(gameId);
          socket.emit('game-update', engine.getState(playerId));
        }
      } else {
        socket.emit('error', 'Game not found');
      }
    });

    // chat-message: { gameId, message }
    socket.on('chat-message', ({ gameId, message }) => {
      io.to(gameId).emit('chat-message', { gameId, message, sender: socket.id });
    });

    // disconnect
    socket.on('disconnect', () => {
      const info = playerSockets.get(socket.id);
      if (info) {
        const { playerId, gameId } = info;
        const engine = activeGames.get(gameId);
        if (engine) {
          const player = engine.state.players.find(p => p.id === playerId);
          if (player) {
            player.disconnected = true;
            player.disconnectTimeout = setTimeout(() => {
              if (activeGames.has(gameId)) {
                engine.handleAction(playerId, { type: 'forfeit' });
                io.to(gameId).emit('game-over', { reason: 'player_disconnected' });
                activeGames.delete(gameId);
              }
            }, 5 * 60 * 1000);
          }
        }
        playerSockets.delete(socket.id);
      }
      
      for (const [lobbyId, lobby] of lobbies.entries()) {
        lobby.players = lobby.players.filter(p => p.socketId !== socket.id);
        if (lobby.players.length === 0 && lobby.status === 'waiting') {
          lobbies.delete(lobbyId);
        } else if (lobby.status === 'waiting') {
          io.to(lobbyId).emit('lobby-update', lobby);
        }
      }
    });
  });
}