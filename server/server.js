import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to soulsyncgames txt files (supports both lowercase and capitalized naming on Linux/Render)
let gamesFolderPath = path.join(__dirname, '../soulsyncgames');
if (!fs.existsSync(gamesFolderPath)) {
  gamesFolderPath = path.join(__dirname, '../SoulSyncGames');
}

// Load custom questions
function readTxtFile(fileName, fallbackArray) {
  try {
    const filePath = path.join(gamesFolderPath, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      if (lines.length > 0) {
        console.log(`[SOULSYNC GAMES] Loaded ${lines.length} prompts from ${fileName}`);
        return lines;
      }
    }
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
  }
  console.log(`[SOULSYNC GAMES] Using fallback prompts for ${fileName}`);
  return fallbackArray;
}

// Load custom ranking structure
function readRankingFile(fileName, fallbackArray) {
  try {
    const filePath = path.join(gamesFolderPath, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').map(line => line.trim());
      const groups = [];
      let currentGroup = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length === 0) {
          if (currentGroup && currentGroup.items.length === 5) {
            groups.push(currentGroup);
          }
          currentGroup = null;
          continue;
        }

        if (!currentGroup) {
          currentGroup = { category: line, items: [] };
        } else {
          currentGroup.items.push(line);
        }
      }
      
      if (currentGroup && currentGroup.items.length === 5) {
        groups.push(currentGroup);
      }

      if (groups.length > 0) {
        console.log(`[SOULSYNC GAMES] Loaded ${groups.length} ranking categories from ${fileName}`);
        return groups;
      }
    }
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
  }
  console.log(`[SOULSYNC GAMES] Using fallback prompts for ${fileName}`);
  return fallbackArray;
}

const FALLBACK_TRUTHS = [
  "What was your first thought about me?",
  "What do you like most about me?",
  "What is your dream date?",
  "What nickname would you give me?",
  "Do you believe in soulmates?"
];
const FALLBACK_DARES = [
  "Send me your cutest selfie.",
  "Say three nice things about me.",
  "Call me by a cute nickname.",
  "Do your cutest face.",
  "Make a heart with your hands."
];
const FALLBACK_WYR = [
  "Would you rather cuddle or kiss?",
  "Would you rather text all day or call all night?",
  "Would you rather watch a movie or go on a date?",
  "Would you rather stay home or travel together?",
  "Would you rather cook together or eat outside?"
];
const FALLBACK_SAME_BRAIN = [
  "Who says 'I love you' first?",
  "Who gets jealous first?",
  "Who apologizes first?",
  "Who falls asleep first?",
  "Who texts first?"
];
const FALLBACK_RED_GREEN = [
  "Replies after many hours.",
  "Claps when the plane lands.",
  "Still close friends with their ex.",
  "Has a separate Instagram account for their pet.",
  "Likes pineapple on pizza.",
  "Wears socks to bed.",
  "Doesn't tip at restaurants.",
  "Stalks exes on social media.",
  "Is always 15 minutes late.",
  "Double dips chips at parties.",
  "Watches movies with subtitles on.",
  "Saves contacts with emojis next to their names.",
  "Has never been out of their home state."
];

const FALLBACK_LIKELY = [
  "Forget an anniversary.",
  "Say 'I love you' first.",
  "Text first.",
  "Fall asleep first.",
  "Get jealous first.",
  "Cry during a movie.",
  "Spend more money.",
  "Get lost while traveling.",
  "Plan the date.",
  "Forget their phone."
];

const FALLBACK_THIS_OR_THAT = [
  "Hug or Kiss?",
  "Call or Text?",
  "Morning or Night?",
  "Beach or Mountains?",
  "Pizza or Burger?",
  "Coffee or Tea?",
  "Sunrise or Sunset?",
  "Cats or Dogs?",
  "Stay home or Travel?",
  "Chocolate or Flowers?"
];

const FALLBACK_DEBATE = [
  "Can exes be friends?",
  "Is love at first sight real?",
  "Should couples share passwords?",
  "Should couples text every day?",
  "Is jealousy cute?",
  "Should couples live together before marriage?",
  "Should couples post each other online?",
  "Is long-distance worth it?",
  "Should both partners pay on dates?",
  "Should couples tell each other everything?"
];

