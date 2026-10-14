/**
 * Tournament-grade Checkers Rules & Search Engine
 * Features:
 * - Exact English Draughts rules with mandatory jumps & multi-jump chains
 * - Crownhead promotions
 * - Minimax with Alpha-Beta Pruning & Quiescence Search
 * - Zobrist Hashing & Transposition Table
 * - ANN Integration with real-time telemetry
 */

import {
  PieceType,
  RED_MAN,
  RED_KING,
  BLACK_MAN,
  BLACK_KING,
  EMPTY,
  PlayerColor,
  Move,
  DifficultyLevel,
  AISearchTelemetry,
} from '../types/checkers';
import { SQUARE_NEIGHBORS, CENTER_SQUARES, globalCheckersANN } from './neuralNetwork';
import { identifyOpening } from './openings';

export function getSquareCoords(sq: number): { row: number; col: number } {
  const row = Math.floor((sq - 1) / 4);
  const posInRow = (sq - 1) % 4;
  const col = row % 2 === 0 ? posInRow * 2 + 1 : posInRow * 2;
  return { row, col };
}

export function getSquareFromCoords(row: number, col: number): number {
  if (row < 0 || row > 7 || col < 0 || col > 7) return -1;
  if ((row + col) % 2 === 0) return -1; // light square
  return row * 4 + Math.floor(col / 2) + 1;
}

export function createInitialBoard(): PieceType[] {
  const board: PieceType[] = new Array(33).fill(EMPTY);
  // Black pieces (AI) on squares 1 to 12
  for (let sq = 1; sq <= 12; sq++) {
    board[sq] = BLACK_MAN;
  }
  // Squares 13 to 20 are empty
  // Red pieces (Player) on squares 21 to 32
  for (let sq = 21; sq <= 32; sq++) {
    board[sq] = RED_MAN;
  }
  return board;
}

// Direction indices
type Direction = 'UL' | 'UR' | 'DL' | 'DR';

const RED_MAN_DIRS: Direction[] = ['UL', 'UR'];
const BLACK_MAN_DIRS: Direction[] = ['DL', 'DR'];
const KING_DIRS: Direction[] = ['UL', 'UR', 'DL', 'DR'];

export function isRedPiece(p: PieceType): boolean {
  return p === RED_MAN || p === RED_KING;
}

export function isBlackPiece(p: PieceType): boolean {
  return p === BLACK_MAN || p === BLACK_KING;
}

export function isOpponent(piece: PieceType, color: PlayerColor): boolean {
  if (color === 'red') return isBlackPiece(piece);
  return isRedPiece(piece);
}

export function isOwnPiece(piece: PieceType, color: PlayerColor): boolean {
  if (color === 'red') return isRedPiece(piece);
  return isBlackPiece(piece);
}

export function isCrownhead(sq: number, color: PlayerColor): boolean {
  if (color === 'red') return sq >= 1 && sq <= 4;
  return sq >= 29 && sq <= 32;
}

// Zobrist Hashing for Transposition Table
const ZOBRIST_TABLE: number[][] = []; // [sq 0..32][piece 0..4]
let ZOBRIST_BLACK_TURN = 0;

function initZobrist() {
  let seed = 918273645;
  const rand32 = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return seed >>> 0;
  };

  for (let sq = 0; sq <= 32; sq++) {
    ZOBRIST_TABLE[sq] = [];
    for (let p = 0; p < 5; p++) {
      ZOBRIST_TABLE[sq][p] = rand32();
    }
  }
  ZOBRIST_BLACK_TURN = rand32();
}
initZobrist();

function pieceToZobristIndex(p: PieceType): number {
  switch (p) {
    case EMPTY: return 0;
    case RED_MAN: return 1;
    case RED_KING: return 2;
    case BLACK_MAN: return 3;
    case BLACK_KING: return 4;
  }
}

