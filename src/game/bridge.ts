// Ponte de eventos entre o Phaser (jogo) e o React (HUD, menus, diálogos).

import type { Line } from '../content';

export type DialogLine = Line;

export interface HudState {
  hearts: number;
  heartsTotal: number;
  letter: boolean;
  levelName: string;
}

export interface LevelResult {
  levelId: string;
  levelIndex: number;
  hearts: number;
  heartsTotal: number;
  letter: boolean;
  deaths: number;
  timeMs: number;
}

type Events = {
  hud: HudState;
  hint: string | null;
  dialog: DialogLine[];
  levelComplete: LevelResult;
  pauseRequest: void;
  dialogDone: { dodges: number };
  introSeen: void;
  mapSelect: { label: string; locked: boolean } | null;
  bossDefeated: void;
  scene: 'map' | 'level' | 'boss';
  bossHp: { hp: number; max: number } | null;
};

type Handler<T> = (payload: T) => void;

class Bridge {
  private handlers = new Map<keyof Events, Set<Handler<never>>>();

  on<K extends keyof Events>(event: K, fn: Handler<Events[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    const h = fn as Handler<never>;
    set.add(h);
    return () => set.delete(h);
  }

  emit<K extends keyof Events>(event: K, ...payload: Events[K] extends void ? [] : [Events[K]]): void {
    this.handlers.get(event)?.forEach((fn) => (fn as Handler<Events[K]>)(payload[0] as Events[K]));
  }
}

export const bridge = new Bridge();
