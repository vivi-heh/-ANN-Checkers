import React, { useState } from 'react';
import {
  PieceType,
  PlayerColor,
  Move,
  RED_MAN,
  RED_KING,
  BLACK_MAN,
  BLACK_KING,
  EMPTY,
} from '../types/checkers';
import { getSquareCoords, getSquareFromCoords, isOwnPiece } from '../engine/checkersEngine';
import { Crown, AlertCircle } from 'lucide-react';
import { BoardTheme, BOARD_THEMES } from '../types/themes';

interface CheckersBoardProps {
  board: PieceType[];
  turn: PlayerColor;
  legalMoves: Move[];
  onMakeMove: (move: Move) => void;
  showSquareNumbers: boolean;
  showHeatmap: boolean;
  heatmapData: Record<number, number>;
  lastMove: Move | null;
  hintMove: Move | null;
  isAiThinking: boolean;
  theme?: BoardTheme;
  onAttemptedInvalidMove?: () => void;
}

export const CheckersBoard: React.FC<CheckersBoardProps> = ({
  board,
  turn,
  legalMoves,
  onMakeMove,
  showSquareNumbers,
  showHeatmap,
  heatmapData,
  lastMove,
  hintMove,
  isAiThinking,
  theme = BOARD_THEMES.walnut,
  onAttemptedInvalidMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<number | null>(null);

  // Filter moves available for the selected square
  const availableMovesFromSelected = selectedSquare !== null
    ? legalMoves.filter((m) => m.from === selectedSquare)
    : [];

  const validTargetSquares = new Set(availableMovesFromSelected.map((m) => m.to));

  const hasMandatoryJumps = legalMoves.some((m) => m.captures.length > 0);

  const handleSquareClick = (sq: number) => {
    if (isAiThinking || turn !== 'red') return;

    // If clicking a valid destination square from currently selected piece:
    if (selectedSquare !== null && validTargetSquares.has(sq)) {
      const chosenMove = availableMovesFromSelected.find((m) => m.to === sq);
      if (chosenMove) {
        setSelectedSquare(null);
        onMakeMove(chosenMove);
        return;
      }
    }

    const piece = board[sq];

    // If clicking own piece
    if (isOwnPiece(piece, 'red')) {
      const pieceMoves = legalMoves.filter((m) => m.from === sq);
      if (pieceMoves.length > 0) {
        setSelectedSquare(sq);
      } else {
        // Piece cannot move (e.g. blocked or mandatory jump exists elsewhere)
        if (hasMandatoryJumps) {
          onAttemptedInvalidMove?.();
        }
        setSelectedSquare(null);
      }
    } else {
      setSelectedSquare(null);
    }
  };

  const getHeatmapColor = (val: number | undefined) => {
    if (val === undefined || !showHeatmap) return '';
    // val ranges from ~ -60 to +60
    if (val > 15) return 'bg-amber-500/25 border border-amber-400/40';
    if (val > 5) return 'bg-amber-500/15';
    if (val < -15) return 'bg-rose-500/25 border border-rose-400/40';
    if (val < -5) return 'bg-rose-500/15';
    return 'bg-emerald-500/10';
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Board Outer Luxury Wooden & Metal Frame */}
      <div className={`relative p-2 sm:p-3 rounded-3xl bg-gradient-to-b ${theme.frameBg} border ${theme.frameBorder} shadow-2xl transition-all duration-300`}>
        {/* Board inner beveled playing surface */}
        <div className={`relative rounded-2xl overflow-hidden border ${theme.boardBorder} shadow-inner bg-stone-950`}>
          
          {/* Top File Coordinate labels */}
          <div className="grid grid-cols-8 text-center text-[8px] sm:text-[9px] font-mono font-medium text-stone-400 py-0.5 bg-stone-900/90 border-b border-stone-800/80">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((col) => (
              <span key={col}>{col}</span>
            ))}
          </div>

          {/* 8x8 Board Grid - Dynamic Viewport Clamp for ALL Screens (Mobile, Landscape, Tablet, Desktop) */}
          <div className="grid grid-cols-8 grid-rows-8 w-[min(48vh,88vw,410px)] h-[min(48vh,88vw,410px)]">
            {Array.from({ length: 64 }).map((_, idx) => {
              const row = Math.floor(idx / 8);
              const col = idx % 8;
              const isDark = (row + col) % 2 === 1;
              const sq = isDark ? getSquareFromCoords(row, col) : -1;
              const piece = sq > 0 ? board[sq] : EMPTY;

              const isSelected = selectedSquare === sq;
              const isValidTarget = sq > 0 && validTargetSquares.has(sq);
              const isLastMoveFrom = lastMove && lastMove.from === sq;
              const isLastMoveTo = lastMove && lastMove.to === sq;
              const isHintFrom = hintMove && hintMove.from === sq;
              const isHintTo = hintMove && hintMove.to === sq;
              const isJumpTarget = isValidTarget && availableMovesFromSelected.some(m => m.to === sq && m.captures.length > 0);

              return (
                <div
                  key={idx}
                  onClick={() => sq > 0 && handleSquareClick(sq)}
                  className={`relative flex items-center justify-center transition-colors duration-150 ${
                    !isDark
                      ? theme.lightSquare
                      : `${theme.darkSquare} ${theme.darkSquareHover}`
                  } ${
                    isSelected ? 'ring-3 ring-amber-400 ring-inset z-10' : ''
                  } ${
                    isLastMoveFrom || isLastMoveTo ? 'bg-amber-800/40' : ''
                  } ${
                    sq > 0 ? getHeatmapColor(heatmapData[sq]) : ''
                  } ${sq > 0 ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                >
                  {/* Square Number Overlay (1 to 32) */}
                  {isDark && showSquareNumbers && (
                    <span className="absolute top-0.5 left-1 text-[7px] sm:text-[8px] font-mono font-medium text-amber-200/40 pointer-events-none select-none">
                      {sq}
                    </span>
                  )}

                  {/* Hint indicator */}
                  {(isHintFrom || isHintTo) && (
                    <div className="absolute inset-1 rounded-lg border-2 border-emerald-400 border-dashed animate-pulse pointer-events-none" />
                  )}

                  {/* Valid move target markers */}
                  {isValidTarget && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                      {isJumpTarget ? (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-rose-400 bg-rose-500/35 animate-ping opacity-85" />
                      ) : (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-amber-400 shadow-md ring-2 ring-stone-900/40" />
                      )}
                    </div>
                  )}

                  {/* Tactile 3D Checker Piece with Theme Styling */}
                  {piece !== EMPTY && (
                    <div
                      className={`relative w-[78%] h-[78%] rounded-full flex items-center justify-center transition-transform transform duration-150 active:scale-90 ${
                        isSelected ? 'scale-105 shadow-2xl ring-2 ring-amber-300' : 'shadow-lg'
                      } ${
                        piece === RED_MAN || piece === RED_KING
                          ? `bg-gradient-to-b ${theme.redPieceBg} border-2 ${theme.redPieceBorder} shadow-black/80`
                          : `bg-gradient-to-b ${theme.blackPieceBg} border-2 ${theme.blackPieceBorder} shadow-black/80`
                      }`}
                    >
                      {/* Concentric lathe rings for authentic tactile checkers feel */}
                      <div className="w-[82%] h-[82%] rounded-full border border-white/25 flex items-center justify-center shadow-inner">
                        <div className="w-[68%] h-[68%] rounded-full border border-black/40 flex items-center justify-center">
                          {/* King Royal Crown Emblem */}
                          {(piece === RED_KING || piece === BLACK_KING) && (
                            <Crown
                              className={`w-[60%] h-[60%] drop-shadow-md ${
                                piece === RED_KING
                                  ? theme.redCrownColor
                                  : theme.blackCrownColor
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Coordinate labels */}
          <div className="grid grid-cols-8 text-center text-[8px] sm:text-[9px] font-mono font-medium text-stone-400 py-0.5 bg-stone-900/90 border-t border-stone-800/80">
            {['1', '2', '3', '4', '5', '6', '7', '8'].map((row) => (
              <span key={row}>{row}</span>
            ))}
          </div>

        </div>
      </div>

      {/* Mandatory Jump Warning Notice */}
      {hasMandatoryJumps && turn === 'red' && (
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/50 px-3.5 py-1.5 rounded-lg shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Mandatory Jump Required: Tournament rules compel all legal captures.</span>
        </div>
      )}
    </div>
  );
};
