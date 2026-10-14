"""
Interactive Checkers Rules Tutorial in Python
Run with: python3 tutorial.py
"""

from checkers import (
    create_initial_board, get_legal_moves, apply_move,
    RED_MAN, RED_KING, BLACK_MAN, BLACK_KING, EMPTY
)

def print_mini_board(board, highlight_from=None, highlight_to=None):
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
                elif sq == highlight_to:
                    char = " * "
                else:
                    char = f"{sq:2d} "
                row_str += char + "|"
            else:
                row_str += " . |"
        print(row_str)
        print("   +---+---+---+---+---+---+---+---+")
    print("     A   B   C   D   E   F   G   H\n")

def run_tutorial():
    print("=" * 60)
    print(" WELCOME TO THE CHECKERS RULES TUTORIAL")
    print("=" * 60)
    print("Learn the 5 core rules of tournament Checkers (English Draughts).\n")

    # Lesson 1
    input("Press Enter to start Lesson 1: The Diagonal Step...")
    print("\n--- Lesson 1: The Diagonal Step ---")
    print("Checkers is played exclusively on the 32 dark squares.")
    print("Normal checkers (Men) move diagonally forward 1 step into an empty square.")
    print("Red moves upward (towards row 8 / sq 1). Black moves downward.")
    b1 = [EMPTY] * 33
    b1[22] = RED_MAN
    print_mini_board(b1, highlight_to=18)
    print("Your piece is on square 22. Legal forward moves: 17 or 18.")
    input("Type '22 18' to move forward: ")
    b1[22] = EMPTY
    b1[18] = RED_MAN
    print_mini_board(b1)
    print("SUCCESS! You completed your first diagonal step.\n")

    # Lesson 2
    input("Press Enter to continue to Lesson 2: Capturing by Jumping...")
    print("\n--- Lesson 2: Capturing by Jumping ---")
    print("When an opponent checker is diagonally adjacent and the square directly")
    print("behind it is vacant, you MUST leap over it to capture and remove it!")
    b2 = [EMPTY] * 33
    b2[18] = RED_MAN
    b2[14] = BLACK_MAN
    print_mini_board(b2, highlight_to=9)
    input("Type '18 9' to jump over Black on square 14: ")
    b2[18] = EMPTY
    b2[14] = EMPTY
    b2[9] = RED_MAN
    print_mini_board(b2)
    print("SUCCESS! You captured Black's checker.\n")

    # Lesson 3
    input("Press Enter to continue to Lesson 3: Mandatory Jumps & Multi-Jumps...")
    print("\n--- Lesson 3: Mandatory Jumps & Multi-Jumps ---")
    print("RULE: Jumping is MANDATORY. If you can jump, you cannot make a step.")
    print("If your landing square immediately opens another jump, you continue jumping!")
    b3 = [EMPTY] * 33
    b3[24] = RED_MAN
    b3[19] = BLACK_MAN
    b3[11] = BLACK_MAN
    print_mini_board(b3, highlight_to=8)
    input("Type '24 8' to execute the double jump (24x15x8): ")
    b3[24] = EMPTY
    b3[19] = EMPTY
    b3[11] = EMPTY
    b3[8] = RED_MAN
    print_mini_board(b3)
    print("SUCCESS! Double capture executed in a single turn.\n")

    # Lesson 4
    input("Press Enter to continue to Lesson 4: Becoming a King...")
    print("\n--- Lesson 4: King Coronation ---")
    print("When a checker reaches the opponent's back row (squares 1-4 for Red),")
    print("it is crowned KING! Kings can move and jump both FORWARDS and BACKWARDS.")
    b4 = [EMPTY] * 33
    b4[6] = RED_MAN
    print_mini_board(b4, highlight_to=1)
    input("Type '6 1' to reach the back rank and crown your King: ")
    b4[6] = EMPTY
    b4[1] = RED_KING
    print_mini_board(b4)
    print("CROWNED! Your King (R) now commands both forward and backward diagonals.\n")

    # Lesson 5
    print("--- Lesson 5: Victory Conditions ---")
    print("You win the game when:")
    print("1. All opponent checkers are captured, OR")
    print("2. The opponent has pieces left but has NO legal moves (Blockade/Zugzwang).")
    print("\nStrategy Tip: Control the center (squares 14, 15, 18, 19) and protect your back row!")
    print("=" * 60)
    print("TUTORIAL COMPLETE! You are now ready to play against the ANN AI Agent.")
    print("Run 'python3 main.py' to begin a match!")
    print("=" * 60)

if __name__ == "__main__":
    run_tutorial()
