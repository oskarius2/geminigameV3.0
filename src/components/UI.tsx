import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Swords, Target, Crosshair, Sparkles } from 'lucide-react';

export function HUD({ state, onSwitchWeapon }: any) {
  const hpPct = Math.max(0, (state.player.health / state.player.maxHealth) * 100);
  const epPct = Math.max(0, (state.player.energy / state.player.maxEnergy) * 100);
  const xpPct = Math.max(0, (state.player.exp / state.player.nextExp) * 100);

  return (
    <>
      {/* Top Left Stats */}
      <div className="absolute top-4 left-4 flex gap-3 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg text-white">
          <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Sector</div>
          <div className="text-xl font-bold flex items-center gap-2"><Target size={18} className="text-blue-400"/> {state.stage}</div>
        </div>
        <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg text-white">
          <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Targets</div>
          <div className="text-xl font-bold flex items-center gap-2"><Crosshair size={18} className="text-red-400"/> {state.enemiesToKill > 0 ? state.enemiesToKill : 'BOSS'}</div>
        </div>
        <div className="bg-black/40 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-lg text-white">
          <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Level {state.player.level}</div>
          <div className="text-xl font-bold flex items-center gap-2"><Sparkles size={18} className="text-fuchsia-400"/> {Math.floor(state.player.exp)}</div>
        </div>
      </div>

      {/* Top Right Score */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] font-mono text-right italic tracking-tighter">
          {Math.floor(state.score).toLocaleString()}
        </div>
        <div className="text-right text-xs text-amber-500/80 font-black uppercase tracking-[0.3em]">Score</div>
      </div>

      {/* Health Bars */}
      <div className="absolute top-24 left-4 w-64 pointer-events-none">
        <div className="flex justify-between text-[10px] font-black text-white/70 mb-1">
          <span>HULL INTEGRITY</span>
          <span>{Math.floor(state.player.health)} / {state.player.maxHealth}</span>
        </div>
        <div className="h-3 bg-black/60 rounded-full border border-white/10 overflow-hidden box-content relative">
           <div className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 transition-all duration-300" style={{ width: `${hpPct}%` }} />
        </div>
        
        <div className="flex justify-between text-[10px] font-black text-white/70 mb-1 mt-3">
          <span>ENERGY</span>
          <span>{Math.floor(state.player.energy)}  / {state.player.maxEnergy}</span>
        </div>
        <div className="h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden box-content relative">
           <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${epPct}%` }} />
        </div>

        <div className="h-1 bg-black/60 rounded-full border border-white/10 overflow-hidden box-content relative mt-3">
           <div className="h-full bg-fuchsia-500 transition-all duration-300" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Weapons Dock (Bottom Center) desktop */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-xl border border-white/10 p-2 rounded-2xl pointer-events-auto">
        {['CANNON_A', 'CANNON_B', 'CANNON_C'].map((slot, i) => (
          <button 
            key={slot}
            onClick={() => onSwitchWeapon(slot)}
            className={`relative w-16 h-16 rounded-xl border flex flex-col items-center justify-center transition-all ${state.activeWeapon === slot ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.5)]' : 'bg-black/40 border-white/10 hover:border-white/30 grayscale opacity-70'}`}
          >
            <Swords size={20} className={state.activeWeapon === slot ? 'text-blue-400' : 'text-white/50'} />
            <div className="text-[9px] font-black text-white mt-1 uppercase">W-\{(i+1)}</div>
          </button>
        ))}
      </div>
    </>
  );
}

export function MainMenu({ onStart, onAimTrainer }: any) {
  return (
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1e1b4b_0%,_#020617_100%)] flex flex-col items-center justify-center z-[100] selection:bg-transparent">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="text-center mb-16 relative z-10">
        <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-blue-500 italic tracking-tighter uppercase leading-none drop-shadow-[0_0_40px_rgba(59,130,246,0.6)]">
          Chaos <br /> <span className="text-blue-500">Arena</span>
        </h1>
        <p className="text-cyan-400 font-mono text-sm tracking-[0.4em] uppercase mt-6 font-bold shadow-black drop-shadow-md">Cybernetic Twin-Stick Survivor</p>
      </motion.div>

      <div className="flex flex-col gap-4 w-[300px] relative z-10">
        <button onClick={onStart} className="bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all active:scale-95">
          <Zap size={24} fill="currentColor" /> INITIATE BOOT
        </button>
        <button onClick={onAimTrainer} className="bg-amber-600 hover:bg-amber-500 text-white font-black py-4 rounded-2xl text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all active:scale-95">
          <Target size={24} /> AIM TRAINER
        </button>
      </div>
      
      <div className="absolute bottom-8 text-white/20 font-mono text-xs uppercase tracking-widest text-center">
        WASD to Move • Mouse to Aim & Fire • Shift to Dash<br/>
        Mobile controls perfectly supported
      </div>
    </div>
  );
}

export function GameOver({ score, onRestart, onMenu }: any) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[200]">
      <motion.h1 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-red-500 text-6xl md:text-8xl font-black mb-4 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] italic tracking-tighter">
        MISSION FAILED
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-white/80 text-xl font-bold mb-12 font-mono tracking-widest uppercase text-center bg-white/5 py-4 px-12 rounded-2xl border border-white/10">
        FINAL SCORE<br/>
        <span className="text-5xl text-amber-400">{Math.floor(score).toLocaleString()}</span>
      </motion.p>
      <div className="flex gap-4">
        <button onClick={onRestart} className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl text-lg font-black text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30">
          RETRY
        </button>
        <button onClick={onMenu} className="bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-4 rounded-2xl text-lg font-black text-white hover:scale-105 active:scale-95 transition-all">
          MAIN MENU
        </button>
      </div>
    </div>
  );
}
