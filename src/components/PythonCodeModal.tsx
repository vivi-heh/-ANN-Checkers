import React, { useState } from 'react';
import { X, Code2, Copy, Check, Download, Terminal } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'ann' | 'checkers' | 'save_load'>('main');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files = {
    main: {
      name: 'main.py',
      desc: 'Interactive Checkers CLI Runner with Board Rendering & Game Loop',
      code: `"""
Checkers Grandmaster ANN - Terminal Runner
Provides terminal interface with board display, ANN opponent, and manual save/load commands.
Run with: python3 main.py
"""

from checkers import (
    create_initial_board, get_legal_moves, apply_move,
    check_game_over, RED_MAN, RED_KING, BLACK_MAN, BLACK_KING
)
from ann_engine import find_best_ai_move
from save_load import save_game_to_file, load_game_from_file, calculate_captured_pieces

def print_board(board):
    print("\\n   +---+---+---+---+---+---+---+---+")
    for row in range(8):
        row_str = f" {8 - row} |"
        for col in range(8):
            if (row + col) % 2 == 1:
                sq = row * 4 + col // 2 + 1
                p = board[sq]
                char = " r " if p == RED_MAN else " R " if p == RED_KING else " b " if p == BLACK_MAN else " B " if p == BLACK_KING else f"{sq:2d} "
                row_str += char + "|"
            else:
                row_str += " . |"
        print(row_str)
        print("   +---+---+---+---+---+---+---+---+")
    print("     A   B   C   D   E   F   G   H\\n")

def main():
    print("=" * 50)
    print(" NeuroCheckers — ANN Draughts Grandmaster (Python)")
    print(" Red = You (r / R) | Black = ANN AI Agent (b / B)")
    print(" Commands: 'from to' (e.g. 11 15), 'save', 'load', 'quit'")
    print("=" * 50)

    board = create_initial_board()
    turn = "red"
    history = []

    while True:
        captured = calculate_captured_pieces(board)
        print(f"Turn: {turn.upper()} | Red captured: {captured['black_captured_total']}, Black captured: {captured['red_captured_total']}")
        print_board(board)

        is_over, winner, reason = check_game_over(board, turn)
        if is_over:
            print(f"GAME OVER! Winner: {winner.upper()}. {reason}")
            break

        if turn == "red":
            legal_moves = get_legal_moves(board, "red")
            if any(len(m.captures) > 0 for m in legal_moves):
                print(">>> MANDATORY JUMP! You must capture. <<<")

            cmd = input("Your move (e.g. '11 15') or 'save'/'load'/'quit': ").strip().lower()
            if cmd == "quit": break
            if cmd == "save":
                fn = input("Filename (default 'checkers_save.json'): ").strip() or "checkers_save.json"
                save_game_to_file(fn, board, turn, history)
                print(f"Saved to {fn}")
                continue
            if cmd == "load":
                fn = input("Filename (default 'checkers_save.json'): ").strip() or "checkers_save.json"
                data = load_game_from_file(fn)
                if data:
                    board, turn, history = data["board"], data["turn"], data.get("move_history", [])
                    print(f"Loaded {fn}!")
                continue

            parts = cmd.split()
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                f, t = int(parts[0]), int(parts[1])
                chosen = next((m for m in legal_moves if m.from_sq == f and m.to_sq == t), None)
                if chosen:
                    board = apply_move(board, chosen, "red")
                    history.append(chosen.to_dict())
                    turn = "black"
                else:
                    print("Illegal move!")
        else:
            print("ANN AI Agent is calculating best response...")
            ai_move = find_best_ai_move(board, "black", depth=4)
            if not ai_move: break
            board = apply_move(board, ai_move, "black")
            history.append(ai_move.to_dict())
            print(f"AI played: {ai_move.notation}")
            turn = "red"

if __name__ == "__main__":
    main()`,
    },
    ann: {
      name: 'ann_engine.py',
      desc: 'Artificial Neural Network Evaluation & Minimax Alpha-Beta Search Engine',
      code: `"""
Artificial Neural Network (ANN) Board Evaluator & Minimax Engine
48 features -> 64 neurons (LeakyReLU) -> 32 neurons -> 16 neurons -> 1 output
"""
import math, random
from checkers import (
    EMPTY, RED_MAN, RED_KING, BLACK_MAN, BLACK_KING,
    get_legal_moves, apply_move
)

def leaky_relu(x: float) -> float:
    return x if x > 0 else 0.02 * x

class CheckersANN:
    def __init__(self):
        rng = random.Random(420791)
        self.w1 = [[(rng.random() * 2 - 1) * math.sqrt(2 / 48) for _ in range(64)] for _ in range(48)]
        self.b1 = [(rng.random() * 2 - 1) * 0.05 for _ in range(64)]
        self.w2 = [[(rng.random() * 2 - 1) * math.sqrt(2 / 64) for _ in range(32)] for _ in range(64)]
        self.b2 = [(rng.random() * 2 - 1) * 0.05 for _ in range(32)]
        self.w3 = [[(rng.random() * 2 - 1) * math.sqrt(2 / 32) for _ in range(16)] for _ in range(32)]
        self.b3 = [(rng.random() * 2 - 1) * 0.05 for _ in range(16)]
        self.w_out = [(rng.random() * 2 - 1) * math.sqrt(2 / 16) for _ in range(16)]
        self.b_out = 0.0

        # Grandmaster heuristic weight injections
        for j in range(12): self.w1[32][j] += 2.4; self.w2[j][0] += 1.8; self.w_out[0] += 2.0
        for j in range(12, 20): self.w1[33][j] += 1.6; self.w2[j][1] += 1.2; self.w_out[1] += 1.3

    def evaluate(self, board, active_color="black"):
        features = [0.0] * 48
        b_men = b_kings = r_men = r_kings = 0
        center = 0.0

        for sq in range(1, 33):
            p = board[sq]
            if p == BLACK_MAN: features[sq - 1] = 1.0; b_men += 1
            elif p == BLACK_KING: features[sq - 1] = 2.4; b_kings += 1
            elif p == RED_MAN: features[sq - 1] = -1.0; r_men += 1
            elif p == RED_KING: features[sq - 1] = -2.4; r_kings += 1

            if sq in [14, 15, 18, 19]:
                if p in (BLACK_MAN, BLACK_KING): center += 1.5
                elif p in (RED_MAN, RED_KING): center -= 1.5

        features[32] = ((b_men * 100 + b_kings * 175) - (r_men * 100 + r_kings * 175)) / 100.0
        features[33] = center
        features[47] = 0.3 if active_color == "black" else -0.3

        l1 = [leaky_relu(self.b1[j] + sum(features[i] * self.w1[i][j] for i in range(48))) for j in range(64)]
        l2 = [leaky_relu(self.b2[j] + sum(l1[i] * self.w2[i][j] for i in range(64))) for j in range(32)]
        l3 = [leaky_relu(self.b3[j] + sum(l2[i] * self.w3[i][j] for i in range(32))) for j in range(16)]
        raw_out = self.b_out + sum(l3[i] * self.w_out[i] for i in range(16))

        return raw_out * 8.0 + features[32] * 120.0 + features[33] * 15.0

global_ann = CheckersANN()

def find_best_ai_move(board, color="black", depth=3):
    legal_moves = get_legal_moves(board, color)
    if not legal_moves: return None
    legal_moves.sort(key=lambda m: len(m.captures), reverse=True)
    best_move = legal_moves[0]
    alpha = -float("inf")
    for move in legal_moves:
        score = _minimax(apply_move(board, move, color), depth - 1, alpha, float("inf"), "red" if color == "black" else "black", False)
        if score > alpha:
            alpha = score
            best_move = move
    return best_move

def _minimax(board, depth, alpha, beta, color, is_max):
    moves = get_legal_moves(board, color)
    if not moves: return -99999 + depth if is_max else 99999 - depth
    if depth <= 0: return global_ann.evaluate(board, color)
    moves.sort(key=lambda m: len(m.captures), reverse=True)
    next_c = "red" if color == "black" else "black"
    if is_max:
        v = -float("inf")
        for m in moves:
            v = max(v, _minimax(apply_move(board, m, color), depth - 1, alpha, beta, next_c, False))
            alpha = max(alpha, v)
            if beta <= alpha: break
        return v
    else:
        v = float("inf")
        for m in moves:
            v = min(v, _minimax(apply_move(board, m, color), depth - 1, alpha, beta, next_c, True))
            beta = min(beta, v)
            if beta <= alpha: break
        return v`,
    },
    checkers: {
      name: 'checkers.py',
      desc: 'Checkers Rules & Mathematical Neighbor Table',
      code: `"""
Checkers Rules Engine in Python
Tournament English Draughts rules with mandatory jumps & multi-jump chains
"""
from typing import List, Dict

EMPTY = 0
RED_MAN = 1
RED_KING = 2
BLACK_MAN = -1
BLACK_KING = -2

def compute_neighbors_table() -> Dict[int, Dict[str, int]]:
    table = {}
    for sq in range(1, 33):
        r = (sq - 1) // 4
        c = (sq - 1) % 4 * 2 + 1 if r % 2 == 0 else (sq - 1) % 4 * 2
        def get_sq(row, col):
            if row < 0 or row > 7 or col < 0 or col > 7 or (row + col) % 2 == 0: return -1
            return row * 4 + col // 2 + 1
        table[sq] = {"UL": get_sq(r-1, c-1), "UR": get_sq(r-1, c+1), "DL": get_sq(r+1, c-1), "DR": get_sq(r+1, c+1)}
    return table

SQUARE_NEIGHBORS = compute_neighbors_table()

class Move:
    def __init__(self, from_sq: int, to_sq: int, captures: List[int] = None, path: List[int] = None, is_kinging: bool = False):
        self.from_sq, self.to_sq, self.captures, self.path, self.is_kinging = from_sq, to_sq, captures or [], path or [from_sq, to_sq], is_kinging
    @property
    def notation(self) -> str:
        return "-".join(map(str, [self.from_sq, self.to_sq])) if not self.captures else "x".join(map(str, self.path))
    def to_dict(self):
        return {"from": self.from_sq, "to": self.to_sq, "captures": self.captures, "path": self.path, "is_kinging": self.is_kinging, "notation": self.notation}

def create_initial_board() -> List[int]:
    b = [EMPTY] * 33
    for sq in range(1, 13): b[sq] = BLACK_MAN
    for sq in range(21, 33): b[sq] = RED_MAN
    return b

def get_legal_moves(board: List[int], color: str) -> List[Move]:
    jumps, steps = [], []
    for sq in range(1, 33):
        p = board[sq]
        if (color == "red" and p not in (RED_MAN, RED_KING)) or (color == "black" and p not in (BLACK_MAN, BLACK_KING)):
            continue
        is_king = p in (RED_KING, BLACK_KING)
        dirs = ["UL", "UR", "DL", "DR"] if is_king else (["UL", "UR"] if color == "red" else ["DL", "DR"])
        j = _find_jumps(board, sq, p, color, dirs)
        if j: jumps.extend(j)
        elif not jumps:
            for d in dirs:
                t = SQUARE_NEIGHBORS[sq][d]
                if t > 0 and board[t] == EMPTY:
                    crown = not is_king and ((1 <= t <= 4) if color == "red" else (29 <= t <= 32))
                    steps.append(Move(sq, t, [], [sq, t], crown))
    return jumps if jumps else steps

def _find_jumps(board, start_sq, piece, color, dirs, visited=None, path=None):
    visited, path = visited or [], path or [start_sq]
    curr = path[-1]
    is_king = piece in (RED_KING, BLACK_KING)
    res = []
    for d in dirs:
        mid = SQUARE_NEIGHBORS[curr][d]
        if mid <= 0 or mid in visited: continue
        jumped = board[mid]
        is_opp = (jumped in (BLACK_MAN, BLACK_KING)) if color == "red" else (jumped in (RED_MAN, RED_KING))
        if is_opp:
            land = SQUARE_NEIGHBORS[mid][d]
            if land > 0 and (board[land] == EMPTY or land == start_sq):
                crowned = not is_king and ((1 <= land <= 4) if color == "red" else (29 <= land <= 32))
                if crowned:
                    res.append(Move(start_sq, land, visited + [mid], path + [land], True))
                else:
                    nb = list(board); nb[curr] = nb[mid] = EMPTY; nb[land] = piece
                    sub = _find_jumps(nb, start_sq, piece, color, dirs, visited + [mid], path + [land])
                    if sub: res.extend(sub)
                    else: res.append(Move(start_sq, land, visited + [mid], path + [land], False))
    return res

def apply_move(board: List[int], move: Move, color: str) -> List[int]:
    nb = list(board); p = nb[move.from_sq]; nb[move.from_sq] = EMPTY
    for c in move.captures: nb[c] = EMPTY
    nb[move.to_sq] = (RED_KING if color == "red" else BLACK_KING) if move.is_kinging else p
    return nb

def check_game_over(board, color):
    r = sum(1 for sq in range(1, 33) if board[sq] in (RED_MAN, RED_KING))
    b = sum(1 for sq in range(1, 33) if board[sq] in (BLACK_MAN, BLACK_KING))
    if r == 0: return True, "black", "Black captured all Red checkers."
    if b == 0: return True, "red", "Red captured all Black checkers."
    if not get_legal_moves(board, color): return True, ("black" if color == "red" else "red"), f"{color.capitalize()} blocked."
    return False, None, None`,
    },
    save_load: {
      name: 'save_load.py',
      desc: 'Save & Load State Serializer (Board, Turn, Captured Pieces)',
      code: `"""
Save and Load Checkers Game State in Python
"""
import json, os, time

def calculate_captured_pieces(board):
    r_total = sum(1 for sq in range(1, 33) if board[sq] in (1, 2))
    b_total = sum(1 for sq in range(1, 33) if board[sq] in (-1, -2))
    return {
        "red_captured_total": max(0, 12 - r_total),
        "black_captured_total": max(0, 12 - b_total),
        "remaining_red": r_total,
        "remaining_black": b_total
    }

def save_game_to_file(filepath, board, turn, history=None):
    state = {
        "timestamp": int(time.time()),
        "board": board,
        "turn": turn,
        "captured_pieces": calculate_captured_pieces(board),
        "move_history": history or []
    }
    with open(filepath, "w") as f:
        json.dump(state, f, indent=2)
    return True

def load_game_from_file(filepath):
    if not os.path.exists(filepath): return None
    with open(filepath, "r") as f:
        return json.load(f)`,
    },
  };

  const currentFile = files[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentFile.code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[88vh] rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200 flex flex-col gap-4">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-800">
          <Terminal className="w-5 h-5 text-amber-400" />
          <div>
            <h2 className="text-base font-bold tracking-tight text-stone-100">
              Python Checkers & ANN Codebase (.py)
            </h2>
            <p className="text-xs text-stone-400">
              Complete standalone Python implementation with ANN engine, rules, and save/load
            </p>
          </div>
        </div>

        {/* File Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-800 text-xs">
            {(
              [
                { id: 'main', label: 'main.py' },
                { id: 'ann', label: 'ann_engine.py' },
                { id: 'checkers', label: 'checkers.py' },
                { id: 'save_load', label: 'save_load.py' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 font-mono text-xs rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-amber-400 text-stone-950 font-semibold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-800 hover:bg-stone-750 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-stone-700/60"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="text-xs text-stone-400 font-mono">
          <span>{currentFile.desc}</span>
        </div>

        {/* Code Block */}
        <div className="flex-1 overflow-auto rounded-xl bg-stone-950 border border-stone-800 p-4 font-mono text-xs text-stone-300 leading-relaxed max-h-[50vh]">
          <pre>
            <code>{currentFile.code}</code>
          </pre>
        </div>

        {/* Run Instruction */}
        <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>To run in terminal: <code className="text-amber-400 font-mono">python3 main.py</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-stone-300 hover:text-stone-100 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
