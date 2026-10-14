export type ThemeId = 'walnut' | 'neon' | 'emerald' | 'cosmic';

export interface BoardTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  icon: string;
  lightSquare: string;
  darkSquare: string;
  darkSquareHover: string;
  frameBg: string;
  frameBorder: string;
  boardBorder: string;
  redPieceBg: string;
  redPieceBorder: string;
  redCrownColor: string;
  blackPieceBg: string;
  blackPieceBorder: string;
  blackCrownColor: string;
  accentColor: string;
  appBackground: string;
}

export const BOARD_THEMES: Record<ThemeId, BoardTheme> = {
  walnut: {
    id: 'walnut',
    name: 'Royal Walnut',
    tagline: 'Classic parlor luxury wood',
    icon: '🍂',
    lightSquare: 'bg-[#e5caa3]',
    darkSquare: 'bg-[#53321b]',
    darkSquareHover: 'active:bg-[#683f23]',
    frameBg: 'from-stone-800 via-stone-900 to-stone-950',
    frameBorder: 'border-stone-750',
    boardBorder: 'border-amber-950/70',
    redPieceBg: 'from-rose-500 via-rose-600 to-rose-950',
    redPieceBorder: 'border-rose-300/80',
    redCrownColor: 'text-amber-300 fill-amber-300',
    blackPieceBg: 'from-stone-600 via-stone-800 to-stone-950',
    blackPieceBorder: 'border-stone-500/80',
    blackCrownColor: 'text-stone-200 fill-stone-200',
    accentColor: 'text-amber-400',
    appBackground: 'bg-stone-950',
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    tagline: 'Electric synth arcade glow',
    icon: '⚡',
    lightSquare: 'bg-slate-800',
    darkSquare: 'bg-slate-950',
    darkSquareHover: 'active:bg-slate-900',
    frameBg: 'from-slate-900 via-purple-950 to-slate-950',
    frameBorder: 'border-cyan-500/40 shadow-cyan-950/40',
    boardBorder: 'border-cyan-500/50',
    redPieceBg: 'from-fuchsia-500 via-pink-600 to-purple-950',
    redPieceBorder: 'border-pink-300 shadow-pink-500/50',
    redCrownColor: 'text-yellow-300 fill-yellow-300',
    blackPieceBg: 'from-cyan-400 via-teal-600 to-slate-950',
    blackPieceBorder: 'border-cyan-200 shadow-cyan-500/50',
    blackCrownColor: 'text-cyan-200 fill-cyan-200',
    accentColor: 'text-cyan-400',
    appBackground: 'bg-slate-950',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Casino',
    tagline: 'Grand championship felt',
    icon: '🌿',
    lightSquare: 'bg-[#e2ead8]',
    darkSquare: 'bg-[#1b4332]',
    darkSquareHover: 'active:bg-[#2d6a4f]',
    frameBg: 'from-emerald-950 via-stone-900 to-stone-950',
    frameBorder: 'border-emerald-600/40',
    boardBorder: 'border-emerald-900',
    redPieceBg: 'from-amber-500 via-amber-600 to-amber-950',
    redPieceBorder: 'border-amber-300/90',
    redCrownColor: 'text-stone-950 fill-stone-950',
    blackPieceBg: 'from-emerald-700 via-emerald-900 to-stone-950',
    blackPieceBorder: 'border-emerald-400/80',
    blackCrownColor: 'text-amber-300 fill-amber-300',
    accentColor: 'text-emerald-400',
    appBackground: 'bg-stone-950',
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Galaxy',
    tagline: 'Deep space nebular duel',
    icon: '🌌',
    lightSquare: 'bg-slate-850',
    darkSquare: 'bg-indigo-950',
    darkSquareHover: 'active:bg-indigo-900',
    frameBg: 'from-indigo-950 via-slate-950 to-purple-950',
    frameBorder: 'border-indigo-500/40',
    boardBorder: 'border-purple-900',
    redPieceBg: 'from-violet-500 via-purple-600 to-indigo-950',
    redPieceBorder: 'border-violet-300',
    redCrownColor: 'text-amber-300 fill-amber-300',
    blackPieceBg: 'from-blue-600 via-blue-900 to-slate-950',
    blackPieceBorder: 'border-sky-300',
    blackCrownColor: 'text-sky-200 fill-sky-200',
    accentColor: 'text-violet-400',
    appBackground: 'bg-slate-950',
  },
};
