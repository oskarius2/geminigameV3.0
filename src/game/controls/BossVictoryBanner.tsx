import React from 'react';
import { BossVisuals } from '../../components/BossVisuals';
import { getBossSpec, getBossVictoryLine } from '../bosses/bossSpecs';

interface BossVictoryBannerProps {
  bossId: string | null;
  timer: number;
}

export const BossVictoryBanner: React.FC<BossVictoryBannerProps> = ({ bossId, timer }) => {
  if (!bossId || timer <= 0) return null;

  const spec = getBossSpec(bossId);
  const line = getBossVictoryLine(bossId) ?? 'Boss defeated.';
  const opacity = Math.min(1, timer / 30);

  return (
    <div
      className="absolute inset-x-0 top-[18%] z-[90] pointer-events-none flex flex-col items-center px-4"
      style={{ opacity }}
    >
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-black/80 border border-emerald-500/40 backdrop-blur-md max-w-lg">
        <BossVisuals
          visualId={spec?.visualId ?? bossId}
          attackPattern={spec?.attackPattern}
          size={72}
        />
        <div className="text-left min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-400/90">
            Boss down
          </p>
          <p className="text-sm text-white/90 font-mono leading-snug">{line}</p>
        </div>
      </div>
    </div>
  );
};
