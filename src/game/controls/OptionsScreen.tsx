import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { SpaceBackground } from '../../components/ui/SpaceBackground';
import { GhostButton } from '../../components/ui/GhostButton';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TacticalFrame } from '../../components/ui/TacticalFrame';
import { AudioSettingsPanel } from '../ui/AudioSettingsPanel';
import {
  ALL_KEYBIND_ACTIONS,
  DEFAULT_KEYBINDS,
  KEYBIND_META,
  type KeybindAction,
  eventToBindKey,
  formatKeyDisplay,
  keybindsByCategory,
  loadKeybinds,
  saveKeybinds,
} from '../settings/keybinds';

export type OptionsTab = 'controls' | 'audio' | 'mobile';

interface OptionsScreenProps {
  onBack: () => void;
  showMobileSection: boolean;
  sfxVolume: number;
  sfxMuted: boolean;
  musicVolume: number;
  musicMuted: boolean;
  mobileLayout: 'LEFT_HANDED' | 'RIGHT_HANDED';
  joystickDeadZone: number;
  hapticsEnabled: boolean;
  onSfxVolume: (v: number) => void;
  onSfxMuted: (v: boolean) => void;
  onMusicVolume: (v: number) => void;
  onMusicMuted: (v: boolean) => void;
  onMobileLayout: (left: boolean) => void;
  onJoystickDeadZone: (v: number) => void;
  onHapticsEnabled: (v: boolean) => void;
  onKeybindsChange?: (binds: Record<KeybindAction, string>) => void;
}

const CLIP = 'polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px)';

