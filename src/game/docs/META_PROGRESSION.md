# Meta Progression — Implementation

Unified persistence and run-only unlocks for SpaceHero survival mode. Achievements (spec section 10) are **not** implemented in this pass.

See also: [UI_UX_POLISH.md](./UI_UX_POLISH.md) (Hangar tabs, NEW badges, start menu).

## Storage

| Key | Purpose |
|-----|---------|
| `spaceheroMetaProgress` | Versioned `MetaProgress` blob (v1) |
| `metaScrap` (via `lib/metaStore.ts`) | Banked scrap — not used to buy relics |
| `companionProgress_v1` | Companion XP/levels (legacy, still authoritative for XP math) |

### Migration (first load)

Legacy keys are merged once into `spaceheroMetaProgress`:

- `unlockedArtifacts` (JSON array)
- `survivalHighScore` / `survivalLongestSeconds`
- `companionsUnlocked_v1`

## Unlock rules

### Artifacts (permanent, run-sourced only)

| Source | Handler |
|--------|---------|
| Stage clear milestones | `grantStageMilestoneUnlocks(clearedStage)` in `unlockSystem.ts` |
| Buff/artifact card pick | `unlockArtifact` via App `persistArtifactUnlock` |
| Artifact unlock picker | same |
| Mini-boss reward | same |
| Kill loot (`vault_artifact`) | `rollLootOnKill` → `persistArtifactUnlock` |

**No scrap purchase** in Relic Vault. Locked cards show hints from `unlockHints.ts`.

Stage milestone counts (approximate): Stage 1 → 3 common; 2 → 5 rare; 3 → 8 epic; 4 → 4 legendary; 5+ → 2 exclusive.

### Companions

- Default: **none** unlocked (fixed from old “all four unlocked” bug).
- First companion: entering Stage 2 (`clearedStage === 1` in App) + `shouldGrantFirstCompanion` in loot.
- Extra companions: kill rolls — 0% stage 2, 5% stage 3, 8% stage 4, 10% stage 5+.

## API (`meta/metaProgress.ts`)

- `getMetaProgress` / `saveMetaProgress` / `migrateFromLegacyStorage`
- `unlockArtifact` / `unlockCompanion` (idempotent, sets `pendingNew*` + `runUnlocksSnapshot`)
- `recordStatDelta` — kills, scrap earned, playtime
- `recordPersonalBest` — high score, longest run
- `clearNewUnlockBadges` — when opening Vault / Unlocks tab or companion select
- `getRunUnlocks` — end-of-run summary section

## UI

| Surface | Behavior |
|---------|----------|
| Start menu | **Unlocks** → Hangar progress tab; dot if pending NEW |
| Hangar → Relic Vault | Hints, NEW badge, sort (new / locked first); no scrap buttons |
| Hangar → Unlocks | Collection %, rarity bars, stage checklist |
| Companion select | Locked silhouette + hint; NEW badge; clears companion NEW on open |
| Run summary | **New unlocks this run**, personal best callout, **View in Vault** |
| In-run | `UnlockToastStack` for first artifact/companion unlock and PB toasts |

## Stats tracked

`stats.totalKills`, `totalScrapEarned`, `totalTimePlayed`, `highScore`, `longestRunSeconds` — flushed on kill, scrap bank, game over playtime, and `recordSurvivalRun`.

## Verification

1. Fresh save: starters only, 0 companions.
2. Clear Stage 1: ~3 commons in vault with NEW.
3. Pick artifact card → permanent unlock + toast.
4. Mini-boss / high-stage kills → occasional vault unlock.
5. Stage 2 → first companion.
6. Migration: old `unlockedArtifacts` array imports once.

Tests: `metaProgress.test.ts`, `unlockSystem.test.ts`, `lootDropController.test.ts` (companion %).
