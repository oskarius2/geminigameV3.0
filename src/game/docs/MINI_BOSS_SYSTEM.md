# Mini-boss system (Survival)

**Status: shipped** — all six archetypes, wave script, difficulty, HUD, meta tracking, dev cheats.

## Overview

Scripted mini-boss encounters mid-stage: tougher than elites, weaker than stage bosses. Guaranteed artifact on kill, 25% passive bonus, −10 threat.

## Spawn schedule

| Stage | Waves (0-based) | Mini-boss |
|-------|-----------------|-----------|
| 1 | — | None |
| 2 | 2 | Chockvågssköld |
| 3 | 1, 3 | Eklips-slaktare |
| 4 | 1, 3 | Tomhetsbudbärare |
| 5+ | 1, 3 (+ hard: all waves) | Rotating pool |

## Difficulty (`miniBossDifficulty.ts`)

- **Lätt:** mini-boss on every 3rd wave only; 82% HP; 60% passive chance; −22% spawn rate, −15% max alive, −12 threat, slower wave spawns
- **Normal:** design waves
- **Svår:** mini-boss every wave from stage 2; 128% HP; 135% passive chance; +22% spawn, +15% max alive, +10 threat, faster wave spawns; +7% HP per wave index in stage 5+

Set on Start screen or `?difficulty=easy|normal|hard`. Shown in HUD, pause menu, and run summary.

## Player feedback

- **Wave heads-up:** entering a wave with a mini-boss shows “Miniboss i denna våg” + name (~4s)
- **Spawn popup:** name + screen flash when the mini-boss entity spawns
- **Combat HUD:** centered HP bar while alive; score panel shows `MB n` kills
- **Run summary:** miniboss kill count + difficulty

## Dev cheats (Survival, dev build / `?devCheats=1`)

| Key | Action |
|-----|--------|
| Shift+Q–Y | Spawn mini-boss (Q Chockvåg, W Eklips, E Tomhet, R Plasma, T Kronos, Y Svärm) |
| Shift+1–7 | Boss warp |
| Shift+B/K/N | Boss shortcuts |

## Files

- `src/game/bosses/miniBossDefs.ts` — data
- `src/game/bosses/miniBossAI.ts` — attacks + world effects
- `src/game/bosses/miniBossLoot.ts` — rewards
- `src/game/bosses/miniBossPassives.ts` — passives + legendary
- `src/game/bosses/miniBossSpawn.ts` — spawn
- `src/game/balance/waveSpawnController.ts` — wave queue
- `src/game/balance/miniBossDifficulty.ts` — difficulty

## Meta

- `miniBossKillsThisRun` on `GameState` — run summary + pause HUD
- `stats.totalMiniBossKills` in meta progress — persisted on run end via `recordStatDelta`

## Snabbtest (efter `npm run dev`)

1. Start → välj **Normal** → Survival
2. Stage 2, våg 3 (~70 s in i steg 2): varning → spawn → HP-bar → död → artefakt + ev. passiv
3. `?devCheats=1` → **Shift+Q** … **Shift+Y** spawnar varje typ
4. `?difficulty=hard` → miniboss nästan varje våg från stage 2
5. Dö → run summary visar minibossar + svårighet; startskärm visar karriär-MB om > 0
