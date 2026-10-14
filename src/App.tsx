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
  Code2,
  CheckCircle2,
  ChevronRight,
  Hash,
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

  // Career Stats
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
    if (isAiThinking) return { emoji: '🤔', label: 'Analyzing Position...' };
    const diff = capturedStats.blackLostTotal - capturedStats.redLostTotal;
    if (diff >= 3) return { emoji: '😰', label: 'Pressured by Red' };
    if (diff <= -3) return { emoji: '😏', label: 'Positional Advantage' };
    if (capturedStats.redRemainingKings > 0 && capturedStats.blackRemainingKings === 0) {
      return { emoji: '👀', label: 'Guarding Back Rank' };
    }
    return { emoji: '🤖', label: 'Neural Master Ready' };
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

  // Human player makes a move
  const handleMakeHumanMove = (move: Move) => {
    if (turn !== 'red' || isAiThinking) return;

    const nextBoard = CheckersEngine.applyMove(board, move, 'red');
    triggerMoveSound(move);

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

  // Helper to render tactile captured checker pieces in a felt-lined groove
  const renderCapturedRack = (count: number, isRedPiece: boolean) => {
    return (
      <div className="flex items-center gap-1.5 felt-groove px-2.5 py-1.5 rounded-xl border border-stone-800/80">
        <div className="flex items-center -space-x-1 overflow-hidden min-h-[18px]">
          {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm shrink-0 ${
                isRedPiece
                  ? 'bg-gradient-to-b from-rose-500 to-rose-900 border-rose-300/40'
                  : 'bg-gradient-to-b from-stone-600 to-stone-950 border-stone-500/40'
              }`}
            >
              <div className="w-[70%] h-[70%] mx-auto mt-[1px] rounded-full border border-white/20" />
            </div>
          ))}
          {count === 0 && (
            <span className="text-[10px] text-stone-500 italic font-serif">None</span>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold text-stone-300 ml-1">
          {count}/12
        </span>
      </div>
    );
  };

  return (
    <div
      className={`min-h-[100dvh] max-h-[100dvh] ${theme.appBackground} ${theme.tableSurface} wood-grain-subtle text-stone-100 flex flex-col justify-between font-sans select-none antialiased overflow-hidden transition-colors duration-300`}
    >
      {/* 1. Game Header */}
      <header className="shrink-0 h-13 sm:h-14 bg-gradient-to-b from-[#1a120c]/95 to-[#120c08]/95 backdrop-blur-md border-b border-[#3b2314] px-3 sm:px-6 flex items-center justify-between z-30 shadow-md">
        {/* Brand & Crest */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl brass-corner border border-[#ffd700]/60 flex items-center justify-center shadow-md">
            <Crown className="w-4 h-4 text-[#2b170c] fill-[#2b170c]" />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-serif font-bold tracking-wide text-amber-100">
                NeuroCheckers
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300 font-semibold">
                ANN Draughts
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-300/80 font-mono">
              <span className="capitalize">{difficulty} Engine</span>
              <span className="text-stone-600">·</span>
              <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                {stats.wins} Wins
              </span>
            </div>
          </div>
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Palette Switcher */}
          <button
            onClick={() => setIsThemeOpen(true)}
            title="Board Finish & Theme"
            className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs text-amber-200/90 hover:text-amber-100 hover:bg-[#311c10] border border-[#4d2d18] transition-colors cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline text-[11px] font-medium">Wood Finish</span>
          </button>

          {/* Python Code (.py) Viewer */}
          <button
            onClick={() => setIsPythonCodeOpen(true)}
            title="Inspect Python Source Code (.py)"
            className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs text-stone-300 hover:text-amber-300 hover:bg-[#311c10] border border-[#4d2d18] transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline text-[11px] font-mono">Python .py</span>
          </button>

          {/* Opening Book */}
          <button
            onClick={() => setIsOpeningsOpen(true)}
            title="Opening Book"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-300 hover:bg-[#311c10] border border-[#4d2d18] transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {/* Tactical Puzzles */}
          <button
            onClick={() => setIsPuzzlesOpen(true)}
            title="Tactical Puzzles"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-300 hover:bg-[#311c10] border border-[#4d2d18] transition-colors cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 text-rose-400" />
          </button>

          {/* Sound FX Mute */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-300 hover:bg-[#311c10] border border-[#4d2d18] transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-stone-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-300 hover:text-amber-300 hover:bg-[#311c10] border border-[#4d2d18] transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Game Arena - Responsive: 3-column parlor layout on Desktop/Tablet, compact stacked view on Mobile */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-3 lg:gap-6 px-3 py-1.5 sm:py-3 w-full max-w-6xl mx-auto overflow-hidden">
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 z-50 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-bold shadow-2xl text-xs border border-amber-300 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* LEFT FLANK (Desktop) / TOP CARD (Mobile): AI Opponent Dossier */}
        <div className="w-[min(50vh,88vw,440px)] md:w-64 lg:w-72 shrink-0 flex flex-col gap-2">
          {/* Opponent Card */}
          <div
            className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 ${
              turn === 'black'
                ? 'bg-gradient-to-b from-[#2a1a10] to-[#1c120a] border-amber-500/80 shadow-[0_4px_16px_rgba(212,175,55,0.15)] ring-1 ring-amber-400/30'
                : 'bg-stone-950/60 border-stone-800/80 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* AI Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border text-base shadow-md ${
                    turn === 'black'
                      ? 'bg-amber-500/20 border-amber-400 text-stone-100 ring-2 ring-amber-400/40'
                      : 'bg-stone-900 border-stone-700 text-stone-300'
                  }`}
                >
                  <span>{aiMood.emoji}</span>
                </div>

                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-serif font-bold text-stone-100">
                      ANN Grandmaster
                    </span>
                    {turn === 'black' && (
                      <span className="text-[9px] font-mono text-amber-400 font-bold animate-pulse px-1 rounded bg-amber-950/60 border border-amber-800/50">
                        {isAiThinking ? 'THINKING' : 'ACTIVE'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-mono">
                    Black Draughts · {difficulty.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Black Piece Badge */}
              <div className="w-5 h-5 rounded-full bg-stone-900 border border-stone-600 shadow-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-700 border border-stone-500" />
              </div>
            </div>

            {/* Captured Red Pieces Tray (Pieces lost by Human) */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800/60">
              <span className="text-[10px] font-medium text-stone-400">Captured Red:</span>
              {renderCapturedRack(capturedStats.redLostTotal, true)}
            </div>
          </div>

          {/* Desktop Only: Move History Log */}
          <div className="hidden md:flex flex-col gap-1.5 p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 h-36 lg:h-44">
            <div className="flex items-center justify-between pb-1 border-b border-stone-800 text-[10px] font-mono text-stone-400">
              <span className="font-bold text-amber-300/90 uppercase tracking-wider">Tournament Notation</span>
              <span>{history.length} Moves</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 text-[11px] font-mono text-stone-300 pr-1">
              {history.length === 0 ? (
                <div className="text-stone-500 italic text-[10px] pt-4 text-center">
                  Match starting. Red moves first.
                </div>
              ) : (
                history.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-0.5 px-1.5 rounded hover:bg-stone-900/60"
                  >
                    <span className="text-stone-500 w-6">{i + 1}.</span>
                    <span
                      className={`font-semibold ${
                        rec.player === 'red' ? 'text-rose-400' : 'text-stone-300'
                      }`}
                    >
                      {rec.player === 'red' ? 'Red' : 'AI'}
                    </span>
                    <span className="text-amber-200/90">{rec.notation}</span>
                    <span className="text-[9px] text-stone-500">
                      {rec.isCapture ? '⚔️' : rec.isKinging ? '👑' : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* CENTER STAGE: The Checkers Board & Turn Status Strip */}
        <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
          
          {/* Real-time Game Turn & Status Banner */}
          <div className="w-[min(50vh,88vw,440px)] md:w-[min(58vh,520px)] px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#21150e]/90 via-[#2e1d13]/90 to-[#21150e]/90 border border-[#54361f] shadow-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  turn === 'red'
                    ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : 'bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                }`}
              />
              <span className="font-serif font-bold text-amber-100">
                {turn === 'red'
                  ? 'Your Turn — Move Red Draught'
                  : isAiThinking
                  ? 'AI Agent is evaluating 48 neural features...'
                  : 'AI Turn completed'}
              </span>
            </div>

            {/* Quick Toggle Square Numbers */}
            <button
              onClick={() => setShowSquareNumbers((prev) => !prev)}
              title="Toggle Standard 1-32 Checkers Square Numbers"
              className={`p-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                showSquareNumbers
                  ? 'bg-amber-950/70 border-amber-700/60 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-400'
              }`}
            >
              <Hash className="w-3 h-3" />
              <span className="hidden sm:inline">1-32</span>
            </button>
          </div>

          {/* The Checkers Board */}
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

          {/* Tactical Hint Notification Banner */}
          {hintExplanation && (
            <div className="w-[min(50vh,88vw,440px)] md:w-[min(58vh,520px)] p-2 rounded-xl bg-gradient-to-r from-amber-950/80 to-stone-950/80 border border-amber-700/60 text-xs text-amber-200 flex items-center gap-2 animate-in fade-in shadow-md">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium truncate">{hintExplanation}</span>
            </div>
          )}
        </div>

        {/* RIGHT FLANK (Desktop) / BOTTOM CARD (Mobile): Player Dossier & Game Controls */}
        <div className="w-[min(50vh,88vw,440px)] md:w-64 lg:w-72 shrink-0 flex flex-col gap-2">
          
          {/* Human Player Card */}
          <div
            className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2 ${
              turn === 'red'
                ? 'bg-gradient-to-b from-[#2e120f] to-[#1c0b09] border-rose-500/80 shadow-[0_4px_16px_rgba(244,63,94,0.15)] ring-1 ring-rose-400/30'
                : 'bg-stone-950/60 border-stone-800/80 opacity-90'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Player Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-inner ${
                    turn === 'red'
                      ? 'bg-gradient-to-br from-rose-600 to-rose-900 border-rose-400 text-stone-100 ring-2 ring-rose-400/40'
                      : 'bg-stone-900 border-stone-700 text-stone-400'
                  }`}
                >
                  <User className="w-4 h-4 text-rose-200" />
                </div>

                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-serif font-bold text-stone-100">
                      You (Human)
                    </span>
                    {turn === 'red' && (
                      <span className="text-[9px] font-mono text-emerald-400 font-bold animate-pulse px-1 rounded bg-emerald-950/60 border border-emerald-800/50">
                        YOUR TURN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-rose-300/80 font-mono">
                    Red Draughts · Moves Upward
                  </span>
                </div>
              </div>

              {/* Red Piece Badge */}
              <div className="w-5 h-5 rounded-full bg-rose-700 border border-rose-400 shadow-sm flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-300" />
              </div>
            </div>

            {/* Captured Black Pieces Tray (Pieces lost by AI) */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800/60">
              <span className="text-[10px] font-medium text-stone-400">Captured Black:</span>
              {renderCapturedRack(capturedStats.blackLostTotal, false)}
            </div>
          </div>

          {/* Desktop Only: Dedicated Control Panel */}
          <div className="hidden md:flex flex-col gap-2 p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80">
            <span className="text-[10px] font-bold font-mono text-amber-300/90 uppercase tracking-wider pb-1 border-b border-stone-800">
              Match Controls
            </span>

            {/* Primary Action Button (New Match) */}
            <button
              onClick={handleNewGame}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-serif font-bold text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Match</span>
            </button>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleUndo}
                disabled={history.length < 2 || isAiThinking}
                className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-800 text-xs text-stone-300 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5 text-stone-400" />
                <span>Undo</span>
              </button>

              <button
                onClick={handleGetHint}
                disabled={isAiThinking || turn !== 'red'}
                className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border border-stone-800 text-xs text-amber-300 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Hint</span>
              </button>

              <button
                onClick={() => setIsSaveLoadOpen(true)}
                className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save/Load</span>
              </button>

              <button
                onClick={() => setIsTutorialOpen(true)}
                className="py-1.5 px-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                <span>Tutorial</span>
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* 3. Fixed Mobile Bottom Game Controller Dock (Natural Thumb Zone) */}
      <footer className="md:hidden shrink-0 h-16 bg-[#170f0a]/95 backdrop-blur-lg border-t border-[#3d2516] px-4 flex items-center justify-around max-w-md w-full mx-auto z-40">
        {/* Undo */}
        <button
          onClick={handleUndo}
          disabled={history.length < 2 || isAiThinking}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-amber-200 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
        >
          <Undo2 className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">Undo</span>
        </button>

        {/* Hint */}
        <button
          onClick={handleGetHint}
          disabled={isAiThinking || turn !== 'red'}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-amber-300 disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
        >
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-medium mt-0.5">Hint</span>
        </button>

        {/* Primary Action Button (New Match) */}
        <button
          onClick={handleNewGame}
          title="Start New Match"
          className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl brass-corner text-stone-950 shadow-lg shadow-amber-950/50 active:scale-90 transition-transform cursor-pointer -mt-3 border-2 border-[#ffd700]"
        >
          <RefreshCw className="w-5 h-5 text-[#2b170c]" />
        </button>

        {/* Save / Load Sheet */}
        <button
          onClick={() => setIsSaveLoadOpen(true)}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-amber-200 active:scale-95 transition-all cursor-pointer"
        >
          <Save className="w-5 h-5 text-amber-400/90" />
          <span className="text-[10px] font-medium mt-0.5">Save</span>
        </button>

        {/* Interactive Tutorial */}
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] text-stone-400 hover:text-amber-300 active:scale-95 transition-all cursor-pointer"
        >
          <GraduationCap className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-medium mt-0.5">Tutorial</span>
        </button>
      </footer>

      {/* Modals & Dialogs */}
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