export function computeZobristHash(board: PieceType[], color: PlayerColor): number {
  let hash = 0;
  for (let sq = 1; sq <= 32; sq++) {
    const pIdx = pieceToZobristIndex(board[sq]);
    hash ^= ZOBRIST_TABLE[sq][pIdx];
  }
  if (color === 'black') {
    hash ^= ZOBRIST_BLACK_TURN;
  }
  return hash >>> 0;
}

interface TTEntry {
  hash: number;
  depth: number;
  score: number;
  flag: 'EXACT' | 'LOWER' | 'UPPER';
  bestMove?: Move;
}

const TRANSPOSITION_TABLE = new Map<number, TTEntry>();

export class CheckersEngine {
  /**
   * Generates all legal moves for `color` on `board`.
   * Follows strict tournament rule: If ANY jump is available, MUST jump!
   */
  public static getLegalMoves(board: PieceType[], color: PlayerColor): Move[] {
    const jumpMoves: Move[] = [];
    const stepMoves: Move[] = [];

    for (let sq = 1; sq <= 32; sq++) {
      const piece = board[sq];
      if (!isOwnPiece(piece, color)) continue;

      const isKing = piece === RED_KING || piece === BLACK_KING;
      const dirs = isKing
        ? KING_DIRS
        : color === 'red'
        ? RED_MAN_DIRS
        : BLACK_MAN_DIRS;

      // Check jumps first
      const pieceJumps = this.findJumpsForPiece(board, sq, piece, color, dirs);
      if (pieceJumps.length > 0) {
        jumpMoves.push(...pieceJumps);
      } else {
        // If no jumps found yet anywhere, check simple steps
        for (const dir of dirs) {
          const target = SQUARE_NEIGHBORS[sq][dir];
          if (target > 0 && board[target] === EMPTY) {
            const becomesKing = !isKing && isCrownhead(target, color);
            stepMoves.push({
              from: sq,
              to: target,
              captures: [],
              path: [sq, target],
              isKinging: becomesKing,
            });
          }
        }
      }
    }

    // MANDATORY JUMP RULE: If any jump exists, only jumps are legal moves
    if (jumpMoves.length > 0) {
      return jumpMoves;
    }

    return stepMoves;
  }

  /**
   * Recursive multi-jump finder
   */
  private static findJumpsForPiece(
    board: PieceType[],
    startSq: number,
    piece: PieceType,
    color: PlayerColor,
    dirs: Direction[],
    visitedCaptures: number[] = [],
    currentPath: number[] = [startSq]
  ): Move[] {
    const jumps: Move[] = [];
    const currentSq = currentPath[currentPath.length - 1];
    const isOriginalKing = piece === RED_KING || piece === BLACK_KING;

    let foundContinuation = false;

    for (const dir of dirs) {
      const overSq = SQUARE_NEIGHBORS[currentSq][dir];
      if (overSq <= 0) continue;
      // Cannot jump already captured piece in this multi-jump sequence
      if (visitedCaptures.includes(overSq)) continue;

      const jumpedPiece = board[overSq];
      if (isOpponent(jumpedPiece, color)) {
        const landSq = SQUARE_NEIGHBORS[overSq][dir];
        if (landSq > 0 && (board[landSq] === EMPTY || landSq === startSq)) {
          // Valid single jump step!
          const becameKing = !isOriginalKing && isCrownhead(landSq, color);

          // In official English rules: if crowned during jump, the move ENDS immediately.
          if (becameKing) {
            jumps.push({
              from: startSq,
              to: landSq,
              captures: [...visitedCaptures, overSq],
              path: [...currentPath, landSq],
              isKinging: true,
            });
            foundContinuation = true;
          } else {
            // Simulate jump on board copy for multi-jump check
            const nextBoard = [...board];
            nextBoard[currentSq] = EMPTY;
            nextBoard[overSq] = EMPTY;
            nextBoard[landSq] = piece;

            const nextDirs = isOriginalKing ? KING_DIRS : dirs;
            const subJumps = this.findJumpsForPiece(
              nextBoard,
              startSq,
              piece,
              color,
              nextDirs,
              [...visitedCaptures, overSq],
              [...currentPath, landSq]
            );

            if (subJumps.length > 0) {
              jumps.push(...subJumps);
              foundContinuation = true;
            } else {
              jumps.push({
                from: startSq,
                to: landSq,
                captures: [...visitedCaptures, overSq],
                path: [...currentPath, landSq],
                isKinging: false,
              });
              foundContinuation = true;
            }
          }
        }
      }
    }

    return jumps;
  }