const FALLBACK_RANKING = [
  {
    category: "Rank these date ideas:",
    items: ["Beach picnic", "Movie night", "Cozy cafe", "Road trip", "Amusement park"]
  },
  {
    category: "Rank these gifts:",
    items: ["Flowers", "Chocolate box", "Fine jewelry", "Handmade photo scrap book", "Sincere love letter"]
  },
  {
    category: "Rank these vacation ideas:",
    items: ["Cabin in the woods", "Beach resort", "Exploring city sights", "Backpacking wilderness", "Luxury cruise ship"]
  }
];

const MASTER_PROMPTS = {
  truth: readTxtFile('truth.txt', FALLBACK_TRUTHS),
  dare: readTxtFile('dare.txt', FALLBACK_DARES),
  wyr: readTxtFile('soulsync-wouldurather.txt', FALLBACK_WYR),
  sameBrain: readTxtFile('same brain.txt', FALLBACK_SAME_BRAIN),
  redGreen: readTxtFile('redgreen.txt', FALLBACK_RED_GREEN),
  likely: readTxtFile('likely.txt', FALLBACK_LIKELY),
  thisOrThat: readTxtFile('thisorthat.txt', FALLBACK_THIS_OR_THAT),
  debate: readTxtFile('debate.txt', FALLBACK_DEBATE),
  ranking: readRankingFile('ranking.txt', FALLBACK_RANKING)
};

