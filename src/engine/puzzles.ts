/**
 * Grandmaster Checkers Tactical Puzzles & Shot Challenges
 * Tests combinations, sacrifices, and multi-jump traps.
 */

import { TacticalPuzzle, PieceType, RED_MAN, RED_KING, BLACK_MAN, BLACK_KING, EMPTY } from '../types/checkers';

function makeEmptyBoard(): PieceType[] {
  return new Array(33).fill(EMPTY);
}

export const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puzzle_goose_walk',
    title: 'The Goose Walk Shot',
    subtitle: 'Classic Double-Jump Decoy Sacrifice',
    difficulty: 'intermediate',
    turn: 'red',
    description: 'Red is down in material but has a devastating combination. Find the decoy pitch that forces Black to jump, opening a multi-jump path to victory.',
    initialBoard: (() => {
      const b = makeEmptyBoard();
      // Red pieces
      b[19] = RED_MAN;
      b[23] = RED_MAN;
      b[27] = RED_MAN;
      // Black pieces
      b[10] = BLACK_MAN;
      b[11] = BLACK_MAN;
      b[18] = BLACK_MAN;
      return b;
    })(),
    solutionMoves: [
      { from: 19, to: 15 }, // Red sacrifices 19-15
      { from: 11, to: 18 }, // Black forced jump: 11x18
      { from: 23, to: 14 }, // Red jumps 23x14x... or 27-23 shot
    ],
    explanation: 'By sacrificing piece 19 to square 15, Black is legally compelled by the mandatory jump rule to capture 11x18, perfectly aligning Black’s checkers for Red’s decisive multi-jump counterstrike!',
  },
  {
    id: 'puzzle_in_and_out',
    title: 'The Double In-and-Out Shot',
    subtitle: 'Grandmaster Clearance Combination',
    difficulty: 'advanced',
    turn: 'red',
    description: 'Black appears to have a commanding center block. Use a double-exchange sacrifice to pierce the center and crown a king.',
    initialBoard: (() => {
      const b = makeEmptyBoard();
      // Red pieces
      b[22] = RED_MAN;
      b[26] = RED_MAN;
      b[31] = RED_MAN;
      b[24] = RED_MAN;
      // Black pieces
      b[14] = BLACK_MAN;
      b[15] = BLACK_MAN;
      b[18] = BLACK_MAN;
      b[10] = BLACK_MAN;
      return b;
    })(),
    solutionMoves: [
      { from: 22, to: 17 }, // Pitch 1
      { from: 14, to: 21 }, // Black jumps
      { from: 26, to: 22 }, // Pitch 2
    ],
    explanation: 'The classic In-and-Out shot exploits the mandatory jump rule by temporarily offering two single checkers to blow open Black’s diagonal protection line, capturing 3 pieces and entering the king row.',
  },
  {
    id: 'puzzle_royal_pinch',
    title: 'The Royal King Pinch',
    subtitle: 'Corner Trap & Endgame Domination',
    difficulty: 'master',
    turn: 'black',
    description: 'As Black (the ANN), you have 1 king and 1 man against Red’s king. Trap Red in the double-corner to enforce a zugzwang win.',
    initialBoard: (() => {
      const b = makeEmptyBoard();
      b[14] = BLACK_KING;
      b[18] = BLACK_MAN;
      b[28] = RED_KING; // Red trapped near double corner
      return b;
    })(),
    solutionMoves: [
      { from: 14, to: 23 }, // Pinching move
      { from: 28, to: 32 }, // Red forced to corner
      { from: 23, to: 27 }, // Pinning Red
    ],
    explanation: 'Checkers endgames are won by seizing the double corner diagonal (squares 28 & 32). By cutting off Red’s escape squares, Red is suffocated into having no legal moves.',
  },
  {
    id: 'puzzle_bridge_lock',
    title: 'The Unbreakable Bridge Defense',
    subtitle: 'Exploiting the Back-Rank Lock',
    difficulty: 'intermediate',
    turn: 'red',
    description: 'Black is charging toward promotion on your right flank. Deploy your bridge checkers to shut down Black’s advance completely.',
    initialBoard: (() => {
      const b = makeEmptyBoard();
      b[30] = RED_MAN;
      b[32] = RED_MAN;
      b[26] = RED_MAN;
      b[21] = BLACK_MAN;
      b[22] = BLACK_MAN;
      return b;
    })(),
    solutionMoves: [
      { from: 26, to: 17 }, // Advance block
    ],
    explanation: 'The "Bridge" (squares 30 and 32) creates an impenetrable fortress because any opposing checker attempting to reach the king row is immediately jumped and captured!',
  },
];
