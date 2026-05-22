import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface CompanionAbilityNotification {
  companionId: string;
  abilityName: string;
  id: string;
}

interface CompanionAbilityToastProps {
  notifications: CompanionAbilityNotification[];
  onDismiss: (id: string) => void;
}

const ABILITY_COLORS: Record<string, string> = {
  'Speed Aura': '#00ff00',
  'Enemy Radar': '#00d4ff',
  'Threat Mark': '#ff006e',
  'Scanner Pulse': '#00ff88',
  'Evasion Burst': '#ffd60a',
  'Damage Absorb': '#a78bfa',
  Taunt: '#ff6b6b',
  Regen: '#10b981',
  'Gunner Fire': '#fbbf24',
  'Focused Burst': '#fbbf24',
  'Triage Pulse': '#10b981',
  'Threat Assessment': '#ff006e',
};

export function CompanionAbilityToastStack({
  notifications,
  onDismiss,
}: CompanionAbilityToastProps) {
  const active = notifications[0];

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => onDismiss(active.id), 2000);
    return () => window.clearTimeout(t);
  }, [active?.id, onDismiss]);

  const abilityColor = active
    ? ABILITY_COLORS[active.abilityName] ?? '#00ff00'
    : '#00ff00';

  return (
    <AnimatePresence mode="wait">
      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 -translate-x-1/2 pointer-events-none z-[650]"
          style={{
            top: '50%',
            marginTop: '60px',
          }}
        >
          <div
            className="absolute rounded-full opacity-40 blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${abilityColor}44, transparent 70%)`,
              width: '200px',
              height: '80px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div
            className="relative px-6 py-3 rounded-lg border backdrop-blur-md font-mono font-bold uppercase tracking-wider text-center text-sm"
            style={{
              color: abilityColor,
              borderColor: `${abilityColor}88`,
              backgroundColor: `${abilityColor}11`,
              boxShadow: `0 0 24px ${abilityColor}44, inset 0 0 12px ${abilityColor}18`,
              textShadow: `0 0 12px ${abilityColor}66`,
              zIndex: 10,
            }}
          >
            {active.abilityName}
          </div>

          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: '-20px',
                marginTop: '-20px',
                border: `1px solid ${abilityColor}`,
                opacity: 0.3,
                width: 40,
                height: 40,
              }}
              animate={{
                width: [40, 120],
                height: [40, 120],
                marginLeft: [-20, -60],
                marginTop: [-20, -60],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.2,
                repeat: Infinity,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
