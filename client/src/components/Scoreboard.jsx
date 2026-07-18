import React from 'react';
import { useSocket } from '../context/SocketContext';
import { RotateCcw, Award, Crown } from 'lucide-react';
import { audioController } from '../utils/audio';

export const Scoreboard = () => {
  const { room, player, resetScores } = useSocket();

  if (!room) return null;

  const handleReset = () => {
    if (confirm('Reset scores for both players?')) {
      resetScores();
      audioController.playClick();
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2 mb-4">
      <div className="glass rounded-2xl border border-pink-200/20 p-4 shadow-sm flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100/10 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-500 uppercase tracking-wider">
            <Award size={14} />
            <span>Live Scoreboard</span>
          </div>
          
          {player?.isHost && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-rose-500 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Reset All Scores"
            >
              <RotateCcw size={10} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Players grid */}
        <div className="grid grid-cols-2 gap-4 divide-x divide-pink-100/10">
          {room.players.map((p, idx) => {
            const isMe = p.id === player?.id;
            return (
              <div 
                key={p.id} 
                className={`flex flex-col items-center justify-center p-2 relative ${
                  idx === 1 ? 'pl-4' : 'pr-4'
                }`}
              >
                {/* Host Crown indicator */}
                {p.isHost && (
                  <Crown size={12} className="text-amber-500 absolute top-1 right-2 fill-amber-500" title="Room Host" />
                )}
                
                <span className={`text-xs font-medium truncate max-w-full ${
                  isMe ? 'text-pink-500 font-bold' : 'text-slate-600 dark:text-slate-300'
                }`}>
                  {p.name} {isMe && '(You)'}
                </span>

                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold bg-gradient-to-br from-pink-500 to-yellow-600 bg-clip-text text-transparent">
                    {p.score}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">pts</span>
                </div>

                {!p.connected && (
                  <span className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold uppercase tracking-wider animate-pulse mt-1">
                    Disconnected
                  </span>
                )}
              </div>
            );
          })}

          {room.players.length < 2 && (
            <div className="flex flex-col items-center justify-center pl-4 text-center">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold animate-pulse">
                Waiting for Player 2
              </span>
              <span className="text-2xl mt-1">⏳</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
