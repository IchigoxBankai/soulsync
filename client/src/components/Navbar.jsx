import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Sun, Moon, Volume2, VolumeX, LogOut, Edit2, Check } from 'lucide-react';
import { audioController } from '../utils/audio';

export const Navbar = () => {
  const { room, player, leaveRoom, leaveGame, changeNickname, connectionStatus } = useSocket();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    // Dark mode init
    const savedTheme = localStorage.getItem('soulsync_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }

    // Audio init
    audioController.initFromStorage();
    setIsMuted(audioController.getMute());
  }, []);

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    if (newVal) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('soulsync_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('soulsync_theme', 'light');
    }
    audioController.playClick();
  };

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    audioController.setMute(newVal);
    if (!newVal) {
      // Play a quick test click to confirm unmute
      audioController.playClick();
    }
  };

  const handleStartEdit = () => {
    if (player) {
      setNewName(player.name);
      setIsEditingName(true);
      audioController.playClick();
    }
  };

  const handleSaveName = (e) => {
    e.preventDefault();
    if (newName.trim() && newName.trim().length <= 15) {
      changeNickname(newName.trim());
      setIsEditingName(false);
      audioController.playClick();
    }
  };

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave the room? Your scores will be reset.')) {
      leaveRoom();
      audioController.playClick();
    }
  };

  return (
    <nav className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4 select-none">
      {/* Brand logo & title */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-yellow-600 bg-clip-text text-transparent drop-shadow-sm select-none">
          SoulSync
        </span>
        
        {/* Connection status badge */}
        <div className="flex items-center gap-1.5 ml-2">
          <span 
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' 
                : connectionStatus === 'reconnecting' 
                ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]' 
                : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
            }`} 
            title={`Status: ${connectionStatus}`}
          />
          <span className="hidden sm:inline text-[10px] uppercase font-semibold tracking-wider text-slate-400 dark:text-slate-500">
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Center user info if in room */}
      {room && player && (
        <div className="flex items-center gap-1.5 glass py-1 px-3 rounded-full border border-pink-200/20 text-xs shadow-sm max-w-[150px] sm:max-w-[200px]">
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={15}
                autoFocus
                className="w-20 bg-transparent border-b border-pink-400 focus:outline-none dark:text-white"
              />
              <button type="submit" className="text-emerald-500 hover:scale-110 p-0.5">
                <Check size={14} />
              </button>
            </form>
          ) : (
            <>
              <span className="truncate font-semibold dark:text-white" title={player.name}>
                {player.name}
              </span>
              <button 
                onClick={handleStartEdit} 
                className="text-slate-400 hover:text-pink-500 hover:scale-110 transition-colors p-0.5"
                title="Edit Nickname"
              >
                <Edit2 size={12} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Settings tools (Mute, Light/Dark, Leave) */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleMute}
          className="p-2 rounded-full glass hover:bg-white/30 dark:hover:bg-slate-800/40 border border-pink-200/20 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full glass hover:bg-white/30 dark:hover:bg-slate-800/40 border border-pink-200/20 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
          title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {room && room.currentGame ? (
          <button
            onClick={() => {
              leaveGame();
              audioController.playClick();
            }}
            className="p-2 rounded-full glass hover:bg-rose-500/20 border border-rose-200/30 text-rose-500 dark:text-rose-400 hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold px-3"
            title="Leave Current Game"
          >
            <LogOut size={14} />
            <span>Leave Game</span>
          </button>
        ) : room ? (
          <button
            onClick={handleLeave}
            className="p-2 rounded-full glass hover:bg-rose-500/20 border border-rose-200/30 text-rose-500 dark:text-rose-400 hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold px-3"
            title="Leave Room"
          >
            <LogOut size={14} />
            <span>Leave Room</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
};
