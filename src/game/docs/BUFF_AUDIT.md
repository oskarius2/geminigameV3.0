# Survival Mode — Buff / Card Audit

Augment picker, rarity rolls, timing, and balance notes for the **NORMAL** survival run.

---

## A) Rarity rolls (`pickBuffs.ts`)

### Normal pick (`rollRarity(false)`)

| Rarity | Roll range | Probability |
|--------|------------|-------------|
| EXCLUSIVE | `< 0.02` | **2%** |
| LEGENDARY | `< 0.05` | **3%** |
| EPIC | `< 0.15` | **10%** |
| RARE | `< 0.40` | **25%** |
| COMMON | else | **60%** |

### Post-boss pick (`postBossBuffPick` → `rollRarity(true)`)

| Rarity | Cumulative | Probability |
|--------|------------|-------------|
| EXCLUSIVE | 4% | **4%** |
| LEGENDARY | 14% | **10%** |
| EPIC | 38% | **24%** |
| RARE | 72% | **34%** |
| COMMON | 100% | **28%** |

Set on boss kill (`App.tsx`); cleared when `pickBuffs` runs.

### Pity / forced EXCLUSIVE

`pickBuffs` injects EXCLUSIVE when:

- `augmentPityExclusive >= 2`, OR
- `threatLevel >= 25` and exclusives remain in pool

`augmentPityExclusive` increments when a pick set has no exclusive; resets on exclusive hit.

### Pick construction (`pickBuffs`, default **3** cards)

1. Filter: stack < `maxStacks`, not exhausted
2. Boss warp/active: 2× weight on `tags: ['boss']` buffs in normal pool
3. `threatLevel > 60`: prefer high `threatWeight` when pity path used
4. One card per call until `count` (3) reached

**Mystery branch:** 20% chance → `openMysteryCard` instead of normal picker (`App.tsx`).

---

## B) Card timing (`cardTiming.ts`)

```ts
base = 20 + random(0..4)     // 20–24
buffDiscount = min(8, passives * 0.8)
stageDiscount = min(6, (stage - 1) * 1.2)
interval = max(12, base - buffDiscount - stageDiscount)
```

### Examples

| Passives | Stage | Interval range |
|----------|-------|----------------|
| 0 | 1 | 12–24 s |
| 5 | 1 | 12–20 s |
| 10 | 5 | **12** s (floor) |
| 0 | 5 | 15.2–19.2 s |

### Timer integration (`App.tsx`)

- `cardTimer -= dt * (16.67/1000)` each frame (~real seconds)
- On `<= 0`: reset interval, open picker, **`isPaused = true`**
- Run start: `cardTimer: 15` → first card ~15s in
- Stage clear: new interval assigned + immediate `openBuffPicker`

### Design impact

| Effect | Severity |
|--------|----------|
| Interval floors at **12s** | Cards every 12–24s all run |
| More passives → **shorter** interval (up to −8s) | Snowball: more buffs → more buffs |
| Higher stage → **shorter** interval (up to −6s) | Late game constant interruption |
| Picker **pauses** combat | Flow broken every wave |
| 20% mystery on top | Extra rules mid-run |

**User-facing:** "Cards come all the more often the longer you play" — accurate.

---

## C) `PASSIVE_BUFFS` inventory (`content/buffs.ts`)

**Total definitions:** **65** buffs in `PASSIVE_BUFFS` object.

### Count by `rarity` field

| Rarity | Count |
|--------|-------|
| COMMON | 8 |
| RARE | 13 |
| EPIC | 13 |
| LEGENDARY | 11 |
| EXCLUSIVE | 11 (incl. `carlsson_mode` + 10 `exclusive: true`) |
| MYSTERY | 6 (`mys_*`) |

### EXCLUSIVE / build-defining (high `threatWeight`)

Examples: `carlsson_mode`, `multishot_apocalypse`, `bullet_storm`, `infinity_pierce`, `orbital_legion`, `chain_god`, `glass_cannon_omega`, `kill_satellite`, `void_rift`, `cursed_ammo`, `neon_blood`, `chrono_glitch`.

