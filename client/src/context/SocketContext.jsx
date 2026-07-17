import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Dynamically target the backend server. If local, target port 5000 on the same host IP. In production, use relative origin.
const getSocketServerUrl = () => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || 
                  host === '127.0.0.1' || 
                  host.startsWith('192.168.') || 
                  host.startsWith('10.') || 
                  host.startsWith('172.');
  return isLocal ? `http://${host}:5000` : '';
};

const SOCKET_SERVER_URL = getSocketServerUrl();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]); // Array of { id, emoji, x }

  // Generate or retrieve persistent playerId from localStorage
  const [playerId] = useState(() => {
    let id = localStorage.getItem('soulsync_player_id');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('soulsync_player_id', id);
    }
    return id;
  });

  useEffect(() => {
    console.log('Initializing Socket connection to:', SOCKET_SERVER_URL);
    setConnectionStatus('connecting');

    const newSocket = io(SOCKET_SERVER_URL, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', newSocket.id);
      setConnectionStatus('connected');

      // Attempt auto-reconnect if room code and player ID exist in storage
      const savedRoomCode = localStorage.getItem('soulsync_room_code');
      if (savedRoomCode) {
        newSocket.emit('reconnect_player', {
          roomCode: savedRoomCode,
          playerId: playerId
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('reconnecting');
    });

    newSocket.on('reconnect_failed', (err) => {
      console.warn('Socket reconnection failed:', err);
      setConnectionStatus('disconnected');
      // Clear invalid storage
      localStorage.removeItem('soulsync_room_code');
      setRoom(null);
      setPlayer(null);
    });

    newSocket.on('room_created', ({ code, player }) => {
      localStorage.setItem('soulsync_room_code', code);
      setPlayer(player);
      setMessages([]);
    });

    newSocket.on('room_joined', ({ code, player }) => {
      localStorage.setItem('soulsync_room_code', code);
      setPlayer(player);
      setMessages([]);
    });

    newSocket.on('room_updated', (updatedRoom) => {
      setRoom(updatedRoom);
      
      // Update local player state references from room lists
      const localMe = updatedRoom.players.find(p => p.id === playerId);
      if (localMe) {
        setPlayer(localMe);
      }
    });

    newSocket.on('chat_message', (msg) => {
      setMessages((prev) => [...prev.slice(-49), msg]); // Keep last 50 messages
    });

    newSocket.on('floating_reaction', ({ senderId, emoji }) => {
      // Create a floating reaction with a unique ID and random horizontal position
      const reaction = {
        id: Math.random().toString(36).substring(2, 9),
        emoji,
        senderId,
        x: Math.floor(Math.random() * 80) + 10 // 10% to 90% screen width
      };
      setReactions((prev) => [...prev, reaction]);
      
      // Auto clean up after animation finishes (4 seconds)
      setTimeout(() => {
        setReactions((prev) => prev.filter(r => r.id !== reaction.id));
      }, 4000);
    });

    newSocket.on('error_message', (err) => {
      alert(err); // Basic alert popup for errors
    });

    // Reset handler when room deleted or user gets kicked
    newSocket.on('reconnect_failed', () => {
      localStorage.removeItem('soulsync_room_code');
      setRoom(null);
      setPlayer(null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [playerId]);

  const createRoom = (playerName) => {
    if (socket) {
      socket.emit('create_room', { playerId, playerName });
    }
  };

  const joinRoom = (roomCode, playerName) => {
    if (socket) {
      socket.emit('join_room', { roomCode, playerId, playerName });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave_room');
      localStorage.removeItem('soulsync_room_code');
      setRoom(null);
      setPlayer(null);
      setMessages([]);
    }
  };

  const selectGame = (gameName) => {
    if (socket) {
      socket.emit('select_game', { gameName });
    }
  };

  const leaveGame = () => {
    if (socket) {
      socket.emit('leave_game');
    }
  };

  const changeNickname = (name) => {
    if (socket) {
      socket.emit('change_nickname', { name });
    }
  };

  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('send_message', { text });
    }
  };

  const sendReaction = (emoji) => {
    if (socket) {
      socket.emit('send_reaction', { emoji });
    }
  };

  const resetScores = () => {
    if (socket) {
      socket.emit('reset_scores');
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      room,
      player,
      playerId,
      connectionStatus,
      messages,
      reactions,
      createRoom,
      joinRoom,
      leaveRoom,
      selectGame,
      leaveGame,
      changeNickname,
      sendMessage,
      sendReaction,
      resetScores
    }}>
      {children}
    </SocketContext.Provider>
  );
};