function KeybindRow({
  action,
  value,
  listening,
  onStartListen,
}: {
  action: KeybindAction;
  value: string;
  listening: boolean;
  onStartListen: () => void;
}) {
  const meta = KEYBIND_META[action];
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-white/[0.06] last:border-0"
      style={{ clipPath: CLIP }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-xs uppercase tracking-wider text-[#f0f8ff]">
          {meta.label}
        </p>
        <p className="font-mono text-[9px] text-white/35 mt-0.5 truncate">{meta.hint}</p>
      </div>
      <button
        type="button"
        onClick={onStartListen}
        className="min-h-touch min-w-[88px] px-3 font-mono font-bold text-xs uppercase tracking-widest transition-all"
        style={{
          clipPath: CLIP,
          background: listening ? 'rgba(232,184,74,0.2)' : 'rgba(0,229,255,0.08)',
          border: `1px solid ${listening ? 'rgba(232,184,74,0.7)' : 'rgba(0,229,255,0.35)'}`,
          color: listening ? '#e8b84a' : '#00e5ff',
          boxShadow: listening ? '0 0 20px rgba(232,184,74,0.25)' : 'none',
        }}
      >
        {listening ? '…' : formatKeyDisplay(value)}
      </button>
    </div>
  );
}

export function OptionsScreen({
  onBack,
  showMobileSection,
  sfxVolume,
  sfxMuted,
  musicVolume,
  musicMuted,
  mobileLayout,
  joystickDeadZone,
  hapticsEnabled,
  onSfxVolume,
  onSfxMuted,
  onMusicVolume,
  onMusicMuted,
  onMobileLayout,
  onJoystickDeadZone,
  onHapticsEnabled,
  onKeybindsChange,
}: OptionsScreenProps) {
  const [tab, setTab] = useState<OptionsTab>('controls');
  const [binds, setBinds] = useState(loadKeybinds);
  const [listening, setListening] = useState<KeybindAction | null>(null);

  const persistBinds = useCallback(
    (next: Record<KeybindAction, string>) => {
      setBinds(next);
      saveKeybinds(next);
      onKeybindsChange?.(next);
    },
    [onKeybindsChange],
  );

  useEffect(() => {
    if (!listening) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setListening(null);
        return;
      }
      const key = eventToBindKey(e);
      if (!key) return;
      const next = { ...binds, [listening]: key };
      persistBinds(next);
      setListening(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, binds, persistBinds]);

  const resetKeybinds = () => {
    persistBinds({ ...DEFAULT_KEYBINDS });
  };

  const tabs: { id: OptionsTab; label: string }[] = [
    { id: 'controls', label: 'Controls' },
    { id: 'audio', label: 'Audio' },
    ...(showMobileSection ? [{ id: 'mobile' as const, label: 'Touch' }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[620] overflow-hidden flex flex-col pointer-events-auto"
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(0,229,255,0.1) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 90% 80%, rgba(139,43,226,0.08) 0%, transparent 60%), var(--bg-void)',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
    >
      <SpaceBackground scanlines />
      <div className="absolute inset-0 nebula-layer nebula-layer-animate pointer-events-none opacity-70" />

      <div className="relative z-10 flex flex-col flex-1 max-w-2xl mx-auto w-full min-h-0 p-4 sm:p-6">
        <header className="flex flex-wrap items-center justify-between gap-4 shrink-0 mb-4">
          <div>
            <p className="hud-micro-label mb-1">System Config</p>
            <h1
              className="font-display font-black tracking-[0.12em] text-white uppercase"
              style={{
                fontSize: 'clamp(1.35rem, 4vw, 1.85rem)',
                textShadow: '0 0 48px rgba(0,229,255,0.35)',
              }}
            >
              Options
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-400/55 mt-1.5">
              Keybinds · audio · touch
            </p>
          </div>
          <GhostButton onClick={onBack} className="!w-auto min-h-touch px-6 shrink-0">
            Back
          </GhostButton>
        </header>

        <div
          className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4 shrink-0"
          role="tablist"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="hud-tab-btn"
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
          {tab === 'controls' && (
            <div className="space-y-4">
              <TacticalFrame size="sm" glow className="p-4">
                <p className="hud-micro-label mb-2">Primary fire</p>
                <p className="font-mono text-[11px] text-white/55 leading-relaxed">
                  Aim with mouse or right stick · hold{' '}
                  <span className="text-cyan-400">left click</span> / touch fire button to shoot.
                  Dash key only applies in survival mode.
                </p>
              </TacticalFrame>

              {keybindsByCategory().map((group) => (
                <TacticalFrame key={group.category} size="sm" className="p-4">
                  <p className="hud-micro-label mb-3">{group.category}</p>
                  {group.actions.map((action) => (
                    <KeybindRow
                      key={action}
                      action={action}
                      value={binds[action]}
                      listening={listening === action}
                      onStartListen={() => setListening(action)}
                    />
                  ))}
                </TacticalFrame>
              ))}

              <button
                type="button"
                onClick={resetKeybinds}
                className="w-full min-h-touch flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/45 hover:text-cyan-300 transition-colors"
              >
                <RotateCcw size={14} />
                Reset controls to default
              </button>
            </div>
          )}

          {tab === 'audio' && (
            <div className="space-y-4">
            <AudioSettingsPanel />
            <TacticalFrame size="md" glow className="p-5 space-y-5">
              <div>
                <label className="hud-micro-label">SFX volume</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(sfxVolume * 100)}
                  onChange={(e) => onSfxVolume(Number(e.target.value) / 100)}
                  className="w-full mt-2 accent-cyan-400"
                />
                <label className="mt-3 flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sfxMuted}
                    onChange={(e) => onSfxMuted(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  Mute SFX
                </label>
              </div>
              <div className="pt-2 border-t border-white/10">
                <label className="hud-micro-label">Music volume</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(musicVolume * 100)}
                  onChange={(e) => onMusicVolume(Number(e.target.value) / 100)}
                  className="w-full mt-2 accent-fuchsia-500"
                />
                <label className="mt-3 flex items-center gap-2 text-sm text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={musicMuted}
                    onChange={(e) => onMusicMuted(e.target.checked)}
                    className="accent-fuchsia-500"
                  />
                  Mute music
                </label>
              </div>
            </TacticalFrame>
            </div>
          )}

          {tab === 'mobile' && showMobileSection && (
            <TacticalFrame size="md" className="p-5 space-y-4">
              <label className="flex items-center gap-3 text-sm text-white/85 cursor-pointer min-h-touch">
                <input
                  type="checkbox"
                  checked={mobileLayout === 'LEFT_HANDED'}
                  onChange={(e) => onMobileLayout(e.target.checked)}
                  className="accent-cyan-500"
                />
                Left-handed layout
              </label>
              <label className="flex items-center gap-3 text-sm text-white/85 cursor-pointer min-h-touch">
                <input
                  type="checkbox"
                  checked={hapticsEnabled}
                  onChange={(e) => onHapticsEnabled(e.target.checked)}
                  className="accent-cyan-500"
                />
                Haptic feedback
              </label>
              <div>
                <p className="text-sm text-white/70">
                  Joystick dead zone: {joystickDeadZone.toFixed(2)}
                </p>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={joystickDeadZone}
                  onChange={(e) => onJoystickDeadZone(Number(e.target.value))}
                  className="w-full mt-2 accent-cyan-500"
                />
              </div>
            </TacticalFrame>
          )}
        </div>

        <div className="shrink-0 pt-4">
          <PrimaryButton onClick={onBack} variant="accent">
            Done
          </PrimaryButton>
        </div>
      </div>
    </motion.div>
  );
}
