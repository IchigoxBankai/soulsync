import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { whoKnowsMeBetterQuestions } from '../../data/prompts';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Send, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WhoKnowsMeBetter = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [answerInput, setAnswerInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [revealData, setRevealData] = useState(null); // { isCorrect, answererSecret, guess }

  const gameState = room?.gameStates?.whoKnowsMeBetter;
  const question = gameState?.question;
  const answererId = gameState?.answererId;
  const step = gameState?.step; // 'answering' | 'guessing' | 'reveal'

  const isAnswerer = player?.id === answererId;
  const answererName = room?.players.find(p => p.id === answererId)?.name || 'Answerer';
  const guesserName = room?.players.find(p => p.id !== answererId)?.name || 'Guesser';

  // Init question if no question set and player is Answerer
  useEffect(() => {
    if (isAnswerer && !question) {
      loadNewQuestion();
    }
  }, [isAnswerer, question]);

  // Listen for results
  useEffect(() => {
    if (!socket) return;

    const handleResult = (data) => {
      setRevealData(data);
      if (data.isCorrect) {
        audioController.playWin();
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.6 }
        });
      } else {
        audioController.playClick();
      }
    };

    socket.on('wymb_result', handleResult);
    return () => {
      socket.off('wymb_result', handleResult);
    };
  }, [socket]);

  // Reset inputs when step resets to answering
  useEffect(() => {
    if (step === 'answering') {
      setAnswerInput('');
      setGuessInput('');
      setRevealData(null);
    }
  }, [step]);

  const loadNewQuestion = () => {
    const history = gameState?.history || [];
    const available = whoKnowsMeBetterQuestions.filter(q => !history.includes(q));
    const pool = available.length > 0 ? available : whoKnowsMeBetterQuestions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];

    socket.emit('wymb_init_question', { question: randomQ });
    audioController.playClick();
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim()) return;

    socket.emit('wymb_submit_answer', { secret: answerInput });
    audioController.playClick();
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!guessInput.trim()) return;

    socket.emit('wymb_submit_guess', { guess: guessInput });
    audioController.playClick();
  };

  const handleNextRound = () => {
    socket.emit('wymb_next_round');
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
        <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          🧠 Who Knows Me Better?
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Panel */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center">
        {/* Role Banner */}
        <div className="flex items-center justify-center gap-2">
          {isAnswerer ? (
            <span className="text-xs font-bold px-3 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full">
              👑 You are the Answerer!
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
              🔍 You are guessing {answererName}'s mind!
            </span>
          )}
        </div>

        {!question ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="animate-spin text-4xl">💭</div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isAnswerer ? 'Generating your question...' : `Waiting for ${answererName} to start round...`}
            </span>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-6">
            {/* Steps Rendering */}

            {step === 'answering' && (
              <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                {isAnswerer ? (
                  <>
                    <div>
                      <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">Your Secret Question</span>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
                        {question}
                      </h2>
                    </div>

                    <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="Type your secret answer..."
                        maxLength={40}
                        className="glass-input w-full px-4 py-3 rounded-2xl text-center font-semibold text-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!answerInput.trim()}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
                      >
                        <Send size={18} />
                        Submit Answer Secretly
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <span className="text-5xl animate-pulse">🤫</span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {answererName} is answering their secret question...
                    </span>
                  </div>
                )}
              </div>
            )}

            {step === 'guessing' && (
              <div className="flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                {!isAnswerer ? (
                  <>
                    <div>
                      <span className="text-[10px] tracking-wider uppercase font-bold text-purple-500">The Question</span>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-1">
                        {question}
                      </h2>
                    </div>

                    <form onSubmit={handleGuessSubmit} className="flex flex-col gap-3">
                      <input
                        type="text"
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        placeholder={`What is ${answererName}'s answer?`}
                        maxLength={40}
                        className="glass-input w-full px-4 py-3 rounded-2xl text-center font-semibold text-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!guessInput.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
                      >
                        <Send size={18} />
                        Submit Guess
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <span className="text-5xl animate-pulse">🤔</span>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      You answered! Waiting for {guesserName} to guess...
                    </span>
                  </div>
                )}
              </div>
            )}

            {step === 'reveal' && revealData && (
              <div className="flex flex-col gap-6 animate-in zoom-in-95 duration-200">
                <div>
                  <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">The Question</span>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {question}
                  </h2>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {revealData.isCorrect ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-5xl animate-bounce">🧠</span>
                      <h3 className="text-2xl font-black text-emerald-500 flex items-center gap-1">
                        <Sparkles size={20} className="text-emerald-500 animate-spin" />
                        Guessed Correctly!
                        <Sparkles size={20} className="text-emerald-500 animate-spin" />
                      </h3>
                      <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                        {guesserName} gets +1 Point!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-5xl">🥺</span>
                      <h3 className="text-2xl font-black text-rose-500">
                        Mismatch!
                      </h3>
                      <span className="text-xs text-slate-400 font-semibold">
                        Better luck next round!
                      </span>
                    </div>
                  )}
                </div>

                {/* Show values */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                      {answererName}'s Truth
                    </span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1 uppercase break-all">
                      {revealData.answererSecret}
                    </span>
                  </div>

                  <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                      {guesserName}'s Guess
                    </span>
                    <span className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1 uppercase break-all">
                      {revealData.guess}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleNextRound}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4"
                >
                  Switch Roles & Next Round
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
