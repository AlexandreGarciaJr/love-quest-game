// Progresso salvo só no aparelho (localStorage). Nada vai para servidor.

import type { Profile } from '../content';
import type { LevelResult } from './bridge';

export interface Progress {
  /** Quantas fases já foram concluídas (desbloqueia a próxima no mapa). */
  completed: number;
  results: Record<string, LevelResult>;
  introSeen: boolean;
}

export interface SaveData {
  version: 1;
  profile: Profile;
  progress: Progress;
}

const KEY = 'love-quest:save';

export const emptyProgress = (): Progress => ({ completed: 0, results: {}, introSeen: false });

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data?.version !== 1 || !data.profile?.playerName) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(profile: Profile, progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, profile, progress } satisfies SaveData));
  } catch {
    /* sem armazenamento: o jogo segue funcionando, só não salva */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada a fazer */
  }
}

/** Registra o resultado de uma fase (mantém o melhor número de corações). */
export function withResult(progress: Progress, r: LevelResult): Progress {
  const prev = progress.results[r.levelId];
  const best: LevelResult = prev
    ? { ...r, hearts: Math.max(prev.hearts, r.hearts), letter: prev.letter || r.letter }
    : r;
  return {
    ...progress,
    completed: Math.max(progress.completed, r.levelIndex + 1),
    results: { ...progress.results, [r.levelId]: best },
  };
}