  /**
   * Applies move to board and returns a new board state
   */
  public static applyMove(board: PieceType[], move: Move, color: PlayerColor): PieceType[] {
    const next = [...board];
    const piece = next[move.from];
    next[move.from] = EMPTY;

    for (const cap of move.captures) {
      next[cap] = EMPTY;
    }

    if (move.isKinging) {
      next[move.to] = color === 'red' ? RED_KING : BLACK_KING;
    } else {
      next[move.to] = piece;
    }

    return next;
  }

  /**
   * Notation format e.g. "11-15" or "15x22x29"
   */
  public static formatMoveNotation(move: Move): string {
    if (move.captures.length === 0) {
      return `${move.from}-${move.to}`;
    }
    return move.path.join('x');
  }

  /**
   * Checks if game has ended
   */
  public static checkGameOver(
    board: PieceType[],
    activeColor: PlayerColor
  ): { isOver: boolean; winner?: PlayerColor | 'draw'; reason?: string } {
    let redCount = 0;
    let blackCount = 0;
    for (let sq = 1; sq <= 32; sq++) {
      if (isRedPiece(board[sq])) redCount++;
      if (isBlackPiece(board[sq])) blackCount++;
    }

    if (redCount === 0) {
      return { isOver: true, winner: 'black', reason: 'Black captured all Red pieces.' };
    }
    if (blackCount === 0) {
      return { isOver: true, winner: 'red', reason: 'Red captured all Black pieces.' };
    }

    const legalMoves = this.getLegalMoves(board, activeColor);
    if (legalMoves.length === 0) {
      const winner = activeColor === 'red' ? 'black' : 'red';
      return {
        isOver: true,
        winner,
        reason: `${activeColor === 'red' ? 'Red' : 'Black'} has no legal moves remaining.`,
      };
    }

    return { isOver: false };
  }

  /**
   * Quiescence search to evaluate captures and avoid the horizon effect
   */
  private static quiescence(
    board: PieceType[],
    alpha: number,
    beta: number,
    color: PlayerColor,
    qDepth: number
  ): number {
    const standPat = globalCheckersANN.evaluate(board, color).evalScore;
    const isMaximizing = color === 'black';

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;
    }

    if (qDepth <= 0) return standPat;

    // Only search captures in quiescence
    const legalMoves = this.getLegalMoves(board, color);
    const captureMoves = legalMoves.filter((m) => m.captures.length > 0);
    if (captureMoves.length === 0) return standPat;

    const nextColor: PlayerColor = color === 'black' ? 'red' : 'black';

    if (isMaximizing) {
      for (const move of captureMoves) {
        const nextBoard = this.applyMove(board, move, color);
        const score = this.quiescence(nextBoard, alpha, beta, nextColor, qDepth - 1);
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    } else {
      for (const move of captureMoves) {
        const nextBoard = this.applyMove(board, move, color);
        const score = this.quiescence(nextBoard, alpha, beta, nextColor, qDepth - 1);
        if (score <= alpha) return alpha;
        if (score < beta) beta = score;
      }
      return beta;
    }
  }

