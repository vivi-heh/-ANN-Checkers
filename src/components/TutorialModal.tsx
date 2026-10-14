import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Crown,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PieceType, RED_MAN, RED_KING, BLACK_MAN, BLACK_KING, EMPTY } from '../types/checkers';
import { soundManager } from '../utils/audio';

interface TutorialStep {
  id: number;
  title: string;
  subtitle: string;
  instruction: string;
  ruleExplanation: string;
  tip: string;
  initialBoard: PieceType[];
  highlightFrom: number;
  highlightTo: number;
  solutionMove: { from: number; to: number };
  successMessage: string;
}

function emptyBoard(): PieceType[] {
  return new Array(33).fill(EMPTY);
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Lesson 1: The Diagonal Step',
    subtitle: 'Movement on dark squares',
    instruction: 'Click your Red checker on square 22 and move it diagonally forward to square 18.',
    ruleExplanation:
      'Checkers is played exclusively on the 32 dark squares. Normal checkers (called "Men") can only move diagonally forward 1 step into an open adjacent dark square.',
    tip: 'Red checkers move UP towards square 1, while Black checkers move DOWN towards square 32.',
    initialBoard: (() => {
      const b = emptyBoard();
      b[22] = RED_MAN;
      b[23] = RED_MAN;
      b[9] = BLACK_MAN;
      return b;
    })(),
    highlightFrom: 22,
    highlightTo: 18,
    solutionMove: { from: 22, to: 18 },
    successMessage: 'Well done! You made your first legal diagonal step.',
  },
  {
    id: 2,
    title: 'Lesson 2: Capturing by Jumping',
    subtitle: 'Leaping over enemy checkers',
    instruction: 'Click your Red checker on 18 and jump over Black on 14 to land on square 9.',
    ruleExplanation:
      'When an opponent checker is diagonally adjacent and the square directly behind it is empty, you must jump over it. The jumped piece is captured and removed from the board!',
    tip: 'Captures can happen diagonally to the left or right, leaping over exactly one piece.',
    initialBoard: (() => {
      const b = emptyBoard();
      b[18] = RED_MAN;
      b[14] = BLACK_MAN; // Enemy piece to capture
      return b;
    })(),
    highlightFrom: 18,
    highlightTo: 9,
    solutionMove: { from: 18, to: 9 },
    successMessage: 'Capture complete! Black piece was removed from the board.',
  },
  {
    id: 3,
    title: 'Lesson 3: The Mandatory Jump & Multi-Jumps',
    subtitle: 'Tournament chaining rule',
    instruction: 'Jump over piece 19 to square 15, then continue jumping over piece 11 to land on 8!',
    ruleExplanation:
      'In tournament draughts, jumping is strictly MANDATORY. If a capture is available, you cannot make a normal step. If your landing square opens another jump, you must continue jumping in the same turn!',
    tip: 'Multi-jumps allow skilled players to wipe out several opposing checkers in a single move.',
    initialBoard: (() => {
      const b = emptyBoard();
      b[24] = RED_MAN;
      b[19] = BLACK_MAN; // First jump
      b[11] = BLACK_MAN; // Second jump
      return b;
    })(),
    highlightFrom: 24,
    highlightTo: 8,
    solutionMove: { from: 24, to: 8 },
    successMessage: 'Double jump executed! You captured 2 pieces in one turn.',
  },
  {
    id: 4,
    title: 'Lesson 4: King Coronation',
    subtitle: 'Unlocking backward movement',
    instruction: 'Advance your checker on square 6 into the crownhead at square 1.',
    ruleExplanation:
      'When a man reaches the farthest row on the opponent’s side (squares 1–4 for Red; 29–32 for Black), it is crowned KING! Kings gain the immense power to move and jump both forwards AND backwards.',
    tip: 'Kings dominate the board because they can attack from any angle and retreat safely.',
    initialBoard: (() => {
      const b = emptyBoard();
      b[6] = RED_MAN;
      b[15] = BLACK_MAN;
      return b;
    })(),
    highlightFrom: 6,
    highlightTo: 1,
    solutionMove: { from: 6, to: 1 },
    successMessage: 'Crowned King! Your piece now commands backward and forward diagonals.',
  },
  {
    id: 5,
    title: 'Lesson 5: Winning the Game',
    subtitle: 'Victory conditions & strategic advice',
    instruction: 'Use your King on square 18 to trap the lone Black piece on square 9.',
    ruleExplanation:
      'You win in Checkers by either: (1) Capturing all opponent pieces, or (2) Leaving the opponent with zero legal moves (suffocation/blockade).',
    tip: 'Control the center squares (14, 15, 18, 19) and maintain your back row (squares 29–32) to prevent the AI from crowning kings early!',
    initialBoard: (() => {
      const b = emptyBoard();
      b[18] = RED_KING;
      b[9] = BLACK_MAN;
      return b;
    })(),
    highlightFrom: 18,
    highlightTo: 14,
    solutionMove: { from: 18, to: 14 },
    successMessage: 'Center seized! You are now prepared to challenge the ANN AI Agent.',
  },
];

