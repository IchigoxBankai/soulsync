import React, { useState, useEffect } from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Scoreboard } from './components/Scoreboard';
import { Chat } from './components/Chat';
import { SameBrain } from './components/games/SameBrain';
import { WouldYouRather } from './components/games/WouldYouRather';
import { SecretMessage } from './components/games/SecretMessage';
import { WhoKnowsMeBetter } from './components/games/WhoKnowsMeBetter';
import { WhatsMyExcuse } from './components/games/WhatsMyExcuse';
import { TruthOrDare } from './components/games/TruthOrDare';
import { RedGreen } from './components/games/RedGreen';
import { Likely } from './components/games/Likely';
import { ThisOrThat } from './components/games/ThisOrThat';
import { Ranking } from './components/games/Ranking';
import { Debate } from './components/games/Debate';
import { NeverHaveIEver } from './components/games/NeverHaveIEver';
import { audioController } from './utils/audio';
import { Copy, Check, Users, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';

const MainApp = () => {
  const { 
    room, 
    player, 
    createRoom, 
    joinRoom, 
    selectGame, 
    connectionStatus 
  } = useSocket();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);

  // Theme options state
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('soulsync_theme_color') || 'sunset';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('soulsync_theme_color', currentTheme);
  }, [currentTheme]);

  const changeTheme = (themeId) => {
    setCurrentTheme(themeId);
    audioController.playClick();
  };

  const themes = [
    { id: 'sunset', name: 'Sunset Love', emoji: '🌅', c1: '#ff2a55', c2: '#eab308' },
    { id: 'midnight', name: 'Midnight', emoji: '🔮', c1: '#ff2a55', c2: '#8b5cf6' },
    { id: 'forest', name: 'Nordic Forest', emoji: '🌲', c1: '#10b981', c2: '#f59e0b' },
    { id: 'ocean', name: 'Ocean Breeze', emoji: '🌊', c1: '#06b6d4', c2: '#3b82f6' }
  ];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createRoom(name.trim());
    audioController.playClick();
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    joinRoom(code.trim(), name.trim());
    audioController.playClick();
  };

  const handleCopy = () => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      audioController.playClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Render game component based on room's currentGame selection
  const renderGame = () => {
    switch (room?.currentGame) {
      case 'sameBrain':
        return <SameBrain />;
      case 'wouldYouRather':
        return <WouldYouRather />;
      case 'secretMessage':
        return <SecretMessage />;
      case 'whoKnowsMeBetter':
        return <WhoKnowsMeBetter />;
      case 'whatsMyExcuse':
        return <WhatsMyExcuse />;
      case 'truthOrDare':
        return <TruthOrDare />;
      case 'redGreen':
        return <RedGreen />;
      case 'likely':
        return <Likely />;
      case 'thisOrThat':
        return <ThisOrThat />;
      case 'ranking':
        return <Ranking />;
      case 'debate':
        return <Debate />;
      case 'neverHaveIEver':
        return <NeverHaveIEver />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-playful dark:bg-gradient-playful flex flex-col transition-colors duration-300 pb-12 overflow-x-hidden">
      <Navbar />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 flex flex-col justify-center items-center py-6">
        
        {/* Connection Offline Banner */}
        {connectionStatus === 'disconnected' && (
          <div className="mb-6 glass border border-rose-300/30 text-rose-500 font-bold p-3 rounded-2xl flex items-center gap-2 text-sm shadow-md animate-bounce">
            <ShieldAlert size={18} />
            <span>Disconnected from server. Attempting to reconnect...</span>
          </div>
        )}

        {/* LOBBY / HOME SCREEN (If no room is joined yet) */}
        {!room ? (
          <>
            <div className="w-full max-w-md glass rounded-3xl p-6 sm:p-8 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div>
                <span className="text-4xl select-none">❤️</span>
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-500 to-yellow-600 bg-clip-text text-transparent mt-2 tracking-wide font-outfit select-none">
                  SoulSync
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Play fun mini games together anywhere in the world.
                </p>
              </div>

              {/* Entry fields Form */}
              <div className="w-full flex flex-col gap-4">
                <div className="flex flex-col text-left gap-1">
                  <label className="text-[10px] tracking-wider uppercase font-bold text-pink-500 pl-1">Your Nickname</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={15}
                    className="glass-input px-4 py-3 rounded-2xl font-semibold text-slate-700 dark:text-white"
                  />
                </div>

                {!isJoining ? (
                  // Home Actions
                  <div className="flex flex-col gap-3 mt-2 w-full">
                    <button
                      disabled={!name.trim()}
                      onClick={handleCreate}
                      className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-yellow-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold text-base rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Create Room</span>
                    </button>
                    <button
                      disabled={!name.trim()}
                      onClick={() => {
                        setIsJoining(true);
                        audioController.playClick();
                      }}
                      className="w-full py-3.5 glass hover:bg-white/30 text-slate-700 dark:text-slate-300 disabled:opacity-50 font-bold text-base rounded-2xl shadow-md border border-pink-200/30 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <span>Join Existing Room</span>
                    </button>
                  </div>
                ) : (
                  // Joining Screen Form
                  <form onSubmit={handleJoin} className="w-full flex flex-col gap-3 mt-2 animate-in slide-in-from-right duration-200">
                    <div className="flex flex-col text-left gap-1">
                      <label className="text-[10px] tracking-wider uppercase font-bold text-yellow-500 pl-1">6-Digit Room Code</label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="e.g. 123456"
                        className="glass-input px-4 py-3 rounded-2xl text-center font-bold text-lg tracking-widest text-slate-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsJoining(false);
                          audioController.playClick();
                        }}
                        className="flex-1 py-3 bg-slate-400/20 hover:bg-slate-400/30 text-slate-700 dark:text-slate-200 font-bold rounded-2xl active:scale-95 transition-transform"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={!code.trim() || code.length < 6}
                        className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-1.5 shadow"
                      >
                        <span>Join</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Home Screen Theme Selector */}
            <div className="w-full max-w-md glass rounded-3xl p-5 border border-pink-200/15 flex flex-col gap-4 mt-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5 pl-1 justify-center">
                <Sparkles size={16} className="text-pink-500 fill-pink-500 animate-pulse" />
                <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                  Choose App Theme
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => changeTheme(t.id)}
                    className={`flex flex-col gap-2 p-3 rounded-2xl border text-left transition-all duration-300 ${
                      currentTheme === t.id
                        ? 'border-pink-400 bg-white/40 dark:bg-slate-800/40 shadow-sm scale-102 font-bold ring-2 ring-pink-400/20'
                        : 'border-pink-200/10 hover:bg-white/20 hover:scale-101'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                        {t.name}
                      </span>
                      <span className="text-xs filter drop-shadow-sm select-none">{t.emoji}</span>
                    </div>
                    <div className="flex gap-1.5 mt-0.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: t.c1 }} />
                      <div className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: t.c2 }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          // ROOM ACTIVE INTERFACES
          <div className="w-full flex flex-col items-center">
            
            {/* LOBBY / WAITING SCREEN (If 2nd player hasn't joined yet) */}
            {room.players.length < 2 ? (
              <div className="w-full max-w-md glass rounded-3xl p-6 sm:p-8 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center animate-in fade-in duration-300">
                <div>
                  <span className="text-4xl animate-bounce inline-block">🌸</span>
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">
                    Lobby Code Created
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Share this code with your partner so they can join.
                  </p>
                </div>

                {/* Code display frame */}
                <div className="flex flex-col items-center gap-2 w-full bg-pink-500/5 dark:bg-black/20 p-4 rounded-2xl border border-pink-100/10">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">Room Code</span>
                  <span className="text-3xl font-black tracking-widest text-slate-800 dark:text-white select-all">
                    {room.code}
                  </span>
                  
                  <button
                    onClick={handleCopy}
                    className="mt-2 text-xs flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-pink-100/10 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm active:scale-95 transition-all text-slate-600 dark:text-slate-300"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-emerald-500" />
                        <span className="font-semibold text-emerald-500">Copied Code!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span className="font-semibold">Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Waiting animation */}
                <div className="flex flex-col items-center gap-3 mt-2">
                  <div className="flex gap-1.5 justify-center">
                    <span className="w-3.5 h-3.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-3.5 h-3.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-3.5 h-3.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                    <Users size={16} />
                    Waiting for Player 2 to enter room...
                  </span>
                </div>
              </div>
            ) : (
              // ACTIVE GAME SCREEN / GAME SELECTION MENU
              <div className="w-full flex flex-col items-center">
                
                {/* Scoreboard displayed during gameplay */}
                <Scoreboard />

                {/* ACTIVE GAME WINDOW CONTAINER */}
                {room.currentGame ? (
                  <div className="w-full">
                    {renderGame()}
                  </div>
                ) : (
                  // GAME SELECTION MENU
                  <div className="w-full max-w-4xl mx-auto px-4 flex flex-col gap-6 animate-in fade-in duration-300">
                    <div className="text-center flex flex-col gap-1">
                      <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center justify-center gap-1.5">
                        <Sparkles size={20} className="text-pink-500 fill-pink-500" />
                        Select a Game
                        <Sparkles size={20} className="text-pink-500 fill-pink-500" />
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {player?.isHost 
                          ? "Click on any game card below to enter the screen together!" 
                          : "Waiting for host to select a game..."}
                      </p>
                    </div>

                    {/* Menu Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      {[
                        { id: 'sameBrain', name: 'Same Brain', icon: '❤️', color: 'hover:border-pink-300 hover:shadow-pink-500/10' },
                        { id: 'wouldYouRather', name: 'Would You Rather', icon: '😂', color: 'hover:border-yellow-300 hover:shadow-yellow-500/10' },
                        { id: 'likely', name: 'Who Is Likely To', icon: '😈', color: 'hover:border-pink-300 hover:shadow-pink-500/10' },
                        { id: 'thisOrThat', name: 'This or That', icon: '⚡', color: 'hover:border-yellow-300 hover:shadow-yellow-500/10' },
                        { id: 'ranking', name: 'Secret Ranking', icon: '👑', color: 'hover:border-pink-300 hover:shadow-pink-500/10' },
                        { id: 'debate', name: 'Relationship Debate', icon: '💬', color: 'hover:border-yellow-300 hover:shadow-yellow-500/10' },
                        { id: 'secretMessage', name: 'Secret Message', icon: '💌', color: 'hover:border-pink-300 hover:shadow-pink-500/10' },
                        { id: 'whoKnowsMeBetter', name: 'Who Knows Me Better', icon: '🧠', color: 'hover:border-yellow-300 hover:shadow-yellow-500/10' },
                        { id: 'whatsMyExcuse', name: "What's My Excuse?", icon: '🤔', color: 'hover:border-pink-300 hover:shadow-pink-500/10' },
                        { id: 'truthOrDare', name: 'Truth or Dare', icon: '😈', color: 'hover:border-yellow-300 hover:shadow-yellow-500/10' },
                        { id: 'redGreen', name: 'Red or Green Flag', icon: '🚩', color: 'hover:border-pink-300 hover:shadow-pink-500/10' },
                        { id: 'neverHaveIEver', name: 'Never Have I Ever', icon: '🙈', color: 'hover:border-yellow-300 hover:shadow-yellow-500/10' }
                      ].map((game) => {
                        const isDisabled = !player?.isHost;
                        return (
                          <button
                            key={game.id}
                            disabled={isDisabled}
                            onClick={() => {
                              selectGame(game.id);
                              audioController.playClick();
                            }}
                            className={`glass p-5 rounded-3xl border border-pink-200/15 text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 shadow-sm ${
                              isDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : `hover:-translate-y-1 hover:scale-103 hover:shadow-md ${game.color}`
                            }`}
                          >
                            <span className="text-4xl select-none filter drop-shadow">
                              {game.icon}
                            </span>
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                              {game.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Theme Selector Section */}
                    <div className="glass rounded-3xl p-5 border border-pink-200/15 flex flex-col gap-4 mt-2">
                      <div className="flex items-center gap-1.5 pl-1">
                        <Sparkles size={16} className="text-pink-500 fill-pink-500 animate-pulse" />
                        <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                          Choose Game Theme
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {themes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => changeTheme(t.id)}
                            className={`flex flex-col gap-2 p-3.5 rounded-2xl border text-left transition-all duration-300 ${
                              currentTheme === t.id
                                ? 'border-pink-400 bg-white/40 dark:bg-slate-800/40 shadow-sm scale-102 font-bold ring-2 ring-pink-400/20'
                                : 'border-pink-200/10 hover:bg-white/20 hover:scale-101'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate pr-1">
                                {t.name}
                              </span>
                              <span className="text-xs filter drop-shadow-sm select-none">
                                {t.emoji}
                              </span>
                            </div>
                            <div className="flex gap-1.5 mt-0.5">
                              <div className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: t.c1 }} />
                              <div className="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: t.c2 }} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Float Chat panel overlay */}
            <Chat />
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <SocketProvider>
      <MainApp />
    </SocketProvider>
  );
}

export default App;
