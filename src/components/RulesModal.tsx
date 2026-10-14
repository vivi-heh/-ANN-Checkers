import React from 'react';
import { X, BookOpen, AlertCircle, Shield, Award, Cpu } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
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
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold tracking-tight text-stone-100">
            Rules of Checkers & ANN Architecture
          </h2>
        </div>

        {/* Content Sections */}
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-stone-300">
          
          {/* Section 1: Core Draughts Rules */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-stone-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              1. The Board & Movement
            </h3>
            <p>
              Checkers is played on an 8x8 grid using only the 32 dark squares (standardly numbered 1 to 32).
              Human plays <span className="text-rose-400 font-semibold">Red</span> (moving upward from rows 5–7), and the AI plays <span className="text-stone-200 font-semibold">Black</span> (moving downward from rows 0–2).
              Regular pieces (Men) move diagonally forward one square at a time into unoccupied dark squares.
            </p>
          </div>

          {/* Section 2: Mandatory Jump Tournament Rule */}
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <h3 className="font-semibold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              2. Mandatory Jumps & Multi-Jump Chains
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm">
              Under official World Checkers / Draughts Federation tournament rules, <strong>jumping is strictly mandatory</strong>.
              If any piece on your side has an available capture, you <em>must</em> jump. Normal steps are not permitted while a jump is on the board.
              Furthermore, if a piece lands on a square where another jump is immediately available, it must continue jumping in the same turn (multi-jump).
            </p>
          </div>

          {/* Section 3: Kinging */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-stone-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              3. Kinging & Crownhead
            </h3>
            <p>
              When a man reaches the opponent’s farthest row (squares 1–4 for Red; squares 29–32 for Black), it is crowned King.
              Kings gain the power to move and jump both <strong>forward and backward</strong>.
              If a piece reaches the crownhead during a jump, its turn ends immediately as it receives its crown.
            </p>
          </div>

          {/* Section 4: How the ANN Evaluates Expert Strategy */}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-stone-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              4. The Artificial Neural Network (ANN) Engine
            </h3>
            <p>
              Rather than merely counting pieces, the ANN agent evaluates 48 strategic features passed through 4 feedforward layers with Leaky-ReLU non-linearities:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-xs text-stone-300">
              <li><strong>Center Dominance:</strong> Controls central squares (14, 15, 18, 19) to restrict opponent maneuvering.</li>
              <li><strong>The Bridge Defense:</strong> Anchors squares 1 & 3 (Black) or 30 & 32 (Red) to block early opposing promotions.</li>
              <li><strong>Dog Hole Tactics:</strong> Pinning the opponent’s single corner (square 5 or 28).</li>
              <li><strong>Quiescence Search:</strong> Continues computing all forced captures to avoid tactical traps.</li>
              <li><strong>Transposition Table:</strong> Caches millions of board states via Zobrist hashing for lightning depth.</li>
            </ul>
          </div>

        </div>

        {/* Footer Action */}
        <div className="pt-5 border-t border-stone-800 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
