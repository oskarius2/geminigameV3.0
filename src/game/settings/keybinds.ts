export type KeybindAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'dash'
  | 'ultimate'
  | 'weaponSwap'
  | 'weaponA'
  | 'weaponB'
  | 'pause'
  | 'achievements'
  | 'companionAbility';

export const KEYBIND_STORAGE_KEY = 'spacehero_keybinds_v1';

export const KEYBIND_META: Record<
  KeybindAction,
  { label: string; hint: string; category: 'movement' | 'combat' | 'ui' }
> = {
  moveUp: { label: 'Move up', hint: 'Hold to fly forward', category: 'movement' },
  moveDown: { label: 'Move down', hint: 'Hold to fly back', category: 'movement' },
  moveLeft: { label: 'Move left', hint: 'Strafe port', category: 'movement' },
  moveRight: { label: 'Move right', hint: 'Strafe starboard', category: 'movement' },
  dash: { label: 'Dash', hint: 'Burst dodge (survival)', category: 'combat' },
  ultimate: { label: 'Ultimate', hint: 'Spend full charge', category: 'combat' },
  weaponSwap: { label: 'Swap weapon', hint: 'Cycle cannons', category: 'combat' },
  weaponA: { label: 'Cannon A', hint: 'Primary slot', category: 'combat' },
  weaponB: { label: 'Cannon B', hint: 'Secondary slot', category: 'combat' },
  companionAbility: {
    label: 'Companion ability',
    hint: 'Force active skill',
    category: 'combat',
  },
  pause: { label: 'Pause', hint: 'Pause / resume', category: 'ui' },
  achievements: { label: 'Achievements', hint: 'Toggle toast stack', category: 'ui' },
};

export const DEFAULT_KEYBINDS: Record<KeybindAction, string> = {
  moveUp: 'w',
  moveDown: 's',
  moveLeft: 'a',
  moveRight: 'd',
  dash: ' ',
  ultimate: 'e',
  weaponSwap: 'q',
  weaponA: '1',
  weaponB: '2',
  pause: 'escape',
  achievements: 'h',
  companionAbility: 'r',
};

export const ALL_KEYBIND_ACTIONS = Object.keys(DEFAULT_KEYBINDS) as KeybindAction[];

const CATEGORY_ORDER: KeybindAction['category'][] = ['movement', 'combat', 'ui'];

export function keybindsByCategory(): { category: string; actions: KeybindAction[] }[] {
  const labels: Record<KeybindAction['category'], string> = {
    movement: 'Movement',
    combat: 'Combat',
    ui: 'Interface',
  };
  return CATEGORY_ORDER.map((category) => ({
    category: labels[category],
    actions: ALL_KEYBIND_ACTIONS.filter((a) => KEYBIND_META[a].category === category),
  }));
}

export function loadKeybinds(): Record<KeybindAction, string> {
  try {
    const raw = localStorage.getItem(KEYBIND_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_KEYBINDS };
    const parsed = JSON.parse(raw) as Partial<Record<KeybindAction, string>>;
    const merged = { ...DEFAULT_KEYBINDS };
    for (const action of ALL_KEYBIND_ACTIONS) {
      const v = parsed[action];
      if (typeof v === 'string' && v.length > 0) merged[action] = v.toLowerCase();
    }
    return merged;
  } catch {
    return { ...DEFAULT_KEYBINDS };
  }
}

export function saveKeybinds(binds: Record<KeybindAction, string>): void {
  localStorage.setItem(KEYBIND_STORAGE_KEY, JSON.stringify(binds));
}

export function formatKeyDisplay(code: string): string {
  const c = code.toLowerCase();
  const map: Record<string, string> = {
    ' ': 'SPACE',
    escape: 'ESC',
    arrowup: 'UP',
    arrowdown: 'DOWN',
    arrowleft: 'LEFT',
    arrowright: 'RIGHT',
  };
  return map[c] ?? c.toUpperCase();
}

/** Match keyboard event to stored bind (lowercase key or "escape"). */
export function keyMatches(bind: string, e: KeyboardEvent): boolean {
  const b = bind.toLowerCase();
  if (b === 'escape') return e.key === 'Escape';
  return e.key.toLowerCase() === b;
}

export function eventToBindKey(e: KeyboardEvent): string | null {
  if (e.key === 'Escape') return 'escape';
  if (e.key === ' ') return ' ';
  if (e.key.length === 1) return e.key.toLowerCase();
  if (e.key.startsWith('Arrow')) return e.key.toLowerCase();
  return null;
}
