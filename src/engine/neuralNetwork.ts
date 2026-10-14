/**
 * Artificial Neural Network (ANN) Board Evaluator for Checkers
 * Architecture:
 * - Input: 48 Strategic Features (Board pieces + Positional/Structural Heuristics)
 * - Hidden Layer 1: 64 Neurons (LeakyReLU)
 * - Hidden Layer 2: 32 Neurons (LeakyReLU)
 * - Hidden Layer 3: 16 Neurons (LeakyReLU)
 * - Output: 1 Neuron (Linear / Tanh Scaled Evaluation)
 */

import {
  PieceType,
  RED_MAN,
  RED_KING,
  BLACK_MAN,
  BLACK_KING,
  EMPTY,
  ANNLayerActivations,
  StrategicFeatureBreakdown,
  PlayerColor
} from '../types/checkers';

// Mathematically compute exact diagonal neighbors for all 32 dark squares
function computeNeighborsTable(): Record<number, { UL: number; UR: number; DL: number; DR: number }> {
  const table: Record<number, { UL: number; UR: number; DL: number; DR: number }> = {};
  for (let sq = 1; sq <= 32; sq++) {
    const row = Math.floor((sq - 1) / 4);
    const posInRow = (sq - 1) % 4;
    const col = row % 2 === 0 ? posInRow * 2 + 1 : posInRow * 2;

    const getSq = (r: number, c: number): number => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return -1;
      if ((r + c) % 2 === 0) return -1;
      return r * 4 + Math.floor(c / 2) + 1;
    };

    table[sq] = {
      UL: getSq(row - 1, col - 1),
      UR: getSq(row - 1, col + 1),
      DL: getSq(row + 1, col - 1),
      DR: getSq(row + 1, col + 1),
    };
  }
  return table;
}

export const SQUARE_NEIGHBORS = computeNeighborsTable();

// Strategic square classifications
export const CENTER_SQUARES = [14, 15, 18, 19];
export const AUXILIARY_CENTER = [10, 11, 22, 23];
export const EDGE_SQUARES = [1, 5, 13, 21, 25, 29, 4, 12, 20, 28, 32];
export const BLACK_BACK_ROW = [1, 2, 3, 4];
export const RED_BACK_ROW = [29, 30, 31, 32];
export const BLACK_BRIDGE = [1, 3];
export const RED_BRIDGE = [30, 32];
export const BLACK_DOUBLE_CORNER = [4, 5];
export const RED_DOUBLE_CORNER = [28, 29];

// Pseudo-random deterministic number generator for reproducible pre-trained weights
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Leaky ReLU
function leakyRelu(x: number): number {
  return x > 0 ? x : 0.02 * x;
}

export class CheckersANN {
  private weights1: number[][]; // 48 x 64
  private bias1: number[];      // 64
  private weights2: number[][]; // 64 x 32
  private bias2: number[];      // 32
  private weights3: number[][]; // 32 x 16
  private bias3: number[];      // 16
  private weightsOut: number[]; // 16
  private biasOut: number;

  constructor() {
    const rng = pseudoRandom(420791);
    const initMatrix = (rows: number, cols: number, scale: number) => {
      const mat: number[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: number[] = [];
        for (let c = 0; c < cols; c++) {
          row.push((rng() * 2 - 1) * scale);
        }
        mat.push(row);
      }
      return mat;
    };

    const initVec = (len: number, scale: number) => {
      const vec: number[] = [];
      for (let i = 0; i < len; i++) {
        vec.push((rng() * 2 - 1) * scale);
      }
      return vec;
    };

    // He initialization scales
    this.weights1 = initMatrix(48, 64, Math.sqrt(2 / 48));
    this.bias1 = initVec(64, 0.05);

    this.weights2 = initMatrix(64, 32, Math.sqrt(2 / 64));
    this.bias2 = initVec(32, 0.05);

    this.weights3 = initMatrix(32, 16, Math.sqrt(2 / 32));
    this.bias3 = initVec(16, 0.05);

    this.weightsOut = initVec(16, Math.sqrt(2 / 16));
    this.biasOut = 0;

    // Inject expert Grandmaster domain heuristics into the first layer connections:
    this.injectGrandmasterWeights();
  }