  /**
   * Minimax search with Alpha-Beta pruning, Transposition Table, and ANN evaluations
   */
  private static alphaBeta(
    board: PieceType[],
    depth: number,
    alpha: number,
    beta: number,
    color: PlayerColor,
    stats: { nodes: number; tHits: number }
  ): { score: number; bestMove?: Move } {
    stats.nodes++;

    const hash = computeZobristHash(board, color);
    const cached = TRANSPOSITION_TABLE.get(hash);
    if (cached && cached.depth >= depth) {
      stats.tHits++;
      if (cached.flag === 'EXACT') return { score: cached.score, bestMove: cached.bestMove };
      if (cached.flag === 'LOWER' && cached.score > alpha) alpha = cached.score;
      if (cached.flag === 'UPPER' && cached.score < beta) beta = cached.score;
      if (alpha >= beta) return { score: cached.score, bestMove: cached.bestMove };
    }

    const legalMoves = this.getLegalMoves(board, color);
    if (legalMoves.length === 0) {
      // Current player lost (no moves)
      return { score: color === 'black' ? -99999 + (10 - depth) : 99999 - (10 - depth) };
    }

    if (depth <= 0) {
      // Run quiescence search to resolve pending tactical captures
      const qScore = this.quiescence(board, alpha, beta, color, 4);
      return { score: qScore };
    }

    // Move Ordering: Captures first (multi-captures first), then killer/cached best move
    legalMoves.sort((a, b) => {
      if (b.captures.length !== a.captures.length) {
        return b.captures.length - a.captures.length;
      }
      if (cached?.bestMove && a.from === cached.bestMove.from && a.to === cached.bestMove.to) return -1;
      if (cached?.bestMove && b.from === cached.bestMove.from && b.to === cached.bestMove.to) return 1;
      return 0;
    });

    let bestMove = legalMoves[0];
    const isMaximizing = color === 'black'; // AI is Black
    const nextColor: PlayerColor = color === 'black' ? 'red' : 'black';

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const move of legalMoves) {
        const nextBoard = this.applyMove(board, move, color);
        const { score } = this.alphaBeta(nextBoard, depth - 1, alpha, beta, nextColor, stats);

        if (score > maxScore) {
          maxScore = score;
          bestMove = move;
        }
        if (score > alpha) alpha = score;
        if (beta <= alpha) break; // Beta cutoff
      }

      TRANSPOSITION_TABLE.set(hash, {
        hash,
        depth,
        score: maxScore,
        flag: maxScore <= alpha ? 'UPPER' : maxScore >= beta ? 'LOWER' : 'EXACT',
        bestMove,
      });

