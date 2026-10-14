/**
 * Core Checkers & ANN Engine Type Definitions
 */

export const EMPTY = 0;
export const RED_MAN = 1;
export const RED_KING = 2;
export const BLACK_MAN = -1;
export const BLACK_KING = -2;

export type PieceType = 0 | 1 | 2 | -1 | -2;

export type PlayerColor = 'red' | 'black'; // Red = Human (moves bottom to top), Black = AI (moves top to bottom)

export interface Move {
  from: number; // 1-32 standard checkers square
  to: number; // 1-32 standard checkers square
  captures: number[]; // squares jumped over
  path: number[]; // sequence of landing squares [from, ..., to]
  isKinging: boolean;
}

export interface BoardSquareCoord {
  row: number; // 0 to 7
  col: number; // 0 to 7
  darkIndex: number; // 1 to 32, or -1 for light squares
}

export type DifficultyLevel = 'apprentice' | 'tactician' | 'master' | 'grandmaster';

export interface ANNLayerActivations {
  input: number[];
  layer1: number[];
  layer2: number[];
  layer3: number[];
  output: number;
}

export interface StrategicFeatureBreakdown {
  materialDelta: number;
  centerControl: number;
  backRowDefense: number;
  kingSafetyAndMobility: number;
  dogHoleTactics: number;
  bridgeIntegrity: number;
  runawayCheckers: number;
  pieceMobility: number;
  edgeSafety: number;
}

export interface AISearchTelemetry {
  depthReached: number;
  nodesEvaluated: number;
  timeMs: number;
  nodesPerSec: number;
  transpositionHits: number;
  winProbability: number; // -100 to +100
  bestMoveNotation: string;
  principalVariation: string[];
  activations?: ANNLayerActivations;
  featureBreakdown?: StrategicFeatureBreakdown;
  evalScore: number;
}

export interface GameMoveRecord {
  player: PlayerColor;
  move: Move;
  notation: string;
  isCapture: boolean;
  isKinging: boolean;
  boardStateAfter: PieceType[];
  evalAfter?: number;
}

export interface TacticalPuzzle {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: 'intermediate' | 'advanced' | 'master';
  turn: PlayerColor;
  initialBoard: PieceType[];
  solutionMoves: { from: number; to: number }[];
  explanation: string;
}

export interface OpeningRecord {
  name: string;
  moves: string[]; // e.g. ["11-15", "22-18", "15-22", "25-18"]
  description: string;
  historicalWinRate: string;
}