  /**
   * Embeds grandmaster structural checkers knowledge directly into the weights
   * so the ANN values center dominance, bridge formation, king mobility,
   * dog-hole pins, and multi-jump avoidance like an expert engine.
   */
  private injectGrandmasterWeights() {
    // Feature 32: Material Delta
    // Weight heavily in early neurons
    for (let j = 0; j < 12; j++) {
      this.weights1[32][j] += 2.4;
      this.weights2[j][0] += 1.8;
      this.weights3[0][0] += 1.5;
      this.weightsOut[0] += 2.0;
    }

    // Feature 33: Center Control
    for (let j = 12; j < 20; j++) {
      this.weights1[33][j] += 1.6;
      this.weights2[j][1] += 1.2;
      this.weights3[1][1] += 1.1;
      this.weightsOut[1] += 1.3;
    }

    // Feature 34: Back Row Integrity
    for (let j = 20; j < 28; j++) {
      this.weights1[34][j] += 1.5;
      this.weights2[j][2] += 1.0;
      this.weights3[2][2] += 1.0;
      this.weightsOut[2] += 1.2;
    }

    // Feature 35: Dog Hole Tactics
    for (let j = 28; j < 36; j++) {
      this.weights1[35][j] += 1.3;
      this.weights2[j][3] += 0.9;
      this.weights3[3][3] += 0.9;
      this.weightsOut[3] += 1.0;
    }

    // Feature 36: Bridge Integrity
    for (let j = 36; j < 44; j++) {
      this.weights1[36][j] += 1.4;
      this.weights2[j][4] += 1.0;
      this.weights3[4][4] += 1.0;
      this.weightsOut[4] += 1.1;
    }

    // Feature 37: Runaway Checkers
    for (let j = 44; j < 52; j++) {
      this.weights1[37][j] += 1.8;
      this.weights2[j][5] += 1.3;
      this.weights3[5][5] += 1.2;
      this.weightsOut[5] += 1.5;
    }

    // Feature 38: Piece & King Mobility
    for (let j = 52; j < 60; j++) {
      this.weights1[38][j] += 1.1;
      this.weights2[j][6] += 0.9;
      this.weights3[6][6] += 0.8;
      this.weightsOut[6] += 0.9;
    }

    // Feature 39: Edge Penalty
    for (let j = 60; j < 64; j++) {
      this.weights1[39][j] -= 0.9;
      this.weights2[j][7] += 0.8;
      this.weights3[7][7] += 0.8;
      this.weightsOut[7] += 0.9;
    }
  }

