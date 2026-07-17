import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev
    methods: ['GET', 'POST']
  }
});

// In-memory store for active rooms
// roomCode -> { code, players: [{ id, name, socketId, isHost, connected, score }], currentGame, gameStates: {...} }
const rooms = new Map();
// socketId -> roomCode
const socketToRoom = new Map();
// playerId -> disconnectTimeout
const disconnectTimeouts = new Map();

// Helper to generate 6-digit room code
function generateRoomCode() {
  let code = '';
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(code));
  return code;
}

// Helper to check room existence and player membership
function getRoomAndPlayer(socket) {
  const roomCode = socketToRoom.get(socket.id);
  if (!roomCode) return { room: null, player: null };
  const room = rooms.get(roomCode);
  if (!room) return { room: null, player: null };
  const player = room.players.find(p => p.socketId === socket.id);
  return { room, player };
}

// Broadcasts updated room data to all players in the room
function broadcastRoomUpdate(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  io.to(roomCode).emit('room_updated', {
    code: room.code,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      connected: p.connected,
      score: p.score
    })),
    currentGame: room.currentGame,
    gameStates: room.gameStates
  });
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ playerId, playerName }) => {
    const code = generateRoomCode();
    const player = {
      id: playerId,
      name: playerName || 'Player 1',
      socketId: socket.id,
      isHost: true,
      connected: true,
      score: 0
    };

    const room = {
      code,
      players: [player],
      currentGame: null,
      gameStates: {
        sameBrain: { prompt: '', answers: {}, history: [] },
        wouldYouRather: { question: null, choices: {}, history: [] },
        secretMessage: { messages: {}, revealed: false },
        whoKnowsMeBetter: { question: '', answererId: '', answererSecret: '', guess: '', step: 'answering', history: [] },
        fastestTap: { round: 1, results: {}, scores: {}, state: 'waiting' },
        truthOrDare: { category: '', type: '', prompt: '', targetPlayerId: '' },
        guessMyMood: { answererId: '', moodEmoji: '', guessEmoji: '', step: 'selecting' },
        loveBingo: { tasks: [], boards: {}, bingos: {} }
      }
    };

    rooms.set(code, room);
    socketToRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('room_created', { code, player });
    broadcastRoomUpdate(code);
    console.log(`Room created: ${code} by player: ${playerId}`);
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerId, playerName }) => {
    const code = roomCode?.trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('error_message', 'Room not found. Please check the code.');
      return;
    }

    if (room.players.length >= 2 && !room.players.some(p => p.id === playerId)) {
      socket.emit('error_message', 'This room is already full (maximum 2 players).');
      return;
    }

    // Check if player is reconnecting
    let player = room.players.find(p => p.id === playerId);

    if (player) {
      // Reconnection path
      console.log(`Player rejoining/reconnecting: ${playerId} to room ${code}`);
      
      // Clear disconnect timer if running
      if (disconnectTimeouts.has(playerId)) {
        clearTimeout(disconnectTimeouts.get(playerId));
        disconnectTimeouts.delete(playerId);
      }

      // Map the old socketId away, clean up socket maps
      socketToRoom.delete(player.socketId);
      
      player.socketId = socket.id;
      player.connected = true;
      if (playerName) player.name = playerName;
    } else {
      // New player joins
      player = {
        id: playerId,
        name: playerName || 'Player 2',
        socketId: socket.id,
        isHost: false,
        connected: true,
        score: 0
      };
      room.players.push(player);
    }

    socketToRoom.set(socket.id, code);
    socket.join(code);

    socket.emit('room_joined', { code, player });
    broadcastRoomUpdate(code);
    
    // Notify the room
    io.to(code).emit('chat_message', {
      sender: 'System',
      text: `${player.name} joined the room!`,
      timestamp: Date.now()
    });

    console.log(`Player joined: ${playerId} to room ${code}`);
  });

  // Reconnect with persistent player ID and room code manually requested
  socket.on('reconnect_player', ({ roomCode, playerId }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('reconnect_failed', 'Room does not exist anymore.');
      return;
    }
    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      socket.emit('reconnect_failed', 'You are not a member of this room.');
      return;
    }

    // Recover connection
    if (disconnectTimeouts.has(playerId)) {
      clearTimeout(disconnectTimeouts.get(playerId));
      disconnectTimeouts.delete(playerId);
    }

    socketToRoom.delete(player.socketId);
    player.socketId = socket.id;
    player.connected = true;
    
    socketToRoom.set(socket.id, roomCode);
    socket.join(roomCode);

    socket.emit('room_joined', { code: roomCode, player });
    broadcastRoomUpdate(roomCode);
    console.log(`Manual reconnect success for ${playerId} in room ${roomCode}`);
  });

  // Change Nickname
  socket.on('change_nickname', ({ name }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    const oldName = player.name;
    player.name = name;
    broadcastRoomUpdate(room.code);

    io.to(room.code).emit('chat_message', {
      sender: 'System',
      text: `${oldName} changed their name to ${name}`,
      timestamp: Date.now()
    });
  });

  // Chat message
  socket.on('send_message', ({ text }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    io.to(room.code).emit('chat_message', {
      sender: player.name,
      senderId: player.id,
      text: text,
      timestamp: Date.now()
    });
  });

  // Floating Reaction
  socket.on('send_reaction', ({ emoji }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    io.to(room.code).emit('floating_reaction', {
      senderId: player.id,
      emoji: emoji
    });
  });

  // Choose / Change current game
  socket.on('select_game', ({ gameName }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.currentGame = gameName;
    
    // Reset specific game states when switching
    if (gameName === 'sameBrain') {
      room.gameStates.sameBrain.answers = {};
      room.gameStates.sameBrain.prompt = '';
    } else if (gameName === 'wouldYouRather') {
      room.gameStates.wouldYouRather.choices = {};
      room.gameStates.wouldYouRather.question = null;
    } else if (gameName === 'secretMessage') {
      room.gameStates.secretMessage.messages = {};
      room.gameStates.secretMessage.revealed = false;
    } else if (gameName === 'whoKnowsMeBetter') {
      room.gameStates.whoKnowsMeBetter.question = '';
      room.gameStates.whoKnowsMeBetter.answererSecret = '';
      room.gameStates.whoKnowsMeBetter.guess = '';
      room.gameStates.whoKnowsMeBetter.step = 'answering';
      // Pick host or random first player as initial answerer
      room.gameStates.whoKnowsMeBetter.answererId = room.players[0]?.id || '';
    } else if (gameName === 'fastestTap') {
      room.gameStates.fastestTap.round = 1;
      room.gameStates.fastestTap.results = {};
      room.gameStates.fastestTap.scores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
      room.gameStates.fastestTap.state = 'waiting';
    } else if (gameName === 'truthOrDare') {
      room.gameStates.truthOrDare.category = '';
      room.gameStates.truthOrDare.type = '';
      room.gameStates.truthOrDare.prompt = '';
      room.gameStates.truthOrDare.targetPlayerId = '';
    } else if (gameName === 'guessMyMood') {
      room.gameStates.guessMyMood.moodEmoji = '';
      room.gameStates.guessMyMood.guessEmoji = '';
      room.gameStates.guessMyMood.step = 'selecting';
      // Select first player as answerer
      room.gameStates.guessMyMood.answererId = room.players[0]?.id || '';
    } else if (gameName === 'loveBingo') {
      room.gameStates.loveBingo.tasks = [];
      room.gameStates.loveBingo.boards = {};
      room.gameStates.loveBingo.bingos = {};
    }

    broadcastRoomUpdate(room.code);
  });

  // Leave active game (back to menu)
  socket.on('leave_game', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.currentGame = null;
    broadcastRoomUpdate(room.code);
  });

  // GAME 1: Same Brain
  socket.on('same_brain_init_prompt', ({ prompt }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;
    room.gameStates.sameBrain.prompt = prompt;
    room.gameStates.sameBrain.answers = {};
    if (!room.gameStates.sameBrain.history.includes(prompt)) {
      room.gameStates.sameBrain.history.push(prompt);
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('same_brain_submit', ({ answer }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.sameBrain.answers[player.id] = answer.trim().toLowerCase();
    
    // Check if both players have submitted
    const activePlayers = room.players.filter(p => p.connected);
    const submittedCount = Object.keys(room.gameStates.sameBrain.answers).length;
    
    if (submittedCount >= room.players.length) {
      // Determine if they match
      const answers = Object.values(room.gameStates.sameBrain.answers);
      const isMatch = answers.length >= 2 && answers[0] === answers[1] && answers[0] !== '';
      
      if (isMatch) {
        // Increment both scores
        room.players.forEach(p => p.score += 1);
      }
      
      io.to(room.code).emit('same_brain_result', {
        answers: room.gameStates.sameBrain.answers,
        match: isMatch
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  // GAME 2: Would You Rather
  socket.on('wyr_init_question', ({ question }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;
    room.gameStates.wouldYouRather.question = question;
    room.gameStates.wouldYouRather.choices = {};
    if (!room.gameStates.wouldYouRather.history.includes(question.text)) {
      room.gameStates.wouldYouRather.history.push(question.text);
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('wyr_submit', ({ choice }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.wouldYouRather.choices[player.id] = choice;
    const submittedCount = Object.keys(room.gameStates.wouldYouRather.choices).length;

    if (submittedCount >= room.players.length) {
      const choices = Object.values(room.gameStates.wouldYouRather.choices);
      const isMatch = choices.length >= 2 && choices[0] === choices[1];
      
      io.to(room.code).emit('wyr_result', {
        choices: room.gameStates.wouldYouRather.choices,
        match: isMatch
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  // GAME 3: Secret Message
  socket.on('secret_message_submit', ({ message }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.secretMessage.messages[player.id] = message.slice(0, 150);
    const submittedCount = Object.keys(room.gameStates.secretMessage.messages).length;

    if (submittedCount >= room.players.length) {
      // Both submitted, trigger countdown
      io.to(room.code).emit('secret_message_countdown');
      setTimeout(() => {
        const currentRoom = rooms.get(room.code);
        if (currentRoom) {
          currentRoom.gameStates.secretMessage.revealed = true;
          broadcastRoomUpdate(currentRoom.code);
        }
      }, 3500); // 3 seconds countdown + margin
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('secret_message_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;
    room.gameStates.secretMessage.messages = {};
    room.gameStates.secretMessage.revealed = false;
    broadcastRoomUpdate(room.code);
  });

  // GAME 4: Who Knows Me Better
  socket.on('wymb_init_question', ({ question }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;
    room.gameStates.whoKnowsMeBetter.question = question;
    room.gameStates.whoKnowsMeBetter.answererSecret = '';
    room.gameStates.whoKnowsMeBetter.guess = '';
    room.gameStates.whoKnowsMeBetter.step = 'answering';
    if (!room.gameStates.whoKnowsMeBetter.history.includes(question)) {
      room.gameStates.whoKnowsMeBetter.history.push(question);
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('wymb_submit_answer', ({ secret }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    if (player.id !== room.gameStates.whoKnowsMeBetter.answererId) return;

    room.gameStates.whoKnowsMeBetter.answererSecret = secret.trim();
    room.gameStates.whoKnowsMeBetter.step = 'guessing';
    broadcastRoomUpdate(room.code);
  });

  socket.on('wymb_submit_guess', ({ guess }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    if (player.id === room.gameStates.whoKnowsMeBetter.answererId) return;

    room.gameStates.whoKnowsMeBetter.guess = guess.trim();
    room.gameStates.whoKnowsMeBetter.step = 'reveal';

    // Award point to guesser if correct (case-insensitive check)
    const secret = room.gameStates.whoKnowsMeBetter.answererSecret.toLowerCase();
    const guessVal = guess.trim().toLowerCase();
    const isCorrect = secret === guessVal;

    if (isCorrect) {
      player.score += 1;
    }

    io.to(room.code).emit('wymb_result', {
      isCorrect,
      answererSecret: room.gameStates.whoKnowsMeBetter.answererSecret,
      guess: room.gameStates.whoKnowsMeBetter.guess
    });
  });

  socket.on('wymb_next_round', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    // Swap answerer
    const currentAnswererIndex = room.players.findIndex(p => p.id === room.gameStates.whoKnowsMeBetter.answererId);
    const nextAnswererIndex = (currentAnswererIndex + 1) % room.players.length;
    
    room.gameStates.whoKnowsMeBetter.answererId = room.players[nextAnswererIndex]?.id || '';
    room.gameStates.whoKnowsMeBetter.question = '';
    room.gameStates.whoKnowsMeBetter.answererSecret = '';
    room.gameStates.whoKnowsMeBetter.guess = '';
    room.gameStates.whoKnowsMeBetter.step = 'answering';

    broadcastRoomUpdate(room.code);
  });

  // GAME 5: Fastest Tap
  socket.on('fastest_tap_start', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.gameStates.fastestTap.state = 'countdown';
    room.gameStates.fastestTap.results = {};
    broadcastRoomUpdate(room.code);

    // Pick random delay between 2 and 6 seconds
    const delay = Math.floor(Math.random() * 4000) + 2000;
    
    io.to(room.code).emit('fastest_tap_countdown_start', { delay });

    setTimeout(() => {
      const activeRoom = rooms.get(room.code);
      if (activeRoom && activeRoom.gameStates.fastestTap.state === 'countdown') {
        activeRoom.gameStates.fastestTap.state = 'go';
        broadcastRoomUpdate(activeRoom.code);
      }
    }, delay + 3000); // 3 seconds count down on client, then delay
  });

  socket.on('fastest_tap_submit', ({ timeMs }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    if (room.gameStates.fastestTap.state !== 'go') return;

    room.gameStates.fastestTap.results[player.id] = timeMs;

    const submittedCount = Object.keys(room.gameStates.fastestTap.results).length;

    if (submittedCount >= room.players.length) {
      // Find winner of this round
      const playerIds = Object.keys(room.gameStates.fastestTap.results);
      const time1 = room.gameStates.fastestTap.results[playerIds[0]];
      const time2 = room.gameStates.fastestTap.results[playerIds[1]];

      let roundWinnerId = null;
      if (time1 < time2) {
        roundWinnerId = playerIds[0];
      } else if (time2 < time1) {
        roundWinnerId = playerIds[1];
      }

      if (roundWinnerId) {
        room.gameStates.fastestTap.scores[roundWinnerId] = (room.gameStates.fastestTap.scores[roundWinnerId] || 0) + 1;
      }

      room.gameStates.fastestTap.state = 'result';

      // Check if match over (best of 5, first to 3 points)
      let matchWinnerId = null;
      room.players.forEach(p => {
        if (room.gameStates.fastestTap.scores[p.id] >= 3) {
          matchWinnerId = p.id;
          p.score += 1; // Award overall point
        }
      });

      if (matchWinnerId) {
        room.gameStates.fastestTap.state = 'match_over';
        room.gameStates.fastestTap.winner = matchWinnerId;
      }

      io.to(room.code).emit('fastest_tap_round_result', {
        results: room.gameStates.fastestTap.results,
        roundWinnerId,
        scores: room.gameStates.fastestTap.scores,
        matchWinnerId
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('fastest_tap_next_round', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.gameStates.fastestTap.round += 1;
    room.gameStates.fastestTap.results = {};
    room.gameStates.fastestTap.state = 'waiting';
    broadcastRoomUpdate(room.code);
  });

  socket.on('fastest_tap_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.gameStates.fastestTap.round = 1;
    room.gameStates.fastestTap.results = {};
    room.gameStates.fastestTap.scores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
    room.gameStates.fastestTap.state = 'waiting';
    room.gameStates.fastestTap.winner = null;
    broadcastRoomUpdate(room.code);
  });

  // GAME 6: Truth or Dare
  socket.on('truth_or_dare_spin', ({ category, type, prompt, targetPlayerId }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    // Trigger spin animation on client
    io.to(room.code).emit('truth_or_dare_spinned', {
      targetPlayerId,
      category,
      type,
      prompt
    });

    // Update state
    room.gameStates.truthOrDare = {
      category,
      type,
      prompt,
      targetPlayerId
    };
  });

  // GAME 7: Guess My Mood
  socket.on('guess_mood_select', ({ emoji }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    if (player.id !== room.gameStates.guessMyMood.answererId) return;

    room.gameStates.guessMyMood.moodEmoji = emoji;
    room.gameStates.guessMyMood.step = 'guessing';
    broadcastRoomUpdate(room.code);
  });

  socket.on('guess_mood_submit', ({ guessEmoji }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    if (player.id === room.gameStates.guessMyMood.answererId) return;

    room.gameStates.guessMyMood.guessEmoji = guessEmoji;
    room.gameStates.guessMyMood.step = 'reveal';

    const isCorrect = room.gameStates.guessMyMood.moodEmoji === guessEmoji;
    if (isCorrect) {
      player.score += 1;
    }

    io.to(room.code).emit('guess_mood_result', {
      isCorrect,
      moodEmoji: room.gameStates.guessMyMood.moodEmoji,
      guessEmoji: room.gameStates.guessMyMood.guessEmoji
    });
  });

  socket.on('guess_mood_next', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    // Swap roles
    const currentAnswererIndex = room.players.findIndex(p => p.id === room.gameStates.guessMyMood.answererId);
    const nextAnswererIndex = (currentAnswererIndex + 1) % room.players.length;

    room.gameStates.guessMyMood.answererId = room.players[nextAnswererIndex]?.id || '';
    room.gameStates.guessMyMood.moodEmoji = '';
    room.gameStates.guessMyMood.guessEmoji = '';
    room.gameStates.guessMyMood.step = 'selecting';

    broadcastRoomUpdate(room.code);
  });

  // GAME 8: Love Bingo
  socket.on('bingo_init', ({ tasks, boards }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.gameStates.loveBingo.tasks = tasks;
    room.gameStates.loveBingo.boards = boards; // Map: playerId -> { grid: array, marked: [] }
    room.gameStates.loveBingo.bingos = {};
    broadcastRoomUpdate(room.code);
  });

  socket.on('bingo_mark', ({ index }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    const board = room.gameStates.loveBingo.boards[player.id];
    if (!board) return;

    // Toggle mark
    if (board.marked.includes(index)) {
      board.marked = board.marked.filter(i => i !== index);
    } else {
      board.marked.push(index);
    }

    // Check for Bingo
    const size = 5;
    const marked = new Set(board.marked);
    let hasBingo = false;

    // Check rows
    for (let r = 0; r < size; r++) {
      let rowFull = true;
      for (let c = 0; c < size; c++) {
        if (!marked.has(r * size + c)) rowFull = false;
      }
      if (rowFull) hasBingo = true;
    }

    // Check columns
    for (let c = 0; c < size; c++) {
      let colFull = true;
      for (let r = 0; r < size; r++) {
        if (!marked.has(r * size + c)) colFull = false;
      }
      if (colFull) hasBingo = true;
    }

    // Diagonal 1 (\)
    let diag1Full = true;
    for (let i = 0; i < size; i++) {
      if (!marked.has(i * size + i)) diag1Full = false;
    }
    if (diag1Full) hasBingo = true;

    // Diagonal 2 (/)
    let diag2Full = true;
    for (let i = 0; i < size; i++) {
      if (!marked.has(i * size + (size - 1 - i))) diag2Full = false;
    }
    if (diag2Full) hasBingo = true;

    const hadBingoBefore = room.gameStates.loveBingo.bingos[player.id];
    room.gameStates.loveBingo.bingos[player.id] = hasBingo;

    // If bingo achieved first time in this game session, award point
    if (hasBingo && !hadBingoBefore) {
      player.score += 1;
      io.to(room.code).emit('bingo_achieved', { playerId: player.id, name: player.name });
    }

    broadcastRoomUpdate(room.code);
  });

  socket.on('bingo_reset', ({ tasks, boards }) => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.gameStates.loveBingo.tasks = tasks;
    room.gameStates.loveBingo.boards = boards;
    room.gameStates.loveBingo.bingos = {};
    broadcastRoomUpdate(room.code);
  });

  // Global score reset
  socket.on('reset_scores', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    room.players.forEach(p => p.score = 0);
    broadcastRoomUpdate(room.code);
  });

  // Explicit leave room
  socket.on('leave_room', () => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    console.log(`Player ${player.id} explicitly leaving room ${room.code}`);
    socket.leave(room.code);
    socketToRoom.delete(socket.id);

    // Remove player
    room.players = room.players.filter(p => p.id !== player.id);

    if (room.players.length === 0) {
      rooms.delete(room.code);
      console.log(`Room ${room.code} deleted (empty)`);
    } else {
      // Transfer host if host left
      if (player.isHost) {
        room.players[0].isHost = true;
      }
      // Notify remaining player
      io.to(room.code).emit('chat_message', {
        sender: 'System',
        text: `${player.name} left the room.`,
        timestamp: Date.now()
      });
      broadcastRoomUpdate(room.code);
    }
  });

  // Disconnection handler (grace period)
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    player.connected = false;
    broadcastRoomUpdate(room.code);

    // Send status to other player
    socket.to(room.code).emit('chat_message', {
      sender: 'System',
      text: `${player.name} disconnected. Waiting for reconnection...`,
      timestamp: Date.now()
    });

    // Start 15-second grace period timer
    const timeout = setTimeout(() => {
      const currentRoom = rooms.get(room.code);
      if (!currentRoom) return;

      const stillOffline = currentRoom.players.find(p => p.id === player.id && !p.connected);
      if (stillOffline) {
        console.log(`Grace period expired for player ${player.id} in room ${room.code}`);
        currentRoom.players = currentRoom.players.filter(p => p.id !== player.id);

        if (currentRoom.players.length === 0) {
          rooms.delete(room.code);
          console.log(`Room ${room.code} deleted (both players left/disconnected)`);
        } else {
          // Hand off host
          currentRoom.players[0].isHost = true;
          io.to(room.code).emit('chat_message', {
            sender: 'System',
            text: `${player.name} left the game.`,
            timestamp: Date.now()
          });
          broadcastRoomUpdate(room.code);
        }
      }
      disconnectTimeouts.delete(player.id);
    }, 15000);

    disconnectTimeouts.set(player.id, timeout);
    socketToRoom.delete(socket.id);
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve built React files if they exist
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA Routing Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Static build files not found. Run npm run build in client.');
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SoulSync Socket Server running on port ${PORT}`);
});
