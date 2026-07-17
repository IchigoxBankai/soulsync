import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { wouldYouRatherQuestions } from '../../data/prompts';
import { audioController } from '../../utils/audio';
import { ArrowLeft } from 'lucide-react';

export const WouldYouRather = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [selectedChoice, setSelectedChoice] = useState(null); // 'option1' | 'option2'
  const [revealData, setRevealData] = useState(null); // { choices: {}, match: bool }

  const gameState = room?.gameStates?.wouldYouRather;
  const question = gameState?.question;

  // Split and format options from text
  const parseOptions = (qText) => {
    if (!qText) return { opt1: '', opt2: '' };
    // Remove "Would you rather " prefix
    const cleanText = qText.replace(/^Would you rather\s+/i, '');
    // Split on first " or " or similar
    const parts = cleanText.split(/\s+or\s+/i);
    let opt1 = parts[0] || '';
    let opt2 = parts.slice(1).join(' or ') || ''; // Re-join if there are multiple "or"s
    
    // Clean trailing question marks
    if (opt2.endsWith('?')) {
      opt2 = opt2.slice(0, -1);
    }

    // Capitalize first letter
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    return {
      opt1: capitalize(opt1.trim()),
      opt2: capitalize(opt2.trim())
    };
  };

  const { opt1, opt2 } = parseOptions(question?.text);

  // Initialize first question if host
  useEffect(() => {
    if (player?.isHost && !question) {
      loadNewQuestion();
    }
  }, [player?.isHost, question]);

  // Listen for results
  useEffect(() => {
    if (!socket) return;

    const handleResult = (data) => {
      setRevealData(data);
      if (data.match) {
        audioController.playWin();
      } else {
        audioController.playClick();
      }
    };

    socket.on('wyr_result', handleResult);
    return () => {
      socket.off('wyr_result', handleResult);
    };
  }, [socket]);

  // Sync choice selection on load/update from server choices
  useEffect(() => {
    if (gameState?.choices && player?.id) {
      setSelectedChoice(gameState.choices[player.id] || null);
    }
  }, [gameState?.choices, player?.id]);

  // Reset when question changes
  useEffect(() => {
    setRevealData(null);
  }, [question]);

  const loadNewQuestion = () => {
    const history = gameState?.history || [];
    const available = wouldYouRatherQuestions.filter(q => !history.includes(q.text));
    const pool = available.length > 0 ? available : wouldYouRatherQuestions;
    const randomQ = pool[Math.floor(Math.random() * pool.length)];

    socket.emit('wyr_init_question', { question: randomQ });
    audioController.playClick();
  };

  const handleSelect = (choice) => {
    if (selectedChoice) return; // already chosen
    setSelectedChoice(choice);
    socket.emit('wyr_submit', { choice });
    audioController.playClick();
  };

  if (!room || !player) return null;

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col gap-6 select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Game Header */}
      <div className="flex items-center justify-between">
        {player?.isHost ? (
          <button
            onClick={() => {
              leaveGame();
              audioController.playClick();
            }}
            className="p-2 rounded-full glass hover:bg-white/20 text-slate-600 dark:text-slate-300 hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <span className="font-extrabold text-xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          😂 Would You Rather
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Game Screen */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 text-center">
        {!question ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="animate-spin text-4xl">🚀</div>
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading question...</span>
          </div>
        ) : (
          <>
            {/* Title / Prompt */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] tracking-wider uppercase font-bold text-purple-500">Would you rather...</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 self-center">
                Category: {question.cat || 'Random'}
              </span>
            </div>

            {/* Option Cards */}
            <div className="w-full flex flex-col gap-4">
              {/* Option 1 Button */}
              <button
                disabled={!!selectedChoice}
                onClick={() => handleSelect('option1')}
                className={`w-full p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden ${
                  revealData
                    ? revealData.choices[player.id] === 'option1'
                      ? 'bg-gradient-to-r from-pink-400 to-pink-500 border-pink-400 text-white shadow-md'
                      : 'bg-white/10 dark:bg-black/10 border-slate-200/20 text-slate-400'
                    : selectedChoice === 'option1'
                    ? 'bg-gradient-to-r from-pink-400 to-pink-500 border-pink-400 text-white shadow-md'
                    : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.02] active:scale-98 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col gap-1 z-10 relative">
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">Option A</span>
                  <span className="text-lg font-black leading-snug">{opt1}</span>
                </div>
                {/* Result overlay percentages or items if needed */}
              </button>

              {/* Option 2 Button */}
              <button
                disabled={!!selectedChoice}
                onClick={() => handleSelect('option2')}
                className={`w-full p-6 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden ${
                  revealData
                    ? revealData.choices[player.id] === 'option2'
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 text-white shadow-md'
                      : 'bg-white/10 dark:bg-black/10 border-slate-200/20 text-slate-400'
                    : selectedChoice === 'option2'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500 text-white shadow-md'
                    : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200 hover:scale-[1.02] active:scale-98 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-col gap-1 z-10 relative">
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-80">Option B</span>
                  <span className="text-lg font-black leading-snug">{opt2}</span>
                </div>
              </button>
            </div>

            {/* Status / Reveal Flow */}
            {!revealData ? (
              selectedChoice ? (
                <div className="flex flex-col items-center gap-2.5 py-4">
                  <div className="flex gap-1 justify-center">
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Waiting for partner...</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 font-semibold py-4">Pick an option to reveal!</span>
              )
            ) : (
              <div className="w-full flex flex-col gap-6 mt-2 animate-in zoom-in-95 duration-200">
                {/* Result Animation banner */}
                <div className="flex flex-col items-center gap-2">
                  {revealData.match ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-5xl animate-bounce">💖</span>
                      <h3 className="text-2xl font-black text-pink-500 dark:text-pink-400">
                        We think alike ❤️
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-pink-500/10 px-3 py-1 rounded-full">
                        You both picked the same choice!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-5xl animate-bounce">😂</span>
                      <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">
                        Opposites attract!
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold bg-purple-500/10 px-3 py-1 rounded-full">
                        You picked different options!
                      </span>
                    </div>
                  )}
                </div>

                {/* Show details */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {room.players.map((p) => {
                    const choice = revealData.choices[p.id];
                    const chosenText = choice === 'option1' ? opt1 : choice === 'option2' ? opt2 : '(None)';
                    return (
                      <div key={p.id} className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10 text-center">
                        <span className="text-[10px] text-slate-400 font-semibold truncate max-w-full">
                          {p.name}
                        </span>
                        <span className="text-sm font-extrabold text-slate-700 dark:text-slate-200 mt-2 break-words max-w-full">
                          {chosenText}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={loadNewQuestion}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base py-3 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-md mt-4"
                >
                  Next Question
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