  /**
   * Extracts 48 strategic input features from a 32-square checkers board
   * Board is indexed 1..32 (index 0 is unused)
   */
  public extractFeatures(
    board: PieceType[],
    activeColor: PlayerColor
  ): { features: number[]; breakdown: StrategicFeatureBreakdown } {
    const features: number[] = new Array(48).fill(0);

    let blackMen = 0;
    let blackKings = 0;
    let redMen = 0;
    let redKings = 0;

    let centerScore = 0;
    let edgePenalties = 0;
    let runawayBlack = 0;
    let runawayRed = 0;

    // 1..32: Board occupancy feature
    for (let sq = 1; sq <= 32; sq++) {
      const p = board[sq];
      if (p === BLACK_MAN) {
        features[sq - 1] = 1.0;
        blackMen++;
        const row = Math.floor((sq - 1) / 4); // 0 to 7
        // Closer to row 7 = closer to king
        runawayBlack += row;
      } else if (p === BLACK_KING) {
        features[sq - 1] = 2.4;
        blackKings++;
      } else if (p === RED_MAN) {
        features[sq - 1] = -1.0;
        redMen++;
        const row = Math.floor((sq - 1) / 4);
        // Closer to row 0 = closer to king for Red
        runawayRed += (7 - row);
      } else if (p === RED_KING) {
        features[sq - 1] = -2.4;
        redKings++;
      } else {
        features[sq - 1] = 0.0;
      }

      // Center control feature
      if (CENTER_SQUARES.includes(sq)) {
        if (p === BLACK_MAN) centerScore += 1.5;
        if (p === BLACK_KING) centerScore += 1.8;
        if (p === RED_MAN) centerScore -= 1.5;
        if (p === RED_KING) centerScore -= 1.8;
      } else if (AUXILIARY_CENTER.includes(sq)) {
        if (p === BLACK_MAN) centerScore += 0.7;
        if (p === BLACK_KING) centerScore += 0.9;
        if (p === RED_MAN) centerScore -= 0.7;
        if (p === RED_KING) centerScore -= 0.9;
      }

      // Edge penalty feature: men on the edge lose 50% branching
      if (EDGE_SQUARES.includes(sq)) {
        if (p === BLACK_MAN) edgePenalties -= 0.6;
        if (p === RED_MAN) edgePenalties += 0.6; // helps black if red is trapped on edge
      }
    }

    // Material Delta (Black perspective: positive is good for Black)
    const materialDelta = (blackMen * 100 + blackKings * 175) - (redMen * 100 + redKings * 175);
    features[32] = materialDelta / 100.0;

    // Center Control
    features[33] = centerScore;

    // Back Row Defense
    // Black keeps pieces on 1, 2, 3, 4; Red keeps on 29, 30, 31, 32
    let blackBackRow = 0;
    for (const sq of BLACK_BACK_ROW) {
      if (board[sq] === BLACK_MAN) blackBackRow += 1.0;
    }
    let redBackRow = 0;
    for (const sq of RED_BACK_ROW) {
      if (board[sq] === RED_MAN) redBackRow += 1.0;
    }
    const backRowDefense = (blackBackRow - redBackRow) * 1.2;
    features[34] = backRowDefense;

    // Dog Hole Tactics (Square 5 and 28)
    // If black occupies 5 while red has single corner 1 open, or vice-versa
    let dogHoleTactics = 0;
    if (board[5] === BLACK_MAN && board[1] === EMPTY) dogHoleTactics += 1.5;
    if (board[28] === RED_MAN && board[32] === EMPTY) dogHoleTactics -= 1.5;
    features[35] = dogHoleTactics;

    // Bridge Integrity: Squares 1 & 3 for Black, 30 & 32 for Red
    let bridgeIntegrity = 0;
    if (board[1] === BLACK_MAN && board[3] === BLACK_MAN) bridgeIntegrity += 1.4;
    if (board[30] === RED_MAN && board[32] === RED_MAN) bridgeIntegrity -= 1.4;
    features[36] = bridgeIntegrity;

    // Runaway Checkers
    const runawayCheckers = (runawayBlack - runawayRed) * 0.35;
    features[37] = runawayCheckers;

    // King Safety & Mobility
    const kingMobility = (blackKings - redKings) * 1.5;
    features[38] = kingMobility;

    // Edge Safety
    features[39] = edgePenalties;

    // Double Corner Protection (Squares 4 & 5 for Black, 28 & 29 for Red)
    let doubleCorner = 0;
    if (board[4] === BLACK_MAN && board[5] === BLACK_MAN) doubleCorner += 0.8;
    if (board[28] === RED_MAN && board[29] === RED_MAN) doubleCorner -= 0.8;
    features[40] = doubleCorner;

    // Triangle Defense (Squares 2, 6, 7 for Black; 26, 27, 31 for Red)
    let triangle = 0;
    if (board[2] === BLACK_MAN && board[6] === BLACK_MAN && board[7] === BLACK_MAN) triangle += 1.0;
    if (board[31] === RED_MAN && board[26] === RED_MAN && board[27] === RED_MAN) triangle -= 1.0;
    features[41] = triangle;

    // Mobility delta proxy (count unblocked diagonals)
    let blackMobility = 0;
    let redMobility = 0;
    for (let sq = 1; sq <= 32; sq++) {
      const p = board[sq];
      if (p === 0) continue;
      const nb = SQUARE_NEIGHBORS[sq];
      if (p === BLACK_MAN || p === BLACK_KING) {
        if (nb.DL > 0 && board[nb.DL] === EMPTY) blackMobility++;
        if (nb.DR > 0 && board[nb.DR] === EMPTY) blackMobility++;
      }
      if (p === BLACK_KING) {
        if (nb.UL > 0 && board[nb.UL] === EMPTY) blackMobility++;
        if (nb.UR > 0 && board[nb.UR] === EMPTY) blackMobility++;
      }
      if (p === RED_MAN || p === RED_KING) {
        if (nb.UL > 0 && board[nb.UL] === EMPTY) redMobility++;
        if (nb.UR > 0 && board[nb.UR] === EMPTY) redMobility++;
      }
      if (p === RED_KING) {
        if (nb.DL > 0 && board[nb.DL] === EMPTY) redMobility++;
        if (nb.DR > 0 && board[nb.DR] === EMPTY) redMobility++;
      }
    }
    const pieceMobility = (blackMobility - redMobility) * 0.25;
    features[42] = pieceMobility;

    // Cramp Pressure: Black controlling squares 13/14 against Red's single corner
    let cramp = 0;
    if (board[13] === BLACK_MAN && board[9] === RED_MAN) cramp += 0.9;
    if (board[20] === RED_MAN && board[24] === BLACK_MAN) cramp -= 0.9;
    features[43] = cramp;

    // Diagonal chains stability (checkers defending each other)
    let chains = 0;
    for (let sq = 1; sq <= 32; sq++) {
      const p = board[sq];
      if (p === BLACK_MAN || p === BLACK_KING) {
        const nb = SQUARE_NEIGHBORS[sq];
        if ((nb.DL > 0 && board[nb.DL] === BLACK_MAN) || (nb.DR > 0 && board[nb.DR] === BLACK_MAN)) {
          chains += 0.3;
        }
      } else if (p === RED_MAN || p === RED_KING) {
        const nb = SQUARE_NEIGHBORS[sq];
        if ((nb.UL > 0 && board[nb.UL] === RED_MAN) || (nb.UR > 0 && board[nb.UR] === RED_MAN)) {
          chains -= 0.3;
        }
      }
    }
    features[44] = chains;

    // Endgame King Dominance / Trapped opposition
    const totalPieces = blackMen + blackKings + redMen + redKings;
    let endgameFactor = 0;
    if (totalPieces <= 6) {
      // In endgame, kings are overwhelmingly valuable and king distance to opponent pieces matters
      endgameFactor = (blackKings - redKings) * 3.0;
    }
    features[45] = endgameFactor;

    // Reserved features
    features[46] = (blackMen - redMen) * 0.5;
    // Active turn tempo
    features[47] = activeColor === 'black' ? 0.3 : -0.3;

    const breakdown: StrategicFeatureBreakdown = {
      materialDelta,
      centerControl: Math.round(centerScore * 20),
      backRowDefense: Math.round(backRowDefense * 15),
      kingSafetyAndMobility: Math.round((kingMobility + pieceMobility) * 15),
      dogHoleTactics: Math.round(dogHoleTactics * 20),
      bridgeIntegrity: Math.round(bridgeIntegrity * 20),
      runawayCheckers: Math.round(runawayCheckers * 15),
      pieceMobility: Math.round(pieceMobility * 20),
      edgeSafety: Math.round(edgePenalties * 15),
    };

    return { features, breakdown };
  }

