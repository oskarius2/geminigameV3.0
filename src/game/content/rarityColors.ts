import { BuffRarity } from '../types';

export const RARITY_COLORS: Record<BuffRarity, { text: string; bg: string; border: string }> = {
  [BuffRarity.COMMON]:    { text: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-500/40'  },
  [BuffRarity.RARE]:      { text: 'text-blue-400',   bg: 'bg-blue-900/20',   border: 'border-blue-500/50'   },
  [BuffRarity.EPIC]:      { text: 'text-purple-400', bg: 'bg-purple-900/20', border: 'border-purple-500/60' },
  [BuffRarity.LEGENDARY]: { text: 'text-amber-400',  bg: 'bg-amber-900/20',  border: 'border-amber-400/70'  },
  [BuffRarity.EXCLUSIVE]: { text: 'text-cyan-400',   bg: 'bg-cyan-900/20',   border: 'border-cyan-400/70'   },
};
