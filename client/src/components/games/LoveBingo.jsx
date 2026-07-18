import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { generateBingoBoard } from '../../data/prompts';
import { audioController } from '../../utils/audio';
import { ArrowLeft, RotateCcw, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LoveBingo = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [showBingoAnimation, setShowBingoAnimation] = useState(false);
  const [bingoWinnerName, setBingoWinnerName] = useState('');

  const gameState = room?.gameStates?.loveBingo;
  const tasks = gameState?.tasks || [];
  const boards = gameState?.boards || {};
  const bingos = gameState?.bingos || {};

  const myBoard = boards[player?.id];
  const myGrid = myBoard?.grid || [];
  const myMarked = myBoard?.marked || [];

  // Initialize board for both players if host and not initialized
  useEffect(() => {
    if (player?.isHost && (!gameState?.tasks || gameState.tasks.length === 0)) {
      handleReset();
    }
  }, [player?.isHost, gameState?.tasks]);

  // Listen for Bingo achievement
  useEffect(() => {
    if (!socket) return;

    const handleBingoAchieved = ({ playerId, name }) => {
      setBingoWinnerName(name);
      setShowBingoAnimation(true);
      audioController.playWin();

      // Fire a nice big confetti shower!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Clear animation overlay after 4 seconds
      setTimeout(() => {
        setShowBingoAnimation(false);
      }, 4000);
    };

    socket.on('bingo_achieved', handleBingoAchieved);
    return () => {
      socket.off('bingo_achieved', handleBingoAchieved);
    };
  }, [socket]);

  const handleCellClick = (index) => {
    if (index === 12) return; // Free Space is always marked
    socket.emit('bingo_mark', { index });
    audioController.playClick();
  };

  const handleReset = () => {
    // Generate new boards for all players in the room
    const newBoards = {};
    room.players.forEach((p) => {
      newBoards[p.id] = {
        grid: generateBingoBoard(),
        marked: [12] // Index 12 is center FREE SPACE
      };
    });

    socket.emit('bingo_reset', {
      tasks: newBoards[player.id].grid, // save one of them as tasks list (or meta tasks)
      boards: newBoards
    });

    audioController.playClick();
  };

  if (!room || !player) return null;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-6 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Bingo Win Overlay */}
      {showBingoAnimation && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white">
          <span className="text-8xl animate-bounce">💝</span>
          <h1 className="text-5xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider text-center px-4 mt-4">
            BINGO ❤️
          </h1>
          <p className="text-xl font-bold text-slate-200 mt-2">
            {bingoWinnerName} completed a row/column/diagonal!
          </p>
        </div>
      )}

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
        <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          ❤️ Love Bingo
        </span>
        
        {player?.isHost ? (
          <button
            onClick={handleReset}
            className="p-2 rounded-full glass hover:bg-white/25 text-slate-500 dark:text-slate-400 hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1 text-xs font-semibold px-3"
            title="Reset Board"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Score and Bingo indicators */}
      <div className="grid grid-cols-2 gap-4">
        {room.players.map((p) => {
          const hasBingo = bingos[p.id];
          return (
            <div key={p.id} className="glass rounded-2xl p-3 border border-pink-200/10 flex items-center justify-between px-4">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                {p.name}
              </span>
              {hasBingo && (
                <span className="text-xs font-bold text-pink-500 flex items-center gap-0.5 animate-pulse">
                  <Heart size={12} className="fill-pink-500 text-pink-500" /> BINGO!
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bingo Grid */}
      {!myBoard ? (
        <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-3 text-center py-16">
          <div className="animate-spin text-4xl">🎲</div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Generating your Bingo board...
          </span>
        </div>
      ) : (
        <div className="glass rounded-3xl p-4 border border-pink-200/20 shadow-xl flex flex-col gap-4 items-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">Your Bingo Card</span>
          
          <div className="grid grid-cols-5 gap-2 w-full max-w-md aspect-square">
            {myGrid.map((taskText, index) => {
              const isMarked = myMarked.includes(index);
              const isCenter = index === 12;

              return (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  className={`relative p-1 rounded-xl text-[9px] sm:text-xs font-bold leading-tight flex items-center justify-center text-center transition-all aspect-square border overflow-hidden ${
                    isCenter
                      ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-pink-400 text-white shadow shadow-pink-500/30 font-black cursor-default scale-102'
                      : isMarked
                      ? 'bg-pink-500 border-pink-400 text-white font-extrabold shadow shadow-pink-500/20'
                      : 'bg-white/40 dark:bg-slate-800/40 border-slate-200/20 text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className="hyphens-auto select-none">
                    {taskText}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[10px] text-slate-400 font-semibold italic text-center px-4">
            Mark squares you have completed together. Link 5 in a row (horizontal, vertical, or diagonal) to hit BINGO!
          </span>
        </div>
      )}
    </div>
  );
};
