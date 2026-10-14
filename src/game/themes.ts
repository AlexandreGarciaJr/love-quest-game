// Fundos com parallax e blocos de cada tema (céu, jardim, cidade).

import * as Phaser from 'phaser';
import { TILE } from './config';
import type { Theme } from './levels/builder';

export interface TileSet {
  key: string;
  groundTop: { single: number; left: number; mid: number; right: number };
  groundFill: number[];
  block: { single: number; left: number; mid: number; right: number };
  cloud: { single: number; left: number; mid: number; right: number };
}

const KENNEY: TileSet = {
  key: 'tiles',
  groundTop: { single: 20, left: 21, mid: 22, right: 23 },
  groundFill: [122],
  block: { single: 0, left: 1, mid: 2, right: 3 },
  cloud: { single: 156, left: 153, mid: 154, right: 155 },
};

const CITY: TileSet = {
  key: 'city-tiles',
  groundTop: { single: 0, left: 1, mid: 2, right: 3 },
  groundFill: [4, 5, 4, 4],
  block: { single: 6, left: 7, mid: 8, right: 9 },
  cloud: { single: 10, left: 11, mid: 12, right: 13 },
};

export function tilesetFor(theme: Theme): TileSet {
  return theme === 'city' ? CITY : KENNEY;
}

// ------------------------------------------------------------------ Texturas

let created = false;

/** Desenha (uma vez) as texturas de fundo e os blocos da cidade. */
export function createThemeTextures(scene: Phaser.Scene): void {
  if (created && scene.textures.exists('bg-stars')) return;
  created = true;
  const rand = mulberry32(7);

  // Estrelas
  const stars = canvas(scene, 'bg-stars', 256, 160);
  for (let i = 0; i < 70; i++) {
    const big = rand() < 0.15;
    stars.fillStyle = rand() < 0.2 ? '#ffc2dc' : '#fff7ec';
    stars.globalAlpha = 0.4 + rand() * 0.6;
    const x = Math.floor(rand() * 256);
    const y = Math.floor(rand() * 160);
    stars.fillRect(x, y, 1, 1);
    if (big) {
      stars.fillRect(x - 1, y, 3, 1);
      stars.fillRect(x, y - 1, 1, 3);
    }
  }
  refresh(scene, 'bg-stars');

  // Céu: nuvens distantes
  const far = canvas(scene, 'bg-clouds', 320, 80);
  [[40, 60, 14], [70, 55, 18], [105, 62, 12], [190, 58, 16], [225, 50, 20], [262, 60, 13], [300, 64, 10]].forEach(([x, y, r]) =>
    blob(far, x, y, r, 2.2, '#2a1f5c'),
  );
  far.fillStyle = '#2a1f5c';
  far.fillRect(0, 66, 320, 14);
  refresh(scene, 'bg-clouds');

  const near = canvas(scene, 'bg-clouds-near', 360, 70);
  [[30, 50, 12], [60, 46, 15], [150, 52, 11], [250, 48, 16], [285, 54, 11], [340, 50, 13]].forEach(([x, y, r]) =>
    blob(near, x, y, r, 2.4, '#3b2b7a'),
  );
  near.fillStyle = '#3b2b7a';
  near.fillRect(0, 58, 360, 12);
  refresh(scene, 'bg-clouds-near');

  // Jardim: colinas
  const hillsFar = canvas(scene, 'bg-hills-far', 400, 90);
  hills(hillsFar, 400, 90, 40, 0.018, '#7b3f8f', 3);
  refresh(scene, 'bg-hills-far');
  const hillsNear = canvas(scene, 'bg-hills-near', 360, 70);
  hills(hillsNear, 360, 70, 28, 0.03, '#3d2a6b', 11);
  for (let i = 0; i < 40; i++) {
    hillsNear.fillStyle = i % 2 ? '#ff86bb' : '#ffd166';
    hillsNear.fillRect(Math.floor(rand() * 360), 40 + Math.floor(rand() * 28), 1, 1);
  }
  refresh(scene, 'bg-hills-near');

  // Cidade: horizonte de Brasília e prédios próximos
  drawBrasilia(scene);
  const city = canvas(scene, 'bg-city-near', 320, 90);
  let x = 0;
  while (x < 320) {
    const w = 18 + Math.floor(rand() * 26);
    const h = 14 + Math.floor(rand() * 26);
    city.fillStyle = '#18133f';
    city.fillRect(x, 90 - h, w - 2, h);
    for (let wy = 90 - h + 4; wy < 86; wy += 6) {
      for (let wx = x + 3; wx < x + w - 5; wx += 5) {
        city.fillStyle = rand() < 0.3 ? '#ffd166' : '#2a2360';
        city.fillRect(wx, wy, 2, 3);
      }
    }
    x += w;
  }
  refresh(scene, 'bg-city-near');

  drawCityTiles(scene);
}

