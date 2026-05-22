# SpaceHero Design System

Brand: high-tech neon survival, terse military sci-fi tone.

## Token layers

| Layer | File |
|-------|------|
| Primitive + semantic + component | `src/styles/design-tokens.css` |
| Relic card UI | `src/styles/relic-card.css` |
| Tailwind reference (v4 uses `@theme` in `index.css`) | `tailwind.config.ts` |

## Relic Vault

- Component: `src/components/relic/RelicCard.tsx`
- Grid tab: `src/game/controls/hangar/RelicVaultTab.tsx`

### Card states

- Unlocked: rarity bar, label, name, description, power, equip CTA
- Locked: overlay, dashed border, unlock hint (no scrap purchase)
- NEW: spinning badge (`spin-badge` 3s, 1.5s on hover)
- Legendary: `legendary-pulse` glow loop
- Equipped: cyan outline

### Grid

- 1 column mobile, 2 tablet (768px+), 3 desktop (1024px+)
- 16px gap (`--primitive-space-lg`)
- Cascade enter: `relic-card-enter` + staggered `animationDelay`

### Rules

- No hardcoded hex in Relic Vault components — use CSS variables only
- `prefers-reduced-motion` disables spin, pulse, hover scale, and enter animation
