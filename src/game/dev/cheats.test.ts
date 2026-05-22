import { describe, expect, it } from 'vitest';
import { BOSS_DEFINITIONS } from '../content/bosses';
import { resolveDevBoss } from './cheats';

describe('dev cheats', () => {
  it('resolves boss by id and index', () => {
    expect(resolveDevBoss('hive_queen')?.id).toBe('hive_queen');
    expect(resolveDevBoss(0)?.id).toBe(BOSS_DEFINITIONS[0].id);
    expect(resolveDevBoss('not_a_boss')).toBeNull();
  });
});
