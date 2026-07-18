import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Debate = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [selectedChoice, setSelectedChoice] = useState('');
  const [revealData, setRevealData] = useState(null); // { answers, match }

  const gameState = room?.gameStates?.debate;
  const questionIndex = gameState?.questionIndex || 1;
  const prompt = gameState?.prompt || '';
  const step = gameState?.step || 'playing'; // 'playing' | 'reveal' | 'summary'
  const agrees = gameState?.agrees || 0;
  const disagrees = gameState?.disagrees || 0;

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

    socket.on('debate_revealed', handleReveal);
    return () => {
      socket.off('debate_revealed', handleReveal);
    };
  }, [socket]);

  // Reset local state for next question
  useEffect(() => {
    if (step === 'playing') {
      setSelectedChoice('');
      setRevealData(null);
    }
  }, [step]);

  const handleSelect = (choice) => {
    setSelectedChoice(choice);
    socket.emit('debate_submit', { choice });
    audioController.playClick();
  };

  const handleNext = () => {
    socket.emit('debate_next');
    audioController.playClick();
  };

  const handleRestart = () => {
    socket.emit('debate_reset');
    audioController.playClick();
  };

  if (!room || !player || !gameState) return null;

  const hasSubmitted = !!selectedChoice;
  const isWaiting = hasSubmitted && !revealData;
  const partner = room.players.find(p => p.id !== player.id) || { name: 'Partner' };
  
  const agreementPercentage = Math.round((agrees / totalQuestions) * 100);
  const disagreementPercentage = Math.round((disagrees / totalQuestions) * 100);

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
          💬 Relationship Debate
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board Container */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col gap-6 text-center">
        {step !== 'summary' && (
          <div className="flex justify-between items-center w-full px-2 border-b border-pink-100/10 pb-3">
            <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">
              Relationship Debate Vibe
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Topic {questionIndex} / {totalQuestions}
            </span>
          </div>
        )}

        {/* Step 1: Playing / Voting */}
        {step === 'playing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Debate Card */}
            <div className="p-8 bg-pink-500/5 dark:bg-black/20 rounded-2xl border border-pink-200/10 flex flex-col items-center justify-center min-h-[140px] shadow-inner">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">The Debate Topic</span>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                "{prompt}"
              </p>
            </div>

            {/* Voting Options */}
            {!isWaiting ? (
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => handleSelect('yes')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${
                    selectedChoice === 'yes'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-102 font-bold'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.02] active:scale-98 hover:bg-emerald-500/10 hover:border-emerald-500/30 shadow-sm'
                  }`}
                >
                  <ThumbsUp size={28} className="filter drop-shadow" />
                  <span className="text-sm font-bold uppercase tracking-wider">Yes, Agree</span>
                </button>

                <button
                  onClick={() => handleSelect('no')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${
                    selectedChoice === 'no'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-lg scale-102 font-bold'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.02] active:scale-98 hover:bg-rose-500/10 hover:border-rose-500/30 shadow-sm'
                  }`}
                >
                  <ThumbsDown size={28} className="filter drop-shadow" />
                  <span className="text-sm font-bold uppercase tracking-wider">No, Disagree</span>
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
                  Submitting opinion... Waiting for {partner.name}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Reveal Results */}
        {step === 'reveal' && revealData && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Agreement outcome */}
            <div className="flex flex-col items-center gap-2">
              {revealData.match ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl animate-bounce">❤️</span>
                  <h3 className="text-2xl font-black text-pink-500 dark:text-pink-400">
                    Same Opinion!
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-pink-500/10 px-3 py-1 rounded-full">
                    You both align on this question.
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl animate-bounce">💬</span>
                  <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    Time to Discuss!
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full">
                    A great opportunity to talk and understand details!
                  </span>
                </div>
              )}
            </div>

            {/* comparison view */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                  Your Opinion
                </span>
                <span className="text-4xl mt-3 select-none filter drop-shadow">
                  {revealData.answers[player.id] === 'yes' ? '👍' : '👎'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 uppercase tracking-wide">
                  {revealData.answers[player.id] === 'yes' ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                  {partner.name}'s Opinion
                </span>
                <span className="text-4xl mt-3 select-none filter drop-shadow">
                  {revealData.answers[partner.id] === 'yes' ? '👍' : '👎'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2 uppercase tracking-wide">
                  {revealData.answers[partner.id] === 'yes' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Next question */}
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold text-base py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4 w-full"
            >
              Next Debate Topic
            </button>
          </div>
        )}

        {/* Step 3: Summary screen */}
        {step === 'summary' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200 py-2">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-5xl animate-pulse">💬</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                Debate Session Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No winners or losers—just deeper understandings.
              </p>
            </div>

            {/* SVG circle gauge for agreement */}
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
                  strokeDashoffset={389.5 - (389.5 * agreementPercentage) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800 dark:text-white">
                  {agreementPercentage}%
                </span>
                <span className="text-[10px] uppercase tracking-wider text-pink-500 font-bold">
                  Agreement
                </span>
              </div>
            </div>

            {/* Stats Breakdown cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 glass rounded-2xl border border-emerald-500/10 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Agreed Topics 👍
                </span>
                <span className="text-3xl font-black text-emerald-500 mt-1">
                  {agrees}
                </span>
              </div>

              <div className="p-4 glass rounded-2xl border border-rose-500/10 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-wide uppercase">
                  Discuss Topics 💬
                </span>
                <span className="text-3xl font-black text-rose-500 mt-1">
                  {disagrees}
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
                Exit to Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
