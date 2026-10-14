"""
Tournament-grade Checkers (English Draughts) Engine in Python
Standard 32 dark squares (indices 1 to 32)
Strict implementation of mandatory jumps and multi-jump chains
"""

from typing import List, Tuple, Optional, Dict, Set

EMPTY = 0
RED_MAN = 1
RED_KING = 2
BLACK_MAN = -1
BLACK_KING = -2

def compute_neighbors_table() -> Dict[int, Dict[str, int]]:
    table = {}
    for sq in range(1, 33):
        r = (sq - 1) // 4
        pos = (sq - 1) % 4
        c = pos * 2 + 1 if r % 2 == 0 else pos * 2

        def get_sq(row: int, col: int) -> int:
            if row < 0 or row > 7 or col < 0 or col > 7: return -1
            if (row + col) % 2 == 0: return -1
            return row * 4 + col // 2 + 1

        table[sq] = {
            "UL": get_sq(r - 1, c - 1),
            "UR": get_sq(r - 1, c + 1),
            "DL": get_sq(r + 1, c - 1),
            "DR": get_sq(r + 1, c + 1),
        }
    return table

SQUARE_NEIGHBORS: Dict[int, Dict[str, int]] = compute_neighbors_table()

RED_MAN_DIRS = ["UL", "UR"]
BLACK_MAN_DIRS = ["DL", "DR"]
KING_DIRS = ["UL", "UR", "DL", "DR"]


class Move:
    def __init__(self, from_sq: int, to_sq: int, captures: List[int] = None, path: List[int] = None, is_kinging: bool = False):
        self.from_sq = from_sq
        self.to_sq = to_sq
        self.captures = captures or []
        self.path = path or [from_sq, to_sq]
        self.is_kinging = is_kinging

    @property
    def notation(self) -> str:
        if not self.captures:
            return f"{self.from_sq}-{self.to_sq}"
        return "x".join(str(p) for p in self.path)

    def to_dict(self) -> dict:
        return {
            "from": self.from_sq,
            "to": self.to_sq,
            "captures": self.captures,
            "path": self.path,
            "is_kinging": self.is_kinging,
            "notation": self.notation,
        }

    @staticmethod
    def from_dict(data: dict) -> "Move":
        return Move(
            from_sq=data.get("from", 0),
            to_sq=data.get("to", 0),
            captures=data.get("captures", []),
            path=data.get("path", []),
            is_kinging=data.get("is_kinging", False),
        )


def create_initial_board() -> List[int]:
    """Returns initial 33-element list (index 0 unused, 1-32 dark squares)."""
    board = [EMPTY] * 33
    # Black pieces on squares 1 to 12
    for sq in range(1, 13):
        board[sq] = BLACK_MAN
    # Red pieces on squares 21 to 32
    for sq in range(21, 33):
        board[sq] = RED_MAN
    return board


def is_red_piece(p: int) -> bool:
    return p in (RED_MAN, RED_KING)


def is_black_piece(p: int) -> bool:
    return p in (BLACK_MAN, BLACK_KING)


def is_own_piece(p: int, color: str) -> bool:
    return is_red_piece(p) if color == "red" else is_black_piece(p)


def is_opponent_piece(p: int, color: str) -> bool:
    return is_black_piece(p) if color == "red" else is_red_piece(p)


def is_crownhead(sq: int, color: str) -> bool:
    return (1 <= sq <= 4) if color == "red" else (29 <= sq <= 32)


def get_legal_moves(board: List[int], color: str) -> List[Move]:
    """
    Finds all legal moves.
    MANDATORY JUMP RULE: If any jump exists, only jumps are legal moves!
    """
    jump_moves: List[Move] = []
    step_moves: List[Move] = []

    for sq in range(1, 33):
        piece = board[sq]
        if not is_own_piece(piece, color):
            continue

        is_king = piece in (RED_KING, BLACK_KING)
        dirs = KING_DIRS if is_king else (RED_MAN_DIRS if color == "red" else BLACK_MAN_DIRS)

        # Check jumps
        jumps = _find_jumps_for_piece(board, sq, piece, color, dirs)
        if jumps:
            jump_moves.extend(jumps)
        elif not jump_moves:
            # Check simple steps
            for d in dirs:
                target = SQUARE_NEIGHBORS[sq][d]
                if target > 0 and board[target] == EMPTY:
                    becomes_king = not is_king and is_crownhead(target, color)
                    step_moves.append(Move(sq, target, [], [sq, target], becomes_king))

    if jump_moves:
        return jump_moves
    return step_moves


def _find_jumps_for_piece(
    board: List[int],
    start_sq: int,
    piece: int,
    color: str,
    dirs: List[str],
    visited_caps: List[int] = None,
    current_path: List[int] = None,
) -> List[Move]:
    visited_caps = visited_caps or []
    current_path = current_path or [start_sq]
    current_sq = current_path[-1]
    is_original_king = piece in (RED_KING, BLACK_KING)
    jumps: List[Move] = []

    for d in dirs:
        over_sq = SQUARE_NEIGHBORS[current_sq][d]
        if over_sq <= 0 or over_sq in visited_caps:
            continue

        jumped = board[over_sq]
        if is_opponent_piece(jumped, color):
            land_sq = SQUARE_NEIGHBORS[over_sq][d]
            if land_sq > 0 and (board[land_sq] == EMPTY or land_sq == start_sq):
                became_king = not is_original_king and is_crownhead(land_sq, color)

                if became_king:
                    # Move ends immediately upon crowning
                    jumps.append(Move(start_sq, land_sq, visited_caps + [over_sq], current_path + [land_sq], True))
                else:
                    # Continue multi-jump search
                    next_board = list(board)
                    next_board[current_sq] = EMPTY
                    next_board[over_sq] = EMPTY
                    next_board[land_sq] = piece

                    next_dirs = KING_DIRS if is_original_king else dirs
                    sub_jumps = _find_jumps_for_piece(
                        next_board,
                        start_sq,
                        piece,
                        color,
                        next_dirs,
                        visited_caps + [over_sq],
                        current_path + [land_sq],
                    )
                    if sub_jumps:
                        jumps.extend(sub_jumps)
                    else:
                        jumps.append(Move(start_sq, land_sq, visited_caps + [over_sq], current_path + [land_sq], False))

    return jumps


def apply_move(board: List[int], move: Move, color: str) -> List[int]:
    next_board = list(board)
    piece = next_board[move.from_sq]
    next_board[move.from_sq] = EMPTY

    for cap in move.captures:
        next_board[cap] = EMPTY

    if move.is_kinging:
        next_board[move.to_sq] = RED_KING if color == "red" else BLACK_KING
    else:
        next_board[move.to_sq] = piece

    return next_board


def check_game_over(board: List[int], active_color: str) -> Tuple[bool, Optional[str], Optional[str]]:
    red_count = sum(1 for sq in range(1, 33) if is_red_piece(board[sq]))
    black_count = sum(1 for sq in range(1, 33) if is_black_piece(board[sq]))

    if red_count == 0:
        return True, "black", "Black captured all Red checkers."
    if black_count == 0:
        return True, "red", "Red captured all Black checkers."

    moves = get_legal_moves(board, active_color)
    if not moves:
        winner = "black" if active_color == "red" else "red"
        return True, winner, f"{active_color.capitalize()} has no legal moves."

    return False, None, None
