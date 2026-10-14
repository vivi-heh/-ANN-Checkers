"""
Checkers Save & Load Module in Python
Saves and loads the complete game state:
- Board configuration (all 32 playable squares)
- Whose turn it is (Red or Black)
- Captured pieces breakdown (Men & Kings for both players)
- Move history and game metadata
"""

import json
import os
import time
from typing import Dict, Any, Tuple, List, Optional
from checkers import (
    RED_MAN, RED_KING, BLACK_MAN, BLACK_KING,
    Move
)


def calculate_captured_pieces(board: List[int]) -> Dict[str, int]:
    """Calculates captured pieces by subtracting remaining board pieces from standard 12."""
    red_men = sum(1 for sq in range(1, 33) if board[sq] == RED_MAN)
    red_kings = sum(1 for sq in range(1, 33) if board[sq] == RED_KING)
    black_men = sum(1 for sq in range(1, 33) if board[sq] == BLACK_MAN)
    black_kings = sum(1 for sq in range(1, 33) if board[sq] == BLACK_KING)

    total_red_on_board = red_men + red_kings
    total_black_on_board = black_men + black_kings

    return {
        "red_captured_total": max(0, 12 - total_red_on_board),
        "black_captured_total": max(0, 12 - total_black_on_board),
        "remaining_red_men": red_men,
        "remaining_red_kings": red_kings,
        "remaining_black_men": black_men,
        "remaining_black_kings": black_kings,
    }


def serialize_game_state(
    board: List[int],
    turn: str,
    history: Optional[List[dict]] = None,
    difficulty: str = "tactician",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Converts game state into a structured JSON-serializable dictionary."""
    captured = calculate_captured_pieces(board)
    return {
        "version": "1.0",
        "timestamp": int(time.time()),
        "turn": turn,
        "board": board,
        "captured_pieces": captured,
        "difficulty": difficulty,
        "move_history": history or [],
        "metadata": metadata or {},
    }


def save_game_to_file(
    filepath: str,
    board: List[int],
    turn: str,
    history: Optional[List[dict]] = None,
    difficulty: str = "tactician",
) -> bool:
    """Saves the current checkers state to a file."""
    try:
        state = serialize_game_state(board, turn, history, difficulty)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving game: {e}")
        return False


def load_game_from_file(filepath: str) -> Optional[Dict[str, Any]]:
    """Loads and validates a saved checkers state from a file."""
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return None

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Basic integrity validation
        board = data.get("board")
        turn = data.get("turn")
        if not isinstance(board, list) or len(board) != 33:
            raise ValueError("Invalid board dimensions in save file.")
        if turn not in ("red", "black"):
            raise ValueError(f"Invalid turn '{turn}' in save file.")

        return data
    except Exception as e:
        print(f"Error loading game: {e}")
        return None
