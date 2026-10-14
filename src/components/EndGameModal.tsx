import React from 'react';
import { Trophy, RefreshCw, Skull, Award } from 'lucide-react';
import { PlayerColor } from '../types/checkers';

interface EndGameModalProps {
  isOpen: boolean;
  winner: PlayerColor | 'draw' | null;
  reason: string | null;
  moveCount: number;
  onPlayAgain: () => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  isOpen,
  winner,
  reason,
  moveCount,
  onPlayAgain,
}) => {
  if (!isOpen) return null;

  const isHumanWinner = winner === 'red';
  const isAiWinner = winner === 'black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200 flex flex-col items-center text-center gap-4">
        
        {/* Emblem */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${
            isHumanWinner
              ? 'bg-amber-500/20 border-amber-400 text-amber-400'
              : isAiWinner
              ? 'bg-stone-800 border-stone-700 text-stone-300'
              : 'bg-blue-500/20 border-blue-400 text-blue-400'
          }`}
        >
          {isHumanWinner ? (
            <Trophy className="w-8 h-8" />
          ) : isAiWinner ? (
            <Award className="w-8 h-8" />
          ) : (
            <RefreshCw className="w-8 h-8" />
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-stone-100">
            {isHumanWinner
              ? 'Grandmaster Victory!'
              : isAiWinner
              ? 'ANN Agent Prevails'
              : 'Stalemate Draw'}
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
            {reason || (isHumanWinner ? 'You outmaneuvered the neural network!' : 'The AI found the decisive line.')}
          </p>
        </div>

        {/* Summary stats */}
        <div className="w-full grid grid-cols-2 gap-2 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80 font-mono text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-stone-300">Total Moves</span>
            <span className="text-sm font-semibold text-stone-100 tabular-nums">
              {moveCount}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-stone-300">Rules Standard</span>
            <span className="text-sm font-semibold text-amber-400">
              Tournament
            </span>
          </div>
        </div>

        {/* Play Again Single-line Action */}
        <button
          onClick={onPlayAgain}
          className="w-full py-2.5 px-4 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Play Again</span>
        </button>

      </div>
    </div>
  );
};
