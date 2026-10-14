import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PieceType,
  PlayerColor,
  Move,
  DifficultyLevel,
  GameMoveRecord,
  TacticalPuzzle,
  RED_MAN,
  RED_KING,
  BLACK_MAN,
  BLACK_KING,
} from './types/checkers';
import {
  createInitialBoard,
  CheckersEngine,
} from './engine/checkersEngine';
import { soundManager } from './utils/audio';
import {
  saveGameStateToStorage,
  loadGameStateFromStorage,
  calculateCapturedStats,
  SavedCheckersState,
} from './utils/saveLoad';
import { ThemeId, BOARD_THEMES } from './types/themes';

import { CheckersBoard } from './components/CheckersBoard';
import { RulesModal } from './components/RulesModal';
import { OpeningsModal } from './components/OpeningsModal';
import { PuzzlesModal } from './components/PuzzlesModal';
import { EndGameModal } from './components/EndGameModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import { TutorialModal } from './components/TutorialModal';
import { SettingsModal } from './components/SettingsModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';

import {
  Save,
  Undo2,
  Lightbulb,
  GraduationCap,
  Settings,
  RefreshCw,
  CheckCircle2,
  Crown,
  Volume2,
  VolumeX,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Target,
  Palette,
  Flame,
} from 'lucide-react';

