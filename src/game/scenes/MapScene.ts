import * as Phaser from 'phaser';
import { bridge } from '../bridge';
import { InputReader } from '../input';
import type { Progress } from '../progress';
import { mapText } from '../../content';
import { playSfx, setMusicTheme } from '../../audio';

const T = 16; // blocos do Tiny Town
const LEVEL_IDS = ['sky', 'garden', 'city'];
const COLS = 30;
const ROWS = 14;

// Índices do spritesheet Tiny Town (Kenney).
const TT = {
  grass: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2],
  path: 40,
  trees: [3, 4, 5, 27, 29],
  fence: 81,
  beehive: 94,
  sign: 83,
  castle: [
    [99, 100, 101],
    [111, 112, 113],
    [123, 124, 125],
  ],
  house: [
    [52, 53, 54],
    [76, 77, 78],
  ],
};

interface Node {
  x: number; // bloco
  y: number;
  label: string;
  /** Índice da fase, -1 = casa, 99 = castelo. */
  level: number;
}

const NODES: Node[] = [
  { x: 3, y: 10, label: mapText.home, level: -1 },
  { x: 9, y: 7, label: 'Fase 1 · Céu Estrelado', level: 0 },
  { x: 15, y: 10, label: 'Fase 2 · Jardim Florido', level: 1 },
  { x: 21, y: 6, label: 'Fase 3 · Cidade à Noite', level: 2 },
  { x: 26, y: 3, label: mapText.castle, level: 99 },
];

/** Caminho em "L" entre dois nós (lista de blocos). */
function pathBetween(a: Node, b: Node): [number, number][] {
  const cells: [number, number][] = [];
  const sx = Math.sign(b.x - a.x);
  for (let x = a.x; x !== b.x; x += sx) cells.push([x, a.y]);
  const sy = Math.sign(b.y - a.y);
  for (let y = a.y; y !== b.y; y += sy) cells.push([b.x, y]);
  cells.push([b.x, b.y]);
  return cells;
}

export class MapScene extends Phaser.Scene {
  private reader!: InputReader;
  private hero!: Phaser.GameObjects.Sprite;
  private nodeIndex = 0;
  private moving = false;
  private progress!: Progress;
  private unlockedNodes = 1;
  private pathLayer: Phaser.GameObjects.Image[][] = [];

  constructor() {
    super('map');
  }

