import React, { useRef, useEffect } from 'react';
import { GameMoveRecord, DifficultyLevel, OpeningRecord, PieceType } from '../types/checkers';
import { Undo2, Lightbulb, Grid, Eye, BookOpen, Crown } from 'lucide-react';
import { isRedPiece, isBlackPiece } from '../engine/checkersEngine';

interface MoveHistoryProps {
  moves: GameMoveRecord[];
  board: PieceType[];
  currentOpening: OpeningRecord | null;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (lvl: DifficultyLevel) => void;
  onUndo: () => void;
  onGetHint: () => void;
  canUndo: boolean;
  isAiThinking: boolean;
  showSquareNumbers: boolean;
  onToggleSquareNumbers: () => void;
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  hintExplanation: string | null;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  board,
  currentOpening,
  difficulty,
  onChangeDifficulty,
  onUndo,
  onGetHint,
  canUndo,
  isAiThinking,
  showSquareNumbers,
  onToggleSquareNumbers,
  showHeatmap,
  onToggleHeatmap,
  hintExplanation,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  // Compute piece counts
  let redMen = 0;
  let redKings = 0;
  let blackMen = 0;
  let blackKings = 0;

  for (let sq = 1; sq <= 32; sq++) {
    const p = board[sq];
    if (p === 1) redMen++;
    else if (p === 2) redKings++;
    else if (p === -1) blackMen++;
    else if (p === -2) blackKings++;
  }

  // Pair moves into turns
  const pairedTurns: { num: number; red?: GameMoveRecord; black?: GameMoveRecord }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairedTurns.push({
      num: Math.floor(i / 2) + 1,
      red: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-stone-900/90 border border-stone-800 text-stone-200 shadow-xl">
      {/* Captured / Material Tray */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
        {/* Human (Red) Material */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Human (Red)</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
            <span>{redMen} Men</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-amber-300">
              <Crown className="w-3 h-3" />
              {redKings}
            </span>
          </div>
        </div>

        {/* AI (Black) Material */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-stone-300 font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-500 border border-stone-400" />
            <span>ANN Agent (Black)</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
            <span>{blackMen} Men</span>
            <span>·</span>
            <span className="flex items-center gap-0.5 text-stone-200">
              <Crown className="w-3 h-3" />
              {blackKings}
            </span>
          </div>
        </div>
      </div>

      {/* Recognized Opening Banner */}
      {currentOpening && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{currentOpening.name}</span>
          </div>
          <p className="text-[11px] text-stone-300 leading-relaxed">
            {currentOpening.description}
          </p>
          <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
            {currentOpening.historicalWinRate}
          </div>
        </div>
      )}

      {/* Hint Alert if requested */}
      {hintExplanation && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-xs flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>ANN Recommendation</span>
          </div>
          <p className="text-[11px] text-emerald-200 leading-relaxed">
            {hintExplanation}
          </p>
        </div>
      )}

      {/* Official Draughts Move Log */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
          <span>Notation History</span>
          <span className="text-[10px] text-stone-300 font-mono">Standard 1-32</span>
        </div>

        <div
          ref={scrollRef}
          className="h-44 overflow-y-auto rounded-xl bg-stone-950/70 border border-stone-800/80 p-2 font-mono text-xs flex flex-col divide-y divide-stone-850"
        >
          {pairedTurns.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-300 text-xs italic">
              Awaiting opening move... Red moves first.
            </div>
          ) : (
            pairedTurns.map((turn) => (
              <div key={turn.num} className="grid grid-cols-12 py-1 items-center px-1">
                <span className="col-span-2 text-stone-300 tabular-nums">{turn.num}.</span>
                <span className="col-span-5 text-rose-300 font-medium">
                  {turn.red?.notation || ''}
                </span>
                <span className="col-span-5 text-stone-300 font-medium">
                  {turn.black?.notation || ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Difficulty Setting (Segmented Functional Button Tabs) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-stone-400 font-medium">AI Strength & Depth</span>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800">
          {(
            [
              { id: 'apprentice', label: 'Apprentice', depth: 'D2' },
              { id: 'tactician', label: 'Tactician', depth: 'D4' },
              { id: 'master', label: 'Master', depth: 'D6' },
              { id: 'grandmaster', label: 'Grandmaster', depth: 'D7+' },
            ] as const
          ).map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => onChangeDifficulty(lvl.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                difficulty === lvl.id
                  ? 'bg-amber-500 text-stone-950 font-semibold shadow'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
              }`}
            >
              <span className="truncate">{lvl.label}</span>
              <span className="text-[10px] opacity-75 font-mono">{lvl.depth}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Affordance Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onGetHint}
          disabled={isAiThinking}
          className="px-3 py-2 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-750 active:scale-95 disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700/60"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Ask Hint</span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo || isAiThinking}
          className="px-3 py-2 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-750 active:scale-95 disabled:opacity-50 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-700/60"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo Turn</span>
        </button>

        <button
          onClick={onToggleSquareNumbers}
          className={`px-3 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
            showSquareNumbers
              ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
              : 'bg-stone-800 text-stone-300 border-stone-700/60 hover:bg-stone-750'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>1-32 Notation</span>
        </button>

        <button
          onClick={onToggleHeatmap}
          className={`px-3 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
            showHeatmap
              ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
              : 'bg-stone-800 text-stone-300 border-stone-700/60 hover:bg-stone-750'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>ANN Heatmap</span>
        </button>
      </div>
    </div>
  );
};
