import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const NeverHaveIEver = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [selectedChoice, setSelectedChoice] = useState('');
  const [revealData, setRevealData] = useState(null); // { answers, match }

  const gameState = room?.gameStates?.neverHaveIEver;
  const questionIndex = gameState?.questionIndex || 1;
  const statements = gameState?.statements || [];
  const currentStatement = statements[questionIndex - 1] || 'Loading statement...';
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

    socket.on('never_have_revealed', handleReveal);
    return () => {
      socket.off('never_have_revealed', handleReveal);
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
    socket.emit('never_have_submit', { choice });
    audioController.playClick();
  };

  const handleNext = () => {
    socket.emit('never_have_next');
    audioController.playClick();
  };

  const handleRestart = () => {
    socket.emit('never_have_reset');
    audioController.playClick();
  };

  if (!room || !player || !gameState) return null;

  const hasSubmitted = !!selectedChoice;
  const isWaiting = hasSubmitted && !revealData;
  const partner = room.players.find(p => p.id !== player.id) || { name: 'Partner' };
  
  const matchPercentage = Math.round((matches / totalQuestions) * 100);

  // Generate a fun fact from matches
  const getFunFact = () => {
    // Look through answers history if available or construct a dynamic one
    // Let's check server state answers if we can find any double match!
    const allAnswers = gameState.answers || {};
    const doubleNeverIdx = Object.keys(allAnswers).find(idx => {
      const pair = allAnswers[idx] || {};
      const votes = Object.values(pair);
      return votes.length === 2 && votes[0] === 'never' && votes[1] === 'never';
    });

    if (doubleNeverIdx) {
      const stmt = statements[parseInt(doubleNeverIdx) - 1];
      if (stmt) {
        return `🥰 You both have never ${stmt.replace(/never have i ever/i, '').trim().replace(/[?.]/g, '')}!`;
      }
    }

    const doubleHaveIdx = Object.keys(allAnswers).find(idx => {
      const pair = allAnswers[idx] || {};
      const votes = Object.values(pair);
      return votes.length === 2 && votes[0] === 'have' && votes[1] === 'have';
    });

    if (doubleHaveIdx) {
      const stmt = statements[parseInt(doubleHaveIdx) - 1];
      if (stmt) {
        return `😎 You both have ${stmt.replace(/never have i ever/i, '').trim().replace(/[?.]/g, '')}!`;
      }
    }

    return "💫 You have very interesting and unique life experiences!";
  };

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
          🙈 Never Have I Ever
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board Container */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col gap-6 text-center">
        {step !== 'summary' && (
          <div className="flex flex-col gap-2 w-full px-2 border-b border-pink-100/10 pb-3">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">
                Never Have I Ever...
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Statement {questionIndex} / {totalQuestions}
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

        {/* Step 1: Voting/Playing */}
        {step === 'playing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Statement card */}
            <div className="p-8 bg-pink-500/5 dark:bg-black/20 rounded-2xl border border-pink-200/10 flex flex-col items-center justify-center min-h-[140px] shadow-inner">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                "{currentStatement}"
              </p>
            </div>

            {/* Voting buttons */}
            {!isWaiting ? (
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={() => handleSelect('have')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${
                    selectedChoice === 'have'
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg scale-102 font-bold'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.02] active:scale-98 hover:bg-emerald-500/10 hover:border-emerald-500/30 shadow-sm'
                  }`}
                >
                  <span className="text-2xl">✅</span>
                  <span className="text-sm font-bold uppercase tracking-wider">I Have</span>
                </button>

                <button
                  onClick={() => handleSelect('never')}
                  className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border transition-all duration-300 ${
                    selectedChoice === 'never'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-lg scale-102 font-bold'
                      : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.02] active:scale-98 hover:bg-rose-500/10 hover:border-rose-500/30 shadow-sm'
                  }`}
                >
                  <span className="text-2xl">❌</span>
                  <span className="text-sm font-bold uppercase tracking-wider">Never</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6">
                <div className="flex gap-1.5 justify-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
                  Answer submitted! Waiting for {partner.name}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Reveal Choices */}
        {step === 'reveal' && revealData && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Outcome banner */}
            <div className="flex flex-col items-center gap-2">
              {revealData.match ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl animate-bounce">❤️</span>
                  <h3 className="text-2xl font-black text-pink-500 dark:text-pink-400 animate-pulse">
                    You Match!
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-pink-500/10 px-3 py-1 rounded-full">
                    You both answered the same!
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl animate-pulse">😂</span>
                  <h3 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    Interesting!
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-yellow-500/10 px-3 py-1 rounded-full">
                    One of you has, and one of you hasn't!
                  </span>
                </div>
              )}
            </div>

            {/* Side-by-side votes */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center p-5 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full uppercase tracking-wider">
                  Your Answer
                </span>
                <span className="text-3xl mt-3 select-none filter drop-shadow">
                  {revealData.answers[player.id] === 'have' ? '✅' : '❌'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-2 uppercase tracking-wide">
                  {revealData.answers[player.id] === 'have' ? 'I Have' : 'Never'}
                </span>
              </div>

              <div className="flex flex-col items-center p-5 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full uppercase tracking-wider">
                  {partner.name}'s Answer
                </span>
                <span className="text-3xl mt-3 select-none filter drop-shadow">
                  {revealData.answers[partner.id] === 'have' ? '✅' : '❌'}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-2 uppercase tracking-wide">
                  {revealData.answers[partner.id] === 'have' ? 'I Have' : 'Never'}
                </span>
              </div>
            </div>

            {/* Next statement */}
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
              <span className="text-5xl animate-pulse">🙈</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                Game Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Here is your sync score on facts:
              </p>
            </div>

            {/* SVG compatibility circle */}
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
                  Sync Score
                </span>
              </div>
            </div>

            {/* Stats list */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 glass rounded-2xl border border-emerald-500/10 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-450 uppercase tracking-wide">
                  Same Answers ❤️
                </span>
                <span className="text-2xl font-black text-emerald-500 mt-1">
                  {matches}
                </span>
              </div>

              <div className="p-4 glass rounded-2xl border border-rose-500/10 flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-455 uppercase tracking-wide">
                  Different Answers 😂
                </span>
                <span className="text-2xl font-black text-rose-500 mt-1">
                  {differences}
                </span>
              </div>
            </div>

            {/* Fun Fact callout */}
            <div className="p-5 bg-gradient-to-r from-pink-500/5 to-yellow-500/5 border border-pink-200/15 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-inner">
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">
                🏆 Fun Fact
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed text-center italic">
                "{getFunFact()}"
              </p>
            </div>

            {/* Play Again / Exit buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full">
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