export default function App() {
  // Game State
  const [board, setBoard] = useState<PieceType[]>(() => createInitialBoard());
  const [turn, setTurn] = useState<PlayerColor>('red'); // Red moves first
  const [history, setHistory] = useState<GameMoveRecord[]>([]);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('tactician');
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [hintExplanation, setHintExplanation] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Theme & Preferences
  const [activeTheme, setActiveTheme] = useState<ThemeId>('walnut');
  const [showSquareNumbers, setShowSquareNumbers] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fun Career Stats
  const [stats, setStats] = useState<{ wins: number; kings: number; jumps: number }>(() => {
    try {
      const raw = localStorage.getItem('neurocheckers_career_stats');
      return raw ? JSON.parse(raw) : { wins: 0, kings: 0, jumps: 0 };
    } catch {
      return { wins: 0, kings: 0, jumps: 0 };
    }
  });

  const saveStats = (newStats: { wins: number; kings: number; jumps: number }) => {
    setStats(newStats);
    try {
      localStorage.setItem('neurocheckers_career_stats', JSON.stringify(newStats));
    } catch {}
  };

  // Modals
  const [isTutorialOpen, setIsTutorialOpen] = useState(() => {
    try {
      return !localStorage.getItem('neurocheckers_tutorial_seen');
    } catch {
      return true;
    }
  });
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isOpeningsOpen, setIsOpeningsOpen] = useState(false);
  const [isPuzzlesOpen, setIsPuzzlesOpen] = useState(false);
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const [isPythonCodeOpen, setIsPythonCodeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const [gameOverInfo, setGameOverInfo] = useState<{
    isOpen: boolean;
    winner: PlayerColor | 'draw' | null;
    reason: string | null;
  }>({
    isOpen: false,
    winner: null,
    reason: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const theme = BOARD_THEMES[activeTheme] || BOARD_THEMES.walnut;

  // Calculate legal moves for active turn
  const legalMoves = useMemo(() => {
    return CheckersEngine.getLegalMoves(board, turn);
  }, [board, turn]);

  // Captured pieces calculation
  const capturedStats = useMemo(() => {
    return calculateCapturedStats(board);
  }, [board]);

  // Dynamic AI Mood & Expression based on board advantage
  const aiMood = useMemo(() => {
    if (isAiThinking) return { emoji: '🤔', label: 'Thinking...' };
    const diff = capturedStats.blackLostTotal - capturedStats.redLostTotal;
    if (diff >= 3) return { emoji: '😰', label: 'Sweating AI' };
    if (diff <= -3) return { emoji: '😏', label: 'Smug Bot' };
    if (capturedStats.redRemainingKings > 0 && capturedStats.blackRemainingKings === 0) {
      return { emoji: '👀', label: 'Wary of King' };
    }
    return { emoji: '🤖', label: 'Evaluating' };
  }, [isAiThinking, capturedStats]);

  // Current serialized state snapshot for saving
  const currentSnapshot: SavedCheckersState = useMemo(() => {
    return {
      version: '1.0',
      savedAt: new Date().toLocaleString(),
      timestamp: Date.now(),
      board: [...board],
      turn,
      difficulty,
      capturedPieces: capturedStats,
      lastMove,
      history: [...history],
    };
  }, [board, turn, difficulty, capturedStats, lastMove, history]);

  // Handle Game Over check
  const verifyGameOver = useCallback(
    (currentBoard: PieceType[], nextTurn: PlayerColor) => {
      const outcome = CheckersEngine.checkGameOver(currentBoard, nextTurn);
      if (outcome.isOver) {
        if (outcome.winner === 'red') {
          soundManager.playVictory();
          saveStats({ ...stats, wins: stats.wins + 1 });
        } else {
          soundManager.playMandatoryJumpAlert();
        }
        setGameOverInfo({
          isOpen: true,
          winner: outcome.winner || null,
          reason: outcome.reason || null,
        });
        return true;
      }
      return false;
    },
    [stats]
  );

  // Play sound for a move
  const triggerMoveSound = (move: Move) => {
    if (move.isKinging) {
      soundManager.playCrown();
    } else if (move.captures.length > 0) {
      soundManager.playCapture();
    } else {
      soundManager.playMove();
    }
  };

  // Fast AI Turn Execution: responsive 80ms delay
  useEffect(() => {
    if (turn !== 'black' || gameOverInfo.isOpen) return;

    setIsAiThinking(true);

    const timer = setTimeout(() => {
      const { move: bestMove } = CheckersEngine.findBestMove(
        board,
        'black',
        difficulty
      );

      if (!bestMove) {
        setIsAiThinking(false);
        verifyGameOver(board, 'black');
        return;
      }

      const nextBoard = CheckersEngine.applyMove(board, bestMove, 'black');
      triggerMoveSound(bestMove);

      const notation = CheckersEngine.formatMoveNotation(bestMove);
      const moveRecord: GameMoveRecord = {
        player: 'black',
        move: bestMove,
        notation,
        isCapture: bestMove.captures.length > 0,
        isKinging: bestMove.isKinging,
        boardStateAfter: nextBoard,
      };

      setBoard(nextBoard);
      setLastMove(bestMove);
      setHistory((prev) => [...prev, moveRecord]);
      setIsAiThinking(false);

      const isEnded = verifyGameOver(nextBoard, 'red');
      if (!isEnded) {
        setTurn('red');
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [turn, board, difficulty, gameOverInfo.isOpen, verifyGameOver]);

  // Human player makes a move with fun combo toasts
  const handleMakeHumanMove = (move: Move) => {
    if (turn !== 'red' || isAiThinking) return;

    const nextBoard = CheckersEngine.applyMove(board, move, 'red');
    triggerMoveSound(move);

    // Fun combo notifications
    if (move.captures.length >= 2) {
      showToast(`🔥 DOUBLE JUMP! (+${move.captures.length} captured)`);
      saveStats({ ...stats, jumps: stats.jumps + move.captures.length });
    } else if (move.isKinging) {
      showToast(`👑 CROWNED ROYAL KING!`);
      saveStats({ ...stats, kings: stats.kings + 1 });
    } else if (move.captures.length === 1) {
      saveStats({ ...stats, jumps: stats.jumps + 1 });
    }

    const notation = CheckersEngine.formatMoveNotation(move);
    const moveRecord: GameMoveRecord = {
      player: 'red',
      move,
      notation,
      isCapture: move.captures.length > 0,
      isKinging: move.isKinging,
      boardStateAfter: nextBoard,
    };

    setBoard(nextBoard);
    setLastMove(move);
    setHintMove(null);
    setHintExplanation(null);
    setHistory((prev) => [...prev, moveRecord]);

    const isEnded = verifyGameOver(nextBoard, 'black');
    if (!isEnded) {
      setTurn('black');
    }
  };

  // Manual Trigger: Save Current Game
  const handleManualSave = () => {
    saveGameStateToStorage(board, turn, history, difficulty, lastMove);
    showToast('Match saved to device! 💾');
    soundManager.playMove();
  };

  // Manual Trigger: Load Saved Game
  const handleManualLoad = () => {
    const saved = loadGameStateFromStorage();
    if (saved) {
      handleRestoreLoadedState(saved);
      showToast('Match restored! 📂');
    } else {
      showToast('No saved match found.');
    }
  };

  // Restore State Handler
  const handleRestoreLoadedState = (state: SavedCheckersState) => {
    setBoard([...state.board]);
    setTurn(state.turn);
    setDifficulty(state.difficulty || 'tactician');
    setHistory([...(state.history || [])]);
    setLastMove(state.lastMove || null);
    setHintMove(null);
    setHintExplanation(null);
    setIsAiThinking(false);
    setGameOverInfo({ isOpen: false, winner: null, reason: null });
    soundManager.playMove();
  };

  // Undo Last Turn
  const handleUndo = () => {
    if (history.length < 2 || isAiThinking) return;

    const targetIndex = history.length - 2;
    const previousState =
      targetIndex === 0 ? createInitialBoard() : history[targetIndex - 1].boardStateAfter;

    setBoard(previousState);
    setHistory((prev) => prev.slice(0, targetIndex));
    setTurn('red');
    setLastMove(targetIndex > 0 ? history[targetIndex - 1].move : null);
    setHintMove(null);
    setHintExplanation(null);
    soundManager.playMove();
  };

  // Ask Hint
  const handleGetHint = () => {
    if (turn !== 'red' || isAiThinking) return;
    const hint = CheckersEngine.getHint(board);
    if (hint) {
      setHintMove(hint.move);
      setHintExplanation(hint.explanation);
      soundManager.playMove();
    }
  };

  // New Game Reset
  const handleNewGame = () => {
    const initial = createInitialBoard();
    setBoard(initial);
    setTurn('red');
    setHistory([]);
    setLastMove(null);
    setHintMove(null);
    setHintExplanation(null);
    setIsAiThinking(false);
    setGameOverInfo({ isOpen: false, winner: null, reason: null });
    soundManager.playMove();
  };

  // Load a tactical puzzle
  const handleSelectPuzzle = (puzzle: TacticalPuzzle) => {
    setBoard([...puzzle.initialBoard]);
    setTurn(puzzle.turn);
    setHistory([]);
    setLastMove(null);
    setHintMove(null);
    setHintExplanation(`Puzzle: ${puzzle.title}`);
    setIsAiThinking(false);
    setGameOverInfo({ isOpen: false, winner: null, reason: null });
    soundManager.playMove();
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    try {
      localStorage.setItem('neurocheckers_tutorial_seen', 'true');
    } catch {}
  };

  return (
    <div className={`min-h-[100dvh] max-h-[100dvh] ${theme.appBackground} text-stone-100 flex flex-col justify-between font-sans select-none antialiased overflow-hidden transition-colors duration-300`}>
      
      {/* 1. Mobile Game Top App Bar */}
      <header className="shrink-0 h-13 sm:h-14 bg-stone-950/90 backdrop-blur-md border-b border-stone-800/80 px-3 sm:px-4 flex items-center justify-between z-30">
        {/* Brand Lockup */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-800 border border-amber-400/50 flex items-center justify-center shadow-md">
            <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-950 fill-stone-950" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-stone-100">
              NeuroCheckers
            </h1>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-400 font-mono">
              <span className="capitalize">{difficulty}</span>
              <span className="text-stone-600">·</span>
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                {stats.wins}W
              </span>
            </div>
          </div>
        </div>

        {/* Right Top Bar Quick Action Icons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Theme Palette Switcher */}
          <button
            onClick={() => setIsThemeOpen(true)}
            title="Change Board Theme"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-amber-400 hover:bg-stone-900 transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Opening Book */}
          <button
            onClick={() => setIsOpeningsOpen(true)}
            title="Opening Book"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-400 hover:bg-stone-900 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Tactical Puzzles */}
          <button
            onClick={() => setIsPuzzlesOpen(true)}
            title="Tactical Puzzles"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-400 hover:bg-stone-900 transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4" />
          </button>

          {/* Sound FX Mute */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-400 hover:bg-stone-900 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings & Modes"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-400 hover:bg-stone-900 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Game Viewport - Responsive across ALL Screen Heights & Widths */}
      <main className="flex-1 flex flex-col items-center justify-evenly px-2 py-1 max-w-md w-full mx-auto overflow-hidden">
        
        {/* Floating Toast Alert */}
        {toastMessage && (
          <div className="fixed top-14 z-50 flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-stone-950 font-bold shadow-2xl text-xs animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* A. Opponent Profile Card (Top: ANN AI Agent) */}
        <div
          className={`w-[min(48vh,88vw,410px)] py-1.5 px-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
            turn === 'black'
              ? 'bg-amber-950/30 border-amber-500/80 shadow-md ring-1 ring-amber-400/40'
              : 'bg-stone-900/50 border-stone-800/80 opacity-80'
          }`}
        >
          {/* Avatar & Title */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border text-sm ${
                turn === 'black'
                  ? 'bg-amber-400 border-amber-300 text-stone-950 font-bold animate-pulse'
                  : 'bg-stone-800 border-stone-700 text-stone-300'
              }`}
            >
              <span>{aiMood.emoji}</span>
            </div>

            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-100">ANN AI Agent</span>
                <span className="text-[9px] font-mono text-amber-400/90 font-medium">
                  {aiMood.label}
                </span>
              </div>
              <span className="text-[9px] text-stone-400 font-mono">
                {difficulty.toUpperCase()} · Black Checkers
              </span>
            </div>
          </div>

          {/* Captured Pieces Meter */}
          <div className="flex items-center gap-1 bg-stone-950/70 px-2 py-0.5 rounded-lg border border-stone-800 text-[10px]">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="font-mono font-bold text-rose-300">
              {capturedStats.redLostTotal}
            </span>
            <span className="text-[9px] text-stone-500">lost</span>
          </div>
        </div>

        {/* B. The Checkers Board (Center Stage with Viewport Height Clamping) */}
        <div className="flex items-center justify-center my-0.5">
          <CheckersBoard
            board={board}
            turn={turn}
            legalMoves={legalMoves}
            onMakeMove={handleMakeHumanMove}
            showSquareNumbers={showSquareNumbers}
            showHeatmap={false}
            heatmapData={{}}
            lastMove={lastMove}
            hintMove={hintMove}
            isAiThinking={isAiThinking}
            theme={theme}
            onAttemptedInvalidMove={() => soundManager.playMandatoryJumpAlert()}
          />
        </div>

        {/* C. Human Player Profile Card (Bottom: You) */}
        <div
          className={`w-[min(48vh,88vw,410px)] py-1.5 px-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
            turn === 'red'
              ? 'bg-rose-950/30 border-rose-500/80 shadow-md ring-1 ring-rose-400/40'
              : 'bg-stone-900/50 border-stone-800/80 opacity-80'
          }`}
        >
          {/* Avatar & Title */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner ${
                turn === 'red'
                  ? 'bg-gradient-to-br from-rose-500 to-rose-700 border-rose-400 text-stone-100'
                  : 'bg-stone-800 border-stone-700 text-stone-400'
              }`}
            >
              <User className="w-4 h-4" />
            </div>

            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-100">You (Human)</span>
                {turn === 'red' && (
                  <span className="text-[9px] font-mono text-emerald-400 font-bold animate-pulse">
                    YOUR TURN
                  </span>
                )}
              </div>
              <span className="text-[9px] text-stone-400 font-mono">
                Red Checkers · Moves Upward
              </span>
            </div>
          </div>

          {/* Captured Pieces Meter */}
          <div className="flex items-center gap-1 bg-stone-950/70 px-2 py-0.5 rounded-lg border border-stone-800 text-[10px]">
            <div className="w-2 h-2 rounded-full bg-stone-300 border border-stone-100" />
            <span className="font-mono font-bold text-stone-200">
              {capturedStats.blackLostTotal}
            </span>
            <span className="text-[9px] text-stone-500">lost</span>
          </div>
        </div>

        {/* Hint Notification (if requested) */}
        {hintExplanation && (
          <div className="w-[min(48vh,88vw,410px)] p-1.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-[10px] text-amber-200 flex items-center gap-1.5 animate-in fade-in">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{hintExplanation}</span>
          </div>
        )}

      </main>

      {/* 3. Fixed Mobile Bottom Game Controller Dock (Thumb Natural Reach Zone) */}
      <footer className="shrink-0 h-16 bg-stone-950/95 backdrop-blur-lg border-t border-stone-800/90 px-4 flex items-center justify-around max-w-md w-full mx-auto z-40">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length < 2 || isAiThinking}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-stone-100 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
        >
          <Undo2 className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Undo</span>
        </button>

        {/* Hint */}
        <button
          onClick={handleGetHint}
          disabled={isAiThinking || turn !== 'red'}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-amber-400 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
        >
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-medium mt-0.5">Hint</span>
        </button>

        {/* Primary Action Button (New Match) */}
        <button
          onClick={handleNewGame}
          title="Start New Match"
          className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 shadow-lg shadow-amber-400/25 active:scale-90 transition-transform cursor-pointer -mt-3 border-2 border-amber-300"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Save / Load Sheet */}
        <button
          onClick={() => setIsSaveLoadOpen(true)}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-stone-100 active:scale-95 transition-all cursor-pointer"
        >
          <Save className="w-5 h-5 text-amber-400/90" />
          <span className="text-[10px] font-medium mt-0.5">Save</span>
        </button>

        {/* Interactive Tutorial */}
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
        >
          <GraduationCap className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-medium mt-0.5">Tutorial</span>
        </button>
      </footer>

      {/* Modals & Sheets */}
      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        activeTheme={activeTheme}
        onSelectTheme={setActiveTheme}
      />
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        onStartPlaying={handleNewGame}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        difficulty={difficulty}
        onChangeDifficulty={setDifficulty}
        showSquareNumbers={showSquareNumbers}
        onToggleSquareNumbers={() => setShowSquareNumbers((prev) => !prev)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNewGame={handleNewGame}
        onOpenPythonCode={() => setIsPythonCodeOpen(true)}
      />
      <SaveLoadModal
        isOpen={isSaveLoadOpen}
        onClose={() => setIsSaveLoadOpen(false)}
        currentState={currentSnapshot}
        onSaveCurrent={handleManualSave}
        onLoadState={handleRestoreLoadedState}
      />
      <PythonCodeModal
        isOpen={isPythonCodeOpen}
        onClose={() => setIsPythonCodeOpen(false)}
      />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <OpeningsModal isOpen={isOpeningsOpen} onClose={() => setIsOpeningsOpen(false)} />
      <PuzzlesModal
        isOpen={isPuzzlesOpen}
        onClose={() => setIsPuzzlesOpen(false)}
        onSelectPuzzle={handleSelectPuzzle}
      />
      <EndGameModal
        isOpen={gameOverInfo.isOpen}
        winner={gameOverInfo.winner}
        reason={gameOverInfo.reason}
        moveCount={history.length}
        onPlayAgain={handleNewGame}
      />
    </div>
  );
}
