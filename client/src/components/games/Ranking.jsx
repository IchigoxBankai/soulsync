import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, ArrowUp, ArrowDown, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Ranking = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [itemsList, setItemsList] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealData, setRevealData] = useState(null); // { answers }

  const gameState = room?.gameStates?.ranking;
  const questionIndex = gameState?.questionIndex || 1;
  const category = gameState?.category || '';
  const initialItems = gameState?.items || [];
  const step = gameState?.step || 'playing'; // 'playing' | 'reveal' | 'summary'
  const totalScore = gameState?.totalScore || 0;

  const totalQuestions = 5;

  // Sync local items with game state items on next question
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItemsList([...initialItems]);
    }
  }, [initialItems, questionIndex]);

  // Reset submit state on next question
  useEffect(() => {
    if (step === 'playing') {
      setHasSubmitted(false);
      setRevealData(null);
    }
  }, [step]);

  // Listen for results
  useEffect(() => {
    if (!socket) return;

    const handleReveal = (data) => {
      setRevealData(data);
      audioController.playWin();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    };

    socket.on('ranking_revealed', handleReveal);
    return () => {
      socket.off('ranking_revealed', handleReveal);
    };
  }, [socket]);

  const moveItem = (index, direction) => {
    if (hasSubmitted) return;
    
    const newItems = [...itemsList];
    if (direction === 'up' && index > 0) {
      const temp = newItems[index];
      newItems[index] = newItems[index - 1];
      newItems[index - 1] = temp;
    } else if (direction === 'down' && index < newItems.length - 1) {
      const temp = newItems[index];
      newItems[index] = newItems[index + 1];
      newItems[index + 1] = temp;
    }
    setItemsList(newItems);
    audioController.playClick();
  };

  const handleSubmit = () => {
    setHasSubmitted(true);
    socket.emit('ranking_submit', { rankingList: itemsList });
    audioController.playClick();
  };

  const handleNext = () => {
    socket.emit('ranking_next');
    audioController.playClick();
  };

  const handleRestart = () => {
    socket.emit('ranking_reset');
    audioController.playClick();
  };

  if (!room || !player || !gameState) return null;

  const isWaiting = hasSubmitted && !revealData;
  const partner = room.players.find(p => p.id !== player.id) || { name: 'Partner' };
  
  // Calculate round compatibility percentage based on matches
  const matchPercentage = Math.round((totalScore / (totalQuestions * 5)) * 100);

  // Helper to check which ranks match in reveal view
  const getRankScore = () => {
    if (!revealData) return 0;
    const r1 = revealData.answers[player.id] || [];
    const r2 = revealData.answers[partner.id] || [];
    let score = 0;
    for (let i = 0; i < 5; i++) {
      if (r1[i] === r2[i]) score++;
    }
    return score;
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
          👑 Secret Ranking
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board Card */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col gap-6 text-center">
        {step !== 'summary' && (
          <div className="flex justify-between items-center w-full px-2 border-b border-pink-100/10 pb-3">
            <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">
              Rank in order of preference
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Category {questionIndex} / {totalQuestions}
            </span>
          </div>
        )}

        {/* Step 1: Sorting/Ranking Phase */}
        {step === 'playing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Category header */}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-yellow-500 uppercase tracking-widest font-extrabold">The Category</span>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
                {category}
              </h2>
            </div>

            {/* List items with Up/Down buttons */}
            {!isWaiting ? (
              <div className="flex flex-col gap-2.5 w-full">
                {itemsList.map((item, idx) => (
                  <div
                    key={item}
                    className="flex justify-between items-center p-4 bg-white/50 dark:bg-slate-800/50 border border-slate-200/30 rounded-2xl shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-pink-500 w-5 h-5 flex items-center justify-center bg-pink-500/10 rounded-full">
                        {idx + 1}
                      </span>
                      <span className="text-base font-extrabold text-slate-700 dark:text-slate-200">{item}</span>
                    </div>
                    
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => moveItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg border border-slate-200/20 hover:bg-pink-500/10 hover:text-pink-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(idx, 'down')}
                        disabled={idx === itemsList.length - 1}
                        className="p-1.5 rounded-lg border border-slate-200/20 hover:bg-pink-500/10 hover:text-pink-500 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold py-3.5 px-6 rounded-2xl hover:scale-[1.01] active:scale-99 shadow-md mt-4 w-full"
                >
                  Submit Sorting Ranking
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="flex gap-1.5 justify-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Sorting submitted! Waiting for {partner.name}...
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Reveal Side by Side */}
        {step === 'reveal' && revealData && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Round matching outcome */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl animate-bounce">👑</span>
              <h3 className="text-2xl font-black text-pink-500">
                Rankings Comparison
              </h3>
              <span className="text-xs font-bold text-slate-500 bg-pink-500/10 px-3 py-1 rounded-full mt-1.5">
                Matches this category: {getRankScore()} / 5 points
              </span>
            </div>

            {/* Split Screen Columns */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* My sorting */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 text-center">Your List</span>
                {(revealData.answers[player.id] || []).map((item, idx) => {
                  const partnerList = revealData.answers[partner.id] || [];
                  const isMatch = partnerList[idx] === item;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-3 border rounded-xl shadow-xs text-left ${
                        isMatch
                          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20'
                          : 'border-slate-200/20 bg-white/30 dark:bg-slate-800/30'
                      }`}
                    >
                      <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                        isMatch ? 'bg-emerald-500/20 text-emerald-500' : 'bg-pink-500/10 text-pink-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold truncate flex-1 ${isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {item}
                      </span>
                      {isMatch && <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-500/10" />}
                    </div>
                  );
                })}
              </div>

              {/* Partner sorting */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 text-center">{partner.name}'s List</span>
                {(revealData.answers[partner.id] || []).map((item, idx) => {
                  const myList = revealData.answers[player.id] || [];
                  const isMatch = myList[idx] === item;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-3 border rounded-xl shadow-xs text-left ${
                        isMatch
                          ? 'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20'
                          : 'border-slate-200/20 bg-white/30 dark:bg-slate-800/30'
                      }`}
                    >
                      <span className={`text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                        isMatch ? 'bg-emerald-500/20 text-emerald-500' : 'bg-pink-500/10 text-pink-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold truncate flex-1 ${isMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {item}
                      </span>
                      {isMatch && <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-500/10" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next category */}
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-bold text-base py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4 w-full"
            >
              Next Category
            </button>
          </div>
        )}

        {/* Step 3: Game Summary */}
        {step === 'summary' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200 py-2">
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl">👑</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">
                Ranking Secret Sorting Done!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Here is your total ranking sync results:
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

            {/* Stats score cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 glass rounded-2xl border border-pink-200/15 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Total Score
                </span>
                <span className="text-2xl font-black text-pink-500 mt-1">
                  {totalScore} <span className="text-xs font-medium text-slate-400">/ 25</span>
                </span>
              </div>

              <div className="p-4 glass rounded-2xl border border-pink-200/15 flex flex-col items-center justify-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Categories Played
                </span>
                <span className="text-2xl font-black text-slate-500 mt-1">
                  {totalQuestions}
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
