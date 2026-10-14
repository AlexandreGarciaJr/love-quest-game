import * as Phaser from 'phaser';
import { TILE } from '../config';

/** Inimigo genérico: qualquer coisa que morre com pisão ou soco. */
export interface Enemy extends Phaser.Physics.Arcade.Sprite {
  alive: boolean;
  squash(): void;
  update(time: number, delta: number): void;
}

/** Abelha: voa em vai-e-vem com leve ondulação. Não tem gravidade. */
export class Bee extends Phaser.Physics.Arcade.Sprite implements Enemy {
  declare body: Phaser.Physics.Arcade.Body;
  alive = true;
  private homeX: number;
  private homeY: number;
  private phase = Math.random() * Math.PI * 2;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private range: number,
    private vertical: boolean,
  ) {
    super(scene, x, y, 'bee', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.homeX = x;
    this.homeY = y;
    this.body.setAllowGravity(false);
    this.body.setSize(9, 6).setOffset(2, 3);
    this.setDepth(8);
    if (!scene.anims.exists('bee-fly')) {
      scene.anims.create({ key: 'bee-fly', frames: scene.anims.generateFrameNumbers('bee', { frames: [0, 1] }), frameRate: 14, repeat: -1 });
    }
    this.anims.play('bee-fly');
  }

  update(time: number): void {
    if (!this.alive) return;
    const t = time / 1000 + this.phase;
    const offset = Math.sin(t * 1.4) * this.range * TILE;
    if (this.vertical) {
      this.setPosition(this.homeX + Math.sin(t * 3) * 3, this.homeY + offset);
    } else {
      this.setPosition(this.homeX + offset, this.homeY + Math.sin(t * 4) * 4);
      this.setFlipX(Math.cos(t * 1.4) > 0);
    }
    this.body.updateFromGameObject();
  }

  squash(): void {
    this.alive = false;
    this.body.enable = false;
    this.anims.stop();
    this.scene.tweens.add({ targets: this, y: this.y + 30, angle: 180, alpha: 0, duration: 400, onComplete: () => this.destroy() });
  }
}

/** Pombo burocrata: anda devagar e carimba quem chegar perto. */
export class Pigeon extends Phaser.Physics.Arcade.Sprite implements Enemy {
  declare body: Phaser.Physics.Arcade.Body;
  alive = true;
  private dir = -1;
  private nextShot = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private layer: Phaser.Tilemaps.TilemapLayer,
    private target: () => Phaser.GameObjects.Sprite,
    private shoot: (x: number, y: number, dir: number) => void,
  ) {
    super(scene, x, y, 'pigeon', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(12, 9).setOffset(2, 2);
    this.setDepth(8);
    if (!scene.anims.exists('pigeon-walk')) {
      scene.anims.create({ key: 'pigeon-walk', frames: scene.anims.generateFrameNumbers('pigeon', { frames: [0, 1] }), frameRate: 5, repeat: -1 });
    }
    this.anims.play('pigeon-walk');
    this.nextShot = scene.time.now + 1200 + Math.random() * 800;
  }

  update(time: number): void {
    if (!this.alive) return;
    const body = this.body;
    const player = this.target();
    const dx = player.x - this.x;
    const near = Math.abs(dx) < 9 * TILE && Math.abs(player.y - this.y) < 3 * TILE;

    if (near) {
      // Para, olha para a pessoa e carimba de tempos em tempos.
      body.setVelocityX(0);
      this.dir = dx > 0 ? 1 : -1;
      if (time > this.nextShot) {
        this.nextShot = time + 2000;
        this.scene.tweens.add({ targets: this, scaleY: 0.85, duration: 90, yoyo: true });
        this.shoot(this.x + this.dir * 8, this.y - 7, this.dir);
      }
    } else {
      if (body.blocked.left) this.dir = 1;
      else if (body.blocked.right) this.dir = -1;
      else if (body.blocked.down) {
        const aheadX = this.dir > 0 ? body.right + 2 : body.left - 2;
        const tile = this.layer.getTileAtWorldXY(aheadX, body.bottom + 2);
        if (!tile || tile.index < 0) this.dir *= -1;
      }
      body.setVelocityX(this.dir * 18);
    }
    this.setFlipX(this.dir > 0);
  }

  squash(): void {
    this.alive = false;
    this.body.enable = false;
    this.anims.stop();
    this.scene.tweens.add({ targets: this, scaleY: 0.2, scaleX: 1.4, alpha: 0, duration: 260, onComplete: () => this.destroy() });
  }
}

/** Gera (uma vez por largura) a textura de uma plataforma com `len` blocos. */
export function platformTexture(scene: Phaser.Scene, tilesKey: string, frames: number[], key: string): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, frames.length * TILE, TILE)!;
  const ctx = tex.getContext();
  const src = scene.textures.get(tilesKey);
  frames.forEach((f, i) => {
    const fr = src.get(f);
    ctx.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, TILE, TILE, i * TILE, 0, TILE, TILE);
  });
  tex.refresh();
  return key;
}

/** Plataforma móvel (vai e volta). Carrega quem estiver em cima. */
export class Mover extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  private ax: number;
  private ay: number;
  private bx: number;
  private by: number;
  private toB = true;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, dx: number, dy: number, private speed: number) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0, 0).setDepth(4);
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;
    this.ax = x;
    this.ay = y;
    this.bx = x + dx * TILE;
    this.by = y - dy * TILE;
  }

  update(): void {
    const tx = this.toB ? this.bx : this.ax;
    const ty = this.toB ? this.by : this.ay;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      this.toB = !this.toB;
      this.body.setVelocity(0, 0);
      return;
    }
    this.body.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
  }
}

/** Plataforma que treme e cai pouco depois de alguém pisar; volta depois. */
export class Faller extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;
  private homeX: number;
  private homeY: number;
  private phase: 'idle' | 'shaking' | 'falling' = 'idle';

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0, 0).setDepth(4);
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.checkCollision.down = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;
    this.homeX = x;
    this.homeY = y;
  }

  /** Chamado quando a personagem está em cima. */
  stepped(): void {
    if (this.phase !== 'idle') return;
    this.phase = 'shaking';
    this.scene.tweens.add({
      targets: this,
      x: this.homeX + 1,
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.x = this.homeX;
        this.phase = 'falling';
        this.body.setAllowGravity(true);
        this.body.checkCollision.up = false;
        this.scene.tweens.add({ targets: this, alpha: 0, delay: 500, duration: 300 });
        this.scene.time.delayedCall(3000, () => this.reset());
      },
    });
  }

  private reset(): void {
    this.phase = 'idle';
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.body.checkCollision.up = true;
    this.body.reset(this.homeX, this.homeY);
    this.setAlpha(0);
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 300 });
  }
}
