/**
 * Web Save & Load Service for Checkers Game State
 * Includes:
 * - Board configuration (32 playable dark squares)
 * - Whose turn it is ('red' | 'black')
 * - Captured pieces count (Red & Black)
 * - Move history and game settings
 */

import { PieceType, PlayerColor, GameMoveRecord, DifficultyLevel, Move } from '../types/checkers';

export interface SavedCheckersState {
  version: string;
  savedAt: string;
  timestamp: number;
  board: PieceType[];
  turn: PlayerColor;
  difficulty: DifficultyLevel;
  capturedPieces: {
    redLostTotal: number;
    blackLostTotal: number;
    redRemainingMen: number;
    redRemainingKings: number;
    blackRemainingMen: number;
    blackRemainingKings: number;
  };
  lastMove: Move | null;
  history: GameMoveRecord[];
}

const STORAGE_KEY = 'neurocheckers_saved_game_state';

export function calculateCapturedStats(board: PieceType[]) {
  let redMen = 0;
  let redKings = 0;
  let blackMen = 0;
  let blackKings = 0;

  for (let sq = 1; sq <= 32; sq++) {
    const p = board[sq];
    if (p === 1) redMen++;
    else if (p === 2) redKings++;
    else if (p === -1) blackMen++;
    else if (p === -2) blackKings++;
  }

  const redRemaining = redMen + redKings;
  const blackRemaining = blackMen + blackKings;

  return {
    redLostTotal: Math.max(0, 12 - redRemaining),
    blackLostTotal: Math.max(0, 12 - blackRemaining),
    redRemainingMen: redMen,
    redRemainingKings: redKings,
    blackRemainingMen: blackMen,
    blackRemainingKings: blackKings,
  };
}

export function saveGameStateToStorage(
  board: PieceType[],
  turn: PlayerColor,
  history: GameMoveRecord[],
  difficulty: DifficultyLevel,
  lastMove: Move | null
): SavedCheckersState {
  const capturedPieces = calculateCapturedStats(board);
  const state: SavedCheckersState = {
    version: '1.0',
    savedAt: new Date().toLocaleString(),
    timestamp: Date.now(),
    board: [...board],
    turn,
    difficulty,
    capturedPieces,
    lastMove,
    history: [...history],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }

  return state;
}

export function loadGameStateFromStorage(): SavedCheckersState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedCheckersState;
    if (data && Array.isArray(data.board) && data.board.length === 33 && data.turn) {
      return data;
    }
  } catch (err) {
    console.error('Error loading game state from storage:', err);
  }
  return null;
}

export function hasSavedGameInStorage(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function downloadStateAsJson(state: SavedCheckersState) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `checkers_save_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function parseUploadedSaveFile(file: File): Promise<SavedCheckersState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as SavedCheckersState;
        if (!parsed.board || parsed.board.length !== 33 || !parsed.turn) {
          throw new Error('Corrupted or invalid checkers save file format.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
