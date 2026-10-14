"""
Checkers Grandmaster ANN - Terminal Runner
Provides terminal interface with board display, ANN opponent, and manual save/load commands.
"""

import sys
from checkers import (
    create_initial_board, get_legal_moves, apply_move,
    check_game_over, is_red_piece, is_black_piece,
    RED_MAN, RED_KING, BLACK_MAN, BLACK_KING, EMPTY
)
from ann_engine import find_best_ai_move, global_ann
from save_load import save_game_to_file, load_game_from_file, calculate_captured_pieces


def print_board(board):
    print("\n   +---+---+---+---+---+---+---+---+")
    for row in range(8):
        row_str = f" {8 - row} |"
        for col in range(8):
            if (row + col) % 2 == 1:
                sq = row * 4 + col // 2 + 1
                p = board[sq]
                if p == RED_MAN:
                    char = " r "
                elif p == RED_KING:
                    char = " R "
                elif p == BLACK_MAN:
                    char = " b "
                elif p == BLACK_KING:
                    char = " B "
                else:
                    char = f"{sq:2d} "
                row_str += char + "|"
            else:
                row_str += " . |"
        print(row_str)
        print("   +---+---+---+---+---+---+---+---+")
    print("     A   B   C   D   E   F   G   H\n")


def main():
    print("=" * 50)
    print(" NeuroCheckers — ANN Draughts Grandmaster (Python)")
    print(" Red = You (lowercase r, King: R)")
    print(" Black = ANN AI Agent (lowercase b, King: B)")
    print(" Commands: 'from to' (e.g. 11 15), 'save', 'load', 'quit'")
    print("=" * 50)

    board = create_initial_board()
    turn = "red"
    history = []

    while True:
        captured = calculate_captured_pieces(board)
        print(f"Turn: {turn.upper()} | Captured: Red lost {captured['red_captured_total']}, Black lost {captured['black_captured_total']}")
        print_board(board)

        is_over, winner, reason = check_game_over(board, turn)
        if is_over:
            print(f"GAME OVER! Winner: {winner.upper()}. {reason}")
            break

        if turn == "red":
            legal_moves = get_legal_moves(board, "red")
            has_jumps = any(len(m.captures) > 0 for m in legal_moves)
            if has_jumps:
                print(">>> MANDATORY JUMP! You must capture. <<<")

            cmd = input("Your move (e.g. '11 15') or 'save'/'load'/'quit': ").strip().lower()
            if cmd == "quit":
                print("Exiting match.")
                break
            elif cmd == "save":
                filename = input("Enter save filename (default 'checkers_save.json'): ").strip() or "checkers_save.json"
                if save_game_to_file(filename, board, turn, history):
                    print(f"Saved game state successfully to {filename}!")
                continue
            elif cmd == "load":
                filename = input("Enter load filename (default 'checkers_save.json'): ").strip() or "checkers_save.json"
                data = load_game_from_file(filename)
                if data:
                    board = data["board"]
                    turn = data["turn"]
                    history = data.get("move_history", [])
                    print(f"Loaded game state from {filename}! Active turn: {turn.upper()}")
                continue

            parts = cmd.split()
            if len(parts) != 2:
                print("Invalid format. Use 'from to' e.g. '11 15'")
                continue

            try:
                from_sq, to_sq = int(parts[0]), int(parts[1])
            except ValueError:
                print("Please enter square numbers (1 to 32).")
                continue

            chosen_move = None
            for m in legal_moves:
                if m.from_sq == from_sq and m.to_sq == to_sq:
                    chosen_move = m
                    break

            if not chosen_move:
                print(f"Illegal move! Legal moves available: {[m.notation for m in legal_moves]}")
                continue

            board = apply_move(board, chosen_move, "red")
            history.append(chosen_move.to_dict())
            print(f"You played {chosen_move.notation}")
            turn = "black"

        else:
            print("ANN AI Agent is calculating best response...")
            ai_move = find_best_ai_move(board, "black", depth=4)
            if not ai_move:
                print("AI has no legal moves!")
                break
            board = apply_move(board, ai_move, "black")
            history.append(ai_move.to_dict())
            print(f"AI played: {ai_move.notation}")
            turn = "red"


if __name__ == "__main__":
    main()
