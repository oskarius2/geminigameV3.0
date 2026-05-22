# Survival Mode — Spawn Audit

How enemies are chosen, scaled, and capped in the **NORMAL** survival loop (`spawnEnemy` + threat composition).

---

## A) `spawnEnemy` cases 0–20 (`Logic.ts`)

Base before switch (non-boss):

- `health = 20 * healthScale`
- `speed = (1.5 + random*0.5) * speedScale`
- `damage = floor((15 + tier*2) * threatMult * timeRamp * damageMult)` (+ boss 2x)

### Scaling inputs (all cases)

| Input | Formula / source |
|-------|------------------|
| `tier` | `getAugmentTier(passives.length)` → 0–4 |
| `tierMods` | HP/speed/spawn mult from `augmentTiers.ts` |
| `threatMult` | `0.75 + (threatLevel/100) * 1.5` → **0.75–2.25** |
| `skillFactor` | `sqrt(score/3500 + 1)` |
| `timeRamp` | `1 + min(1.5, survivalTime/600)` → up to **+150%** at ~15 min |
| `healthScale` | `tierMods.enemyHpMult * skillFactor * (0.7 + threatLevel/100*2) * timeRamp * threatMult` |
| `speedScale` | `tierMods.enemySpeedMult * min(2.5, skillFactor * (0.8 + threatLevel/100)) * min(1.5, 1 + survivalTime/1200)` |

Boss branch (`bossActive` && no BOSS entity): separate stats from `BOSS_DEFINITIONS`, not switch cases.

| Case | EnemyType | Color | Radius | Health mult | Speed mult | Special |
|------|-----------|-------|--------|-------------|------------|---------|
| **0** | CHASER | `#ef4444` | 25 | ×10 | ×0.8 | Tanky chaser (late unlock t≥88) |
| **1** | PHALANX | `#0ea5e9` | 40 | ×30 | ×0.3 | Very slow wall (t≥75) |
| **2** | WRAITH | `#fde68a` | 18 | ×5 | ×1.4 | (t≥25) |
| **3** | ELITE | `#fbbf24` | 35 | ×15 | ×1.1 | (t≥35) |
| **4** | SPLINTER | `#f87171` | 25 | ×8 | ×0.8 | (t≥45) |
| **5** | NOVA | `#f97316` | 22 | ×6 | ×1.1 | (t≥55) |
| **6** | RANGED | `#c084fc` | 20 | ×2.5 | ×0.85 | (t≥15) |
| **7** | CHASER | `#10b981` | 16 | ×3 | ×1.1 | Starter pool |
| **8** | CHASER | `#22d3ee` | 14 | ×4 | ×1.2 | `damageResist: 0.15` |
| **9** | FAST | `#fde047` | 11 | ×0.4 | ×2.3 | Starter pool |
| **10** | SWARMER | `#fb923c` | 9 | ×0.15 | ×2.6 | Starter pool |
| **11** | SNIPER | `#ef4444` | 20 | ×8 | ×0.6 | (t≥65) |
| **12** | DASHER | `#ff6b35` | 10 | ×0.5 | ×2.8 | Starter pool |
| **13** | PHANTOM | `#00d4ff` | 16 | ×4 | ×1.5 | (t≥35) |
| **14** | ZAPPER | `#38bdf8` | 13 | ×1.8 | ×1.1 | (t≥15) |
| **15** | STRIKER | `#cc2200` | 18 | ×5 | ×1.9 | `damageMult: 1.9` contact |
| **16** | SWARM_V2 | `#ff8c00` | 10 | ×0.3 | ×2.9 | Pack spawn +2–4 mates (`App.tsx`) |
| **17** | TRACKER | `#c026d3` | 17 | ×7 | ×1.15 | (t≥50) |
| **18** | FORTIFIED | `#475569` | 44 | ×60 | ×0.2 | (t≥60) |
| **19** | SHIELDED | `#06b6d4` | 22 | ×8 | ×0.9 | `damageResist: 0.85`, `shieldHealth: 10` |
| **20** | REGENERATING | `#22c55e` | 20 | ×12 | ×0.8 | Drops health orb on death |
| default | CHASER | `#ef4444` | 14 | ×1.2 | ×1 | Fallback |

**21 archetypes** in switch (cases 0–20); case 7 and 8 both CHASER variants.

---

## B) Spawn algorithm

### 1. When spawns fire (`App.tsx`)

Conditions (all must pass):

- `gameMode !== ON_RAILS`
- `stageTransition <= 0`
- `bossArenaTransition <= 0`
- `!bossActive && enemiesToKill > 0` (grind phase)
- `enemies.length < maxEnemies`

`spawnChance` roll per frame; up to **4** spawn attempts per frame at high progress (main + 0.5x + 0.4x×2 + 3% burst).

Grace: first **30s** `survivalTime` → spawn chance × **0.35**.

`spawnRampTimer > 0` → max alive capped lower (4 vs 8), fewer multi-spawn branches.

### 2. `pickEnemyTypeForThreat()` (`spawnComposition.ts`)

**Returns:** switch index `0–20` or **`null`** (spawn skipped).