function drawBrasilia(scene: Phaser.Scene): void {
  const W = 900;
  const H = 130;
  const c = canvas(scene, 'bg-brasilia', W, H);
  const sil = '#2a2363';
  const lit = '#ffd166';
  c.fillStyle = sil;
  c.strokeStyle = sil;

  // Lago e Ponte JK: tabuleiro + três arcos cruzando
  c.fillStyle = '#1c1748';
  c.fillRect(0, 118, W, 12);
  c.fillStyle = sil;
  c.fillRect(30, 108, 300, 3);
  c.strokeStyle = '#c9c4f0';
  c.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const x0 = 40 + i * 95;
    c.beginPath();
    c.moveTo(x0, 112);
    c.quadraticCurveTo(x0 + 50, 52, x0 + 100, 112);
    c.stroke();
  }
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(201,196,240,0.45)';
  for (let i = 0; i < 3; i++) {
    const x0 = 40 + i * 95;
    for (let k = 1; k < 8; k++) {
      const t = k / 8;
      const ax = x0 + 100 * t;
      const ay = (1 - t) * (1 - t) * 112 + 2 * (1 - t) * t * 52 + t * t * 112;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(ax, 108);
      c.stroke();
    }
  }

  // Catedral: coroa hiperboloide
  c.fillStyle = sil;
  const cx = 380;
  c.beginPath();
  c.moveTo(cx - 22, 118);
  c.lineTo(cx - 10, 94);
  c.lineTo(cx - 26, 66);
  c.lineTo(cx - 16, 70);
  c.lineTo(cx - 8, 60);
  c.lineTo(cx - 3, 68);
  c.lineTo(cx + 3, 58);
  c.lineTo(cx + 8, 68);
  c.lineTo(cx + 14, 60);
  c.lineTo(cx + 18, 70);
  c.lineTo(cx + 26, 66);
  c.lineTo(cx + 10, 94);
  c.lineTo(cx + 22, 118);
  c.closePath();
  c.fill();
  c.fillStyle = '#3a3388';
  c.fillRect(cx - 1, 50, 2, 10);
  c.fillRect(cx - 4, 53, 8, 2);

  // Congresso Nacional: base, duas torres com passarela, cúpula e "bacia"
  c.fillStyle = sil;
  c.fillRect(470, 104, 190, 14);
  c.fillRect(556, 22, 11, 84);
  c.fillRect(572, 22, 11, 84);
  c.fillRect(556, 50, 27, 5);
  ellipseHalf(c, 505, 104, 26, 12, 'up', sil); // Câmara (bacia virada para cima)
  ellipseHalf(c, 630, 104, 17, 11, 'down', sil); // Senado (cúpula)
  c.fillStyle = lit;
  for (let y = 26; y < 100; y += 6) {
    if (rand01(y) < 0.6) c.fillRect(559, y, 2, 2);
    if (rand01(y + 7) < 0.6) c.fillRect(578, y, 2, 2);
  }

  // Torre de TV
  c.fillStyle = sil;
  c.beginPath();
  c.moveTo(770, 118);
  c.lineTo(790, 118);
  c.lineTo(782, 40);
  c.lineTo(778, 40);
  c.closePath();
  c.fill();
  c.fillRect(770, 60, 20, 4);
  c.fillRect(779, 6, 2, 36);
  c.fillStyle = '#ff4f9a';
  c.fillRect(779, 5, 2, 2);

  // Prédios baixos entre os monumentos
  [[330, 20, 24], [425, 30, 18], [680, 26, 30], [720, 18, 40], [820, 30, 26], [860, 22, 34]].forEach(([bx, w, h]) => {
    c.fillStyle = sil;
    c.fillRect(bx, 118 - h, w, h);
    c.fillStyle = lit;
    for (let y = 118 - h + 3; y < 114; y += 5) for (let xx = bx + 2; xx < bx + w - 2; xx += 4) if (rand01(xx * y) < 0.35) c.fillRect(xx, y, 1, 2);
  });
  refresh(scene, 'bg-brasilia');
}

