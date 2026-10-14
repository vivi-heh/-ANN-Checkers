import React from 'react';
import {
  X,
  Settings,
  Grid,
  Volume2,
  VolumeX,
  RefreshCw,
  Terminal,
  Shield,
  Zap,
  Award,
  Crown,
} from 'lucide-react';
import { DifficultyLevel } from '../types/checkers';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  difficulty: DifficultyLevel;
  onChangeDifficulty: (lvl: DifficultyLevel) => void;
  showSquareNumbers: boolean;
  onToggleSquareNumbers: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNewGame: () => void;
  onOpenPythonCode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  difficulty,
  onChangeDifficulty,
  showSquareNumbers,
  onToggleSquareNumbers,
  isMuted,
  onToggleMute,
  onNewGame,
  onOpenPythonCode,
}) => {
  if (!isOpen) return null;

  const difficulties: { id: DifficultyLevel; name: string; desc: string; icon: any }[] = [
    { id: 'apprentice', name: 'Apprentice', desc: 'Fast tactical moves, depth 2', icon: Zap },
    { id: 'tactician', name: 'Tactician', desc: 'Positional heuristics, depth 3', icon: Shield },
    { id: 'master', name: 'Master', desc: 'Quiescence search, depth 4', icon: Award },
    { id: 'grandmaster', name: 'Grandmaster', desc: 'Deep iterative deepening, depth 5+', icon: Crown },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200 flex flex-col gap-5">
        
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1.5 bg-stone-700 rounded-full mx-auto -mt-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold tracking-tight text-stone-100">
              Game Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Strength Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-stone-300">
            ANN AI Difficulty
          </span>
          <div className="grid grid-cols-2 gap-2">
            {difficulties.map((item) => {
              const Icon = item.icon;
              const isSelected = difficulty === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeDifficulty(item.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-md font-semibold'
                      : 'bg-stone-950/60 border-stone-800 text-stone-300 hover:bg-stone-850'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{item.name}</span>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] leading-tight ${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggles List */}
        <div className="flex flex-col gap-2 pt-1 border-t border-stone-800/80">
          <span className="text-xs font-semibold text-stone-300">
            Display & Audio
          </span>

          {/* 1-32 Numbers */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="flex items-center gap-2.5">
              <Grid className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-stone-200">1–32 Square Notation</span>
                <span className="text-[10px] text-stone-400">Official tournament square numbers</span>
              </div>
            </div>
            <button
              onClick={onToggleSquareNumbers}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                showSquareNumbers ? 'bg-amber-400' : 'bg-stone-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-stone-950 absolute top-1 transition-transform ${
                  showSquareNumbers ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Sound FX */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/60 border border-stone-800">
            <div className="flex items-center gap-2.5">
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-stone-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-stone-200">Sound Effects</span>
                <span className="text-[10px] text-stone-400">Synthesized wooden taps and crown chimes</span>
              </div>
            </div>
            <button
              onClick={onToggleMute}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                !isMuted ? 'bg-amber-400' : 'bg-stone-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-stone-950 absolute top-1 transition-transform ${
                  !isMuted ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
          <button
            onClick={() => {
              onOpenPythonCode();
              onClose();
            }}
            className="p-3 rounded-2xl bg-stone-850 hover:bg-stone-800 border border-stone-700/60 text-xs font-medium text-stone-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Python Files (.py)</span>
          </button>

          <button
            onClick={() => {
              onNewGame();
              onClose();
            }}
            className="p-3 rounded-2xl bg-rose-950/50 hover:bg-rose-900/50 border border-rose-800/60 text-xs font-medium text-rose-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-rose-400" />
            <span>Restart Match</span>
          </button>
        </div>

      </div>
    </div>
  );
};