  init(data: { from?: number; reveal?: boolean }): void {
    this.progress = this.registry.get('progress') as Progress;
    // Nó 0 = casa; fase i fica no nó i+1. Castelo abre depois das 3 fases.
    this.unlockedNodes = Math.min(NODES.length, this.progress.completed + 2);
    this.nodeIndex = data.from !== undefined ? data.from + 1 : Math.min(this.progress.completed + 1, NODES.length - 1);
    this.moving = false;
    this.pathLayer = [];
    this.registry.set('mapReveal', data.reveal ? this.unlockedNodes - 1 : -1);
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#3fa34d');
    const W = COLS * T;
    const H = ROWS * T;

    // Grama com variações e um rio de nuvens ao redor do castelo.
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = TT.grass[(x * 7 + y * 13 + ((x * y) >> 1)) % TT.grass.length];
        this.add.image(x * T, y * T, 'town', v).setOrigin(0);
      }
    }

    const occupied = new Set<string>();
    const mark = (x: number, y: number) => occupied.add(`${x},${y}`);

    // Caminhos (só os desbloqueados aparecem; o último pode surgir animado).
    const reveal = this.registry.get('mapReveal') as number;
    for (let i = 0; i < NODES.length - 1; i++) {
      const cells = pathBetween(NODES[i], NODES[i + 1]);
      cells.forEach(([x, y]) => mark(x, y));
      const imgs = cells.map(([x, y]) => this.add.image(x * T, y * T, 'town', TT.path).setOrigin(0).setDepth(1));
      this.pathLayer.push(imgs);
      const unlocked = i + 1 < this.unlockedNodes;
      if (!unlocked) imgs.forEach((im) => im.setAlpha(0.18).setTint(0x2d6b35));
      if (unlocked && i + 1 === reveal) {
        imgs.forEach((im, k) => {
          im.setAlpha(0);
          this.tweens.add({ targets: im, alpha: 1, delay: 300 + k * 70, duration: 200 });
        });
        this.time.delayedCall(300 + imgs.length * 70, () => playSfx('checkpoint'));
      }
    }

    // Casa e castelo.
    const home = NODES[0];
    TT.house.forEach((row, ry) => row.forEach((f, rx) => {
      this.add.image((home.x - 1 + rx) * T, (home.y - 2 + ry) * T, 'town', f).setOrigin(0).setDepth(2);
      mark(home.x - 1 + rx, home.y - 2 + ry);
    }));
    const castle = NODES[NODES.length - 1];
    const cloud = this.add.ellipse((castle.x + 0.5) * T, (castle.y - 0.5) * T, 7 * T, 4.6 * T, 0xfff7ec, 0.55).setDepth(2);
    this.tweens.add({ targets: cloud, scaleX: 1.06, duration: 1400, yoyo: true, repeat: -1 });
    TT.castle.forEach((row, ry) => row.forEach((f, rx) => {
      const img = this.add.image((castle.x - 1 + rx) * T, (castle.y - 3 + ry) * T, 'town', f).setOrigin(0).setDepth(3);
      if (this.unlockedNodes < NODES.length) img.setTint(0x8c88a0);
      mark(castle.x - 1 + rx, castle.y - 3 + ry);
    }));
    if (this.unlockedNodes >= NODES.length) {
      const tedio = this.add.image((castle.x + 0.5) * T, (castle.y - 4.4) * T, 'tedio', 1).setScale(0.45).setDepth(4);
      this.tweens.add({ targets: tedio, y: tedio.y - 4, duration: 900, yoyo: true, repeat: -1 });
    }

    // Árvores e enfeites onde não há caminho.
    for (let i = 0; i < 70; i++) {
      const x = (i * 37 + 11) % COLS;
      const y = (i * 23 + 5) % ROWS;
      if (occupied.has(`${x},${y}`) || NODES.some((n) => Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1)) continue;
      mark(x, y);
      const f = i % 9 === 0 ? TT.beehive : TT.trees[i % TT.trees.length];
      this.add.image(x * T, y * T, 'town', f).setOrigin(0).setDepth(2);
    }

    // Marcadores das fases.
    NODES.forEach((n, i) => {
      if (n.level < 0 || n.level === 99) return;
      const done = !!this.progress.results[LEVEL_IDS[n.level]];
      const open = i < this.unlockedNodes;
      const color = done ? 0xff4f9a : open ? 0xffd166 : 0x6d6880;
      const g = this.add.circle((n.x + 0.5) * T, (n.y + 0.5) * T, 7, color).setDepth(3).setStrokeStyle(2, 0x2b1633);
      if (open && !done) this.tweens.add({ targets: g, scale: 1.2, duration: 600, yoyo: true, repeat: -1 });
      const icon = done ? 'mascot' : open ? 'spark' : null;
      if (icon) this.add.image(g.x, g.y, icon).setDepth(4).setScale(done ? 0.55 : 1.4);
      if (done && this.progress.results[LEVEL_IDS[n.level]]?.letter) {
        this.add.image(g.x + 9, g.y - 8, 'letter').setDepth(5).setScale(0.6);
      }
    });

    const start = NODES[this.nodeIndex];
    this.hero = this.add.sprite((start.x + 0.5) * T, (start.y + 0.5) * T + 4, 'hero', 0).setOrigin(0.5, 1).setDepth(10);
    if (!this.anims.exists('hero-idle')) {
      this.anims.create({ key: 'hero-idle', frames: this.anims.generateFrameNumbers('hero', { frames: [0, 1] }), frameRate: 2, repeat: -1 });
      this.anims.create({ key: 'hero-run', frames: this.anims.generateFrameNumbers('hero', { frames: [2, 3, 4, 5] }), frameRate: 12, repeat: -1 });
    }
    this.hero.play('hero-idle');

    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, H);
    cam.startFollow(this.hero, true, 0.15, 0.15);
    cam.setRoundPixels(true);

    // Toque direto num marcador.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const tx = Math.floor(p.worldX / T);
      const ty = Math.floor(p.worldY / T);
      const target = NODES.findIndex((n) => Math.abs(n.x - tx) <= 1 && Math.abs(n.y - ty) <= 1);
      if (target < 0 || this.moving) return;
      if (target === this.nodeIndex) this.enter();
      else void this.walkTo(target);
    });

    bridge.emit('scene', 'map');
    setMusicTheme('map');
    this.reader = new InputReader(this);
    this.events.on('resume', () => this.reader.sync());
    this.events.once('shutdown', () => bridge.emit('mapSelect', null));
    this.announce();
  }

  update(): void {
    const c = this.reader.read();
    if (c.pausePressed) bridge.emit('pauseRequest');
    if (this.moving) return;
    if (c.right) void this.walkTo(this.nodeIndex + 1);
    else if (c.left) void this.walkTo(this.nodeIndex - 1);
    else if (c.jumpPressed || c.actionPressed) this.enter();
  }

  private announce(): void {
    const n = NODES[this.nodeIndex];
    const locked = this.nodeIndex >= this.unlockedNodes;
    let label = n.label;
    if (n.level >= 0 && n.level !== 99) label = mapText.enter(n.label);
    if (n.level === 99) label = this.unlockedNodes >= NODES.length ? mapText.enter(n.label) : mapText.locked;
    bridge.emit('mapSelect', { label, locked });
  }

  private async walkTo(target: number): Promise<void> {
    if (target < 0 || target >= NODES.length || target >= this.unlockedNodes) {
      if (target >= this.unlockedNodes && target < NODES.length) {
        playSfx('error');
        bridge.emit('mapSelect', { label: mapText.locked, locked: true });
      }
      return;
    }
    this.moving = true;
    const step = Math.sign(target - this.nodeIndex);
    while (this.nodeIndex !== target) {
      const a = NODES[this.nodeIndex];
      const b = NODES[this.nodeIndex + step];
      const cells = step > 0 ? pathBetween(a, b) : pathBetween(b, a).reverse();
      this.hero.play('hero-run', true);
      for (const [x, y] of cells) {
        this.hero.setFlipX(x * T + T / 2 < this.hero.x);
        await new Promise<void>((resolve) =>
          this.tweens.add({ targets: this.hero, x: (x + 0.5) * T, y: (y + 0.5) * T + 4, duration: 70, onComplete: () => resolve() }),
        );
      }
      this.nodeIndex += step;
    }
    this.hero.play('hero-idle');
    playSfx('tap');
    this.moving = false;
    this.announce();
  }

  private enter(): void {
    const n = NODES[this.nodeIndex];
    if (n.level < 0) return;
    if (n.level === 99) {
      if (this.unlockedNodes < NODES.length) {
        playSfx('error');
        return;
      }
      playSfx('success');
      this.cameras.main.fadeOut(400, 11, 8, 32);
      this.time.delayedCall(420, () => this.scene.start('boss'));
      return;
    }
    playSfx('success');
    this.cameras.main.fadeOut(400, 11, 8, 32);
    this.time.delayedCall(420, () => this.scene.start('level', { levelIndex: n.level }));
  }
}