function drawCityTiles(scene: Phaser.Scene): void {
  const n = 14;
  const c = canvas(scene, 'city-tiles', TILE * n, TILE);
  const at = (i: number) => i * TILE;
  const outline = '#1c1838';

  // 0-3: telhado (topo de prédio)
  for (let i = 0; i < 4; i++) {
    const x = at(i);
    c.fillStyle = '#4b4570';
    c.fillRect(x, 0, TILE, TILE);
    c.fillStyle = '#8e88b8';
    c.fillRect(x, 1, TILE, 3);
    c.fillStyle = outline;
    c.fillRect(x, 0, TILE, 1);
    c.fillStyle = '#3c3760';
    c.fillRect(x, 4, TILE, 1);
    windowsRow(c, x, 8);
    const left = i === 0 || i === 1;
    const right = i === 0 || i === 3;
    c.fillStyle = outline;
    if (left) c.fillRect(x, 0, 1, TILE);
    if (right) c.fillRect(x + TILE - 1, 0, 1, TILE);
  }
  // 4-5: parede do prédio
  for (let i = 4; i < 6; i++) {
    const x = at(i);
    c.fillStyle = '#2a2452';
    c.fillRect(x, 0, TILE, TILE);
    if (i === 4) {
      windowsRow(c, x, 3);
      windowsRow(c, x, 11);
    }
  }
  // 6-9: viga de aço
  for (let i = 6; i < 10; i++) {
    const x = at(i);
    c.fillStyle = '#c44a8a';
    c.fillRect(x, 2, TILE, 14);
    c.fillStyle = '#ff86bb';
    c.fillRect(x, 2, TILE, 2);
    c.fillStyle = '#8a2f63';
    c.fillRect(x, 14, TILE, 2);
    c.fillStyle = '#ffd1e6';
    c.fillRect(x + 4, 8, 2, 2);
    c.fillRect(x + 12, 8, 2, 2);
    c.fillStyle = outline;
    c.fillRect(x, 1, TILE, 1);
    c.fillRect(x, 16, TILE, 1);
    if (i === 6 || i === 7) c.fillRect(x, 1, 1, 16);
    if (i === 6 || i === 9) c.fillRect(x + TILE - 1, 1, 1, 16);
  }
  // 10-13: andaime (atravessável)
  for (let i = 10; i < 14; i++) {
    const x = at(i);
    c.fillStyle = '#b07a4f';
    c.fillRect(x, 1, TILE, 5);
    c.fillStyle = '#e0a87a';
    c.fillRect(x, 1, TILE, 1);
    c.fillStyle = outline;
    c.fillRect(x, 0, TILE, 1);
    c.fillRect(x, 6, TILE, 1);
    c.fillStyle = '#6f4a33';
    if (i === 10 || i === 11) c.fillRect(x + 2, 7, 2, 6);
    if (i === 10 || i === 13) c.fillRect(x + TILE - 4, 7, 2, 6);
  }
  refresh(scene, 'city-tiles');
  const tex = scene.textures.get('city-tiles');
  for (let i = 0; i < n; i++) tex.add(i, 0, i * TILE, 0, TILE, TILE);
}

function windowsRow(c: CanvasRenderingContext2D, x: number, y: number): void {
  for (let k = 0; k < 2; k++) {
    c.fillStyle = rand01(x * 3 + y * 7 + k) < 0.45 ? '#ffd166' : '#3a3470';
    c.fillRect(x + 3 + k * 8, y, 4, 4);
  }
}

// ------------------------------------------------------------------ Fundo

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
  /** Altura do bloco a partir de baixo (0 = céu inteiro). */
  height: number;
  bottom: number;
}

export class ThemeBackground {
  private layers: Layer[] = [];
  private sky: Phaser.GameObjects.Graphics;
  private skyColors: [number, number];
  private orb: Phaser.GameObjects.Arc;
  private plane?: Phaser.GameObjects.Image;
  private sunset = false;
  /** Altura (mundo) da linha do chão; o fundo se ancora nela, não na borda da tela. */
  private horizonY = Infinity;
  private lift = 0;

  constructor(
    private scene: Phaser.Scene,
    theme: Theme,
  ) {
    const colors: Record<Theme, [number, number, number]> = {
      sky: [0x07051a, 0x2a1a5e, 0x0b0820],
      garden: [0x2d1b5e, 0xe0709a, 0x2d1b5e],
      city: [0x050418, 0x2b1d66, 0x050418],
    };
    const [top, bottom, base] = colors[theme];
    scene.cameras.main.setBackgroundColor(base);
    this.sky = scene.add.graphics().setScrollFactor(0).setDepth(-20);
    this.skyColors = [top, bottom];

    const orbColor = theme === 'garden' ? 0xffc48a : 0xfff7ec;
    this.orb = scene.add.circle(0, 0, theme === 'garden' ? 18 : 14, orbColor).setScrollFactor(0).setDepth(-18);
    this.sunset = theme === 'garden';

    if (theme !== 'garden') this.add('bg-stars', 0.05, 0, 0, -19);
    if (theme === 'sky') {
      this.add('bg-clouds', 0.2, 80, 10, -17);
      this.add('bg-clouds-near', 0.45, 70, 0, -16);
    } else if (theme === 'garden') {
      this.add('bg-hills-far', 0.2, 90, 14, -17);
      this.add('bg-hills-near', 0.45, 70, 0, -16);
    } else {
      this.add('bg-brasilia', 0.15, 130, 16, -17);
      this.add('bg-city-near', 0.4, 90, 0, -16);
      this.plane = scene.add.image(-80, 40, 'plane').setScrollFactor(0).setDepth(-17.5).setAlpha(0.9);
      this.flyPlane();
    }
    this.layout();
  }

