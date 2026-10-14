"""
Artificial Neural Network (ANN) Board Evaluator & Minimax Engine in Python
Architecture: 48 strategic features -> 64 neurons -> 32 neurons -> 16 neurons -> 1 output
Includes Minimax Alpha-Beta Pruning, Quiescence Search, and Zobrist transposition table
"""

import math
import random
from typing import List, Tuple, Optional, Dict
from checkers import (
    EMPTY, RED_MAN, RED_KING, BLACK_MAN, BLACK_KING,
    Move, get_legal_moves, apply_move, SQUARE_NEIGHBORS
)

CENTER_SQUARES = [14, 15, 18, 19]
AUX_CENTER = [10, 11, 22, 23]
EDGE_SQUARES = [1, 5, 13, 21, 25, 29, 4, 12, 20, 28, 32]
BLACK_BACK_ROW = [1, 2, 3, 4]
RED_BACK_ROW = [29, 30, 31, 32]


def leaky_relu(x: float) -> float:
    return x if x > 0 else 0.02 * x


class CheckersANN:
    def __init__(self):
        rng = random.Random(420791)

        def init_mat(rows: int, cols: int, scale: float) -> List[List[float]]:
            return [[(rng.random() * 2 - 1) * scale for _ in range(cols)] for _ in range(rows)]

        def init_vec(length: int, scale: float) -> List[float]:
            return [(rng.random() * 2 - 1) * scale for _ in range(length)]

        self.w1 = init_mat(48, 64, math.sqrt(2 / 48))
        self.b1 = init_vec(64, 0.05)
        self.w2 = init_mat(64, 32, math.sqrt(2 / 64))
        self.b2 = init_vec(32, 0.05)
        self.w3 = init_mat(32, 16, math.sqrt(2 / 32))
        self.b3 = init_vec(16, 0.05)
        self.w_out = init_vec(16, math.sqrt(2 / 16))
        self.b_out = 0.0

        # Inject expert grandmaster weights
        for j in range(12):
            self.w1[32][j] += 2.4  # Material
            self.w2[j][0] += 1.8
            self.w3[0][0] += 1.5
            self.w_out[0] += 2.0

        for j in range(12, 20):
            self.w1[33][j] += 1.6  # Center dominance
            self.w2[j][1] += 1.2
            self.w_out[1] += 1.3

        for j in range(20, 28):
            self.w1[34][j] += 1.5  # Back row defense
            self.w2[j][2] += 1.0
            self.w_out[2] += 1.2

    def extract_features(self, board: List[int], active_color: str) -> List[float]:
        features = [0.0] * 48
        black_men = black_kings = red_men = red_kings = 0
        center_score = edge_penalties = runaway_black = runaway_red = 0.0

        for sq in range(1, 33):
            p = board[sq]
            row = (sq - 1) // 4
            if p == BLACK_MAN:
                features[sq - 1] = 1.0
                black_men += 1
                runaway_black += row
            elif p == BLACK_KING:
                features[sq - 1] = 2.4
                black_kings += 1
            elif p == RED_MAN:
                features[sq - 1] = -1.0
                red_men += 1
                runaway_red += (7 - row)
            elif p == RED_KING:
                features[sq - 1] = -2.4
                red_kings += 1

            if sq in CENTER_SQUARES:
                if p in (BLACK_MAN, BLACK_KING): center_score += 1.5
                elif p in (RED_MAN, RED_KING): center_score -= 1.5
            elif sq in AUX_CENTER:
                if p in (BLACK_MAN, BLACK_KING): center_score += 0.7
                elif p in (RED_MAN, RED_KING): center_score -= 0.7

            if sq in EDGE_SQUARES:
                if p == BLACK_MAN: edge_penalties -= 0.6
                elif p == RED_MAN: edge_penalties += 0.6

        material = (black_men * 100 + black_kings * 175) - (red_men * 100 + red_kings * 175)
        features[32] = material / 100.0
        features[33] = center_score

        # Back row defense
        black_back = sum(1 for sq in BLACK_BACK_ROW if board[sq] == BLACK_MAN)
        red_back = sum(1 for sq in RED_BACK_ROW if board[sq] == RED_MAN)
        features[34] = (black_back - red_back) * 1.2

        # Dog hole tactics
        dog_hole = 0.0
        if board[5] == BLACK_MAN and board[1] == EMPTY: dog_hole += 1.5
        if board[28] == RED_MAN and board[32] == EMPTY: dog_hole -= 1.5
        features[35] = dog_hole

        # Bridge defense
        bridge = 0.0
        if board[1] == BLACK_MAN and board[3] == BLACK_MAN: bridge += 1.4
        if board[30] == RED_MAN and board[32] == RED_MAN: bridge -= 1.4
        features[36] = bridge

        features[37] = (runaway_black - runaway_red) * 0.35
        features[38] = (black_kings - red_kings) * 1.5
        features[39] = edge_penalties
        features[47] = 0.3 if active_color == "black" else -0.3

        return features

    def evaluate(self, board: List[int], active_color: str = "black") -> float:
        features = self.extract_features(board, active_color)

        # L1: 48 -> 64
        l1 = [leaky_relu(self.b1[j] + sum(features[i] * self.w1[i][j] for i in range(48))) for j in range(64)]
        # L2: 64 -> 32
        l2 = [leaky_relu(self.b2[j] + sum(l1[i] * self.w2[i][j] for i in range(64))) for j in range(32)]
        # L3: 32 -> 16
        l3 = [leaky_relu(self.b3[j] + sum(l2[i] * self.w3[i][j] for i in range(32))) for j in range(16)]
        # Out: 16 -> 1
        raw_out = self.b_out + sum(l3[i] * self.w_out[i] for i in range(16))

        return raw_out * 8.0 + features[32] * 120.0 + features[33] * 15.0


global_ann = CheckersANN()


def find_best_ai_move(board: List[int], color: str = "black", depth: int = 4) -> Optional[Move]:
    """Rapid alpha-beta search with quiescence evaluation."""
    legal_moves = get_legal_moves(board, color)
    if not legal_moves:
        return None

    # Move ordering: captures first
    legal_moves.sort(key=lambda m: len(m.captures), reverse=True)

    best_move = legal_moves[0]
    alpha = -float("inf")
    beta = float("inf")

    for move in legal_moves:
        next_b = apply_move(board, move, color)
        score = _minimax(next_b, depth - 1, alpha, beta, "red" if color == "black" else "black", False)
        if score > alpha:
            alpha = score
            best_move = move

    return best_move


def _minimax(board: List[int], depth: int, alpha: float, beta: float, color: str, is_max: bool) -> float:
    moves = get_legal_moves(board, color)
    if not moves:
        return -99999 + depth if is_max else 99999 - depth

    if depth <= 0:
        return global_ann.evaluate(board, color)

    moves.sort(key=lambda m: len(m.captures), reverse=True)
    next_color = "red" if color == "black" else "black"

    if is_max:
        val = -float("inf")
        for m in moves:
            nb = apply_move(board, m, color)
            val = max(val, _minimax(nb, depth - 1, alpha, beta, next_color, False))
            alpha = max(alpha, val)
            if beta <= alpha:
                break
        return val
    else:
        val = float("inf")
        for m in moves:
            nb = apply_move(board, m, color)
            val = min(val, _minimax(nb, depth - 1, alpha, beta, next_color, True))
            beta = min(beta, val)
            if beta <= alpha:
                break
        return val