export const TutorialModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onStartPlaying: () => void;
}> = ({ isOpen, onClose, onStartPlaying }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [board, setBoard] = useState<PieceType[]>(() => TUTORIAL_STEPS[0].initialBoard);
  const [selectedSq, setSelectedSq] = useState<number | null>(null);
  const [stepCompleted, setStepCompleted] = useState(false);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStepIdx];

  const handleSelectStep = (idx: number) => {
    setCurrentStepIdx(idx);
    setBoard([...TUTORIAL_STEPS[idx].initialBoard]);
    setSelectedSq(null);
    setStepCompleted(false);
  };

  const handleResetStep = () => {
    setBoard([...step.initialBoard]);
    setSelectedSq(null);
    setStepCompleted(false);
    soundManager.playMove();
  };

  const handleSquareClick = (sq: number) => {
    if (stepCompleted) return;

    if (selectedSq === null) {
      if (sq === step.highlightFrom) {
        setSelectedSq(sq);
        soundManager.playMove();
      }
    } else {
      if (sq === step.highlightTo) {
        // Execute the tutorial move
        const next = [...board];
        const piece = next[selectedSq];
        next[selectedSq] = EMPTY;

        // Handle captures
        if (step.id === 2) {
          next[14] = EMPTY;
          soundManager.playCapture();
        } else if (step.id === 3) {
          next[19] = EMPTY;
          next[11] = EMPTY;
          soundManager.playCapture();
        } else if (step.id === 4) {
          soundManager.playCrown();
        } else {
          soundManager.playMove();
        }

        if (step.id === 4) {
          next[sq] = RED_KING;
        } else {
          next[sq] = piece;
        }

        setBoard(next);
        setSelectedSq(null);
        setStepCompleted(true);
      } else if (sq === step.highlightFrom) {
        setSelectedSq(null);
      }
    }
  };

  const handleNextLesson = () => {
    if (currentStepIdx < TUTORIAL_STEPS.length - 1) {
      handleSelectStep(currentStepIdx + 1);
    } else {
      onStartPlaying();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-stone-900 border border-stone-800 p-5 sm:p-6 shadow-2xl text-stone-200 flex flex-col gap-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-stone-100">
              Interactive Checkers Tutorial
            </h2>
            <p className="text-xs text-stone-400">
              Master the basic rules and tournament mechanics in 5 quick interactive steps
            </p>
          </div>
        </div>

        {/* Lesson Stepper */}
        <div className="grid grid-cols-5 gap-1.5">
          {TUTORIAL_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleSelectStep(idx)}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                currentStepIdx === idx
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                  : 'bg-stone-950/60 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              <span>{s.id}</span>
              <span className="hidden sm:inline">· {s.title.split(':')[1]?.trim() || ''}</span>
            </button>
          ))}
        </div>

        {/* Lesson Title & Instructions Card */}
        <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100">
              {step.title}: {step.subtitle}
            </h3>
            <button
              onClick={handleResetStep}
              title="Reset position"
              className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed">
            {step.ruleExplanation}
          </p>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 font-medium">
            <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{step.instruction}</span>
          </div>
        </div>

        {/* Interactive Mini Checkers Board */}
        <div className="flex flex-col items-center justify-center my-1 select-none">
          <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-stone-850 to-stone-950 border border-stone-800 shadow-xl">
            <div className="grid grid-cols-8 grid-rows-8 w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-lg overflow-hidden border border-amber-950/50">
              {Array.from({ length: 64 }).map((_, idx) => {
                const row = Math.floor(idx / 8);
                const col = idx % 8;
                const isDark = (row + col) % 2 === 1;
                const sq = isDark ? row * 4 + Math.floor(col / 2) + 1 : -1;
                const piece = sq > 0 ? board[sq] : EMPTY;

                const isHighlightFrom = sq === step.highlightFrom && !stepCompleted;
                const isHighlightTo = sq === step.highlightTo && !stepCompleted;
                const isSelected = selectedSq === sq;

                return (
                  <div
                    key={idx}
                    onClick={() => sq > 0 && handleSquareClick(sq)}
                    className={`relative flex items-center justify-center transition-colors ${
                      !isDark
                        ? 'bg-[#e2c79f]'
                        : 'bg-[#5c3a21] hover:bg-[#6e4627]'
                    } ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-inset z-10'
                        : isHighlightFrom
                        ? 'ring-2 ring-rose-400/80 animate-pulse'
                        : isHighlightTo && selectedSq
                        ? 'ring-2 ring-emerald-400/90 bg-[#6d4e33]'
                        : ''
                    } ${sq > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {/* Square Number */}
                    {isDark && (
                      <span className="absolute top-0.5 left-1 text-[8px] font-mono text-amber-200/40 pointer-events-none">
                        {sq}
                      </span>
                    )}

                    {/* Move Target Dot */}
                    {isHighlightTo && selectedSq && !stepCompleted && (
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping pointer-events-none" />
                    )}

                    {/* Piece */}
                    {piece !== EMPTY && (
                      <div
                        className={`w-6 h-6 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center border transition-all ${
                          piece === RED_MAN || piece === RED_KING
                            ? 'bg-gradient-to-b from-rose-500 to-rose-900 border-rose-400 shadow-md'
                            : 'bg-gradient-to-b from-stone-700 to-stone-950 border-stone-500 shadow-md'
                        } ${isSelected ? 'scale-110' : ''}`}
                      >
                        {(piece === RED_KING || piece === BLACK_KING) && (
                          <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Completion Banner */}
        {stepCompleted && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{step.successMessage}</span>
            </div>
            <button
              onClick={handleNextLesson}
              className="px-3 py-1 font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>{currentStepIdx < TUTORIAL_STEPS.length - 1 ? 'Next Lesson' : 'Play Match'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pro Tip */}
        <div className="text-[11px] text-stone-400 font-mono flex items-start gap-1.5 px-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span><strong>Strategic Tip:</strong> {step.tip}</span>
        </div>

        {/* Footer Navigation Actions */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
          <button
            onClick={() => currentStepIdx > 0 && handleSelectStep(currentStepIdx - 1)}
            disabled={currentStepIdx === 0}
            className="px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onStartPlaying();
                onClose();
              }}
              className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              Skip to Match
            </button>

            <button
              onClick={handleNextLesson}
              className="px-4 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>{currentStepIdx < TUTORIAL_STEPS.length - 1 ? 'Next' : 'Start Match'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
