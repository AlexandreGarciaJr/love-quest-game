import type { LevelData } from './builder';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';

/** Ordem das fases. Mantenha LEVEL_COUNT (count.ts) igual ao tamanho desta lista. */
export const LEVELS: (() => LevelData)[] = [level1, level2, level3];
