import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { truthPrompts, darePrompts } from '../../data/prompts';
import { audioController } from '../../utils/audio';
import { ArrowLeft } from 'lucide-react';

export const TruthOrDare = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [spinDeg, setSpinDeg] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState(null); // { targetPlayerId, category, type, prompt }

  const gameState = room?.gameStates?.truthOrDare;

  // Sync state if spinned by other player
  useEffect(() => {
    if (!socket) return;

    const handleSpinned = (data) => {
      setIsSpinning(true);
      setResult(null);

      // Determine angle to land on based on truth vs dare
      // Let's divide wheel into 8 slices: T, D, T, D, T, D, T, D (45 deg each)
      // Index 0: Truth, Index 1: Dare, etc.
      // Truth lands on index 0, 2, 4, 6. Dare lands on 1, 3, 5, 7.
      const targetTypeIndex = data.type === 'truth' ? 0 : 1;
      
      const targetSlice = targetTypeIndex * 45 + 22.5; // mid point of slice
      const targetAngle = 360 - targetSlice; 

      // Accumulate spin degree: add 6 full spins + target offset
      setSpinDeg((prevDeg) => {
        const currentSpins = Math.floor(prevDeg / 360);
        return (currentSpins + 6) * 360 + targetAngle;
      });

      audioController.playClick(); // Play initial click

      // Timer to wait for spin end (3 seconds transition)
      setTimeout(() => {
        setIsSpinning(false);
        setResult(data);
        audioController.playWin();
      }, 3100);
    };

    socket.on('truth_or_dare_spinned', handleSpinned);
    return () => {
      socket.off('truth_or_dare_spinned', handleSpinned);
    };
  }, [socket]);

  const handleSpin = () => {
    if (isSpinning) return;

    const categories = ['Funny', 'Cute', 'Romantic', 'Deep', 'Anime'];
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    const selectedType = Math.random() > 0.5 ? 'truth' : 'dare';

    // Pick prompt from prompts.js
    const pool = selectedType === 'truth' ? truthPrompts : darePrompts;
    const catPool = pool[selectedCategory] || [];
    const selectedPrompt = catPool[Math.floor(Math.random() * catPool.length)];

    // Target a random player in the room
    const targetPlayer = room.players[Math.floor(Math.random() * room.players.length)];

    socket.emit('truth_or_dare_spin', {
      category: selectedCategory,
      type: selectedType,
      prompt: selectedPrompt,
      targetPlayerId: targetPlayer.id
    });
  };

  if (!room || !player) return null;

  const targetPlayerName = room.players.find(p => p.id === result?.targetPlayerId)?.name || '';
  const isMeTarget = result?.targetPlayerId === player.id;

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col gap-6 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Game Header */}
      <div className="flex items-center justify-between">
        {player?.isHost ? (
          <button
            onClick={() => {
              leaveGame();
              audioController.playClick();
            }}
            className="p-2 rounded-full glass hover:bg-white/20 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          😈 Truth or Dare
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Game Container */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center overflow-hidden">
        {/* Helper subtitle */}
        <div className="text-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500 font-sans">The Spinning Wheel</span>
          <p className="text-xs text-slate-400 font-medium">Spin the wheel to get a truth or dare prompt assigned to a player!</p>
        </div>

        {/* Spin wheel visual */}
        <div className="relative w-64 h-64 flex items-center justify-center mt-2">
          {/* Wheel Pointer needle */}
          <div className="absolute top-0 z-20 text-2xl -mt-4 animate-bounce">
            👇
          </div>

          {/* Slices circle container */}
          <div
            className="w-full h-full rounded-full border-4 border-white/60 shadow-xl relative overflow-hidden transition-transform duration-[3000ms] ease-[cubic-bezier(0.1,0.8,0.25,1)]"
            style={{
              transform: `rotate(${spinDeg}deg)`,
            }}
          >
            {/* Slices of Truth & Dare */}
            {[...Array(8)].map((_, i) => {
              const isTruth = i % 2 === 0;
              const angle = i * 45;
              return (
                <div
                  key={i}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    clipPath: 'polygon(50% 50%, 50% 0, 85.35% 14.65%)',
                  }}
                >
                  <div
                    className={`w-full h-full flex items-center justify-center ${
                      isTruth
                        ? 'bg-gradient-to-r from-pink-400 to-pink-300'
                        : 'bg-gradient-to-r from-purple-500 to-purple-400'
                    }`}
                  >
                    <span 
                      className="absolute text-white font-extrabold text-[11px] uppercase tracking-wider origin-center select-none"
                      style={{
                        transform: 'rotate(22.5deg) translateY(-80px)',
                      }}
                    >
                      {isTruth ? 'Truth' : 'Dare'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Inner tiny circle cap */}
            <div className="absolute inset-0 m-auto w-12 h-12 bg-white rounded-full border border-pink-200/50 shadow flex items-center justify-center font-bold text-lg">
              ✨
            </div>
          </div>
        </div>

        {/* Result & Actions */}
        {!isSpinning && !result && (
          <button
            onClick={handleSpin}
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base py-3 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md mt-2"
          >
            Spin the Wheel!
          </button>
        )}

        {isSpinning && (
          <div className="flex flex-col items-center gap-1.5 py-4">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
              Spinning the destiny wheel... 🌀
            </span>
          </div>
        )}

        {/* Reveal prompt box */}
        {!isSpinning && result && (
          <div className="w-full flex flex-col gap-4 mt-2 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-1 border-t border-b border-pink-100/10 py-3">
              <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">
                Target Selected
              </span>
              <h3 className="text-xl font-black text-slate-800 dark:text-white">
                {isMeTarget ? '👑 YOU (' + targetPlayerName + ')' : targetPlayerName}
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category: {result.category} &bull; Type: {result.type}
              </span>
            </div>

            {/* Prompt block */}
            <div className="p-4 bg-pink-500/5 rounded-2xl border border-pink-200/10">
              <p className="text-lg font-bold italic text-slate-800 dark:text-slate-100 break-words">
                "{result.prompt}"
              </p>
            </div>

            <button
              onClick={handleSpin}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base py-3 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md mt-2"
            >
              Spin Again!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
