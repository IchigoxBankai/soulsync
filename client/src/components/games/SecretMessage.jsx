import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Lock, Send, Heart, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SecretMessage = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [message, setMessage] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [countdownVal, setCountdownVal] = useState(null); // null | 3 | 2 | 1 | 0

  const gameState = room?.gameStates?.secretMessage;
  const messages = gameState?.messages || {};
  const revealed = gameState?.revealed;

  // Listen for countdown start
  useEffect(() => {
    if (!socket) return;

    const handleCountdown = () => {
      setCountdownVal(3);
      audioController.playCountdown();

      const timer3 = setTimeout(() => {
        setCountdownVal(2);
        audioController.playCountdown();
      }, 1000);

      const timer2 = setTimeout(() => {
        setCountdownVal(1);
        audioController.playCountdown();
      }, 2000);

      const timer1 = setTimeout(() => {
        setCountdownVal('REVEAL! 💖');
        audioController.playConfetti();
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }, 3000);

      const timer0 = setTimeout(() => {
        setCountdownVal(null);
      }, 4200);

      return () => {
        clearTimeout(timer3);
        clearTimeout(timer2);
        clearTimeout(timer1);
        clearTimeout(timer0);
      };
    };

    socket.on('secret_message_countdown', handleCountdown);
    return () => {
      socket.off('secret_message_countdown', handleCountdown);
    };
  }, [socket]);

  // Sync submission state on load/update from server messages
  useEffect(() => {
    if (messages && player?.id) {
      setHasSubmitted(!!messages[player.id]);
    }
  }, [messages, player?.id]);

  // Reset local states when database clears messages
  useEffect(() => {
    if (Object.keys(messages).length === 0) {
      setMessage('');
      setCountdownVal(null);
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('secret_message_submit', { message: message.trim() });
    setHasSubmitted(true);
    audioController.playClick();
  };

  const handleReset = () => {
    socket.emit('secret_message_reset');
    audioController.playClick();
  };

  if (!room || !player) return null;

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col gap-6 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Game Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            leaveGame();
            audioController.playClick();
          }}
          className="p-2 rounded-full glass hover:bg-white/20 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 to-yellow-600 bg-clip-text text-transparent">
          💌 Secret Message
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Container */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Countdown Overlay */}
        {countdownVal !== null && (
          <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-30 flex flex-col items-center justify-center text-white">
            <span className="text-sm font-bold tracking-widest text-pink-400 uppercase mb-4">Revealing Secrets in...</span>
            <h1 className="text-6xl font-black animate-ping text-pink-500">
              {countdownVal}
            </h1>
          </div>
        )}

        <div className="text-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">Secret message exchange</span>
          <p className="text-xs text-slate-400 mt-1 font-medium px-4">
            Type a message. It remains hidden until both players click submit. Then a joint countdown reveals them!
          </p>
        </div>

        {/* Game Flow states */}
        {!revealed ? (
          // Writing or Waiting state
          <div className="w-full flex flex-col gap-4 mt-2">
            {!hasSubmitted ? (
              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 150))}
                    placeholder="Type your secret message here... (max 150 chars)"
                    rows={4}
                    className="glass-input w-full p-4 rounded-2xl text-slate-800 dark:text-white text-base font-semibold shadow-inner resize-none focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] font-bold text-slate-400">
                    {message.length}/150
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-gradient-to-r from-pink-500 to-yellow-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
                >
                  <Send size={18} />
                  Submit Secret Message
                </button>
              </form>
            ) : (
              // Submitted, waiting for other player
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin" />
                  <Lock size={28} className="text-pink-500 animate-pulse" />
                </div>
                <div className="text-center flex flex-col gap-1">
                  <span className="text-base font-extrabold text-slate-700 dark:text-slate-300">
                    Message Locked & Secured!
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Waiting for the other player to submit their message...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Reveal messages state
          <div className="w-full flex flex-col gap-6 mt-2 animate-in zoom-in-95 duration-200">
            {/* Cute reveal top bar */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-5xl animate-bounce">💖</span>
              <h3 className="text-2xl font-black text-pink-500 flex items-center gap-1">
                Secrets Revealed!
              </h3>
            </div>

            {/* Messages box */}
            <div className="flex flex-col gap-4">
              {room.players.map((p) => {
                const msgText = messages[p.id] || '(No Message)';
                const isMe = p.id === player.id;
                return (
                  <div 
                    key={p.id} 
                    className={`flex flex-col p-4 glass rounded-2xl border ${
                      isMe ? 'border-pink-300/30' : 'border-yellow-300/30'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Heart size={10} className={isMe ? 'text-pink-500 fill-pink-500' : 'text-yellow-500 fill-purple-500'} />
                      {p.name}'s Secret
                    </span>
                    <p className="text-base font-bold italic text-slate-800 dark:text-slate-100 break-words">
                      "{msgText}"
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold text-base py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md mt-2"
            >
              <RotateCcw size={18} />
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
