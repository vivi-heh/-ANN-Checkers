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
import { soundManager } from '../utils/audio';

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

  // Moves available for the currently selected square
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

    // If clicking own piece (Red)
    if (isOwnPiece(piece, 'red')) {
      const pieceMoves = legalMoves.filter((m) => m.from === sq);
      if (pieceMoves.length > 0) {
        setSelectedSquare(sq);
        soundManager.playSelectPiece();
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
    if (val > 15) return 'bg-amber-500/25 border border-amber-400/40';
    if (val > 5) return 'bg-amber-500/15';
    if (val < -15) return 'bg-rose-500/25 border border-rose-400/40';
    if (val < -5) return 'bg-rose-500/15';
    return 'bg-emerald-500/10';
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Outer Luxury Hardwood Moulding Frame */}
      <div
        className={`relative p-2.5 sm:p-4 rounded-3xl bg-gradient-to-b ${theme.frameBg} border-2 ${theme.frameBorder} shadow-[0_20px_50px_rgba(0,0,0,0.85)] transition-all duration-300`}
      >
        {/* Decorative Polished Brass Corner Brackets */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 sm:w-4 sm:h-4 brass-corner rounded-tl-sm pointer-events-none opacity-90" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 brass-corner rounded-tr-sm pointer-events-none opacity-90" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 sm:w-4 sm:h-4 brass-corner rounded-bl-sm pointer-events-none opacity-90" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 brass-corner rounded-br-sm pointer-events-none opacity-90" />

        {/* Inner Brass Inlay Fillet */}
        <div className="relative p-0.5 sm:p-1 rounded-2xl bg-gradient-to-b from-[#d4af37]/60 via-[#997b1a]/40 to-[#d4af37]/50 shadow-sm">
          
          {/* Board Playing Box */}
          <div className={`relative rounded-xl overflow-hidden border ${theme.boardBorder} bg-stone-950 shadow-inner`}>
            
            {/* Top Coordinate Header (A to H) */}
            <div className="grid grid-cols-8 text-center text-[9px] sm:text-[10px] font-serif font-bold text-[#d4af37]/80 py-0.5 sm:py-1 bg-gradient-to-b from-[#221711] to-[#1a110c] border-b border-[#3d2415]">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((col) => (
                <span key={col} className="tracking-widest">{col}</span>
              ))}
            </div>

            {/* 8x8 Board Grid - Dynamically clamped for flawless view on phone, tablet, and desktop */}
            <div className="grid grid-cols-8 grid-rows-8 w-[min(50vh,88vw,440px)] h-[min(50vh,88vw,440px)] md:w-[min(58vh,520px)] md:h-[min(58vh,520px)]">
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
                const isJumpTarget = isValidTarget && availableMovesFromSelected.some((m) => m.to === sq && m.captures.length > 0);

                return (
                  <div
                    key={idx}
                    onClick={() => sq > 0 && handleSquareClick(sq)}
                    className={`relative flex items-center justify-center transition-colors duration-150 ${
                      !isDark
                        ? `${theme.lightSquare} square-grain-light shadow-inner`
                        : `${theme.darkSquare} square-grain-dark ${theme.darkSquareHover}`
                    } ${
                      isSelected ? 'ring-2 sm:ring-3 ring-amber-400 ring-inset z-10' : ''
                    } ${
                      isLastMoveFrom || isLastMoveTo ? 'after:absolute after:inset-0 after:bg-amber-500/20 after:pointer-events-none' : ''
                    } ${
                      sq > 0 ? getHeatmapColor(heatmapData[sq]) : ''
                    } ${sq > 0 ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
                  >
                    {/* Square Number Overlay (1 to 32) */}
                    {isDark && showSquareNumbers && (
                      <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] font-serif font-bold text-amber-200/40 pointer-events-none select-none drop-shadow-sm">
                        {sq}
                      </span>
                    )}

                    {/* Hint indicator */}
                    {(isHintFrom || isHintTo) && (
                      <div className="absolute inset-1 rounded-lg border-2 border-emerald-400 border-dashed animate-pulse pointer-events-none z-20" />
                    )}

                    {/* Valid move target markers (Warm refined gaming markers) */}
                    {isValidTarget && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        {isJumpTarget ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-amber-300 bg-amber-500/30 animate-pulse flex items-center justify-center shadow-md">
                            <div className="w-2 h-2 rounded-full bg-amber-300" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#d4af37] shadow-[0_2px_4px_rgba(0,0,0,0.6)] ring-2 ring-[#70551c]" />
                        )}
                      </div>
                    )}

                    {/* Tactile 3D Checker Piece */}
                    {piece !== EMPTY && (
                      <div
                        className={`relative w-[80%] h-[80%] rounded-full flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? 'checker-disc-selected z-30'
                            : piece === RED_MAN || piece === RED_KING
                            ? 'checker-disc-red'
                            : 'checker-disc-black'
                        } ${
                          piece === RED_MAN || piece === RED_KING
                            ? `bg-gradient-to-b ${theme.redPieceBg} border ${theme.redPieceBorder}`
                            : `bg-gradient-to-b ${theme.blackPieceBg} border ${theme.blackPieceBorder}`
                        }`}
                      >
                        {/* Concentric Lathe Ring 1 */}
                        <div className="w-[82%] h-[82%] rounded-full border border-white/20 flex items-center justify-center shadow-inner">
                          {/* Concentric Lathe Ring 2 */}
                          <div className="w-[70%] h-[70%] rounded-full border border-black/40 flex items-center justify-center bg-black/10">
                            {/* King Royal Crown Emblem */}
                            {(piece === RED_KING || piece === BLACK_KING) && (
                              <Crown
                                className={`w-[62%] h-[62%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
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

            {/* Bottom Coordinate Footer (1 to 8) */}
            <div className="grid grid-cols-8 text-center text-[9px] sm:text-[10px] font-serif font-bold text-[#d4af37]/80 py-0.5 sm:py-1 bg-gradient-to-b from-[#1a110c] to-[#221711] border-t border-[#3d2415]">
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((row) => (
                <span key={row} className="tracking-widest">{row}</span>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Mandatory Jump Warning Notice */}
      {hasMandatoryJumps && turn === 'red' && (
        <div className="mt-2 sm:mt-3 flex items-center gap-2 text-xs font-semibold text-amber-200 bg-amber-950/70 border border-amber-700/60 px-3.5 py-1.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Mandatory Jump Required — Tournament rules compel legal capture.</span>
        </div>
      )}
    </div>
  );
};
