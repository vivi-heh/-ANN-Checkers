import React from 'react';
import { Volume2, VolumeX, RefreshCw, Save } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  onNewGame: () => void;
  onOpenTutorial: () => void;
  onOpenRules: () => void;
  onOpenOpenings: () => void;
  onOpenPuzzles: () => void;
  onOpenSaveLoad: () => void;
  onOpenPythonCode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewGame,
  onOpenTutorial,
  onOpenRules,
  onOpenOpenings,
  onOpenPuzzles,
  onOpenSaveLoad,
  onOpenPythonCode,
  isMuted,
  onToggleMute,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-500/40 flex items-center justify-center shadow-inner">
          <div className="w-4 h-4 rounded-full border-2 border-amber-200/90 bg-stone-950 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>
        <span className="text-lg font-bold tracking-tight text-stone-100 font-sans">
          NeuroCheckers
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
        <button
          onClick={onOpenTutorial}
          className="text-amber-400 font-semibold hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
        >
          <span>Tutorial</span>
        </button>
        <button
          onClick={onOpenRules}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Rules
        </button>
        <button
          onClick={onOpenOpenings}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Openings
        </button>
        <button
          onClick={onOpenPuzzles}
          className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Puzzles
        </button>
        <button
          onClick={onOpenPythonCode}
          className="hover:text-amber-400 text-stone-300 font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Python (.py)
        </button>
      </nav>

      {/* Zone 3: 1 primary action group and sound toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSaveLoad}
          className="px-3 py-1.5 text-xs font-medium text-stone-200 bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5 text-amber-400" />
          <span>Save / Load</span>
        </button>
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <button
          onClick={onNewGame}
          className="px-3.5 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Match</span>
        </button>
      </div>
    </header>
  );
};
