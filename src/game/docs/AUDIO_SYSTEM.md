# SpaceHero — Survival Audio System

Design spec + implementation map for premium, juicy survival-mode audio.

## Architecture

```
App.tsx / gameplay hooks
        │
        ▼
survivalAudio.ts     ── threat updates, boss warp/defeat, death, ultimate
        │
   ┌────┴────┐
   ▼         ▼
survivalMusic.ts   sfx.ts + sfxPresets.ts
   │                 │
   └──── audioEngine.ts (Music / SFX / UI busses, ducking, pan)
```

**Runtime:** Web Audio API (procedural). No Howler dependency. WAV/OGG stems can replace procedural layers later via the same stem gain nodes.

**Channels (master × user volume):**

| Channel | Default master | Role |
|---------|----------------|------|
| Music | 80% | VOID PURSUIT stems + boss themes |
| SFX | 80% | Combat, UI stings |
| UI | 70% | Menus (reserved) |

Settings persist: `musicMuted`, `sfxMuted`, `musicVolume`, `sfxVolume`, `uiVolume`.

---

## Task 1 — Music: VOID PURSUIT

**Base track:** 4 stems — `pad`, `drums`, `bass`, `melody` — loop at shared BPM.

| Threat tier | Threat % | BPM | Stems (relative gain) |
|-------------|----------|-----|------------------------|
| Calm | 0–25 | 100 | Pad + light bass/melody |
| Pressure | 26–50 | 120 | + drums |
| Danger | 51–75 | 140 | Full rhythm |
| Critical | 76–100 | 160 | All stems max |

Transitions: **2.5s** `setTargetAtTime` crossfade on stem gains (no hard cuts).

**Stage layers** (detune / intensity): stages 1–5+ increase bass presence (AWAKENING → INFINITY).

**Boss override** (`enterBossMusic`): replaces calm/pressure mix with theme BPM until boss dies.

| Boss (survival id) | Theme | BPM |
|--------------------|-------|-----|
| `salvage_hauler` | Mechanical Hunter | 140 |
| `hive_regent`, `crimson_tyrant`, `hive_queen` | Red Predator | 150 |
| `void_cardinal`, `wraith_lord` | Void Whisper | 130 |
| `colossus` | Titan Strike | 160 |
| Stage 5+ unknown | Reality Break | 120–180 (scales with HP) |

**Victory / defeat:** `playVictorySting(stage)` (3–5s), `playDefeatSting()` (2–3s) on player death.

**Hooks:** `startSurvivalAudio`, `updateSurvivalAudio`, `onBossWarpBegin`, `onBossDefeated`, `onPlayerDeath`.

---

## Task 2 — SFX hierarchy

All events in `SfxEvent` (`src/game/audio/sfx.ts`). Relative volumes in `SFX_VOLUME`.

### Player

| Event | Ship / context | Vol |
|-------|----------------|-----|
| `shoot_falcon` | interceptor | 70% |
| `shoot_sentinel` | gunship | 70% |
| `shoot_swarm` | drone | 70% |
| `playerUltimate` | ult | 90% |
| `playerHit` | damage | 80% |
| `playerDeath` | fatal | 100% |

Pan: `playShipShootSfx(shipId, screenX, viewWidth)`.

### Companion

| Event | Ability |
|-------|---------|
| `companionTaunt` | guardian |
| `companionSpeed` | scout |
| `companionHeal` | healer |
| `companionBurst` | gunner |
| `companionUnlock` | meta unlock |
| `companionLevelUp` | level up |

### Enemies / bosses

| Event | When |
|-------|------|
| `enemySpawn` / `enemyFire` / `enemyHit` / `enemyDeath` | generic |
| `enemyDeathHeavy` | tank/elite |
| `miniBossSpawn` + duck 30% | mini-boss |
| `miniBossTell` / `miniBossHit` / `miniBossDefeat` | mini-boss combat |
| `bossSpawn` | warp sting |
| `bossTell*` | attack tells |
| `bossHit` / `bossPhase2` / `bossDeath` | boss combat |
| `threatChange` | tier boundary |

### Loot

`playArtifactAcquireSfx(rarity)` — common → exclusive escalation.

Rails events retained (`rails_*`) for on-rails mode.

---

## Task 3 — Mixing

**Ducking** (`scheduleMusicDuck`):

| Trigger | Duck | Hold |
|---------|------|------|
| Boss attack tell | 80% | 0.5s |
| Mini-boss spawn | 70% | 1.0s |
| Player ultimate | 90% | 0.5s |
| Boss spawn sting | ~5% | 0.9s |

**Pan:** stereo on SFX when `pan` passed (-1…1). Music centered.

**EQ per tier:** implemented as stem balance + BPM (warm calm = pad-heavy; critical = drum-heavy).

---

## Task 4 — Asset checklist (production)

Place under `public/audio/` when ready:

### Music stems (loop 3:00, 48kHz)

- `music/void_pursuit/{pad,drums,bass,melody}.wav`
- `music/stage_{1-5}_layer.wav`
- `music/boss_{theme}.wav`
- `music/victory_stage{1-3,4,5}.wav`
- `music/defeat.wav`

### SFX (0.1–1.5s, sci-fi synth)

See user spec list (`player_shoot_*.wav`, `boss_*.wav`, …). Wire via `loadBuffer()` in `survivalMusic.ts` / `sfx.ts` when files exist.

### Implementation checklist

- [x] Multi-channel engine
- [x] Threat-adaptive stem crossfade
- [x] Boss theme override + HP intensity
- [x] Ducking on key stings
- [x] Ship-specific shoot + pan
- [x] Survival hooks in App loop
- [ ] Replace procedural with authored WAV
- [ ] Accessibility: reduce loud stings toggle
- [ ] Mobile speaker QA

---

## Task 5 — Production notes

- **Genre:** synthwave / cyberpunk — references: Hades, Hotline Miami, FTL.
- **Key:** minor preferred.
- **SFX:** electronic only, short, no room noise, pitch variation on repeats.
- **Sources:** Freesound, Zapsplat, Epidemic (licensed), or custom composer.

---

## Testing

```bash
npm run test -- src/game/audio
```

Manual: survival run, raise threat (augments), trigger boss warp, ult, mini-boss, death. Verify music crossfade and ducking on phone + headphones.