**Blocked when:** `bossActive`.

**Candidate pool** (`buildCandidatePicks(threatLevel)`):

- Always: FAST(9), SWARMER(10), CHASER(7), DASHER(12), SWARM_V2(16) — duplicated entries = higher weight
- Unlocks by `threatLevel` threshold (15, 25, 30, 35, … 88)

**Weighted selection:**

- Skip picks at **type cap** (`isPickAtCap`)
- Weight ∝ `slotsLeft = cap - currentCount` for that type

### 3. `levelProgress` (0 → 1)

| Mode | Formula |
|------|---------|
| NORMAL | `getLevelProgress(enemiesToKill, getStageQuota(stage))` — kills done / quota |
| SURVIVAL | Same base + `min(1, progress + survivalTime/600)` — **time forces progress** |
| Boss active | Overridden toward 1 + time component when `bossActive \|\| SURVIVAL` |

Higher `levelProgress` → higher `maxEnemies`, higher `spawnChance`, higher **type caps** (25%–100% of base cap).

### 4. `isTypeAtCap` / caps (`BASE_TYPE_CAPS`)

Per-type max on screen at full progress (examples):

| Type | Base cap |
|------|----------|
| CHASER | 8 |
| FAST / SWARMER / RANGED / DASHER / SWARM_V2 | 8–10 |
| ELITE / WRAITH / PHALANX | 3–5 |
| FORTIFIED / TANK | 2 |
| (missing types) | 999 |

Effective cap: `ceil(base * (0.25 + 0.75 * levelProgress))`.

Prevents one pick from dominating but **many types can coexist** once threat unlocks them.

### 5. `threatMult` on stats (`threat.ts`)

- `threatLevel` 0–100 from passives, stage, exclusives
- `getThreatMult` → enemy HP/damage scale
- Also feeds `threatFactor` into `maxEnemies` and `spawnChance` via augment tier

### 6. `getMaxAliveEnemies` (`spawnCurve.ts`)

```
earlyCap = ramping ? 4 : 8
lateCap = mobile ? 30 : 50
max = floor(earlyCap + progress² * (lateCap - earlyCap) + threatFactor * (15|25))
```

### 7. `getSpawnChance` (`spawnCurve.ts`)

- Base `0.01 + progressForSpawn * 0.4 + threatFactor * 0.1`
- Progress dampened above 70% of stage (anti flood)
- Capped 0.35 mobile / 0.85 desktop
- × `tierMods.spawnChanceMult` (up to 1.06)
- × 0.35 if `survivalTime < 30`

### 8. `resolveSpawnTypePick` (`Logic.ts`)

- Campaign: may override type; if cap hit, reroll up to 3×
- NORMAL: always `pickEnemyTypeForThreat` up to 3 retries
- Returns `null` → **no enemy spawned** that attempt

---

## C) Current issues (design audit)

| Issue | Evidence | Player feel |
|-------|----------|-------------|
| **Too many types at once** | 15+ picks unlock by threat 15–88; caps allow many types simultaneously | Visual noise, no readable "wave" |
| **No wave composition** | Pure random weighted pick each spawn | Chaos, not curated difficulty |
| **Duplicate CHASER entries** | Cases 7, 8 + pool weights | Redundant archetypes |
| **Random = chaos** | No templates, burst is only `progress > 0.6` 3% | Unpredictable density spikes |
| **Spawn rate accelerates hard** | progress² max alive, spawn chance to 0.85, multi-spawn branches | Late stage flood |
| **timeRamp +150%** | `survivalTime/600` in `spawnEnemy` | Long runs trivial for HP unless damage keeps up |
| **skillFactor sqrt(score)** | Score feeds HP/speed forever | Snowball or death spiral |
| **SURVIVAL mode half-wired** | Progress time-ramp without quota boss loop | Mode unclear vs NORMAL |
| **SWARM_V2 pack spawn** | +2–4 per spawn instant multiplies count | Spike lag / FPS |
| **null pick = empty frame** | All caps hit → spawn whiffs | Dead moments then sudden burst |
| **Threat unlock staircase** | Many types appear within 10 threat points | Difficulty cliff not smooth |

---

## Spawn curve by stage (quota only)

| Stage | `getStageQuota` |
|-------|-----------------|
| 1 | 50 |
| 2+ | `35 + 25 * stage` (60, 85, 110, …) |

Kill speed + spawn rate determine how long grind lasts; not wall-clock timed stages.

---

## File index

| File | Role |
|------|------|
| `src/game/Logic.ts` | `spawnEnemy`, scaling, switch 0–20 |
| `src/game/balance/spawnComposition.ts` | `pickEnemyTypeForThreat`, caps, `PICK_TO_TYPE` |
| `src/game/balance/spawnCurve.ts` | quota, progress, max alive, spawn chance |
| `src/game/balance/threat.ts` | `computeThreatLevel`, `getThreatMult` |
| `src/game/balance/augmentTiers.ts` | tier modifiers from buff count |
| `src/App.tsx` | spawn loop, pack spawns, boss spawn branch |
