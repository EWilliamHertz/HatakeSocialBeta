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

// ─── MTG Matchmaking (Phase engine) with Elo ─────────────────────────────────
import { jwtVerify } from 'jose';

const mtgQueue = [];
const mtgRooms = new Map();
const ELO_K = 32;
const DEFAULT_ELO = 1200;
const SINGLE_REPORT_GRACE_MS = 60 * 1000;

const JWT_KEY = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

/** Authenticate a socket from the hatake_session cookie (same-origin). */
async function getUserFromSocket(socket) {
  try {
    if (!JWT_KEY) return null;
    const cookieHeader = socket.handshake?.headers?.cookie || '';
    const match = cookieHeader.match(/(?:^|;\s*)hatake_session=([^;]+)/);
    if (!match) return null;
    const { payload } = await jwtVerify(decodeURIComponent(match[1]), JWT_KEY, {
      algorithms: ['HS256'],
    });
    if (!payload?.id) return null;
    let username = payload.username;
    if (!username) {
      const u = await pool.user.findUnique({
        where: { id: payload.id },
        select: { username: true },
      });
      username = u?.username;
    }
    return username ? { id: payload.id, username } : null;
  } catch {
    return null;
  }
}

async function getElo(userId) {
  try {
    const rating = await pool.playerRating.findUnique({
      where: { userId_game: { userId, game: 'MAGIC' } },
    });
    return rating?.elo ?? DEFAULT_ELO;
  } catch {
    return DEFAULT_ELO;
  }
}

function expectedScore(a, b) {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

/**
 * Elo-based pairing: match the two closest-rated players whose Elo gap fits
 * inside a window that widens the longer they wait (±150 base, +50/5s waited).
 */
function pairMtgPlayers(io) {
  let paired = true;
  while (paired && mtgQueue.length >= 2) {
    paired = false;
    const sorted = [...mtgQueue].sort((a, b) => a.elo - b.elo);
    let best = null;
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      const diff = Math.abs(a.elo - b.elo);
      const waited = Math.min(Date.now() - a.joinedAt, Date.now() - b.joinedAt);
      const window = 150 + 50 * Math.floor(waited / 5000);
      if (diff <= window && (!best || diff < best.diff)) best = { a, b, diff };
    }
    if (!best) return;

    const { a: p1, b: p2 } = best;
    mtgQueue.splice(mtgQueue.findIndex((q) => q.socketId === p1.socketId), 1);
    mtgQueue.splice(mtgQueue.findIndex((q) => q.socketId === p2.socketId), 1);

    const roomId = uuidv4();
    mtgRooms.set(roomId, {
      id: roomId,
      host: p1,
      guest: p2,
      roomCode: null,
      reports: {},
      finalized: false,
      finalizeTimer: null,
      createdAt: Date.now(),
    });

    io.to(p1.socketId).emit('match-found', {
      isHost: true,
      opponent: { userId: p2.userId, username: p2.username, elo: Math.round(p2.elo) },
      roomId,
    });
    io.to(p2.socketId).emit('match-found', {
      isHost: false,
      opponent: { userId: p1.userId, username: p1.username, elo: Math.round(p1.elo) },
      roomId,
    });

    console.log(
      `[MTG Matchmaking] Paired ${p1.username} (${Math.round(p1.elo)}) vs ${p2.username} (${Math.round(p2.elo)}) -> Match ${roomId}`,
    );
    paired = true;
  }
}

function findMtgRoomBySocket(socketId) {
  for (const room of mtgRooms.values()) {
    if (room.host.socketId === socketId || room.guest.socketId === socketId) {
      return room;
    }
  }
  return null;
}

/** Apply Elo + persist Match once we trust the outcome. */
async function finalizeMtgMatch(io, room, winnerUserId /* null = draw */) {
  if (room.finalized) return;
  room.finalized = true;
  if (room.finalizeTimer) clearTimeout(room.finalizeTimer);
  mtgRooms.delete(room.id);

  const { host, guest } = room;
  // Guests without a real hatake account can play, but no Elo is recorded.
  if (!host.userId || !guest.userId || host.userId === guest.userId) return;

  try {
    const scoreHost = winnerUserId == null ? 0.5 : winnerUserId === host.userId ? 1 : 0;
    const hostElo = await getElo(host.userId);
    const guestElo = await getElo(guest.userId);
    const hostDelta = ELO_K * (scoreHost - expectedScore(hostElo, guestElo));
    const guestDelta = -hostDelta;

    const upsert = (userId, delta, won, draw) =>
      pool.playerRating.upsert({
        where: { userId_game: { userId, game: 'MAGIC' } },
        create: {
          userId,
          game: 'MAGIC',
          elo: DEFAULT_ELO + delta,
          matchesPlayed: 1,
          wins: won ? 1 : 0,
          losses: won || draw ? 0 : 1,
        },
        update: {
          elo: { increment: delta },
          matchesPlayed: { increment: 1 },
          wins: { increment: won ? 1 : 0 },
          losses: { increment: won || draw ? 0 : 1 },
        },
      });

    const draw = winnerUserId == null;
    await pool.$transaction([
      upsert(host.userId, hostDelta, winnerUserId === host.userId, draw),
      upsert(guest.userId, guestDelta, winnerUserId === guest.userId, draw),
      pool.match.create({
        data: {
          game: 'MAGIC',
          player1Id: host.userId,
          player2Id: guest.userId,
          winnerId: winnerUserId,
          player1EloChange: hostDelta,
          player2EloChange: guestDelta,
          durationSeconds: Math.floor((Date.now() - room.createdAt) / 1000),
        },
      }),
    ]);

    io.to(host.socketId).emit('elo:update', {
      elo: Math.round(hostElo + hostDelta),
      delta: Math.round(hostDelta),
      result: draw ? 'draw' : winnerUserId === host.userId ? 'win' : 'loss',
    });
    io.to(guest.socketId).emit('elo:update', {
      elo: Math.round(guestElo + guestDelta),
      delta: Math.round(guestDelta),
      result: draw ? 'draw' : winnerUserId === guest.userId ? 'win' : 'loss',
    });

    console.log(
      `[MTG Elo] ${host.username} ${hostDelta >= 0 ? '+' : ''}${Math.round(hostDelta)} / ${guest.username} ${guestDelta >= 0 ? '+' : ''}${Math.round(guestDelta)}`,
    );
  } catch (err) {
    console.error('[MTG Elo] Failed to finalize match:', err);
  }
}