// Helper to shuffle arrays
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get next non-repeating prompt from pool
function getNextPrompt(room, type) {
  if (!room.promptPools) {
    room.promptPools = {
      truth: shuffleArray(MASTER_PROMPTS.truth),
      dare: shuffleArray(MASTER_PROMPTS.dare),
      wyr: shuffleArray(MASTER_PROMPTS.wyr),
      sameBrain: shuffleArray(MASTER_PROMPTS.sameBrain),
      redGreen: shuffleArray(MASTER_PROMPTS.redGreen)
    };
  }

  let pool = room.promptPools[type];
  if (!pool || pool.length === 0) {
    console.log(`[SOULSYNC GAMES] Room ${room.code} prompt pool for ${type} exhausted. Replenishing and shuffling.`);
    pool = shuffleArray(MASTER_PROMPTS[type]);
    room.promptPools[type] = pool;
  }

  return pool.pop();
}

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
        redGreen: { questionIndex: 1, situation: '', answers: {}, matches: 0, differences: 0, step: 'playing' },
        likely: { questionIndex: 1, prompt: '', answers: {}, matches: 0, differences: 0, step: 'playing' },
        thisOrThat: { questionIndex: 1, prompt: '', answers: {}, matches: 0, differences: 0, step: 'playing' },
        ranking: { questionIndex: 1, category: '', items: [], answers: {}, totalScore: 0, step: 'playing' },
        debate: { questionIndex: 1, prompt: '', answers: {}, agrees: 0, disagrees: 0, step: 'playing' },
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

  // Choose / Change current game (Host only)
  socket.on('select_game', ({ gameName }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player || !player.isHost) return;

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
      // Clear any remaining fastest tap timeouts
      if (room.gameStates.fastestTap.timeout) {
        clearTimeout(room.gameStates.fastestTap.timeout);
        room.gameStates.fastestTap.timeout = null;
      }
    } else if (gameName === 'truthOrDare') {
      room.gameStates.truthOrDare.category = '';
      room.gameStates.truthOrDare.type = '';
      room.gameStates.truthOrDare.prompt = '';
      room.gameStates.truthOrDare.targetPlayerId = '';
    } else if (gameName === 'redGreen') {
      const situation = getNextPrompt(room, 'redGreen');
      room.gameStates.redGreen = {
        questionIndex: 1,
        situation,
        answers: {},
        matches: 0,
        differences: 0,
        step: 'playing'
      };
    } else if (gameName === 'likely') {
      const prompt = getNextPrompt(room, 'likely');
      room.gameStates.likely = {
        questionIndex: 1,
        prompt,
        answers: {},
        matches: 0,
        differences: 0,
        step: 'playing'
      };
    } else if (gameName === 'thisOrThat') {
      const prompt = getNextPrompt(room, 'thisOrThat');
      room.gameStates.thisOrThat = {
        questionIndex: 1,
        prompt,
        answers: {},
        matches: 0,
        differences: 0,
        step: 'playing'
      };
    } else if (gameName === 'ranking') {
      const group = getNextPrompt(room, 'ranking');
      room.gameStates.ranking = {
        questionIndex: 1,
        category: group.category,
        items: group.items,
        answers: {},
        totalScore: 0,
        step: 'playing'
      };
    } else if (gameName === 'debate') {
      const prompt = getNextPrompt(room, 'debate');
      room.gameStates.debate = {
        questionIndex: 1,
        prompt,
        answers: {},
        agrees: 0,
        disagrees: 0,
        step: 'playing'
      };
    } else if (gameName === 'loveBingo') {
      room.gameStates.loveBingo.tasks = [];
      room.gameStates.loveBingo.boards = {};
      room.gameStates.loveBingo.bingos = {};
    }

    broadcastRoomUpdate(room.code);
  });

  // Leave active game (back to menu) (Either player can trigger)
  socket.on('leave_game', () => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.currentGame = null;
    
    // Clear any active fastest tap timeouts
    if (room.gameStates.fastestTap?.timeout) {
      clearTimeout(room.gameStates.fastestTap.timeout);
      room.gameStates.fastestTap.timeout = null;
    }

    broadcastRoomUpdate(room.code);
  });

  // GAME 1: Same Brain (Custom prompt selection from deck)
  socket.on('same_brain_init_prompt', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;
    
    const prompt = getNextPrompt(room, 'sameBrain');
    room.gameStates.sameBrain.prompt = prompt;
    room.gameStates.sameBrain.answers = {};
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

  // GAME 2: Would You Rather (Custom question selection from deck)
  socket.on('wyr_init_question', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;
    
    const text = getNextPrompt(room, 'wyr');
    room.gameStates.wouldYouRather.question = { text, cat: 'custom' };
    room.gameStates.wouldYouRather.choices = {};
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
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player || !player.isHost) return;

    // Clear any active timeouts
    if (room.gameStates.fastestTap.timeout) {
      clearTimeout(room.gameStates.fastestTap.timeout);
      room.gameStates.fastestTap.timeout = null;
    }

    room.gameStates.fastestTap.state = 'countdown';
    room.gameStates.fastestTap.results = {};
    broadcastRoomUpdate(room.code);

    // Pick random delay between 2 and 6 seconds
    const delay = Math.floor(Math.random() * 4000) + 2000;
    
    io.to(room.code).emit('fastest_tap_countdown_start', { delay });

    room.gameStates.fastestTap.timeout = setTimeout(() => {
      const activeRoom = rooms.get(room.code);
      if (activeRoom && activeRoom.gameStates.fastestTap.state === 'countdown') {
        activeRoom.gameStates.fastestTap.state = 'go';
        activeRoom.gameStates.fastestTap.timeout = null;
        broadcastRoomUpdate(activeRoom.code);
      }
    }, delay + 3000); // 3 seconds count down on client, then delay
  });

  socket.on('fastest_tap_submit', ({ timeMs }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    // Handle early tap (Foul) during countdown or delay
    if (timeMs === 9999) {
      if (room.gameStates.fastestTap.state === 'countdown') {
        // Clear active timeouts
        if (room.gameStates.fastestTap.timeout) {
          clearTimeout(room.gameStates.fastestTap.timeout);
          room.gameStates.fastestTap.timeout = null;
        }

        const foulingPlayerId = player.id;
        const nonFoulingPlayer = room.players.find(p => p.id !== foulingPlayerId);

        room.gameStates.fastestTap.results[foulingPlayerId] = 9999;
        if (nonFoulingPlayer) {
          room.gameStates.fastestTap.results[nonFoulingPlayer.id] = 0; // standard win
          room.gameStates.fastestTap.scores[nonFoulingPlayer.id] = (room.gameStates.fastestTap.scores[nonFoulingPlayer.id] || 0) + 1;
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
          roundWinnerId: nonFoulingPlayer ? nonFoulingPlayer.id : null,
          scores: room.gameStates.fastestTap.scores,
          matchWinnerId
        });
        return;
      }
    }

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
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player || !player.isHost) return;

    room.gameStates.fastestTap.round += 1;
    room.gameStates.fastestTap.results = {};
    room.gameStates.fastestTap.state = 'waiting';
    broadcastRoomUpdate(room.code);
  });

  socket.on('fastest_tap_reset', () => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player || !player.isHost) return;

    room.gameStates.fastestTap.round = 1;
    room.gameStates.fastestTap.results = {};
    room.gameStates.fastestTap.scores = room.players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
    room.gameStates.fastestTap.state = 'waiting';
    room.gameStates.fastestTap.winner = null;
    broadcastRoomUpdate(room.code);
  });

  // GAME 6: Truth or Dare (Custom prompt selection from deck)
  socket.on('truth_or_dare_spin', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const type = Math.random() > 0.5 ? 'truth' : 'dare';
    const prompt = getNextPrompt(room, type);
    const category = 'Custom';
    
    const targetPlayer = room.players[Math.floor(Math.random() * room.players.length)];
    const targetPlayerId = targetPlayer.id;

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

  // GAME 7: Red Flag or Green Flag
  socket.on('red_green_submit', ({ choice }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.redGreen.answers[player.id] = choice;

    const submittedCount = Object.keys(room.gameStates.redGreen.answers).length;
    if (submittedCount >= room.players.length) {
      // Both submitted!
      const playerIds = Object.keys(room.gameStates.redGreen.answers);
      const isMatch = room.gameStates.redGreen.answers[playerIds[0]] === room.gameStates.redGreen.answers[playerIds[1]];

      if (isMatch) {
        room.gameStates.redGreen.matches += 1;
        // Award point to both
        room.players.forEach(p => p.score += 1);
      } else {
        room.gameStates.redGreen.differences += 1;
      }

      room.gameStates.redGreen.step = 'reveal';
      
      io.to(room.code).emit('red_green_revealed', {
        answers: room.gameStates.redGreen.answers,
        match: isMatch
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('red_green_next', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const nextIndex = room.gameStates.redGreen.questionIndex + 1;
    if (nextIndex > 10) {
      // Game Over, show summary
      room.gameStates.redGreen.step = 'summary';
    } else {
      const situation = getNextPrompt(room, 'redGreen');
      room.gameStates.redGreen.questionIndex = nextIndex;
      room.gameStates.redGreen.situation = situation;
      room.gameStates.redGreen.answers = {};
      room.gameStates.redGreen.step = 'playing';
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('red_green_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const situation = getNextPrompt(room, 'redGreen');
    room.gameStates.redGreen = {
      questionIndex: 1,
      situation,
      answers: {},
      matches: 0,
      differences: 0,
      step: 'playing'
    };
    broadcastRoomUpdate(room.code);
  });

  // GAME: Who Is More Likely To
  socket.on('likely_submit', ({ choice }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.likely.answers[player.id] = choice;

    const submittedCount = Object.keys(room.gameStates.likely.answers).length;
    if (submittedCount >= room.players.length) {
      const playerIds = Object.keys(room.gameStates.likely.answers);
      const isMatch = room.gameStates.likely.answers[playerIds[0]] === room.gameStates.likely.answers[playerIds[1]];

      if (isMatch) {
        room.gameStates.likely.matches += 1;
        room.players.forEach(p => p.score += 1);
      } else {
        room.gameStates.likely.differences += 1;
      }

      room.gameStates.likely.step = 'reveal';
      
      io.to(room.code).emit('likely_revealed', {
        answers: room.gameStates.likely.answers,
        match: isMatch
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('likely_next', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const nextIndex = room.gameStates.likely.questionIndex + 1;
    if (nextIndex > 10) {
      room.gameStates.likely.step = 'summary';
    } else {
      const prompt = getNextPrompt(room, 'likely');
      room.gameStates.likely.questionIndex = nextIndex;
      room.gameStates.likely.prompt = prompt;
      room.gameStates.likely.answers = {};
      room.gameStates.likely.step = 'playing';
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('likely_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const prompt = getNextPrompt(room, 'likely');
    room.gameStates.likely = {
      questionIndex: 1,
      prompt,
      answers: {},
      matches: 0,
      differences: 0,
      step: 'playing'
    };
    broadcastRoomUpdate(room.code);
  });

  // GAME: This or That
  socket.on('this_or_that_submit', ({ choice }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.thisOrThat.answers[player.id] = choice;

    const submittedCount = Object.keys(room.gameStates.thisOrThat.answers).length;
    if (submittedCount >= room.players.length) {
      const playerIds = Object.keys(room.gameStates.thisOrThat.answers);
      const isMatch = room.gameStates.thisOrThat.answers[playerIds[0]] === room.gameStates.thisOrThat.answers[playerIds[1]];

      if (isMatch) {
        room.gameStates.thisOrThat.matches += 1;
        room.players.forEach(p => p.score += 1);
      } else {
        room.gameStates.thisOrThat.differences += 1;
      }

      room.gameStates.thisOrThat.step = 'reveal';
      
      io.to(room.code).emit('this_or_that_revealed', {
        answers: room.gameStates.thisOrThat.answers,
        match: isMatch
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('this_or_that_next', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const nextIndex = room.gameStates.thisOrThat.questionIndex + 1;
    if (nextIndex > 10) {
      room.gameStates.thisOrThat.step = 'summary';
    } else {
      const prompt = getNextPrompt(room, 'thisOrThat');
      room.gameStates.thisOrThat.questionIndex = nextIndex;
      room.gameStates.thisOrThat.prompt = prompt;
      room.gameStates.thisOrThat.answers = {};
      room.gameStates.thisOrThat.step = 'playing';
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('this_or_that_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const prompt = getNextPrompt(room, 'thisOrThat');
    room.gameStates.thisOrThat = {
      questionIndex: 1,
      prompt,
      answers: {},
      matches: 0,
      differences: 0,
      step: 'playing'
    };
    broadcastRoomUpdate(room.code);
  });

  // GAME: Secret Ranking
  socket.on('ranking_submit', ({ rankingList }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.ranking.answers[player.id] = rankingList;

    const submittedCount = Object.keys(room.gameStates.ranking.answers).length;
    if (submittedCount >= room.players.length) {
      const playerIds = Object.keys(room.gameStates.ranking.answers);
      const r1 = room.gameStates.ranking.answers[playerIds[0]] || [];
      const r2 = room.gameStates.ranking.answers[playerIds[1]] || [];
      
      let roundMatches = 0;
      for (let i = 0; i < 5; i++) {
        if (r1[i] === r2[i]) roundMatches++;
      }

      room.gameStates.ranking.totalScore += roundMatches;
      // Award point to both players for each match
      room.players.forEach(p => p.score += roundMatches);

      room.gameStates.ranking.step = 'reveal';
      
      io.to(room.code).emit('ranking_revealed', {
        answers: room.gameStates.ranking.answers
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('ranking_next', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const nextIndex = room.gameStates.ranking.questionIndex + 1;
    if (nextIndex > 5) {
      room.gameStates.ranking.step = 'summary';
    } else {
      const group = getNextPrompt(room, 'ranking');
      room.gameStates.ranking.questionIndex = nextIndex;
      room.gameStates.ranking.category = group.category;
      room.gameStates.ranking.items = group.items;
      room.gameStates.ranking.answers = {};
      room.gameStates.ranking.step = 'playing';
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('ranking_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const group = getNextPrompt(room, 'ranking');
    room.gameStates.ranking = {
      questionIndex: 1,
      category: group.category,
      items: group.items,
      answers: {},
      totalScore: 0,
      step: 'playing'
    };
    broadcastRoomUpdate(room.code);
  });

  // GAME: Relationship Debate
  socket.on('debate_submit', ({ choice }) => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player) return;

    room.gameStates.debate.answers[player.id] = choice;

    const submittedCount = Object.keys(room.gameStates.debate.answers).length;
    if (submittedCount >= room.players.length) {
      const playerIds = Object.keys(room.gameStates.debate.answers);
      const isMatch = room.gameStates.debate.answers[playerIds[0]] === room.gameStates.debate.answers[playerIds[1]];

      if (isMatch) {
        room.gameStates.debate.agrees += 1;
      } else {
        room.gameStates.debate.disagrees += 1;
      }

      room.gameStates.debate.step = 'reveal';
      
      io.to(room.code).emit('debate_revealed', {
        answers: room.gameStates.debate.answers,
        match: isMatch
      });
    } else {
      broadcastRoomUpdate(room.code);
    }
  });

  socket.on('debate_next', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const nextIndex = room.gameStates.debate.questionIndex + 1;
    if (nextIndex > 10) {
      room.gameStates.debate.step = 'summary';
    } else {
      const prompt = getNextPrompt(room, 'debate');
      room.gameStates.debate.questionIndex = nextIndex;
      room.gameStates.debate.prompt = prompt;
      room.gameStates.debate.answers = {};
      room.gameStates.debate.step = 'playing';
    }
    broadcastRoomUpdate(room.code);
  });

  socket.on('debate_reset', () => {
    const { room } = getRoomAndPlayer(socket);
    if (!room) return;

    const prompt = getNextPrompt(room, 'debate');
    room.gameStates.debate = {
      questionIndex: 1,
      prompt,
      answers: {},
      agrees: 0,
      disagrees: 0,
      step: 'playing'
    };
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
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player || !player.isHost) return;

    room.gameStates.loveBingo.tasks = tasks;
    room.gameStates.loveBingo.boards = boards;
    room.gameStates.loveBingo.bingos = {};
    broadcastRoomUpdate(room.code);
  });

  // Global score reset (Host only)
  socket.on('reset_scores', () => {
    const { room, player } = getRoomAndPlayer(socket);
    if (!room || !player || !player.isHost) return;

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
