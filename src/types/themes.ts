export type ThemeId = 'walnut' | 'mahogany' | 'oak' | 'championship';

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
  brassAccent: string;
  redPieceBg: string;
  redPieceBorder: string;
  redCrownColor: string;
  blackPieceBg: string;
  blackPieceBorder: string;
  blackCrownColor: string;
  accentColor: string;
  appBackground: string;
  tableSurface: string;
}

export const BOARD_THEMES: Record<ThemeId, BoardTheme> = {
  walnut: {
    id: 'walnut',
    name: 'Royal Walnut & Maple',
    tagline: 'Classic parlor luxury hardwood with brass inlays',
    icon: '🍂',
    lightSquare: 'bg-[#ebd8bd] text-[#5c3c21]',
    darkSquare: 'bg-[#5a361e] text-[#ebd8bd]',
    darkSquareHover: 'hover:bg-[#683f23]',
    frameBg: 'from-[#2e1d13] via-[#3a2518] to-[#20140d]',
    frameBorder: 'border-[#5a3b25]',
    boardBorder: 'border-[#4a2e1b]',
    brassAccent: '#d4af37',
    redPieceBg: 'from-[#c2362b] via-[#991b1b] to-[#591010]',
    redPieceBorder: 'border-[#fca5a5]/80',
    redCrownColor: 'text-[#ffd700] fill-[#ffd700]',
    blackPieceBg: 'from-[#38332f] via-[#221e1b] to-[#12100e]',
    blackPieceBorder: 'border-[#78716c]/70',
    blackCrownColor: 'text-[#f5d77f] fill-[#f5d77f]',
    accentColor: 'text-amber-400',
    appBackground: 'bg-[#181310]',
    tableSurface: 'bg-gradient-to-b from-[#1c1613] via-[#140f0c] to-[#0d0a08]',
  },
  mahogany: {
    id: 'mahogany',
    name: 'Antique Mahogany & Birch',
    tagline: 'Warm red-mahogany with fine satin lacquer',
    icon: '🪵',
    lightSquare: 'bg-[#f0e2d0] text-[#54211a]',
    darkSquare: 'bg-[#6b251d] text-[#f0e2d0]',
    darkSquareHover: 'hover:bg-[#7e2d24]',
    frameBg: 'from-[#381512] via-[#451b17] to-[#260e0c]',
    frameBorder: 'border-[#6e2b23]',
    boardBorder: 'border-[#4d1d17]',
    brassAccent: '#e6be65',
    redPieceBg: 'from-[#d94436] via-[#a82218] to-[#63140e]',
    redPieceBorder: 'border-[#fecaca]/80',
    redCrownColor: 'text-[#ffe066] fill-[#ffe066]',
    blackPieceBg: 'from-[#2b2726] via-[#1a1716] to-[#0c0a0a]',
    blackPieceBorder: 'border-[#736b69]/70',
    blackCrownColor: 'text-[#e6c875] fill-[#e6c875]',
    accentColor: 'text-amber-500',
    appBackground: 'bg-[#170e0d]',
    tableSurface: 'bg-gradient-to-b from-[#1a100f] via-[#130c0b] to-[#0a0606]',
  },
  oak: {
    id: 'oak',
    name: 'Heritage Golden Oak',
    tagline: 'Warm golden oak grain with roasted chestnut squares',
    icon: '🍯',
    lightSquare: 'bg-[#eddcb9] text-[#593d1f]',
    darkSquare: 'bg-[#6e4624] text-[#eddcb9]',
    darkSquareHover: 'hover:bg-[#80522b]',
    frameBg: 'from-[#3d2715] via-[#4a301b] to-[#2a1a0d]',
    frameBorder: 'border-[#734c2a]',
    boardBorder: 'border-[#54361c]',
    brassAccent: '#c99e32',
    redPieceBg: 'from-[#bf360c] via-[#872506] to-[#4e1402]',
    redPieceBorder: 'border-[#ffab91]/80',
    redCrownColor: 'text-[#ffecb3] fill-[#ffecb3]',
    blackPieceBg: 'from-[#374151] via-[#1f2937] to-[#111827]',
    blackPieceBorder: 'border-[#9ca3af]/70',
    blackCrownColor: 'text-[#fef3c7] fill-[#fef3c7]',
    accentColor: 'text-amber-400',
    appBackground: 'bg-[#15120e]',
    tableSurface: 'bg-gradient-to-b from-[#1c1712] via-[#14100c] to-[#0a0806]',
  },
  championship: {
    id: 'championship',
    name: 'Grand Championship Baize',
    tagline: 'Forest green tournament felt & maple',
    icon: '🏆',
    lightSquare: 'bg-[#f4efe6] text-[#143d2c]',
    darkSquare: 'bg-[#194d38] text-[#f4efe6]',
    darkSquareHover: 'hover:bg-[#205e45]',
    frameBg: 'from-[#222922] via-[#2c352c] to-[#161a16]',
    frameBorder: 'border-[#3f4d3f]',
    boardBorder: 'border-[#2d372d]',
    brassAccent: '#d4af37',
    redPieceBg: 'from-[#c53030] via-[#9b1c1c] to-[#551010]',
    redPieceBorder: 'border-[#fca5a5]/80',
    redCrownColor: 'text-[#ffd700] fill-[#ffd700]',
    blackPieceBg: 'from-[#2d3748] via-[#1a202c] to-[#0f141c]',
    blackPieceBorder: 'border-[#a0aec0]/70',
    blackCrownColor: 'text-[#ecc94b] fill-[#ecc94b]',
    accentColor: 'text-emerald-400',
    appBackground: 'bg-[#101412]',
    tableSurface: 'bg-gradient-to-b from-[#141a16] via-[#0f1411] to-[#090d0b]',
  },
};