function tryResolveMtgReports(io, room) {
  const hostReport = room.reports[room.host.userId];
  const guestReport = room.reports[room.guest.userId];

  if (hostReport && guestReport) {
    if (hostReport === 'draw' && guestReport === 'draw') {
      finalizeMtgMatch(io, room, null);
    } else if (hostReport === 'win' && guestReport === 'loss') {
      finalizeMtgMatch(io, room, room.host.userId);
    } else if (hostReport === 'loss' && guestReport === 'win') {
      finalizeMtgMatch(io, room, room.guest.userId);
    } else {
      // Conflicting reports — do not adjust ratings.
      console.warn(`[MTG Elo] Conflicting reports for match ${room.id}, skipping Elo.`);
      room.finalized = true;
      if (room.finalizeTimer) clearTimeout(room.finalizeTimer);
      mtgRooms.delete(room.id);
    }
    return;
  }

  // Only one report so far: trust it after a grace period (covers opponents
  // who close the tab instead of reporting).
  if (!room.finalizeTimer) {
    room.finalizeTimer = setTimeout(() => {
      const report = room.reports[room.host.userId]
        ? { userId: room.host.userId, result: room.reports[room.host.userId], other: room.guest.userId }
        : { userId: room.guest.userId, result: room.reports[room.guest.userId], other: room.host.userId };
      if (!report.result) return;
      const winnerId =
        report.result === 'draw' ? null : report.result === 'win' ? report.userId : report.other;
      finalizeMtgMatch(io, room, winnerId);
    }, SINGLE_REPORT_GRACE_MS);
  }
}

let mtgSweepStarted = false;

export function registerSocketHandlers(io) {
  // Re-run pairing every 5s (the Elo window widens with wait time) and drop
  // abandoned match rooms after 6 hours.
  if (!mtgSweepStarted) {
    mtgSweepStarted = true;
    setInterval(() => {
      if (mtgQueue.length >= 2) pairMtgPlayers(io);
      const cutoff = Date.now() - 6 * 60 * 60 * 1000;
      for (const [id, room] of mtgRooms.entries()) {
        if (room.createdAt < cutoff) {
          if (room.finalizeTimer) clearTimeout(room.finalizeTimer);
          mtgRooms.delete(id);
        }
      }
    }, 5000);
  }

  io.on('connection', (socket) => {
    // Send current lobbies to newly connected client
    socket.emit('lobby-list', Array.from(lobbies.values()).filter(l => l.status !== 'in-game'));

    socket.on('queue:join', async ({ userId, username } = {}) => {
      // Authoritative identity comes from the session cookie; the payload is
      // only a fallback for unauthenticated/dev usage (no Elo recorded).
      const sessionUser = await getUserFromSocket(socket);
      const resolvedId = sessionUser?.id ?? userId ?? null;
      const resolvedName = sessionUser?.username ?? username ?? 'Player';
      const elo = resolvedId ? await getElo(resolvedId) : DEFAULT_ELO;

      const existingIdx = mtgQueue.findIndex((q) => q.socketId === socket.id);
      if (existingIdx >= 0) mtgQueue.splice(existingIdx, 1);
      // Prevent the same account queueing twice from two tabs.
      if (resolvedId) {
        const dupIdx = mtgQueue.findIndex((q) => q.userId === resolvedId);
        if (dupIdx >= 0) mtgQueue.splice(dupIdx, 1);
      }
      mtgQueue.push({
        socketId: socket.id,
        userId: resolvedId,
        username: resolvedName,
        elo,
        joinedAt: Date.now(),
      });
      socket.emit('queue:joined', { position: mtgQueue.length, elo: Math.round(elo) });
      pairMtgPlayers(io);
    });

    socket.on('queue:leave', () => {
      const idx = mtgQueue.findIndex((q) => q.socketId === socket.id);
      if (idx >= 0) mtgQueue.splice(idx, 1);
    });

    socket.on('room:created', ({ roomCode }) => {
      // Relay the Phase room code from the host to the guest. The room is kept
      // alive so the match result can be reported for Elo afterwards.
      for (const room of mtgRooms.values()) {
        if (room.host.socketId === socket.id) {
          room.roomCode = roomCode;
          io.to(room.guest.socketId).emit('match-ready', { roomCode });
          break;
        }
      }
    });

    // match:result — { result: 'win' | 'loss' | 'draw' }, sent by each client
    // when their game-over screen appears. Elo updates when reports agree.
    socket.on('match:result', ({ result } = {}) => {
      if (!['win', 'loss', 'draw'].includes(result)) return;
      const room = findMtgRoomBySocket(socket.id);
      if (!room || room.finalized) return;
      const reporter = room.host.socketId === socket.id ? room.host : room.guest;
      if (!reporter.userId) return;
      if (room.reports[reporter.userId]) return; // first report wins
      room.reports[reporter.userId] = result;
      tryResolveMtgReports(io, room);
    });

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
      const idx = mtgQueue.findIndex((q) => q.socketId === socket.id);
      if (idx >= 0) mtgQueue.splice(idx, 1);

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