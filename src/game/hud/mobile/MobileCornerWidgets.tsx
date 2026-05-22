import React from 'react';
import { GameIcon, getShipIconName } from '../../../components/icons';
import { getThreatTier, getThreatVisualConfig } from '../../balance/threat';
import { getCompanionDef } from '../../companions/companionDefs';
import { HUD_COLORS } from '../hudTokens';
import type { ShipDef } from '../../ships/shipDefs';
import type { CompanionId, GameState } from '../../types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function tierLabel(level: number): string {
  const tier = getThreatTier(level);
  if (tier === 'calm') return 'CALM';
  if (tier === 'pressure') return 'PRESSURE';
  if (tier === 'danger') return 'DANGER';
  return 'CRITICAL';
}

export function MobileShipCorner({
  ship,
  playerHP,
  playerMaxHP,
}: {
  ship: ShipDef;
  playerHP: number;
  playerMaxHP: number;
}) {
  const hpPct = playerMaxHP > 0 ? Math.max(0, Math.min(100, (playerHP / playerMaxHP) * 100)) : 0;
  const lowHp = hpPct < 25;
  const midHp = !lowHp && hpPct < 55;
  const hpGlowClass = lowHp
    ? 'mobile-ship-corner__hp-fill--low'
    : midHp
      ? 'mobile-ship-corner__hp-fill--mid'
      : '';

  return (
    <div className="mobile-hud-card mobile-ship-corner">
      <div className="mobile-ship-corner__row">
        <div
          className="mobile-ship-corner__icon"
          style={{
            backgroundColor: `${ship.color}22`,
            borderColor: `${ship.color}55`,
          }}
        >
          <GameIcon
            name={getShipIconName(ship.id)}
            size={22}
            color={ship.color}
            glow
          />
        </div>
        <span className="mobile-ship-corner__name">{ship.name}</span>
      </div>
      <div className="mobile-ship-corner__hp-track">
        <div
          className={`mobile-ship-corner__hp-fill ${hpGlowClass}`}
          style={{
            width: `${hpPct}%`,
            background: lowHp
              ? `linear-gradient(90deg, ${HUD_COLORS.danger}, #ef4444)`
              : midHp
                ? `linear-gradient(90deg, #f97316, ${HUD_COLORS.accent})`
                : `linear-gradient(90deg, ${HUD_COLORS.success}, ${HUD_COLORS.accent})`,
          }}
        />
      </div>
    </div>
  );
}

export function MobileCompanionMini({
  companionId,
  level,
  abilityReady,
}: {
  companionId: CompanionId;
  level: number;
  abilityReady: boolean;
}) {
  const def = getCompanionDef(companionId);
  if (!def) return null;

  return (
    <div className="mobile-hud-card mobile-companion-mini">
      <span className="truncate">{def.name.split(' ')[0]}</span>
      <span className="mobile-companion-mini__lvl">Lv{level}</span>
      {abilityReady && <span className="mobile-companion-mini__ready" aria-label="Ability ready" />}
    </div>
  );
}

export function MobileScoreCorner({
  score,
  survivalTime,
  stage,
  enemiesToKill,
  stageTransition,
  bossArenaTransition,
  bossActive,
  gameMode,
  survivalDifficultyLabel,
  onOpenMenu,
}: {
  score: number;
  survivalTime: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  bossArenaTransition: number;
  bossActive: boolean;
  gameMode: string;
  survivalDifficultyLabel?: string;
  onOpenMenu?: () => void;
}) {
  const stageLine =
    gameMode === 'NORMAL' || gameMode === 'CAMPAIGN'
      ? `STAGE ${stage}${bossArenaTransition > 0 ? ' · ARENA' : stageTransition > 0 ? ' · CLEAR' : enemiesToKill > 0 ? ` · ${enemiesToKill} LEFT` : bossActive ? ' · BOSS' : ''}`
      : '';

  return (
    <div className="mobile-hud-card mobile-score-corner">
      <button
        type="button"
        className="mobile-score-corner__menu pointer-events-auto"
        aria-label="Pausmeny"
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenu?.();
        }}
      >
        <GameIcon name="ui.menu" size={14} color="var(--primitive-color-cyan, #00e5ff)" />
      </button>
      <p className="mobile-score-corner__label">Score</p>
      <p className="mobile-score-corner__value">{score.toLocaleString()}</p>
      <p className="mobile-score-corner__meta">{formatTime(survivalTime)}</p>
      {stageLine ? <p className="mobile-score-corner__stage">{stageLine}</p> : null}
      {gameMode === 'NORMAL' && survivalDifficultyLabel ? (
        <p className="mobile-score-corner__stage">{survivalDifficultyLabel}</p>
      ) : null}
    </div>
  );
}

export function MobileThreatCorner({ state }: { state: GameState }) {
  const level = state.threatLevel ?? 0;
  const tier = getThreatTier(level);
  const { hudColor } = getThreatVisualConfig(tier);
  const fill = Math.min(100, Math.max(0, level));

  const critical = tier === 'critical' || tier === 'danger';

  return (
    <div className={`mobile-threat-corner${critical ? ' mobile-threat-corner--critical' : ''}`}>
      <p className="mobile-threat-corner__tier" style={{ color: hudColor }}>
        {tierLabel(level)}
      </p>
      <div className="mobile-threat-corner__track">
        <div
          className="mobile-threat-corner__fill"
          style={{
            width: `${fill}%`,
            background: `linear-gradient(90deg, ${hudColor}88, ${hudColor})`,
          }}
        />
      </div>
    </div>
  );
}

export { MobileBottomDock } from './MobileBottomDock';
