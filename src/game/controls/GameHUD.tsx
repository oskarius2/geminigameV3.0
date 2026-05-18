import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sword, Zap, Flame, Menu, Activity, Radar, Fingerprint, Radio, Terminal, Fuel, Cpu, AlertTriangle } from 'lucide-react';

function formatSurvival(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface HUDProps {
  health: number;
  maxHealth: number;
  survivalTime?: number;
  threatLevel?: number;
  score: number;
  stage?: number;
  enemiesToKill?: number;
  stageTransition?: number;
  gameMode?: 'NORMAL' | 'AIM_TRAINER';
  onOpenMenu?: () => void;
  onWeaponSwitch?: (slot: 'CANNON_A' | 'CANNON_B') => void;
  cardTimer?: number;
  cardInterval?: number;
  activeWeaponSlot?: 'CANNON_A' | 'CANNON_B';
  energy: number;
  maxEnergy: number;
  ultimateCharge: number;
  isMobile?: boolean;
  compactHud?: boolean;
  scrap?: number;
  fuel?: number;
  maxFuel?: number;
}

function RandomTelemetry() {
  const [data, setData] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0,
    hex: '0x0000',
    ops: 0
  });

  useEffect(() => {
    const i = setInterval(() => {
      setData({
        alpha: Math.random() * 100,
        beta: Math.random() * 100,
        gamma: Math.random() * 100,
        hex: '0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'),
        ops: Math.floor(Math.random() * 900) + 100
      });
    }, 150);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col text-[8px] font-mono leading-[9px] text-white/50 pointer-events-none mt-2 w-32 tracking-widest mix-blend-screen">
      <div className="flex justify-between"><span>LINK.STABLE</span><span className="text-white/80">OK</span></div>
      <div className="flex justify-between"><span>MEM.ALLOC</span><span>{data.hex}</span></div>
      <div className="flex justify-between"><span>CORTEX.DRV</span><span>{data.ops.toString().padStart(3, '0')}</span></div>
      <div className="w-full flex items-end gap-px h-3 mt-1.5 opacity-50">
        {[data.alpha, data.beta, data.gamma, data.alpha * 0.5, data.beta * 0.8, data.gamma * 0.3].map((val, i) => (
          <div key={i} className="flex-1 bg-white/40" style={{ height: `${val}%` }} />
        ))}
      </div>
    </div>
  );
}

function DecorNodes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none">
      <div className="absolute top-1/4 right-8 w-px h-32 bg-gradient-to-b from-transparent via-cyan-500 to-transparent flex flex-col justify-center gap-4">
         <div className="w-1 h-3 -ml-[2px] bg-cyan-400" />
         <div className="w-1 h-1 -ml-[2px] bg-cyan-400 rounded-full" />
      </div>
      <div className="absolute bottom-1/3 left-6 flex items-center gap-1">
         <Fingerprint className="text-cyan-600/30 w-16 h-16" />
         <div className="flex flex-col text-[7px] text-cyan-500/40 font-mono">
           <span>ID.SYNC_AUTH</span>
           <span>v4.9.1.002</span>
         </div>
      </div>
      <div className="absolute top-2/3 right-12 crosshair-rotator pointer-events-none w-24 h-24 border border-rose-500/10 rounded-full flex flex-col items-center justify-center opacity-40">
        <div className="absolute inset-2 border-l border-b border-rose-500/30 rounded-full animate-spin [animation-duration:8s] [animation-direction:reverse]" />
        <div className="w-1 h-1 bg-rose-500/50 rounded-full" />
        <span className="text-[6px] text-rose-500/50 mt-1 uppercase font-black tracking-widest text-center leading-tight">Threat<br/>Vector</span>
      </div>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[600px] max-w-[95vw] h-px bg-white/5" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[800px] max-w-[95vw] h-px bg-white/5" />
    </div>
  );
}

function CardTimerRing({ cardTimer, cardInterval }: { cardTimer: number; cardInterval: number }) {
  return (
    <motion.div className="relative flex items-center justify-center shrink-0" style={{ width: 44, height: 44 }}>
      <svg className="absolute inset-0 -rotate-90 w-11 h-11" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="18" cy="18" r="11" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <circle cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="2"
          strokeDasharray={`${Math.max(0, (cardTimer / cardInterval) * 94)} 94`}
          strokeLinecap="round"
        />
        <circle cx="18" cy="18" r="11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 4" className="origin-center animate-[spin_10s_linear_infinite]" />
      </svg>
      <div className="flex flex-col items-center leading-none z-10 mt-0.5">
        <span className="text-[6px] text-white/50 font-sans tracking-[0.2em] uppercase">SYNC</span>
        <span className="text-[9px] font-mono text-white tabular-nums tracking-widest mt-0.5">
          {cardTimer > 3 ? `~${Math.ceil(cardTimer)}s` : `${Math.max(0, Math.ceil(cardTimer))}s`}
        </span>
      </div>
    </motion.div>
  );
}

