/**
 * Checkers Opening Book & Grandmaster Line Registry
 * Standard 1-32 notation is used for all moves.
 */

import { OpeningRecord } from '../types/checkers';

export const CHECKERS_OPENINGS: OpeningRecord[] = [
  {
    name: 'Single Corner Opening (11-15)',
    moves: ['11-15', '22-18', '15-22', '25-18'],
    description: 'The most popular and aggressive tournament opening. Red stakes claim to the center, leading to sharp tactical exchanges.',
    historicalWinRate: 'Red 38% · Black 36% · Draw 26%',
  },
  {
    name: 'Cross Opening (11-15, 23-18)',
    moves: ['11-15', '23-18', '8-11', '27-23'],
    description: 'A solid, classical response where Black counters Red’s center thrust with cross-flank consolidation.',
    historicalWinRate: 'Red 34% · Black 37% · Draw 29%',
  },
  {
    name: 'Old Fourteenth (11-15, 23-19)',
    moves: ['11-15', '23-19', '8-11', '22-17', '9-13', '17-14'],
    description: 'Named after the famous 14th game in Sturges’ treatise. Deeply theoretical with mutual sacrifice possibilities.',
    historicalWinRate: 'Red 35% · Black 35% · Draw 30%',
  },
  {
    name: 'Edinburgh Opening (9-13)',
    moves: ['9-13', '22-18', '10-15', '25-22'],
    description: 'An asymmetrical side-line development. Red avoids early central clashes to play for long-term positional squeeze.',
    historicalWinRate: 'Red 32% · Black 39% · Draw 29%',
  },
  {
    name: 'Bristol Opening (11-16)',
    moves: ['11-16', '24-20', '16-19', '23-16'],
    description: 'Invites double-corner tension. Fast development that tests the opponent’s calculation under pressure.',
    historicalWinRate: 'Red 33% · Black 38% · Draw 29%',
  },
  {
    name: 'Double Corner Opening (9-14)',
    moves: ['9-14', '22-17', '5-9', '25-22'],
    description: 'Direct pressure against Black’s single corner flank, aiming to create a cramp.',
    historicalWinRate: 'Red 36% · Black 35% · Draw 29%',
  },
  {
    name: 'Denny Opening (10-14)',
    moves: ['10-14', '22-17', '7-10', '17-13'],
    description: 'Leads to closed, methodical maneuvers where tempo and triangle defense stability determine victory.',
    historicalWinRate: 'Red 31% · Black 38% · Draw 31%',
  },
  {
    name: 'Kelso Opening (10-15)',
    moves: ['10-15', '21-17', '11-16', '17-13'],
    description: 'A tactical flank gambit favored by attacking grandmasters to force opponent piece dislocation.',
    historicalWinRate: 'Red 37% · Black 35% · Draw 28%',
  },
  {
    name: 'Maid of the Mill (11-15, 22-17)',
    moves: ['11-15', '22-17', '8-11', '17-13', '4-8', '25-22'],
    description: 'A historic line featuring an early lock on square 13, requiring precise endgame calculation.',
    historicalWinRate: 'Red 34% · Black 36% · Draw 30%',
  },
  {
    name: 'Pioneer Opening (11-15, 23-18, 9-14)',
    moves: ['11-15', '23-18', '9-14', '18-9', '5-14'],
    description: 'An aggressive double-exchange variation where Black attacks the center head-on.',
    historicalWinRate: 'Red 33% · Black 39% · Draw 28%',
  },
];

/**
 * Matches an opening given a sequence of move notations (e.g., ["11-15", "22-18"])
 */
export function identifyOpening(moveHistory: string[]): OpeningRecord | null {
  if (moveHistory.length === 0) return null;

  for (const opening of CHECKERS_OPENINGS) {
    let match = true;
    for (let i = 0; i < opening.moves.length && i < moveHistory.length; i++) {
      if (opening.moves[i] !== moveHistory[i]) {
        match = false;
        break;
      }
    }
    if (match) return opening;
  }
  return null;
}
