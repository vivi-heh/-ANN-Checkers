import React from 'react';
import { X, Palette, Check } from 'lucide-react';
import { ThemeId, BOARD_THEMES } from '../types/themes';
import { soundManager } from '../utils/audio';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const handleSelect = (id: ThemeId) => {
    onSelectTheme(id);
    soundManager.playMove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-200 flex flex-col gap-4">
        
        {/* Mobile Drag Handle */}
        <div className="w-10 h-1.5 bg-stone-700 rounded-full mx-auto -mt-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold tracking-tight text-stone-100">
                Board Themes & Styles
              </h2>
              <p className="text-xs text-stone-400">
                Choose your favorite game board skin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Grid */}
        <div className="grid grid-cols-2 gap-3">
          {(Object.values(BOARD_THEMES)).map((t) => {
            const isSelected = activeTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 bg-stone-850 ring-2 ring-amber-400/40 shadow-lg'
                    : 'border-stone-800 bg-stone-950/60 hover:bg-stone-850 hover:border-stone-700'
                }`}
              >
                {/* Active Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}

                {/* Theme Mini Board Preview */}
                <div className="w-full h-12 rounded-lg overflow-hidden border border-white/10 grid grid-cols-4 grid-rows-2">
                  <div className={t.lightSquare} />
                  <div className={t.darkSquare} />
                  <div className={t.lightSquare} />
                  <div className={t.darkSquare} />
                  <div className={t.darkSquare} />
                  <div className={t.lightSquare} />
                  <div className={t.darkSquare} />
                  <div className={t.lightSquare} />
                </div>

                {/* Name & Tagline */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                  </span>
                  <span className="text-[10px] text-stone-400 leading-tight mt-0.5">
                    {t.tagline}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
          >
            Apply & Play
          </button>
        </div>

      </div>
    </div>
  );
};
