import * as Phaser from 'phaser';
import { createTextures } from '../sprites';
import { createWorldTextures } from '../worldSprites';
import { createThemeTextures } from '../themes';
import type { Progress } from '../progress';
import type { Profile } from '../../content';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.spritesheet('tiles', '/assets/kenney/platformer/tiles.png', { frameWidth: 18, frameHeight: 18 });
    this.load.spritesheet('town', '/assets/kenney/town/tiles.png', { frameWidth: 16, frameHeight: 16 });
  }

  create(): void {
    const profile = this.registry.get('profile') as Profile;
    createTextures(this, profile.playerGender, profile.partnerGender);
    createWorldTextures(this);
    createThemeTextures(this);

    // Primeira vez: vai direto para a Fase 1 (com a abertura). Depois, para o mapa.
    const progress = this.registry.get('progress') as Progress;
    if (progress.completed === 0) this.scene.start('level', { levelIndex: 0 });
    else this.scene.start('map', {});
  }
}
