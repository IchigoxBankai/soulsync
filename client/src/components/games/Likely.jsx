import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles, Trophy, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Likely = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [selectedChoice, setSelectedChoice] = useState('');
  const [revealData, setRevealData] = useState(null); // { answers, match }

  const gameState = room?.gameStates?.likely;
  const questionIndex = gameState?.questionIndex || 1;
  const prompt = gameState?.prompt || '';
  const step = gameState?.step || 'playing'; // 'playing' | 'reveal' | 'summary'
  const matches = gameState?.matches || 0;
  const differences = gameState?.differences || 0;

  const totalQuestions = 10;

  // Listen for results
  useEffect(() => {
    if (!socket) return;

    const handleReveal = (data) => {
      setRevealData(data);
      if (data.match) {
        audioController.playWin();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        audioController.playClick();
      }
    };

    socket.on('likely_revealed', handleReveal);
    return () => {
      socket.off('likely_revealed', handleReveal);
    };
  }, [socket]);

  // Reset local state for next question
  useEffect(() => {
    if (step === 'playing') {
      setSelectedChoice('');
      setRevealData(null);
    }
  }, [step]);

  const handleSelect = (playerId) => {
    setSelectedChoice(playerId);
    socket.emit('likely_submit', { choice: playerId });
    audioController.playClick();
  };

  const handleNext = () => {
    socket.emit('likely_next');
    audioController.playClick();
  };

  const handleRestart = () => {
    socket.emit('likely_reset');
    audioController.playClick();
  };

  if (!room || !player || !gameState) return null;

  const hasSubmitted = !!selectedChoice;
  const isWaiting = hasSubmitted && !revealData;
  const partner = room.players.find(p => p.id !== player.id) || { name: 'Partner' };
  
  const matchPercentage = Math.round((matches / totalQuestions) * 100);

  // Find most selected person in current state analysis if revealData or state records it
  const player1 = room.players[0] || { name: 'Player 1' };
  const player2 = room.players[1] || { name: 'Player 2' };

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
          😈 Who is More Likely To
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board Card */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col gap-6 text-center">
        {step !== 'summary' && (
          <div className="flex justify-between items-center w-full px-2 border-b border-pink-100/10 pb-3">
            <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">
              Who is more likely to...
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Question {questionIndex} / {totalQuestions}
            </span>
          </div>
        )}

        {/* Step 1: Voting Phase */}
        {step === 'playing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Prompt card */}
            <div className="p-8 bg-pink-500/5 dark:bg-black/20 rounded-2xl border border-pink-200/10 flex flex-col items-center justify-center min-h-[120px] shadow-inner">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                "...{prompt}"
              </p>
            </div>

            {/* Selection profile buttons */}
            {!isWaiting ? (
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => handleSelect(player.id)}
                  className={`w-full p-5 rounded-2xl border transition-all duration-300 ${
                    selectedChoice === player.id
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 border-pink-500 text-white shadow-lg scale-102 font-bold'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.01] active:scale-99 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">👑</span>
                    <span className="font-extrabold uppercase tracking-wide">{player.name} (You)</span>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect(partner.id)}
                  className={`w-full p-5 rounded-2xl border transition-all duration-300 ${
                    selectedChoice === partner.id
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 border-yellow-500 text-white shadow-lg scale-102 font-bold'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.01] active:scale-99 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="font-extrabold uppercase tracking-wide">{partner.name}</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex gap-1.5 justify-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Waiting for your partner's vote...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Reveal Results */}
        {step === 'reveal' && revealData && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Match outcomes */}
            <div className="flex flex-col items-center gap-1">
              {revealData.match ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl animate-bounce">🤝</span>
                  <h3 className="text-2xl font-black text-pink-500 dark:text-pink-400">
                    Perfect Match!
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-pink-500/10 px-3 py-1 rounded-full">
                    You both agreed on who is more likely!
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl">🤷</span>
                  <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    Different Opinions
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full">
                    You voted for different people!
                  </span>
                </div>
              )}
            </div>

            {/* Voted comparison */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                  You Voted For
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 mt-3 break-words max-w-full uppercase tracking-wide">
                  {revealData.answers[player.id] === player.id ? player.name : partner.name}
                </span>
              </div>

              <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                  {partner.name} Voted For
                </span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-200 mt-3 break-words max-w-full uppercase tracking-wide">
                  {revealData.answers[partner.id] === player.id ? player.name : partner.name}
                </span>
              </div>
            </div>

            {/* Next question */}
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold text-base py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4 w-full"
            >
              Next Question
            </button>
          </div>
        )}

        {/* Step 3: Summary Screen */}
        {step === 'summary' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200 py-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl">🏆</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                Who Is More Likely To Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Here is your sync score:
              </p>
            </div>

            {/* SVG circle gauge */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center mt-2">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="10"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-pink-500 fill-none transition-all duration-1000 ease-out"
                  strokeWidth="10"
                  strokeDasharray={389.5}
                  strokeDashoffset={389.5 - (389.5 * matchPercentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {matchPercentage}%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-pink-500 font-bold">
                  Compatibility
                </span>
              </div>
            </div>

            {/* Stats Breakdown cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 glass rounded-2xl border border-pink-200/15 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Total Matches
                </span>
                <span className="text-2xl font-black text-pink-500 mt-1">
                  {matches}
                </span>
              </div>

              <div className="p-4 glass rounded-2xl border border-pink-200/15 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Different Ideas
                </span>
                <span className="text-2xl font-black text-slate-500 mt-1">
                  {differences}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-200/20 text-pink-500 font-bold rounded-2xl active:scale-95 transition-transform"
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  leaveGame();
                  audioController.playClick();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold rounded-2xl active:scale-95 transition-transform shadow-md"
              >
                Exit Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