  private add(key: string, factor: number, height: number, bottom: number, depth: number): void {
    const sprite = this.scene.add.tileSprite(0, 0, 10, 10, key).setOrigin(0, 0).setScrollFactor(0).setDepth(depth);
    this.layers.push({ sprite, factor, height, bottom });
  }

  private flyPlane(): void {
    if (!this.plane) return;
    const { width } = this.scene.scale.gameSize;
    this.plane.setPosition(-60, 26 + Math.random() * 20);
    this.scene.tweens.add({
      targets: this.plane,
      x: width + 60,
      y: this.plane.y - 12,
      duration: 14000,
      delay: 2500,
      onComplete: () => this.flyPlane(),
    });
  }

  setHorizon(worldY: number): void {
    this.horizonY = worldY;
  }

  layout(): void {
    const { width, height } = this.scene.scale.gameSize;
    const base = height - this.lift;
    // Degradê até o horizonte visível.
    const [top, bottom] = this.skyColors;
    this.sky.clear();
    this.sky.fillStyle(bottom, 1);
    this.sky.fillRect(0, 0, width, height);
    this.sky.fillGradientStyle(top, top, bottom, bottom, 1);
    this.sky.fillRect(0, 0, width, Math.max(40, base));
    for (const l of this.layers) {
      if (l.height === 0) l.sprite.setSize(width, height).setPosition(0, 0);
      else l.sprite.setSize(width, l.height).setPosition(0, base - l.height - l.bottom);
    }
    // No jardim é um sol se pondo atrás das colinas.
    this.orb.setPosition(width - 60, this.sunset ? base - 50 : 36);
  }

  update(cam: Phaser.Cameras.Scene2D.Camera): void {
    // Se o chão sobe na tela (câmera mais baixa), o fundo sobe junto.
    const { height } = this.scene.scale.gameSize;
    const horizonOnScreen = this.horizonY - cam.scrollY;
    const lift = Number.isFinite(horizonOnScreen) ? Math.max(0, Math.round(height - horizonOnScreen - 6)) : 0;
    if (lift !== this.lift) {
      this.lift = lift;
      this.layout();
    }
    for (const l of this.layers) {
      l.sprite.tilePositionX = cam.scrollX * l.factor;
      if (l.height === 0) l.sprite.tilePositionY = cam.scrollY * 0.03;
    }
  }
}

// ------------------------------------------------------------------ Utilidades

function canvas(scene: Phaser.Scene, key: string, w: number, h: number): CanvasRenderingContext2D {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.createCanvas(key, w, h)!.getContext();
}

function refresh(scene: Phaser.Scene, key: string): void {
  (scene.textures.get(key) as Phaser.Textures.CanvasTexture).refresh();
}

function blob(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, stretch: number, color: string): void {
  c.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y) * stretch);
    c.fillRect(Math.round(cx - w / 2), cy + y, w, 1);
  }
}

function hills(c: CanvasRenderingContext2D, w: number, h: number, amp: number, freq: number, color: string, seed: number): void {
  c.fillStyle = color;
  for (let x = 0; x < w; x++) {
    // Soma de senos com período que fecha em w, para repetir sem emenda.
    const t = (x / w) * Math.PI * 2;
    const y = h - amp * (0.6 + 0.25 * Math.sin(t * 2 + seed) + 0.15 * Math.sin(t * 5 + seed * 2)) - freq;
    c.fillRect(x, Math.round(y), 1, h);
  }
}

function ellipseHalf(c: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, dir: 'up' | 'down', color: string): void {
  c.fillStyle = color;
  c.beginPath();
  if (dir === 'down') c.ellipse(cx, cy, rx, ry, 0, Math.PI, 0);
  else {
    // "Bacia": metade de baixo de uma elipse, apoiada um pouco acima da base.
    c.ellipse(cx, cy - ry, rx, ry, 0, 0, Math.PI);
  }
  c.closePath();
  c.fill();
  if (dir === 'up') c.fillRect(cx - 3, cy - ry, 6, ry);
}

function rand01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
