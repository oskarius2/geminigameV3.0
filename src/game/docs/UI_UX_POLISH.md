# SpaceHero UI/UX Polish — Design Reference

Living spec for menus, hangar, survival HUD, tokens, and responsive rules. Implementation tracks this document.

## 1. Start Menu

```
+----------------------------------------------------------+
|  SYS ONLINE                          BEST: 1,250  LONG: 2:45 |
|                                                          |
|                    SPACEHERO (logo pulse)                |
|           SURVIVAL IS THE ONLY VICTORY (tagline)         |
|                                                          |
|              [ START SURVIVAL ]  primary cyan            |
|              [ HANGAR ]            secondary             |
|              [ ON RAILS ]          tertiary              |
|              [ CAMPAIGN ]          tertiary              |
|                                                          |
| v3.0.0 (bottom-left)                                     |
+----------------------------------------------------------+
```

- Background: canvas starfield + CSS nebula (no nebula animation on viewport &lt; 480px).
- Buttons: 32px gap, min-height touch (48px+), cyan border `#00d4ff`, active scale 0.95.
- Meta: `survivalStats` localStorage for best score and longest run.

### Mobile (&lt; 480px)

- Logo scales via `clamp`; full-width buttons with 32px side margins.
- Static starfield only.

## 2. Hangar (4 tabs)

Entry: **Start Survival** → Hangar (Ship tab). **Hangar** from menu → last tab or Ship. **Unlocks** (start menu) → Progress tab.

Meta unlock rules: [META_PROGRESSION.md](./META_PROGRESSION.md).

| Tab | Layout |
|-----|--------|
| Ship Select | Left preview 256px; right 3 ship cards; Confirm Ship |
| Relic Vault | Tokenized relic cards ([DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)); 3-col grid; locked hints; NEW spin badge; equip |
| Loadout | 5 slots + aggregated stat summary |
| Unlocks | Collection %, rarity bars, stage milestone checklist |

Confirm & Launch (survival entry): requires ship selection → `startGame(shipId)`.

## 3. Survival HUD — Z-order (bottom → top)

1. Game canvas  
2. ThreatBar — bottom-center  
3. EquippedLoadoutStrip — bottom-right  
4. ShipHudWidget — top-left  
5. ScorePanel — top-right (score ~48px)  
6. ActiveBuffChips — center-top  
7. Boss HP — top-center when active  
8. BuffCardPicker / ArtifactAcquireOverlay — modal  

## 4. Global Design System

| Token | Value |
|-------|-------|
| Primary | `#00d4ff` |
| Legendary | `#ffd700` |
| Epic | `#9d4edd` |
| Rare | `#3b82f6` |
| Common | `#888888` |
| Danger | `#ff3333` |
| Success | `#33ff88` |

Source: [`uiTokens.ts`](../design/uiTokens.ts), [`hudTokens.ts`](../hud/hudTokens.ts), [`index.css`](../../index.css).

Typography: Space Grotesk (display), Inter (body), JetBrains Mono (stats).

Spacing: 4 / 8 / 16 / 32 / 64 px grid.

## 5. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| &lt; 480px | Single column; modal pickers; no nebula animation |
| 480–768px | 2-col relic grid; scaled typography |
| 768px+ | Desktop layouts per section above |

## 6. Accessibility (future)

- WCAG AA contrast on cyan-on-dark pairs.
- Rarity: text labels + color (colorblind patterns deferred).
- `prefers-reduced-motion`: disables logo pulse, nebula drift, popup shimmers.
- Icon + label on all interactive controls.

## 7. Before / After

Screenshots (add after implementation):

- `docs/screenshots/menu-after.png`
- `docs/screenshots/hangar-vault-after.png`
- `docs/screenshots/hud-after.png`
