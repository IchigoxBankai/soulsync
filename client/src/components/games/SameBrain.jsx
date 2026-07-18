import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { sameBrainPrompts, shuffleArray } from '../../data/prompts';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SameBrain = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [answer, setAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [revealData, setRevealData] = useState(null);

  const gameState = room?.gameStates?.sameBrain;
  const prompt = gameState?.prompt;
  const answers = gameState?.answers || {};

  // If host and no prompt is set, generate a random one
  useEffect(() => {
    if (player?.isHost && !prompt) {
      loadNewPrompt();
    }
  }, [player?.isHost, prompt]);

  // Listen for reveal results
  useEffect(() => {
    if (!socket) return;

    const handleResult = (data) => {
      setRevealData(data);
      if (data.match) {
        audioController.playWin();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        audioController.playClick();
      }
    };

    socket.on('same_brain_result', handleResult);
    return () => {
      socket.off('same_brain_result', handleResult);
    };
  }, [socket]);

  // Sync submission state on load/update from server answers
  useEffect(() => {
    if (answers && player?.id) {
      setHasSubmitted(!!answers[player.id]);
    }
  }, [answers, player?.id]);

  // Reset when prompt changes
  useEffect(() => {
    setRevealData(null);
    setAnswer('');
  }, [prompt]);

  const loadNewPrompt = () => {
    // Pick a prompt not in history if possible, else random
    const history = gameState?.history || [];
    const available = sameBrainPrompts.filter(p => !history.includes(p));
    const pool = available.length > 0 ? available : sameBrainPrompts;
    const randomPrompt = pool[Math.floor(Math.random() * pool.length)];

    socket.emit('same_brain_init_prompt', { prompt: randomPrompt });
    audioController.playClick();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    socket.emit('same_brain_submit', { answer });
    setHasSubmitted(true);
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
          ❤️ Same Brain
        </span>
        <div className="w-8 h-8" /> {/* Spacer */}
      </div>

      {/* Main Game Card */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center">
        {!prompt ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="animate-spin text-4xl">🌸</div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading prompt...</span>
          </div>
        ) : (
          <>
            {/* Prompt Display */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">The Prompt</span>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white px-2">
                {prompt}
              </h2>
            </div>

            {/* Game Screen Flow */}
            {!revealData ? (
              // Submission Phase
              <div className="w-full flex flex-col gap-4 mt-2">
                {!hasSubmitted ? (
                  <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      maxLength={30}
                      className="glass-input w-full px-4 py-3 rounded-2xl text-center font-semibold text-lg text-slate-800 dark:text-white shadow-inner"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={!answer.trim()}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold text-base py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
                    >
                      <Send size={18} />
                      Submit Answer
                    </button>
                  </form>
                ) : (
                  // Waiting Phase
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="flex gap-1.5 justify-center">
                      <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Submitted! Waiting for your partner...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              // Reveal Phase
              <div className="w-full flex flex-col gap-6 mt-2 animate-in zoom-in-95 duration-200">
                {/* Score / Matching Notification */}
                <div className="flex flex-col items-center gap-2">
                  {revealData.match ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-5xl animate-bounce">🤩</span>
                      <h3 className="text-2xl font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                        <Sparkles size={24} className="animate-pulse" /> Perfect Match! <Sparkles size={24} className="animate-pulse" />
                      </h3>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full">
                        +1 Point Each!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-5xl">🥺</span>
                      <h3 className="text-xl font-bold text-rose-500 dark:text-rose-400">
                        Almost Synced!
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Try aligning your thoughts next time!
                      </span>
                    </div>
                  )}
                </div>

                {/* Side by side Answers */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {room.players.map((p) => {
                    const ans = revealData.answers[p.id] || '(No Answer)';
                    return (
                      <div key={p.id} className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                        <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                          {p.name}
                        </span>
                        <span className="text-lg font-black text-slate-700 dark:text-slate-200 mt-1 uppercase break-all">
                          {ans}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Next button */}
                <button
                  onClick={loadNewPrompt}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4"
                >
                  Next Prompt
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
