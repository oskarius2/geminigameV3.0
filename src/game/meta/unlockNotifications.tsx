import React, { useEffect } from 'react';

import { motion, AnimatePresence } from 'motion/react';

import { GameIcon, getCompanionIconName } from '../../components/icons';

import { ARTIFACTS } from '../content/artifacts';

import { HUD_RARITY_HEX } from '../hud/hudTokens';

import { getCompanionDef } from '../companions/companionDefs';

import type { CompanionId } from '../types';

import { BuffRarity } from '../types';



export type UnlockToast =

  | { type: 'artifact'; artifactId: string }

  | { type: 'companion'; companionId: CompanionId }

  | { type: 'personal_best'; metric: 'score' | 'time'; previous: number; current: number };



const MAX_VISIBLE_TOASTS = 3;



interface UnlockToastStackProps {

  toasts: UnlockToast[];

  onDismiss: (index: number) => void;

}



function rarityBadgeClass(rarity: BuffRarity): string {

  const map: Record<BuffRarity, string> = {

    [BuffRarity.COMMON]: 'ui-rarity-badge--common',

    [BuffRarity.RARE]: 'ui-rarity-badge--rare',

    [BuffRarity.EPIC]: 'ui-rarity-badge--epic',

    [BuffRarity.LEGENDARY]: 'ui-rarity-badge--legendary',

    [BuffRarity.EXCLUSIVE]: 'ui-rarity-badge--exclusive',

    [BuffRarity.MYSTERY]: 'ui-rarity-badge--mystery',

  };

  return `ui-rarity-badge ${map[rarity] ?? 'ui-rarity-badge--common'}`;

}



export function UnlockToastStack({ toasts, onDismiss }: UnlockToastStackProps) {

  const visible = toasts.slice(0, MAX_VISIBLE_TOASTS);



  useEffect(() => {

    if (toasts.length === 0) return;

    const t = window.setTimeout(() => onDismiss(0), 3000);

    return () => window.clearTimeout(t);

  }, [toasts.length, onDismiss]);



  return (

    <div className="ui-achievement-panel pointer-events-none w-full">

      <p className="ui-achievement-header">Achievements unlocked</p>

      <div className="flex flex-col">

        <AnimatePresence mode="popLayout">

          {visible.map((toast, i) => (

            <motion.div

              key={`${toast.type}-${i}-${'artifactId' in toast ? toast.artifactId : 'companionId' in toast ? toast.companionId : toast.metric}`}

              layout

              initial={{ opacity: 0, y: 8 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -6 }}

              transition={{ duration: 0.25, ease: 'easeOut' }}

              className="ui-achievement-card"

            >

              {toast.type === 'artifact' && <ArtifactUnlockToast artifactId={toast.artifactId} />}

              {toast.type === 'companion' && <CompanionUnlockToast companionId={toast.companionId} />}

              {toast.type === 'personal_best' && (

                <PersonalBestToast

                  metric={toast.metric}

                  previous={toast.previous}

                  current={toast.current}

                />

              )}

            </motion.div>

          ))}

        </AnimatePresence>

      </div>

    </div>

  );

}



function ArtifactUnlockToast({ artifactId }: { artifactId: string }) {

  const art = ARTIFACTS[artifactId];

  if (!art) return null;

  const color = HUD_RARITY_HEX[art.rarity] ?? '#00d4ff';

  return (

    <>

      <div className="ui-achievement-icon" style={{ borderColor: `${color}55`, boxShadow: `0 0 20px ${color}44` }}>

        <GameIcon name="ui.relic" size={28} color={color} glow />

      </div>

      <div className="min-w-0 flex-1">

        <p className="ui-achievement-kicker">New artifact unlocked</p>

        <p className="ui-achievement-title mt-1" style={{ color }}>

          {art.name}

        </p>

        <span className={rarityBadgeClass(art.rarity)}>{art.rarity}</span>

        <p className="ui-achievement-desc line-clamp-2">{art.description}</p>

      </div>

    </>

  );

}



function CompanionUnlockToast({ companionId }: { companionId: CompanionId }) {

  const def = getCompanionDef(companionId);

  if (!def) return null;

  const color = '#a78bfa';

  return (

    <>

      <div className="ui-achievement-icon" style={{ borderColor: `${color}55`, boxShadow: `0 0 20px ${color}44` }}>

        <GameIcon name={getCompanionIconName(companionId)} size={28} color={color} glow />

      </div>

      <div className="min-w-0 flex-1">

        <p className="ui-achievement-kicker" style={{ color }}>

          New companion unlocked

        </p>

        <p className="ui-achievement-title mt-1 text-[#fbbf24]" style={{ textShadow: 'var(--ui-text-gold-neon)' }}>

          {def.name}

        </p>

        <p className="ui-achievement-desc">{def.description}</p>

      </div>

    </>

  );

}



function PersonalBestToast({

  metric,

  previous,

  current,

}: {

  metric: 'score' | 'time';

  previous: number;

  current: number;

}) {

  const label = metric === 'score' ? 'High score' : 'Longest run';

  const fmt = (v: number) =>

    metric === 'score' ? v.toLocaleString() : formatTime(v);

  return (

    <>

      <div className="ui-achievement-icon" style={{ borderColor: 'rgba(251,191,36,0.45)', boxShadow: '0 0 20px rgba(251,191,36,0.25)' }}>

        <GameIcon name="ui.trophy" size={28} color="#fbbf24" glow />

      </div>

      <div className="min-w-0 flex-1">

        <p className="ui-achievement-kicker text-amber-300/90">New personal best</p>

        <p className="ui-achievement-title mt-1 text-[#fbbf24]" style={{ textShadow: 'var(--ui-text-gold-neon)' }}>

          {label}

        </p>

        <p className="ui-achievement-desc font-mono text-sm">

          {fmt(previous)} → <span className="text-emerald-400" style={{ textShadow: '0 0 8px rgba(16,185,129,0.5)' }}>{fmt(current)}</span>

        </p>

      </div>

    </>

  );

}



function formatTime(seconds: number): string {

  const m = Math.floor(seconds / 60);

  const s = Math.floor(seconds % 60);

  return `${m}:${s.toString().padStart(2, '0')}`;

}



export function buildArtifactUnlockToast(artifactId: string): UnlockToast {

  return { type: 'artifact', artifactId };

}



export function buildCompanionUnlockToast(companionId: CompanionId): UnlockToast {

  return { type: 'companion', companionId };

}



export function buildPersonalBestToast(

  metric: 'score' | 'time',

  previous: number,

  current: number,

): UnlockToast {

  return { type: 'personal_best', metric, previous, current };

}

