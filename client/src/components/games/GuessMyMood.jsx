import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const GuessMyMood = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [revealData, setRevealData] = useState(null); // { isCorrect, moodEmoji, guessEmoji }

  const gameState = room?.gameStates?.guessMyMood;
  const answererId = gameState?.answererId;
  const moodEmoji = gameState?.moodEmoji;
  const step = gameState?.step; // 'selecting' | 'guessing' | 'reveal'

  const isAnswerer = player?.id === answererId;
  const answererName = room?.players.find(p => p.id === answererId)?.name || 'Answerer';
  const guesserName = room?.players.find(p => p.id !== answererId)?.name || 'Guesser';

  const emojiList = ['😀', '😴', '😭', '😎', '😡', '🥺', '❤️', '😂', '🤯'];

  // Listen for results
  useEffect(() => {
    if (!socket) return;

    const handleResult = (data) => {
      setRevealData(data);
      if (data.isCorrect) {
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

    socket.on('guess_mood_result', handleResult);
    return () => {
      socket.off('guess_mood_result', handleResult);
    };
  }, [socket]);

  // Reset local states when starting new round
  useEffect(() => {
    if (step === 'selecting') {
      setSelectedEmoji('');
      setRevealData(null);
    }
  }, [step]);

  const handleSelectMood = (emoji) => {
    setSelectedEmoji(emoji);
    socket.emit('guess_mood_select', { emoji });
    audioController.playClick();
  };

  const handleSelectGuess = (emoji) => {
    setSelectedEmoji(emoji);
    socket.emit('guess_mood_submit', { guessEmoji: emoji });
    audioController.playClick();
  };

  const handleNext = () => {
    socket.emit('guess_mood_next');
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
          🎭 Guess My Mood
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Game Screen */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center">
        {/* Banner Info */}
        <div className="flex items-center justify-center">
          {isAnswerer ? (
            <span className="text-xs font-bold px-3 py-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-full">
              👑 You are selecting the mood emoji!
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full">
              🔍 You are guessing {answererName}'s mood!
            </span>
          )}
        </div>

        {/* Steps */}

        {step === 'selecting' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {isAnswerer ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-pink-500">Pick My Mood</span>
                  <p className="text-xs text-slate-400 font-medium px-4">
                    Choose an emoji that represents your current vibe/mood. Your partner will guess!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 max-w-sm mx-auto">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      disabled={!!selectedEmoji}
                      onClick={() => handleSelectMood(emoji)}
                      className={`text-4xl p-4 glass rounded-2xl hover:scale-115 active:scale-95 transition-all shadow-sm ${
                        selectedEmoji === emoji ? 'bg-pink-500/20 border-pink-400 scale-110' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <span className="text-5xl animate-pulse">🎭</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {answererName} is choosing their secret mood emoji...
                </span>
              </div>
            )}
          </div>
        )}

        {step === 'guessing' && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            {!isAnswerer ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] tracking-wider uppercase font-bold text-purple-500">Guess {answererName}'s Mood</span>
                  <p className="text-xs text-slate-400 font-medium px-4">
                    Which emoji did {answererName} pick to describe their mood? Choose wisely!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2 max-w-sm mx-auto">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      disabled={!!selectedEmoji}
                      onClick={() => handleSelectGuess(emoji)}
                      className={`text-4xl p-4 glass rounded-2xl hover:scale-115 active:scale-95 transition-all shadow-sm ${
                        selectedEmoji === emoji ? 'bg-purple-500/20 border-purple-400 scale-110' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8">
                <span className="text-5xl animate-bounce">🤔</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Vibe selected! Waiting for {guesserName} to guess...
                </span>
              </div>
            )}
          </div>
        )}

        {step === 'reveal' && revealData && (
          <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-2">
              {revealData.isCorrect ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl animate-bounce">🥳</span>
                  <h3 className="text-2xl font-black text-emerald-500 flex items-center gap-1">
                    <Sparkles size={20} className="animate-spin text-emerald-500" />
                    Correct Mood!
                    <Sparkles size={20} className="animate-spin text-emerald-500" />
                  </h3>
                  <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                    {guesserName} gets +1 Point!
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="text-5xl">🥺</span>
                  <h3 className="text-2xl font-black text-rose-500">
                    Not quite!
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">
                    Mood check was incorrect!
                  </span>
                </div>
              )}
            </div>

            {/* Show choice comparison */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                  {answererName}'s Vibe
                </span>
                <span className="text-5xl mt-2 select-none">
                  {revealData.moodEmoji}
                </span>
              </div>

              <div className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">
                  {guesserName}'s Guess
                </span>
                <span className="text-5xl mt-2 select-none">
                  {revealData.guessEmoji}
                </span>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-md mt-4"
            >
              Switch Roles & Next Round
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
