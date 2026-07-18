import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { audioController } from '../../utils/audio';
import { ArrowLeft, Zap, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const FastestTap = () => {
  const { room, player, socket, leaveGame } = useSocket();
  const [localState, setLocalState] = useState('idle'); // 'idle' | 'countdown' | 'wait_delay' | 'go' | 'tapped'
  const [countdown, setCountdown] = useState(3);
  const [reactionTime, setReactionTime] = useState(null);
  const [goTimestamp, setGoTimestamp] = useState(0);
  const [roundResult, setRoundResult] = useState(null); // { results, roundWinnerId, scores, matchWinnerId }

  const gameState = room?.gameStates?.fastestTap;
  const state = gameState?.state; // 'waiting' | 'countdown' | 'go' | 'result' | 'match_over'
  const round = gameState?.round || 1;
  const scores = gameState?.scores || {};
  const winner = gameState?.winner;

  const timerRef = useRef(null);

  // Listen for fastest tap specific events
  useEffect(() => {
    if (!socket) return;

    const handleCountdownStart = ({ delay }) => {
      setLocalState('countdown');
      setCountdown(3);
      audioController.playCountdown();

      // Countdown 3 -> 2 -> 1
      let count = 3;
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          audioController.playCountdown();
        } else {
          clearInterval(interval);
          setLocalState('wait_delay');
        }
      }, 1000);

      // Clean timer ref
      timerRef.current = interval;
    };

    const handleRoundResult = (data) => {
      setRoundResult(data);
      setLocalState('idle');
      
      // Play sounds based on outcome
      if (data.matchWinnerId) {
        if (data.matchWinnerId === player.id) {
          audioController.playWin();
          confetti({ particleCount: 150, spread: 80 });
        } else {
          audioController.playClick();
        }
      } else {
        if (data.roundWinnerId === player.id) {
          audioController.playWin();
        } else {
          audioController.playClick();
        }
      }
    };

    socket.on('fastest_tap_countdown_start', handleCountdownStart);
    socket.on('fastest_tap_round_result', handleRoundResult);

    return () => {
      socket.off('fastest_tap_countdown_start', handleCountdownStart);
      socket.off('fastest_tap_round_result', handleRoundResult);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket, player]);

  // Sync state with server's 'go' state
  useEffect(() => {
    if (state === 'go') {
      setLocalState('go');
      setGoTimestamp(Date.now());
    } else if (state === 'waiting') {
      setLocalState('idle');
      setReactionTime(null);
      setRoundResult(null);
    }
  }, [state]);

  const handleStart = () => {
    socket.emit('fastest_tap_start');
    audioController.playClick();
  };

  const handleTap = () => {
    if (localState === 'wait_delay' || localState === 'countdown') {
      // FOUL! Tapped too early
      const foulTime = 9999;
      setReactionTime(foulTime);
      setLocalState('tapped');
      socket.emit('fastest_tap_submit', { timeMs: foulTime });
      audioController.playClick();
      return;
    }

    if (localState !== 'go') return;

    const tappedTime = Date.now();
    const diff = tappedTime - goTimestamp;
    
    setReactionTime(diff);
    setLocalState('tapped');
    socket.emit('fastest_tap_submit', { timeMs: diff });
    audioController.playClick();
  };

  const handleNextRound = () => {
    socket.emit('fastest_tap_next_round');
    audioController.playClick();
  };

  const handleReset = () => {
    socket.emit('fastest_tap_reset');
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
          🎯 Fastest Tap
        </span>
        <div className="w-8 h-8" />
      </div>

      {/* Main Board */}
      <div className="glass rounded-3xl p-6 border border-pink-200/20 shadow-xl flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Round tracker & Score dots */}
        <div className="w-full flex items-center justify-between border-b border-pink-100/10 pb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            Round {state === 'match_over' ? 'Ended' : round} / 5
          </span>
          <div className="flex gap-4">
            {room.players.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs font-semibold">
                <span className="text-slate-500 truncate max-w-[80px]">{p.name}</span>
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full border border-pink-500/20 ${
                        i < (scores[p.id] || 0) ? 'bg-pink-500 shadow-[0_0_6px_#ec4899]' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TAP SCREEN PANEL */}
        {state === 'waiting' && (
          <div className="w-full flex flex-col items-center gap-4 py-8">
            <span className="text-5xl animate-bounce">⚡</span>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 max-w-xs text-center">
              {player?.isHost 
                ? "First player to win 3 rounds is the champion! Click start when both are ready."
                : "First player to win 3 rounds is the champion! Waiting for host to start..."}
            </span>
            {player?.isHost && (
              <button
                onClick={handleStart}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-base py-3 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 shadow-md"
              >
                <Zap size={18} />
                Start Round
              </button>
            )}
          </div>
        )}

        {(localState === 'countdown' || localState === 'wait_delay' || localState === 'go' || localState === 'tapped') && state !== 'result' && state !== 'match_over' && (
          <button
            onClick={handleTap}
            disabled={localState === 'tapped'}
            className={`w-full h-64 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-150 border-2 select-none active:scale-98 ${
              localState === 'go'
                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-400 text-white shadow-lg animate-pulse'
                : localState === 'wait_delay'
                ? 'bg-gradient-to-br from-rose-400 to-pink-500 border-rose-400 text-white shadow-sm'
                : localState === 'tapped'
                ? 'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300/20 text-slate-500'
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/30 text-slate-700 dark:text-slate-200'
            }`}
          >
            {localState === 'countdown' && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] tracking-wider uppercase font-bold opacity-80">Get Ready</span>
                <span className="text-6xl font-black">{countdown}</span>
              </div>
            )}
            
            {localState === 'wait_delay' && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl animate-bounce">🚨</span>
                <span className="text-2xl font-black uppercase tracking-wider animate-pulse">Wait for it...</span>
                <span className="text-[10px] opacity-75 font-semibold">Tapping early is a foul!</span>
              </div>
            )}

            {localState === 'go' && (
              <div className="flex flex-col items-center gap-1">
                <Zap size={48} className="fill-white" />
                <span className="text-4xl font-black uppercase tracking-widest animate-bounce">TAP NOW!!</span>
              </div>
            )}

            {localState === 'tapped' && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold">Registered time:</span>
                <span className="text-3xl font-black">
                  {reactionTime === 9999 ? '🛑 FOUL (9999ms)' : `${reactionTime} ms`}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold mt-1">Waiting for opponent...</span>
              </div>
            )}
          </button>
        )}

        {/* ROUND / MATCH RESULTS PANELS */}
        {(state === 'result' || state === 'match_over') && roundResult && (
          <div className="w-full flex flex-col gap-6 py-2 animate-in zoom-in-95 duration-200">
            {/* Header info */}
            <div className="flex flex-col items-center gap-1 text-center">
              {state === 'match_over' ? (
                <>
                  <span className="text-5xl animate-bounce">🏆</span>
                  <h3 className="text-2xl font-black text-pink-500">
                    {room.players.find(p => p.id === roundResult.matchWinnerId)?.name} wins the Match!
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">Match score: {roundResult.scores[room.players[0].id]} - {roundResult.scores[room.players[1].id]}</span>
                </>
              ) : (
                <>
                  <span className="text-4xl animate-bounce">🔥</span>
                  <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    Round {round} Winner: {room.players.find(p => p.id === roundResult.roundWinnerId)?.name || 'Tie'}
                  </h3>
                </>
              )}
            </div>

            {/* Reaction times */}
            <div className="grid grid-cols-2 gap-4">
              {room.players.map((p) => {
                const rt = roundResult.results[p.id];
                const isFoul = rt === 9999;
                return (
                  <div key={p.id} className="flex flex-col items-center p-4 glass rounded-2xl border border-pink-200/10">
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-full">
                      {p.name}
                    </span>
                    <span className={`text-xl font-black mt-1 ${isFoul ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {isFoul ? 'FOUL' : `${rt} ms`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            {player?.isHost ? (
              state === 'match_over' ? (
                <button
                  onClick={handleReset}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md"
                >
                  <RotateCcw size={18} />
                  Rematch
                </button>
              ) : (
                <button
                  onClick={handleNextRound}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-md"
                >
                  Next Round
                </button>
              )
            ) : (
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 animate-pulse text-center mt-2">
                {state === 'match_over' 
                  ? "Waiting for host to restart match..."
                  : "Waiting for host to start next round..."}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