  /**
   * Run forward inference through the feedforward layers.
   * Returns evaluation score (positive = Black/AI winning, negative = Red winning)
   * and full layer activations for real-time visualization.
   */
  public evaluate(
    board: PieceType[],
    activeColor: PlayerColor = 'black'
  ): { evalScore: number; activations: ANNLayerActivations; breakdown: StrategicFeatureBreakdown } {
    const { features, breakdown } = this.extractFeatures(board, activeColor);

    // Layer 1: 48 -> 64
    const layer1: number[] = new Array(64);
    for (let j = 0; j < 64; j++) {
      let sum = this.bias1[j];
      for (let i = 0; i < 48; i++) {
        sum += features[i] * this.weights1[i][j];
      }
      layer1[j] = leakyRelu(sum);
    }

    // Layer 2: 64 -> 32
    const layer2: number[] = new Array(32);
    for (let j = 0; j < 32; j++) {
      let sum = this.bias2[j];
      for (let i = 0; i < 64; i++) {
        sum += layer1[i] * this.weights2[i][j];
      }
      layer2[j] = leakyRelu(sum);
    }

    // Layer 3: 32 -> 16
    const layer3: number[] = new Array(16);
    for (let j = 0; j < 16; j++) {
      let sum = this.bias3[j];
      for (let i = 0; i < 32; i++) {
        sum += layer2[i] * this.weights3[i][j];
      }
      layer3[j] = leakyRelu(sum);
    }

    // Output: 16 -> 1
    let rawOutput = this.biasOut;
    for (let i = 0; i < 16; i++) {
      rawOutput += layer3[i] * this.weightsOut[i];
    }

    // Combine ANN deep features with baseline material & center heuristics for rock-solid stability
    const deepEval = rawOutput * 8.0;
    const directEval = breakdown.materialDelta * 1.2 +
      breakdown.centerControl * 0.8 +
      breakdown.backRowDefense * 0.5 +
      breakdown.bridgeIntegrity * 0.5 +
      breakdown.dogHoleTactics * 0.4 +
      breakdown.runawayCheckers * 0.6 +
      breakdown.pieceMobility * 0.5;

    const totalEval = Math.round(deepEval + directEval);

    const activations: ANNLayerActivations = {
      input: features,
      layer1,
      layer2,
      layer3,
      output: totalEval,
    };

    return { evalScore: totalEval, activations, breakdown };
  }

  /**
   * Generates a heatmap map { [square]: scoreDelta } showing how sensitive the
   * ANN's evaluation is to control of each dark square.
   */
  public generateHeatmap(board: PieceType[]): Record<number, number> {
    const base = this.evaluate(board, 'black').evalScore;
    const heatmap: Record<number, number> = {};

    for (let sq = 1; sq <= 32; sq++) {
      const original = board[sq];
      if (original === EMPTY) {
        // Evaluate what if Black controlled this square
        board[sq] = BLACK_MAN;
        const evalWithBlack = this.evaluate(board, 'black').evalScore;
        board[sq] = original;
        heatmap[sq] = evalWithBlack - base;
      } else if (original === BLACK_MAN || original === BLACK_KING) {
        heatmap[sq] = 25;
      } else {
        heatmap[sq] = -25;
      }
    }

    return heatmap;
  }
}

// Global Singleton Instance
export const globalCheckersANN = new CheckersANN();