function HudBracket({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}

function CompactTopHud(props: {
  threatLevel: number;
  score: number;
  survivalTime: number;
  stage: number;
  enemiesToKill: number;
  stageTransition: number;
  gameMode: string;
  cardTimer: number;
  cardInterval: number;
  isMobile?: boolean;
  onOpenMenu?: () => void;
}) {
  const {
    threatLevel,
    score,
    survivalTime,
    stage,
    enemiesToKill,
    stageTransition,
    gameMode,
    cardTimer,
    cardInterval,
    isMobile,
    onOpenMenu,
  } = props;

  return (
    <div className="w-full flex justify-between items-start z-20 mix-blend-screen overflow-visible px-2 pt-2">
      <HudBracket className="flex flex-col gap-1.5 p-2 bg-black/60 backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <button
             type="button"
             onClick={(e) => { e.stopPropagation(); onOpenMenu?.(); }}
             className="pointer-events-auto h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
             <Menu size={14} />
          </button>
          <div className="flex flex-col justify-center">
            <span className="text-[7px] text-white/50 font-sans tracking-[0.2em] uppercase">Score Sys</span>
            <p className="text-sm font-display font-bold text-white tracking-widest leading-none">
              {score.toLocaleString().padStart(8, '0')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-white/70 border-t border-white/10 pt-1.5">
          <div className="flex items-center gap-1.5 tracking-widest">
            <Activity size={10} className="text-white/40" /> 
            {formatSurvival(survivalTime)}
          </div>
          {gameMode === 'NORMAL' && (
            <div className="flex items-center gap-1 font-bold tracking-widest">
              <span className="text-white/20">|</span> 
              <span className="text-white">S{stage}</span> 
              <span className="text-white/20">|</span> 
              <span className="text-white/90">
                {stageTransition > 0 ? 'CLEAR' : enemiesToKill > 0 ? `TGT:${enemiesToKill}` : 'BOSS INC'}
              </span>
            </div>
          )}
        </div>
        {!isMobile && <RandomTelemetry />}
      </HudBracket>

      <div className="flex flex-col items-end gap-3 pt-1">
         <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} />
         <div className="flex flex-col items-end gap-1">
           <span className="text-[8px] text-white/50 font-sans tracking-[0.2em] uppercase">Heat Level</span>
           <span className="bg-red-500/10 border border-red-500/30 px-2 py-1 text-[10px] font-mono text-red-400 tabular-nums font-bold">
              {(threatLevel).toFixed(1)}%
           </span>
         </div>
      </div>
    </div>
  );
}

export const GameHUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  survivalTime = 0,
  threatLevel = 0,
  score,
  stage = 1,
  enemiesToKill = 0,
  stageTransition = 0,
  gameMode = 'NORMAL',
  onOpenMenu,
  onWeaponSwitch,
  cardTimer = 60,
  cardInterval = 75,
  activeWeaponSlot = 'CANNON_A',
  energy,
  maxEnergy,
  ultimateCharge,
  compactHud = false,
  isMobile = false,
  scrap = 0,
  fuel = 100,
  maxFuel = 100,
}) => {
  const healthPercent = (health / maxHealth) * 100;
  const energyPercent = (energy / maxEnergy) * 100;
  const fuelPercent = (fuel / maxFuel) * 100;
  const threatPercent = Math.min(100, threatLevel);
  const showDesktopWeapons = !compactHud;

  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none flex flex-col font-sans overflow-hidden ${
        compactHud
          ? 'p-2 pt-[max(0.5rem,env(safe-area-inset-top))] px-[max(0.5rem,env(safe-area-inset-left))]'
          : 'p-4 md:p-6'
      }`}
    >
      {!isMobile && <DecorNodes />}

      {/* Fuel and Scrap Overlay */}
      <div className={`absolute top-24 md:top-32 left-4 md:left-8 z-30 flex flex-col gap-2 ${compactHud ? 'scale-90 origin-top-left' : ''}`}>
         <div className="flex bg-black/60 backdrop-blur-xl border border-white/10 p-3 gap-5 items-center rounded-xl shadow-xl">
            <div className="flex flex-col gap-1.5 w-24">
               <div className="flex justify-between items-center text-[8px] font-sans tracking-[0.2em] text-white/50 uppercase">
                  <span>Fuel Sys</span>
                  {fuel < 20 && <AlertTriangle size={10} className="text-red-500 animate-pulse" />}
               </div>
               <div className="h-1.5 w-full bg-black/50 border border-white/5 rounded-full overflow-hidden p-[1px]">
                  <motion.div 
                    className={`h-full rounded-full ${fuel < 20 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-sky-600 to-sky-400'}`}
                    animate={{ width: `${fuelPercent}%` }}
                  />
               </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-2.5">
               <div className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                  <Cpu size={14} />
               </div>
               <div className="flex flex-col">
                  <span className="text-[8px] font-sans tracking-[0.2em] text-white/50 uppercase leading-none mb-1">Scrap</span>
                  <span className="text-sm font-display font-bold text-white tabular-nums leading-none tracking-widest">{scrap}</span>
               </div>
            </div>
         </div>
         {fuel < 20 && (
           <motion.div 
             animate={{ opacity: [1, 0.4, 1] }} 
             transition={{ repeat: Infinity, duration: 1 }}
             className="text-[9px] font-sans tracking-[0.2em] text-red-500 uppercase px-2"
           >
             Critical Fuel Loss
           </motion.div>
         )}
      </div>
      
      {compactHud ? (
        <CompactTopHud
          threatLevel={threatLevel}
          score={score}
          survivalTime={survivalTime}
          stage={stage}
          enemiesToKill={enemiesToKill}
          stageTransition={stageTransition}
          gameMode={gameMode}
          cardTimer={cardTimer}
          cardInterval={cardInterval}
          isMobile={isMobile}
          onOpenMenu={onOpenMenu}
        />
      ) : (
        <div className="w-full flex justify-between items-start z-20">
          <HudBracket className="flex flex-col gap-3 p-4 w-80">
             <div className="flex justify-between items-start">
               <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="text-[8px] text-white/50 font-sans tracking-[0.2em] uppercase">Score Sys</span>
                    <span className="text-[10px] font-mono text-white/40 tabular-nums">
                       T+{formatSurvival(survivalTime)}
                    </span>
                  </div>
                  <p className="text-3xl md:text-5xl font-display font-bold text-white tracking-widest leading-none mb-3">
                    {score.toLocaleString().padStart(8, '0')}
                  </p>
                  <button
                     type="button"
                     onClick={(e) => { e.stopPropagation(); onOpenMenu?.(); }}
                     className="pointer-events-auto h-8 flex items-center justify-center gap-2 px-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors w-full"
                  >
                     <Terminal size={12} /> <span className="text-[10px] font-sans tracking-[0.2em] uppercase">System Ops</span>
                  </button>
               </div>
             </div>
             
             {!isMobile && <RandomTelemetry />}
          </HudBracket>

          <div className="flex flex-col gap-4 items-end">
            <CardTimerRing cardTimer={cardTimer} cardInterval={cardInterval} />
            <HudBracket className="p-3 flex flex-col items-end min-w-[200px]">
              <span className="text-[8px] text-white/50 font-sans tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5">
                <Radar size={10} className="animate-[spin_4s_linear_infinite] text-white/40" /> HOSTILE RADAR
              </span>
              {gameMode === 'AIM_TRAINER' ? (
                <p className="text-xs md:text-sm font-display font-medium text-amber-500 tracking-widest uppercase mt-1">AIM.MODULE</p>
              ) : (
                <div className="text-right mt-1">
                  <p className="text-sm md:text-lg font-display font-bold text-white tracking-widest uppercase">SECTOR {stage.toString().padStart(2, '0')}</p>
                  <div className="mt-1">
                    {stageTransition > 0 ? (
                      <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(52,211,153,0.1)]">SECURED</span>
                    ) : enemiesToKill > 0 ? (
                      <span className="text-[10px] font-mono uppercase text-amber-400/80 bg-amber-900/20 border border-amber-500/20 px-2 py-0.5 rounded">
                        TGT:{enemiesToKill.toString().padStart(3, '0')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-sans font-bold tracking-widest uppercase text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                        HVT DETECTED
                      </span>
                    )}
                  </div>
                </div>
              )}
            </HudBracket>
            <div className="flex flex-col items-end gap-1 mt-1">
               <span className="text-[7px] text-red-400/70 font-sans uppercase tracking-[0.2em] mb-0.5 flex gap-1 items-center">
                 Heat_Signature <Activity size={10} />
               </span>
               <div className="w-32 h-1 bg-white/5 flex overflow-hidden rounded-full border border-white/10">
                  <motion.div className="h-full bg-red-500" animate={{ width: `${threatPercent}%` }} transition={{ duration: 0.1 }} />
               </div>
               <span className="text-[10px] font-mono text-red-400 font-bold tabular-nums">{(threatLevel).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {showDesktopWeapons && (
        <motion.div className="mt-auto flex justify-between items-end mb-8 md:mb-16 z-20 mix-blend-screen">
          <HudBracket className="flex p-2 gap-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl">
            {(['CANNON_A', 'CANNON_B'] as const).map((slot) => {
              const isActive = activeWeaponSlot === slot;
              const label = slot === 'CANNON_A' ? 'Primary' : 'Heavy';
              const Icon = slot === 'CANNON_B' ? Flame : Sword;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWeaponSwitch?.(slot);
                  }}
                  className={`relative h-14 w-14 md:h-16 md:w-16 rounded-lg transition-all flex flex-col items-center justify-center touch-manipulation group overflow-hidden ${
                    isActive
                      ? 'bg-white/10 border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)_inset]'
                      : 'bg-white/5 border-transparent opacity-50 hover:opacity-100 hover:bg-white/10'
                  } border`}
                >
                  <span
                    className={`absolute top-1 text-[8px] font-sans tracking-[0.2em] uppercase text-center w-full transition-colors ${
                      isActive ? 'text-white font-bold' : 'text-white/50'
                    }`}
                  >
                     {label}
                  </span>
                  <Icon size={20} className={`mt-3 transition-colors ${isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/40'}`} />
                  {isActive && <div className="absolute inset-0 shadow-[0_0_20px_rgba(255,255,255,0.2)] animate-pulse pointer-events-none mix-blend-screen rounded-lg" />}
                </button>
              );
            })}
          </HudBracket>
        </motion.div>
      )}

      {/* Bottom HUD: Health (Left), Energy (Right), Ultimate (Center) */}
      <div className={`absolute bottom-0 left-0 right-0 pointer-events-none flex justify-between items-end ${compactHud ? 'p-4 pb-20' : 'p-8 md:px-12 md:pb-10'} z-20`}>
        
        {/* Health (Bottom Left) */}
        <motion.div className="flex flex-col w-40 md:w-64 origin-bottom-left group" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="w-full flex justify-between items-end mb-2 px-1 text-[8px] md:text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-white/50">
             <div className="flex gap-1.5 items-center"><Radio size={10} className="animate-pulse text-emerald-400" /> Hull Integrity</div>
             <span className="tabular-nums font-mono text-white/80">{(healthPercent).toFixed(1)}%</span>
          </div>
          <div className="w-full relative h-2 md:h-2.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden shadow-lg p-[1px]">
             {healthPercent < 25 && <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none mix-blend-screen" />}
             <motion.div 
               className={`h-full rounded-full transition-colors duration-300 ${healthPercent < 25 ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`}
               animate={{ width: `${healthPercent}%` }}
               transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
             />
          </div>
        </motion.div>

        {/* Ultimate Charge (Bottom Center) */}
        <motion.div className={`flex flex-col items-center ${compactHud ? 'w-32' : 'w-48'} shrink-0`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="w-full flex justify-between items-end mb-2 px-1 text-[7px] md:text-[9px] font-sans font-bold tracking-[0.2em] uppercase text-white/50">
             <div className="flex gap-1 items-center">Core Output</div>
             <span className="tabular-nums font-mono text-white/80">{ultimateCharge?.toFixed(0) || 0}%</span>
          </div>
          <div className="w-full relative h-1.5 md:h-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden shadow-lg p-[1px]">
             <motion.div 
               className={`h-full rounded-full bg-gradient-to-r from-white/20 via-white to-white shadow-[0_0_15px_rgba(255,255,255,1)] ${ ultimateCharge >= 100 ? 'animate-pulse' : '' }`}
               animate={{ width: `${Math.min(100, ultimateCharge || 0)}%` }} 
             />
          </div>
        </motion.div>

        {/* Energy (Bottom Right) */}
        <motion.div className="flex flex-col w-32 md:w-48 origin-bottom-right" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="w-full flex justify-between items-end mb-2 px-1 text-[8px] md:text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-white/50">
             <span className="tabular-nums font-mono text-white/80">{(energyPercent).toFixed(1)}%</span>
             <div className="flex gap-1.5 items-center">Energy Reserve</div>
          </div>
          <div className="w-full relative h-2 md:h-2.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full overflow-hidden shadow-lg p-[1px] flex justify-end">
             <motion.div 
               className={`h-full rounded-full transition-colors duration-300 ${energy >= 30 ? 'bg-gradient-to-l from-amber-400 to-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-gradient-to-l from-amber-600/50 to-amber-800/50'}`}
               animate={{ width: `${energyPercent}%` }}
               transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
             />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

