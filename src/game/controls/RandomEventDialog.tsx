import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameIcon } from '../../components/icons';
import { HudCorner } from '../../components/ui/SpaceBackground';
import { RandomEvent } from '../types';

interface RandomEventDialogProps {
  event: RandomEvent | null;
  onChoice: (choiceId: string) => void;
}

export const RandomEventDialog: React.FC<RandomEventDialogProps> = ({ event, onChoice }) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-6"
        style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(16px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative max-w-lg w-full rounded-2xl p-8 shadow-2xl overflow-hidden"
          style={{
            background: 'rgba(15,23,42,0.75)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(6,182,212,0.2)',
            boxShadow: 'inset 0 0 20px rgba(6,182,212,0.04), 0 8px 64px rgba(0,0,0,0.7)',
          }}
        >
          <HudCorner position="tl" />
          <HudCorner position="tr" />
          <HudCorner position="bl" />
          <HudCorner position="br" />
          {/* Grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage: 'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4 text-cyan-400">
              <div
                className="p-3 rounded-xl"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)' }}
              >
                <GameIcon name="ui.alert" size={32} color="#fbbf24" glow />
              </div>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Incoming Transmission</h2>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">Emergency Event ID: {event.id}</span>
                </div>
              </div>
            </div>

            <h3 className="text-4xl font-black text-white italic mb-4 uppercase tracking-tighter leading-none">{event.title}</h3>
            
            <div
              className="p-4 rounded-xl mb-8"
              style={{
                background: 'rgba(6,182,212,0.04)',
                border: '1px solid rgba(6,182,212,0.12)',
              }}
            >
              <p className="text-white/60 text-base leading-relaxed font-medium italic">
                "{event.description}"
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {event.options.map((option, idx) => (
                <button
                  key={option.id}
                  onClick={() => onChoice(option.id)}
                  className="group relative flex flex-col items-start text-left p-4 rounded-xl transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(6,182,212,0.06)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,182,212,0.3)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="font-mono text-[10px] text-cyan-400/50 tracking-[0.2em]">0{idx + 1}</span>
                    <span className="font-display font-semibold text-white uppercase tracking-wider text-sm">{option.label}</span>
                    <div className="flex-1" />
                    <div className="h-px w-12 bg-cyan-400/20 group-hover:bg-cyan-400/50 transition-colors" />
                  </div>
                  <p className="text-white/40 text-sm mt-1.5 leading-snug group-hover:text-cyan-200/60 transition-colors">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-between items-center opacity-40">
              <div className="flex gap-1">
                 {[...Array(5)].map((_, i) => <div key={i} className="w-8 h-1 bg-white/20" />)}
              </div>
              <span className="text-[10px] font-mono text-white tracking-[0.3em] uppercase">Status: Decision Pending</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
