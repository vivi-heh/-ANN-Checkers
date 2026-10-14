import React from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import { CHECKERS_OPENINGS } from '../engine/openings';

interface OpeningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOpening?: (moves: string[]) => void;
}

export const OpeningsModal: React.FC<OpeningsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-stone-800 mb-5">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-100">
              Grandmaster Checkers Opening Book
            </h2>
            <p className="text-xs text-stone-400">
              Theoretical tournament openings recognized by the ANN neural engine
            </p>
          </div>
        </div>

        {/* Openings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHECKERS_OPENINGS.map((op, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-stone-950/70 border border-stone-800/80 hover:border-amber-500/40 transition-colors flex flex-col justify-between gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-100">
                    {op.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs text-amber-400 bg-stone-900 px-2.5 py-1 rounded-md w-fit">
                  {op.moves.join(' · ')}
                </div>

                <p className="text-xs text-stone-300 leading-relaxed mt-1">
                  {op.description}
                </p>
              </div>

              <div className="text-[11px] text-stone-300 font-mono pt-2 border-t border-stone-850">
                {op.historicalWinRate}
              </div>
            </div>
          ))}
        </div>

        {/* Close Button Footer */}
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
