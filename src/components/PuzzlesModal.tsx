import React from 'react';
import { X, Target, Play, CheckCircle2 } from 'lucide-react';
import { TACTICAL_PUZZLES } from '../engine/puzzles';
import { TacticalPuzzle } from '../types/checkers';

interface PuzzlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPuzzle: (puzzle: TacticalPuzzle) => void;
}

export const PuzzlesModal: React.FC<PuzzlesModalProps> = ({
  isOpen,
  onClose,
  onSelectPuzzle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-800 mb-5">
          <Target className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-100">
              Tactical Shot & Combination Challenges
            </h2>
            <p className="text-xs text-stone-400">
              Solve renowned checkers endgame combinations and sacrifice traps
            </p>
          </div>
        </div>

        {/* Puzzle List */}
        <div className="flex flex-col gap-4">
          {TACTICAL_PUZZLES.map((puzzle) => (
            <div
              key={puzzle.id}
              className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 hover:border-amber-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-stone-100">
                    {puzzle.title}
                  </h3>
                  <span className="text-[10px] font-mono uppercase text-amber-400/90 bg-stone-900 px-2 py-0.5 rounded border border-amber-900/30">
                    {puzzle.difficulty}
                  </span>
                </div>

                <div className="text-xs text-stone-400 font-medium">
                  {puzzle.subtitle} · To move:{' '}
                  <span className={puzzle.turn === 'red' ? 'text-rose-400' : 'text-stone-300'}>
                    {puzzle.turn.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {puzzle.description}
                </p>
              </div>

              <button
                onClick={() => {
                  onSelectPuzzle(puzzle);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                Play Shot
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-5 border-t border-stone-800 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
