import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WhatsMyExcuse = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [excuseInput, setExcuseInput] = useState('');
  const [revealData, setRevealData] = useState(null); // { answers, match }

  const gameState = room?.gameStates?.whatsMyExcuse;
  const questionIndex = gameState?.questionIndex || 1;
  const prompts = gameState?.prompts || [];
  const currentPrompt = prompts[questionIndex - 1] || 'Loading situation...';
  const step = gameState?.step || 'playing'; // 'playing' | 'reveal' | 'summary'
  const matches = gameState?.matches || 0;
  const differences = gameState?.differences || 0;

  const totalQuestions = 20;

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

    socket.on('whats_excuse_revealed', handleReveal);
    return () => {
      socket.off('whats_excuse_revealed', handleReveal);
    };
  }, [socket]);

  // Reset local state for next question
  useEffect(() => {
    if (step === 'playing') {
      setExcuseInput('');
      setRevealData(null);
    }
  }, [step]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!excuseInput.trim()) return;

    socket.emit('whats_excuse_submit', { excuse: excuseInput.trim() });
    audioController.playClick();
  };

  const handleNext = () => {
    socket.emit('whats_excuse_next');
    audioController.playClick();
  };

  const handleRestart = () => {
    socket.emit('whats_excuse_reset');
    audioController.playClick();
  };

  if (!room || !player || !gameState) return null;

  const hasSubmitted = !!revealData || (gameState.answers && gameState.answers[questionIndex] && gameState.answers[questionIndex][player.id]);
  const isWaiting = hasSubmitted && !revealData;
  const partner = room.players.find(p => p.id !== player.id) || { name: 'Partner' };
  
  const matchPercentage = Math.round((matches / totalQuestions) * 100);

  // Helper to determine active inputs or reveal data
  const myAnswer = revealData?.answers?.[player.id] || excuseInput;
  const partnerAnswer = revealData?.answers?.[partner.id] || '';

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
          🤔 What's My Excuse?
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board Container */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col gap-6 text-center">
        {step !== 'summary' && (
          <div className="flex flex-col gap-2 w-full px-2 border-b border-pink-100/10 pb-3">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">
                What's My Excuse...
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Question {questionIndex} / {totalQuestions}
              </span>
            </div>
            {/* Custom progress bar */}
            <div className="w-full bg-slate-100/10 dark:bg-slate-800/50 h-2 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-500 to-yellow-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Typing excuses */}
        {step === 'playing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Prompt Card */}
            <div className="p-8 bg-pink-500/5 dark:bg-black/20 rounded-2xl border border-pink-200/10 flex flex-col items-center justify-center min-h-[140px] shadow-inner">
              <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">The Situation</span>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                "{currentPrompt}"
              </p>
            </div>

            {/* Input field */}
            {!isWaiting ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                <div className="relative">
                  <input
                    type="text"
                    value={excuseInput}
                    onChange={(e) => setExcuseInput(e.target.value.slice(0, 60))}
                    placeholder="Type the excuse..."
                    maxLength={60}
                    className="glass-input w-full px-5 py-4 rounded-2xl text-center font-bold text-base text-slate-800 dark:text-white border border-pink-200/10 focus:border-pink-500 outline-none transition-all shadow-sm"
                    autoFocus
                  />
                  <span className="absolute bottom-2.5 right-4 text-[10px] text-slate-400 font-bold">
                    {excuseInput.length}/60
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={!excuseInput.trim()}
                  className="bg-gradient-to-r from-pink-500 to-yellow-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md w-full"
                >
                  <Send size={18} />
                  Submit Excuse
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex gap-1.5 justify-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                  Excuse submitted! Waiting for {partner.name}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Reveal excuse choices */}
        {step === 'reveal' && revealData && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Matching Outcome badges */}
            <div className="flex flex-wrap justify-center gap-2">
              {revealData.match ? (
                <span className="px-3.5 py-1.5 bg-pink-500/10 text-pink-500 border border-pink-500/20 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  ❤️ Same Thought
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 text-xs font-black rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  😂 Totally Different
                </span>
              )}
              {/* Cute/Funny tags for discussion */}
              <span className="px-3.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-black rounded-full uppercase tracking-wider cursor-pointer hover:bg-purple-500/20 transition-all select-none">
                🥹 Cute Answer
              </span>
              <span className="px-3.5 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-black rounded-full uppercase tracking-wider cursor-pointer hover:bg-blue-500/20 transition-all select-none">
                😈 Funny Excuse
              </span>
            </div>

            {/* Side by side comparison cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center p-5 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full uppercase tracking-wider">
                  Your excuse
                </span>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-4 leading-relaxed break-words w-full">
                  "{revealData.answers[player.id]}"
                </p>
              </div>

              <div className="flex flex-col items-center p-5 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full uppercase tracking-wider">
                  {partner.name}'s excuse
                </span>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-4 leading-relaxed break-words w-full">
                  "{revealData.answers[partner.id]}"
                </p>
              </div>
            </div>

            {/* Next excuse button */}
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold text-base py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4 w-full"
            >
              Next Question
            </button>
          </div>
        )}

        {/* Step 3: Game Summary */}
        {step === 'summary' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200 py-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl animate-pulse">🤔</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                Game Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Here is your sync score on excuses:
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

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 glass rounded-2xl border border-pink-200/15 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Matching Answers ❤️
                </span>
                <span className="text-2xl font-black text-pink-500 mt-1">
                  {matches}
                </span>
              </div>

              <div className="p-4 glass rounded-2xl border border-pink-200/15 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Different Answers 😂
                </span>
                <span className="text-2xl font-black text-slate-500 mt-1">
                  {differences}
                </span>
              </div>
            </div>

            {/* Review List Section */}
            <div className="flex flex-col gap-1.5 mt-2 bg-gradient-to-r from-pink-500/5 to-yellow-500/5 border border-pink-200/15 rounded-2xl p-4 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">
                🏆 Discussion Review
              </span>
              <p className="text-[11px] font-medium text-slate-400 italic">
                Discuss and select which answers were the funniest and most romantic!
              </p>
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
                Back Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
