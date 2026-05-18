import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Cpu, Fuel, Ghost } from 'lucide-react';
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
        className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative max-w-lg w-full bg-[#151619] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden"
        >
          {/* Hardware grid background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4 text-cyan-400">
              <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
                <AlertTriangle size={32} />
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
            
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl mb-8">
               <p className="text-gray-400 text-lg leading-relaxed font-medium italic">
                 "{event.description}"
               </p>
            </div>

            <div className="flex flex-col gap-4">
              {event.options.map((option, idx) => (
                <button
                  key={option.id}
                  onClick={() => onChoice(option.id)}
                  className="group relative flex flex-col items-start text-left p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-500/50 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="text-cyan-400/50 font-mono text-xs">0{idx + 1}</span>
                    <span className="font-bold text-white uppercase tracking-tight">{option.label}</span>
                    <div className="flex-1" />
                    <div className="h-1 w-12 bg-white/5 group-hover:bg-cyan-500/30 transition-colors" />
                  </div>
                  <p className="text-gray-500 text-sm mt-1 group-hover:text-cyan-200/70 transition-colors">
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
