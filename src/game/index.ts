import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LevelScene } from './scenes/LevelScene';
import { MapScene } from './scenes/MapScene';
import { BossScene } from './scenes/BossScene';
import type { Progress } from './progress';
import type { Profile } from '../content';

export interface GameOptions {
  parent: HTMLElement;
  profile: Profile;
  progress: Progress;
  width: number;
  height: number;
}

export function createGame({ parent, profile, progress, width, height }: GameOptions): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width,
    height,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#0b0820',
    scale: { mode: Phaser.Scale.NONE },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
    input: { gamepad: false },
    audio: { noAudio: true },
    banner: false,
    // ?lqtimer (só em dev): roda o loop com setTimeout, para testes com a aba em segundo plano.
    fps: { forceSetTimeOut: import.meta.env.DEV && location.search.includes('lqtimer'), target: 60 },
    scene: [BootScene, LevelScene, MapScene, BossScene],
  });
  game.registry.set('profile', profile);
  game.registry.set('progress', progress);
  // Gancho só em desenvolvimento, para testes automatizados no navegador.
  if (import.meta.env.DEV) (window as unknown as { __lqGame?: Phaser.Game }).__lqGame = game;
  return game;
}
