import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles, Send, Heart, User } from 'lucide-react';

export const WhoKnowsMeBetter = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [answerInput, setAnswerInput] = useState('');

  const gameState = room?.gameStates?.whoKnowsMeBetter;
  const questions = gameState?.questions || [];
  const questionIndex = gameState?.questionIndex || 1;
  const currentRound = gameState?.round || 1;
  const answers = gameState?.answers || { round1: {}, round2: {} };
  const step = gameState?.step || 'playing'; // 'playing' | 'summary'

  // Sync inputs on questionIndex or round updates
  useEffect(() => {
    setAnswerInput('');
  }, [questionIndex, currentRound]);

  if (!room || !player || !gameState) return null;

  const player1 = room.players[0] || { name: 'Player 1', id: '1' };
  const player2 = room.players[1] || { name: 'Player 2', id: '2' };

  // Determine active guesser & active subject based on currentRound
  // Round 1: Player 2 (guesser) guesses about Player 1 (subject)
  // Round 2: Player 1 (guesser) guesses about Player 2 (subject)
  const isRound1 = currentRound === 1;
  const guesser = isRound1 ? player2 : player1;
  const subject = isRound1 ? player1 : player2;

  const isActiveGuesser = player.id === guesser.id;
  const currentQuestion = questions[questionIndex - 1] || 'Loading question...';

  const handleNext = (e) => {
    if (e) e.preventDefault();
    if (!answerInput.trim()) return;

    socket.emit('who_knows_submit', { answer: answerInput.trim() });
    audioController.playClick();
  };

  const handleRestart = () => {
    socket.emit('who_knows_reset');
    audioController.playClick();
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
          🧠 Who Knows Me Better?
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board Container */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col gap-6 text-center">
        {step === 'playing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="flex flex-col gap-1 px-2 border-b border-pink-100/10 pb-3">
              <span className="text-xs font-black text-pink-500 uppercase tracking-wider">
                Round {currentRound}
              </span>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {guesser.name} is answering about {subject.name}
              </span>
              <span className="text-xs font-semibold text-slate-400 mt-1">
                Question {questionIndex} / 10
              </span>
            </div>

            {/* Question display */}
            <div className="p-8 bg-pink-500/5 dark:bg-black/20 rounded-2xl border border-pink-200/10 flex flex-col items-center justify-center min-h-[120px] shadow-inner">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100 break-words leading-relaxed">
                "{currentQuestion}"
              </p>
            </div>

            {/* Input / Waiting states */}
            {isActiveGuesser ? (
              <form onSubmit={handleNext} className="flex flex-col gap-4 w-full">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder={`What is ${subject.name}'s answer?`}
                  maxLength={50}
                  className="glass-input w-full px-5 py-4 rounded-2xl text-center font-bold text-base text-slate-800 dark:text-white border border-pink-200/10 focus:border-pink-500 outline-none transition-all shadow-sm"
                  autoFocus
                />
                
                <button
                  type="submit"
                  disabled={!answerInput.trim()}
                  className="bg-gradient-to-r from-pink-500 to-yellow-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md w-full"
                >
                  <Send size={18} />
                  Next Question
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 bg-pink-500/5 rounded-2xl p-4 border border-pink-200/5">
                <div className="flex gap-1.5 justify-center">
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-bold text-pink-500 animate-pulse">
                  {guesser.name} is typing...
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  You must watch silently & cannot help!
                </span>
              </div>
            )}
          </div>
        )}

        {/* Summary Screen */}
        {step === 'summary' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200 py-2">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-5xl animate-pulse">🎉</span>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                Game Finished!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Time to compare and discuss your answers side by side!
              </p>
            </div>

            {/* Answer Lists Comparison */}
            <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1 text-left mt-2">
              {questions.map((q, idx) => {
                const ans1 = answers.round1[idx + 1] || 'No answer';
                const ans2 = answers.round2[idx + 1] || 'No answer';
                return (
                  <div key={idx} className="p-4 glass rounded-2xl border border-pink-200/10 flex flex-col gap-2.5 shadow-sm">
                    <span className="text-xs font-bold text-pink-500 flex items-center gap-1">
                      <Sparkles size={12} />
                      Question {idx + 1}
                    </span>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      "{q}"
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mt-1 pt-2.5 border-t border-slate-100/10">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          Round 1 ({player2.name}'s Guess)
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 break-words">
                          {ans1}
                        </span>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          Round 2 ({player1.name}'s Guess)
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 break-words">
                          {ans2}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom options */}
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