### Boss-tagged (`tags: ['boss']`)

`boss_slayer`, `arena_stabilizer`, `salvage_radar`, `tyrant_fury`, `hive_bulwark`, `void_hunter`, `regent_protocol`, `crimson_overdrive`.

### Tag themes (synergy clusters)

| Tag cluster | Example buffs |
|-------------|----------------|
| damage / fire | `dmg_up`, `burn_dot`, `hunter_mark`, `tyrant_fury` |
| crit / chain | `crit_up`, `chain_crit`, `chain_god` |
| defense | `shield_up`, `thorns`, `emergency_shield`, `hive_bulwark` |
| mobility | `speed_up`, `dash_iframes`, `overcharge_dash` |
| economy / meta | `score_burst`, `salvage_radar`, `regent_protocol` |
| chaos / curse | `cursed_ammo`, `glass_cannon_omega`, `volatile_death` |

### Likely weak picks (low impact vs opportunity cost)

| Buff | Why |
|------|-----|
| `score_burst` | Score doesn't save run |
| `magnet_up` | QoL, not power spike |
| `bounce_up` | Niche without ricochet stack |
| `wide_arc` | Small unless multishot stacked |
| `mys_scrap_tax` | Mystery downside |

### Strong picks (run-shaping)

| Buff | Why |
|------|-----|
| `multishot_apocalypse` / `bullet_storm` | Multiplicative DPS |
| `infinity_pierce` | Screen clear |
| `chain_god` / `chain_crit` | Scaling crit builds |
| `void_rift` | Periodic wipe |
| `tyrant_fury` | Boss damage + ult refill |
| `emergency_shield` / `regen_up` | Survival floor |

### `applyBuff.ts` side effects

Many passives flip **boolean flags** on `GameState` (`hasVoidRift`, `volatileDeath`, etc.) — stacking same id respects `maxStacks`.

---

## D) Issues summary

| # | Issue | Detail |
|---|-------|--------|
| 1 | **Cards too frequent** | 12–24s floor; discounts push to 12s constantly |
| 2 | **60% COMMON feels flat** | Most picks are +10% stat sticks |
| 3 | **Choice overload** | 3 cards × many times = no single identity |
| 4 | **No WOW pacing** | EXCLUSIVE 2% / pity at 25 threat = late lottery |
| 5 | **Pause friction** | Every card stops game (`isPaused`) |
| 6 | **Post-boss only bump** | 28% COMMON still post-boss |
| 7 | **Threat ↔ buff spiral** | More buffs → higher threat → harder enemies → need more buffs |
| 8 | **Mystery 20%** | Unmapped risk in timing doc until now |
| 9 | **Stage clear + timer** | Double buff sources (boss kill doesn't open picker; stage end does) |
| 10 | **MYSTERY rarity** | Separate from roll table — only via mystery door |

---

## Threat ↔ augment tier (`augmentTiers.ts`)

| Passives count | Tier | threatFactor | enemyHpMult | spawnChanceMult |
|----------------|------|--------------|-------------|-----------------|
| 0–1 | 0 | 0.10 | 1.0 | 0.92 |
| 2–3 | 1 | 0.25 | 1.1 | 0.96 |
| 4–6 | 2 | 0.45 | 1.25 | 1.0 |
| 7–9 | 3 | 0.65 | 1.4 | 1.03 |
| 10+ | 4 | 0.85 | 1.55 | 1.06 |

`computeThreatLevel` also adds per-passive score → feeds spawn difficulty and EXCLUSIVE pity.

---

## File index

| File | Role |
|------|------|
| `src/game/buffs/pickBuffs.ts` | rarity, 3-choice selection |
| `src/game/buffs/cardTiming.ts` | interval seconds |
| `src/game/buffs/applyBuff.ts` | apply effects to state |
| `src/game/content/buffs.ts` | `PASSIVE_BUFFS` definitions |
| `src/game/types.ts` | `BuffRarity`, `PassiveBuff` |
| `src/App.tsx` | card timer, open picker, pause |