      return { score: maxScore, bestMove };
    } else {
      let minScore = Infinity;
      for (const move of legalMoves) {
        const nextBoard = this.applyMove(board, move, color);
        const { score } = this.alphaBeta(nextBoard, depth - 1, alpha, beta, nextColor, stats);

        if (score < minScore) {
          minScore = score;
          bestMove = move;
        }
        if (score < beta) beta = score;
        if (beta <= alpha) break; // Alpha cutoff
      }

      TRANSPOSITION_TABLE.set(hash, {
        hash,
        depth,
        score: minScore,
        flag: minScore <= alpha ? 'UPPER' : minScore >= beta ? 'LOWER' : 'EXACT',
        bestMove,
      });

      return { score: minScore, bestMove };
    }
  }

  /**
   * Runs the ANN search for the AI agent
   */
  public static findBestMove(
    board: PieceType[],
    color: PlayerColor,
    difficulty: DifficultyLevel,
    moveHistory: string[] = []
  ): { move: Move; telemetry: AISearchTelemetry } {
    const startTime = performance.now();
    // Instant exit if only 1 legal move is available (forced capture or move)
    const immediateMoves = this.getLegalMoves(board, color);
    if (immediateMoves.length === 1) {
      const bestMove = immediateMoves[0];
      const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
      const nextBoard = this.applyMove(board, bestMove, color);
      const { activations, breakdown, evalScore } = globalCheckersANN.evaluate(nextBoard, color);
      const notation = this.formatMoveNotation(bestMove);
      return {
        move: bestMove,
        telemetry: {
          depthReached: 1,
          nodesEvaluated: 1,
          timeMs: elapsedMs,
          nodesPerSec: 1000,
          transpositionHits: 0,
          winProbability: Math.round(100 * (2 / (1 + Math.exp(-evalScore / 250)) - 1)),
          bestMoveNotation: notation,
          principalVariation: [notation],
          activations,
          featureBreakdown: breakdown,
          evalScore,
        },
      };
    }

    // Select search depth according to difficulty - tuned for fast sub-50ms responses
    let targetDepth = 3;
    switch (difficulty) {
      case 'apprentice':
        targetDepth = 2;
        break;
      case 'tactician':
        targetDepth = 3;
        break;
      case 'master':
        targetDepth = 4;
        break;
      case 'grandmaster':
        targetDepth = 5;
        break;
    }

    let bestMove: Move | undefined;
    let finalScore = 0;
    const stats = { nodes: 0, tHits: 0 };

    // Iterative deepening up to target depth
    for (let d = 1; d <= targetDepth; d++) {
      const result = this.alphaBeta(board, d, -Infinity, Infinity, color, stats);
      if (result.bestMove) {
        bestMove = result.bestMove;
        finalScore = result.score;
      }
    }

    if (!bestMove) {
      const fallbackMoves = this.getLegalMoves(board, color);
      bestMove = fallbackMoves[0];
    }

    const elapsedMs = Math.max(1, Math.round(performance.now() - startTime));
    const nps = Math.round((stats.nodes / elapsedMs) * 1000);

    // Get live ANN activations for the chosen move's resulting board state
    const nextBoard = this.applyMove(board, bestMove, color);
    const { activations, breakdown, evalScore } = globalCheckersANN.evaluate(nextBoard, color);

    // Compute win probability clamped from -100 to +100
    // +1000 eval score corresponds to approx ~88% win prob
    const winProb = Math.round(100 * (2 / (1 + Math.exp(-evalScore / 250)) - 1));

    const notation = this.formatMoveNotation(bestMove);

    const telemetry: AISearchTelemetry = {
      depthReached: targetDepth,
      nodesEvaluated: stats.nodes,
      timeMs: elapsedMs,
      nodesPerSec: nps,
      transpositionHits: stats.tHits,
      winProbability: winProb,
      bestMoveNotation: notation,
      principalVariation: [notation],
      activations,
      featureBreakdown: breakdown,
      evalScore,
    };

    return { move: bestMove, telemetry };
  }

  /**
   * Generates Hint for Human player (Red)
   */
  public static getHint(board: PieceType[]): { move: Move; explanation: string } | null {
    const legalMoves = this.getLegalMoves(board, 'red');
    if (legalMoves.length === 0) return null;

    // Use depth 4 alpha-beta to evaluate best response for Red
    const stats = { nodes: 0, tHits: 0 };
    const result = this.alphaBeta(board, 4, -Infinity, Infinity, 'red', stats);
    const chosenMove = result.bestMove || legalMoves[0];

    const isCapture = chosenMove.captures.length > 0;
    const notation = this.formatMoveNotation(chosenMove);

    let explanation = `ANN Engine suggests ${notation}. `;
    if (isCapture) {
      explanation += `Mandatory tactical jump capturing ${chosenMove.captures.length} piece(s).`;
    } else if (CENTER_SQUARES.includes(chosenMove.to)) {
      explanation += `Seizes center diagonal dominance (square ${chosenMove.to}) to restrict Black's counterplay.`;
    } else if (chosenMove.isKinging) {
      explanation += `Advances into the king row to gain supreme diagonal mobility!`;
    } else {
      explanation += `Strengthens structural coordination while denying Black breakthrough avenues.`;
    }

    return { move: chosenMove, explanation };
  }
}
