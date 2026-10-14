import * as Phaser from 'phaser';
import { PHYS, TILE } from '../config';
import { bridge } from '../bridge';
import { InputReader } from '../input';
import { Player } from '../entities/Player';
import { Tedinho } from '../entities/Tedinho';
import { Bee, Faller, Mover, Pigeon, platformTexture, type Enemy } from '../entities/Hazards';
import { LEVELS } from '../levels';
import type { Cell, LevelData, NpcKind, PowerKind } from '../levels/builder';
import { ThemeBackground, tilesetFor, type TileSet } from '../themes';
import type { Progress } from '../progress';
import { carinhoText, gameText, levelIntros, npcText, powerText, type Line, type Profile } from '../../content';
import { playSfx, setMusicTheme } from '../../audio';

/** Linhas extras de terra abaixo do mapa (espaço para a câmera subir acima dos controles). */
const EXTRA_ROWS = 4;
/** Mortes desde o último checkpoint até o mascote oferecer o Modo Carinho. */
const CARINHO_AFTER = 5;

const K = { spike: 68, heart: 44, flag: [111, 112], sign: 86 };

interface Pickup {
  sprite: Phaser.GameObjects.Image;
  taken: boolean;
}
interface Checkpoint {
  sprite: Phaser.GameObjects.Sprite;
  x: number;
  y: number;
  active: boolean;
}
interface Sign {
  sprite: Phaser.GameObjects.Image;
  text: string;
}
interface Npc {
  sprite: Phaser.GameObjects.Sprite;
  kind: NpcKind;
  prompt: Phaser.GameObjects.Text;
  talked: boolean;
}
interface Power {
  sprite: Phaser.GameObjects.Image;
  kind: PowerKind;
  taken: boolean;
}

export class LevelScene extends Phaser.Scene {
  private level!: LevelData;
  levelIndex = 0;
  private profile!: Profile;
  private tiles!: TileSet;
  private player!: Player;
  private mascot!: Phaser.GameObjects.Sprite;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private reader!: InputReader;
  private background!: ThemeBackground;
  private enemies!: Phaser.Physics.Arcade.Group;
  private shots!: Phaser.Physics.Arcade.Group;
  /** Corações arremessados pela personagem. */
  private heartShots!: Phaser.Physics.Arcade.Group;
  private movers!: Phaser.Physics.Arcade.Group;
  private fallers!: Phaser.Physics.Arcade.Group;
  private springs: Phaser.GameObjects.Sprite[] = [];
  private hearts: Pickup[] = [];
  private letter: Pickup | null = null;
  private checkpoints: Checkpoint[] = [];
  private signs: Sign[] = [];
  private npcs: Npc[] = [];
  private powers: Power[] = [];
  private spikeRects: Phaser.Geom.Rectangle[] = [];
  private goal!: { x: number; y: number };
  private respawnPoint = { x: 0, y: 0 };
  private heartsTaken = 0;
  private deaths = 0;
  private deathsHere = 0;
  private carinhoOffered = false;
  private startTime = 0;
  private finished = false;
  private busy = false;
  private currentHint: string | null = null;
  private camExtra = -1;
  private cleanups: (() => void)[] = [];

  constructor() {
    super('level');
  }

  init(data: { levelIndex: number }): void {
    this.levelIndex = data.levelIndex;
    this.springs = [];
    this.hearts = [];
    this.letter = null;
    this.checkpoints = [];
    this.signs = [];
    this.npcs = [];
    this.powers = [];
    this.spikeRects = [];
    this.heartsTaken = 0;
    this.deaths = 0;
    this.deathsHere = 0;
    this.carinhoOffered = false;
    this.finished = false;
    this.busy = false;
    this.currentHint = null;
    this.camExtra = -1;
  }

  create(): void {
    this.level = LEVELS[this.levelIndex]();
    this.profile = this.registry.get('profile') as Profile;
    this.tiles = tilesetFor(this.level.theme);
    this.physics.world.gravity.y = PHYS.gravity;

    this.background = new ThemeBackground(this, this.level.theme);
    this.background.setHorizon((this.level.height - 2) * TILE);
    this.createMap();
    this.createEntities();

    const W = this.level.width * TILE;
    const H = (this.level.height + EXTRA_ROWS) * TILE;
    this.physics.world.setBounds(0, 0, W, H + 200);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.player.setCollideWorldBounds(true);

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(24, 36);
    cam.setRoundPixels(true);
    this.updateCameraFraming();

    bridge.emit('scene', 'level');
    setMusicTheme(this.level.theme);
    this.reader = new InputReader(this);
    this.startTime = this.time.now;
    this.emitHud();

    const onResize = () => this.background.layout();
    this.scale.on('resize', onResize);
    this.cleanups.push(() => this.scale.off('resize', onResize));
    this.events.once('shutdown', () => {
      this.cleanups.forEach((fn) => fn());
      this.cleanups = [];
      bridge.emit('hint', null);
    });
    this.events.on('resume', () => this.reader.sync());

    const progress = this.registry.get('progress') as Progress | undefined;
    const firstTime = !progress?.results[this.level.id];
    if (this.levelIndex === 0 && !progress?.introSeen) void this.playIntro();
    else if (firstTime && levelIntros[this.level.id]) void this.cutscene(levelIntros[this.level.id](this.profile));
  }

  // ------------------------------------------------------------- Construção

  private createMap(): void {
    const { width } = this.level;
    const base = this.level.grid;
    const grid = [...base, ...Array.from({ length: EXTRA_ROWS }, () => [...base[base.length - 1]])];
    const at = (x: number, y: number): Cell => grid[y]?.[x] ?? '.';
    const t = this.tiles;
    const data: number[][] = [];

    for (let y = 0; y < grid.length; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        const c = at(x, y);
        let idx = -1;
        if (c === 'G') {
          if (at(x, y - 1) !== 'G') {
            idx = pick(t.groundTop, at(x - 1, y) !== 'G', at(x + 1, y) !== 'G');
            if (this.level.theme === 'garden' && hash(x) % 3 === 0 && at(x, y - 1) === '.') this.flowerAt(x, y);
          } else idx = t.groundFill[hash(x * 7 + y) % t.groundFill.length];
        } else if (c === 'B') {
          idx = pick(t.block, at(x - 1, y) !== 'B', at(x + 1, y) !== 'B');
        } else if (c === 'C') {
          idx = pick(t.cloud, at(x - 1, y) !== 'C', at(x + 1, y) !== 'C');
        } else if (c === '^') {
          const img = this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, 'tiles', K.spike).setDepth(5);
          this.spikeRects.push(new Phaser.Geom.Rectangle(img.x - 6, y * TILE + 11, 12, 7));
        }
        row.push(idx);
      }
      data.push(row);
    }

    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage(t.key, t.key, TILE, TILE, 0, 0)!;
    this.layer = (map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer).setDepth(4);
    this.layer.setCollisionByExclusion([-1]);
    const oneWay = new Set(Object.values(t.cloud));
    this.layer.forEachTile((tile) => {
      if (oneWay.has(tile.index)) tile.setCollision(false, false, true, false);
    });
  }

  private flowerAt(x: number, row: number): void {
    const decor = hash(x * 13) % 3 === 0 ? 'tiles' : 'flower-decor';
    const img =
      decor === 'tiles'
        ? this.add.image(x * TILE + TILE / 2, row * TILE, 'tiles', 124).setOrigin(0.5, 1)
        : this.add.image(x * TILE + 4 + (hash(x) % 10), row * TILE, 'flower-decor').setOrigin(0.5, 1);
    img.setDepth(3);
  }

  private createEntities(): void {
    const H = this.level.height;
    const toWorld = (x: number, y: number) => ({ x: x * TILE + TILE / 2, y: (H - y) * TILE });
    this.enemies = this.physics.add.group({ runChildUpdate: false });
    this.shots = this.physics.add.group({ allowGravity: false });
    this.heartShots = this.physics.add.group({ allowGravity: false });
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    this.fallers = this.physics.add.group({ allowGravity: false, immovable: true });
    const t = this.tiles;

    // A personagem primeiro: inimigos precisam dela como alvo.
    const start = this.level.entities.find((e) => e.kind === 'start')!;
    const sp = toWorld(start.x, start.y);
    this.respawnPoint = { ...sp };
    this.player = new Player(this, sp.x, sp.y);
    this.player.abilities = { doubleJump: this.levelIndex >= 2, dash: false };

    for (const e of this.level.entities) {
      const p = toWorld(e.x, e.y);
      switch (e.kind) {
        case 'heart': {
          const s = this.add.image(p.x, p.y - TILE / 2, 'tiles', K.heart).setDepth(6);
          this.tweens.add({ targets: s, y: s.y - 2, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: (e.x * 90) % 700 });
          this.hearts.push({ sprite: s, taken: false });
          break;
        }
        case 'letter': {
          const s = this.add.image(p.x, p.y - TILE / 2, 'letter').setDepth(6);
          this.tweens.add({ targets: s, y: s.y - 3, angle: 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          const glow = this.add.circle(p.x, p.y - TILE / 2, 12, 0xffd166, 0.25).setDepth(5);
          this.tweens.add({ targets: glow, scale: 1.4, alpha: 0.05, duration: 900, yoyo: true, repeat: -1 });
          s.setData('glow', glow);
          this.letter = { sprite: s, taken: false };
          break;
        }
        case 'tedinho':
          this.enemies.add(new Tedinho(this, p.x, p.y, this.layer));
          break;
        case 'bee':
          this.enemies.add(new Bee(this, p.x, p.y - TILE / 2, e.range, e.vertical));
          break;
        case 'pigeon':
          this.enemies.add(new Pigeon(this, p.x, p.y, this.layer, () => this.player, (x, y, dir) => this.shoot(x, y, dir)));
          break;
        case 'spring': {
          const s = this.add.sprite(p.x, p.y, 'spring', 0).setOrigin(0.5, 1).setDepth(5);
          this.springs.push(s);
          break;
        }
        case 'mover': {
          const frames = rowFrames(t.block, e.len);
          const key = platformTexture(this, t.key, frames, `plat-${t.key}-${e.len}`);
          const mv = new Mover(this, e.x * TILE, (H - e.y - 1) * TILE, key, e.dx, e.dy, e.speed);
          this.movers.add(mv);
          mv.body.setFriction(1, 1); // carrega quem estiver em cima (o grupo zera isso)
          break;
        }
        case 'faller': {
          const frames = rowFrames(t.cloud, e.len);
          const key = platformTexture(this, t.key, frames, `fall-${t.key}-${e.len}`);
          const f = new Faller(this, e.x * TILE, (H - e.y - 1) * TILE, key);
          f.setTint(0xffc2dc);
          this.fallers.add(f);
          break;
        }
        case 'checkpoint': {
          const s = this.add.sprite(p.x, p.y, 'checkpoint', 0).setOrigin(0.5, 1).setDepth(5);
          this.checkpoints.push({ sprite: s, x: p.x, y: p.y, active: false });
          break;
        }
        case 'sign': {
          const s = this.add.image(p.x, p.y, 'tiles', K.sign).setOrigin(0.5, 1).setDepth(3);
          this.signs.push({ sprite: s, text: e.text });
          break;
        }
        case 'npc': {
          const s = this.add.sprite(p.x, p.y, `npc-${e.npc}`, 0).setOrigin(0.5, 1).setDepth(7).setFlipX(true);
          if (e.npc === 'owl') {
            if (!this.anims.exists('owl-blink')) {
              this.anims.create({ key: 'owl-blink', frames: this.anims.generateFrameNumbers('npc-owl', { frames: [0, 0, 0, 0, 0, 1] }), frameRate: 3, repeat: -1 });
            }
            s.play('owl-blink');
          }
          this.tweens.add({ targets: s, scaleY: 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          const prompt = this.add
            .text(p.x, p.y - s.height - 8, 'B', { fontFamily: 'Pixelify Sans, monospace', fontSize: '10px', color: '#2a0f2a', backgroundColor: '#fff7ec', padding: { x: 3, y: 1 } })
            .setOrigin(0.5, 1)
            .setDepth(13)
            .setResolution(4)
            .setVisible(false);
          this.tweens.add({ targets: prompt, y: prompt.y - 3, duration: 500, yoyo: true, repeat: -1 });
          this.npcs.push({ sprite: s, kind: e.npc, prompt, talked: false });
          break;
        }
        case 'power': {
          const s = this.add.image(p.x, p.y - TILE / 2 - 2, `power-${e.power}`).setDepth(6);
          this.tweens.add({ targets: s, y: s.y - 4, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          const glow = this.add.circle(s.x, s.y, 13, 0xff4f9a, 0.25).setDepth(5);
          this.tweens.add({ targets: glow, scale: 1.5, alpha: 0.05, duration: 800, yoyo: true, repeat: -1 });
          s.setData('glow', glow);
          this.powers.push({ sprite: s, kind: e.power, taken: false });
          break;
        }
        case 'decor':
          this.addDecor(e.decor, p.x, p.y);
          break;
        case 'goal': {
          this.goal = { x: p.x, y: p.y };
          this.add.rectangle(p.x - 6, p.y, 2, 54, 0xdce1e7).setOrigin(0.5, 1).setDepth(3);
          const flag = this.add.sprite(p.x + 3, p.y - 46, 'tiles', K.flag[0]).setDepth(3);
          if (!this.anims.exists('flag-wave')) {
            this.anims.create({ key: 'flag-wave', frames: this.anims.generateFrameNumbers('tiles', { frames: K.flag }), frameRate: 4, repeat: -1 });
          }
          flag.play('flag-wave');
          break;
        }
        case 'start':
          break;
      }
    }

    this.mascot = this.add.sprite(this.player.x - 14, this.player.y - 26, 'mascot').setDepth(11);

    this.physics.add.collider(this.player, this.layer);
    this.physics.add.collider(this.enemies, this.layer);
    this.physics.add.collider(this.player, this.movers);
    this.physics.add.collider(this.player, this.fallers, (_p, f) => {
      if (this.player.body.touching.down) (f as Faller).stepped();
    });
    this.physics.add.collider(this.shots, this.layer, (s) => s.destroy());
    this.physics.add.collider(this.heartShots, this.layer, (h) => this.popHeart(h as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.heartShots, this.enemies, (h, e) => {
      if (!(e as Enemy).alive) return;
      this.popHeart(h as Phaser.Physics.Arcade.Image);
      this.defeat(e as Enemy);
    });
    this.physics.add.overlap(this.heartShots, this.shots, (h, s) => {
      this.burst((s as Phaser.Physics.Arcade.Image).x, (s as Phaser.Physics.Arcade.Image).y, 0xe2364b, 5);
      s.destroy();
      this.popHeart(h as Phaser.Physics.Arcade.Image);
    });
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => this.touchEnemy(e as Enemy));
    this.physics.add.overlap(this.player, this.shots, (_p, s) => this.touchShot(s as Phaser.Physics.Arcade.Image));
  }

  private addDecor(kind: string, x: number, y: number): void {
    if (kind === 'ipe') this.add.image(x, y, 'ipe').setOrigin(0.5, 1).setDepth(2);
    else if (kind === 'plane') this.add.image(x, y, 'plane').setOrigin(0.5, 1).setDepth(2).setScale(2);
    else if (kind === 'jk-arch') {
      // Arco branco da Ponte JK cruzando por cima do tabuleiro.
      const g = this.add.graphics().setDepth(2);
      const w = 12 * TILE;
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x - TILE / 2, y), new Phaser.Math.Vector2(x + w / 2, y - 9 * TILE), new Phaser.Math.Vector2(x + w, y));
      g.lineStyle(4, 0xe8e6f2, 1);
      curve.draw(g, 32);
      g.lineStyle(1, 0xe8e6f2, 0.45);
      for (let i = 1; i < 10; i++) {
        const pt = curve.getPoint(i / 10);
        g.lineBetween(pt.x, pt.y, pt.x, y);
      }
    } else if (kind === 'flower') this.add.image(x, y, 'flower-decor').setOrigin(0.5, 1).setDepth(3);
    else if (kind === 'airport') {
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(0x3a3470).fillRect(x - 60, y - 54, 120, 54);
      g.fillStyle(0x8e88b8).fillRect(x - 64, y - 58, 128, 6);
      g.fillStyle(0xffd166);
      for (let i = 0; i < 6; i++) g.fillRect(x - 52 + i * 18, y - 44, 12, 16);
      g.fillStyle(0x1c1838).fillRect(x - 10, y - 24, 20, 24);
      this.add
        .text(x, y - 66, 'CHEGADAS ✈', { fontFamily: 'Pixelify Sans, monospace', fontSize: '10px', color: '#ffd166' })
        .setOrigin(0.5, 1)
        .setResolution(4)
        .setDepth(1);
    }
  }

  private shoot(x: number, y: number, dir: number): void {
    const s = this.shots.create(x, y, 'carimbo') as Phaser.Physics.Arcade.Image;
    s.setDepth(9);
    s.body!.setSize(5, 5);
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    s.setVelocityX(dir * 105);
    this.tweens.add({ targets: s, angle: dir * 360, duration: 600, repeat: -1 });
    this.time.delayedCall(3500, () => s.active && s.destroy());
  }

  // ------------------------------------------------------------- Loop

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 1 / 30);
    const raw = this.reader.read();
    if (raw.pausePressed) bridge.emit('pauseRequest');

    // Perto de um NPC, o botão de ação vira "conversar".
    const npc = this.nearNpc();
    const c = npc && raw.actionPressed && !this.busy ? { ...raw, actionPressed: false } : raw;
    if (npc && raw.actionPressed && !this.busy) void this.talk(npc);

    this.player.update(dt, c);
    this.enemies.getChildren().forEach((e) => (e as Enemy).update(time, delta));
    this.movers.getChildren().forEach((m) => (m as Mover).update());
    this.updateMascot(time, dt);
    this.updateCameraFraming();
    this.background.update(this.cameras.main);
    this.npcs.forEach((n) => n.prompt.setVisible(n === npc && !this.busy));

    if (this.player.dead || this.finished) return;

    const px = this.player.x;
    const py = this.player.y - 8;

    for (const h of this.hearts) {
      if (!h.taken && Math.abs(h.sprite.x - px) < 11 && Math.abs(h.sprite.y - py) < 13) this.collectHeart(h);
    }
    if (this.letter && !this.letter.taken && Math.abs(this.letter.sprite.x - px) < 12 && Math.abs(this.letter.sprite.y - py) < 14) {
      this.collectLetter();
    }
    for (const pw of this.powers) {
      if (!pw.taken && Math.abs(pw.sprite.x - px) < 12 && Math.abs(pw.sprite.y - py) < 16) void this.collectPower(pw);
    }
    for (const cp of this.checkpoints) {
      if (!cp.active && Math.abs(cp.x - px) < 12 && Math.abs(cp.y - this.player.y) < 30) this.activateCheckpoint(cp);
    }
    this.checkSprings();
    if (this.player.takeShot()) this.throwHeart();

    let hint: string | null = null;
    for (const s of this.signs) {
      if (Math.abs(s.sprite.x - px) < 30 && Math.abs(s.sprite.y - this.player.y) < 30) hint = s.text;
    }
    if (hint !== this.currentHint && !(hint === null && this.currentHint === gameText.letterFound)) {
      this.currentHint = hint;
      bridge.emit('hint', hint);
    }

    if (!this.player.carinho) {
      const pb = this.player.body;
      const pRect = new Phaser.Geom.Rectangle(pb.x, pb.y, pb.width, pb.height);
      if (this.spikeRects.some((r) => Phaser.Geom.Intersects.RectangleToRectangle(pRect, r))) this.die();
    }
    if (this.player.y > (this.level.height + EXTRA_ROWS) * TILE - 4) this.die();

    if (this.goal && px >= this.goal.x - 4 && Math.abs(this.player.y - this.goal.y) < 60) this.finish();
  }

  private nearNpc(): Npc | null {
    for (const n of this.npcs) {
      if (Math.abs(n.sprite.x - this.player.x) < 26 && Math.abs(n.sprite.y - this.player.y) < 24) return n;
    }
    return null;
  }

  private updateCameraFraming(): void {
    const cam = this.cameras.main;
    cam.followOffset.y = (this.registry.get('camOffsetY') as number | undefined) ?? -16;
    const extra = this.registry.get('camExtraRows') ? EXTRA_ROWS : 0;
    if (extra !== this.camExtra) {
      this.camExtra = extra;
      cam.setBounds(0, 0, this.level.width * TILE, (this.level.height + extra) * TILE);
    }
  }

  private updateMascot(time: number, dt: number): void {
    const tx = this.player.x + (this.player.flipX ? 16 : -16);
    const ty = this.player.y - 28 + Math.sin(time / 300) * 3;
    const k = 1 - Math.pow(0.002, dt);
    this.mascot.x += (tx - this.mascot.x) * k;
    this.mascot.y += (ty - this.mascot.y) * k;
    this.mascot.setFlipX(this.player.flipX);
  }

  private checkSprings(): void {
    const pb = this.player.body;
    if (pb.velocity.y < 0) return;
    for (const s of this.springs) {
      // A flor tem ~9px de altura: vale pousar em cima dela ou já estar no chão sobre ela.
      const top = s.y - 9;
      if (Math.abs(s.x - this.player.x) < 11 && pb.bottom >= top - 4 && pb.bottom <= s.y + 2) {
        // bounce(false): o impulso da flor não é cortado ao soltar o botão de pulo.
        this.player.bounce(false);
        pb.setVelocityY(-560);
        playSfx('boing');
        s.setFrame(1);
        this.time.delayedCall(180, () => s.setFrame(0));
        this.burst(s.x, top, 0xff86bb, 6);
      }
    }
  }

  private throwHeart(): void {
    const dir = this.player.flipX ? -1 : 1;
    // Na altura da cintura: acerta Tedinhos e pombos (baixinhos) e abelhas em voo baixo.
    const h = this.heartShots.create(this.player.x + dir * 8, this.player.y - 7, 'heart-shot') as Phaser.Physics.Arcade.Image;
    h.setDepth(10).setFlipX(dir < 0);
    const body = h.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false).setSize(7, 8);
    body.setVelocityX(dir * PHYS.shotSpeed);
    this.tweens.add({ targets: h, scale: { from: 0.6, to: 1 }, duration: 100 });
    this.time.delayedCall(PHYS.shotLife * 1000, () => h.active && this.popHeart(h));
  }

  private popHeart(h: Phaser.Physics.Arcade.Image): void {
    if (!h.active) return;
    this.burst(h.x, h.y, 0xff86bb, 4);
    h.destroy();
  }

  // ------------------------------------------------------------- Eventos

  private defeat(e: Enemy): void {
    e.squash();
    playSfx('stomp');
    this.burst(e.x, e.y - 6, 0xb8b4cc, 8);
    const pow = this.add.image(e.x, e.y - 10, 'mascot').setDepth(12).setScale(0.6).setTint(0xffc2dc);
    this.tweens.add({ targets: pow, y: pow.y - 16, alpha: 0, scale: 1, duration: 400, onComplete: () => pow.destroy() });
  }

  private touchEnemy(e: Enemy): void {
    if (!e.alive || this.player.dead || this.finished) return;
    const pb = this.player.body;
    const eb = e.body as Phaser.Physics.Arcade.Body;
    if (this.player.isDashing) {
      this.defeat(e);
      return;
    }
    if (pb.velocity.y > 0 && pb.bottom <= eb.top + 7) {
      this.defeat(e);
      this.player.bounce(this.reader.read().jump);
      return;
    }
    if (this.player.carinho || this.time.now < this.player.invincibleUntil) return;
    this.die();
  }

  private touchShot(s: Phaser.Physics.Arcade.Image): void {
    if (this.player.dead || this.finished) return;
    s.destroy();
    if (this.player.carinho || this.time.now < this.player.invincibleUntil) return;
    this.die();
  }

  private collectHeart(h: Pickup): void {
    h.taken = true;
    this.heartsTaken++;
    playSfx('pop');
    this.tweens.killTweensOf(h.sprite);
    this.tweens.add({ targets: h.sprite, y: h.sprite.y - 14, alpha: 0, scale: 1.5, duration: 260, onComplete: () => h.sprite.destroy() });
    this.emitHud();
  }

  private collectLetter(): void {
    if (!this.letter) return;
    this.letter.taken = true;
    const s = this.letter.sprite;
    (s.getData('glow') as Phaser.GameObjects.Arc).destroy();
    this.tweens.killTweensOf(s);
    this.tweens.add({ targets: s, y: s.y - 30, scale: 2, alpha: 0, duration: 700, onComplete: () => s.destroy() });
    playSfx('letter');
    this.burst(s.x, s.y, 0xffd166, 14);
    bridge.emit('hint', gameText.letterFound);
    this.currentHint = gameText.letterFound;
    this.time.delayedCall(2500, () => {
      if (this.currentHint === gameText.letterFound) {
        this.currentHint = null;
        bridge.emit('hint', null);
      }
    });
    this.emitHud();
  }

  private async collectPower(pw: Power): Promise<void> {
    pw.taken = true;
    (pw.sprite.getData('glow') as Phaser.GameObjects.Arc).destroy();
    this.tweens.killTweensOf(pw.sprite);
    this.tweens.add({ targets: pw.sprite, scale: 2.5, alpha: 0, duration: 500, onComplete: () => pw.sprite.destroy() });
    playSfx('letter');
    this.burst(pw.sprite.x, pw.sprite.y, 0xff4f9a, 16);
    if (pw.kind === 'wings') this.player.abilities.doubleJump = true;
    else this.player.abilities.dash = true;
    await this.cutscene(pw.kind === 'wings' ? powerText.wings(this.profile) : powerText.dash());
  }

  private activateCheckpoint(cp: Checkpoint): void {
    this.checkpoints.forEach((c) => {
      c.active = false;
      c.sprite.setFrame(0);
    });
    cp.active = true;
    cp.sprite.setFrame(1);
    this.respawnPoint = { x: cp.x, y: cp.y };
    this.deathsHere = 0;
    playSfx('checkpoint');
    this.burst(cp.x, cp.y - 30, 0xff4f9a, 10);
  }

  /** Chamado pelo menu de pausa. */
  restartFromCheckpoint(): void {
    if (!this.finished) this.die();
  }

  private die(): void {
    if (this.player.dead) return;
    this.player.dead = true;
    this.deaths++;
    this.deathsHere++;
    playSfx('die');
    const body = this.player.body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.enable = false;
    this.cameras.main.shake(120, 0.004);
    this.tweens.add({
      targets: this.player,
      y: this.player.y - 24,
      angle: 180,
      alpha: 0,
      duration: 450,
      ease: 'Quad.out',
      onComplete: () => {
        this.player.respawn(this.respawnPoint.x, this.respawnPoint.y, this.time.now);
        this.player.setFlipX(false);
        this.mascot.setPosition(this.player.x - 14, this.player.y - 26);
        this.tweens.add({ targets: this.player, alpha: { from: 0.3, to: 1 }, duration: 120, repeat: 4, yoyo: true });
        if (this.deathsHere >= CARINHO_AFTER && !this.carinhoOffered && !this.player.carinho) void this.offerCarinho();
      },
    });
  }

  private async offerCarinho(): Promise<void> {
    this.carinhoOffered = true;
    await this.cutscene([carinhoText.offer(this.profile)]);
    // Aceitando ou recusando 3 vezes, o mascote ativa de qualquer jeito. 💗
    this.player.carinho = true;
    this.player.setTint(0xffc2dc);
    this.burst(this.player.x, this.player.y - 10, 0xff4f9a, 18);
    playSfx('success');
    await this.cutscene([carinhoText.on]);
  }

  private finish(): void {
    this.finished = true;
    this.player.frozen = true;
    playSfx('fanfare');
    this.burst(this.goal.x, this.goal.y - 40, 0xff4f9a, 20);
    this.time.delayedCall(1300, () => {
      bridge.emit('levelComplete', {
        levelId: this.level.id,
        levelIndex: this.levelIndex,
        hearts: this.heartsTaken,
        heartsTotal: this.hearts.length,
        letter: !!this.letter?.taken,
        deaths: this.deaths,
        timeMs: this.time.now - this.startTime,
      });
    });
  }

  private burst(x: number, y: number, tint: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'spark').setTint(tint).setDepth(12);
      const a = (i / n) * Math.PI * 2;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(a) * Phaser.Math.Between(12, 24),
        y: y + Math.sin(a) * Phaser.Math.Between(12, 24),
        alpha: 0,
        duration: 450,
        onComplete: () => s.destroy(),
      });
    }
  }

  private emitHud(): void {
    bridge.emit('hud', {
      hearts: this.heartsTaken,
      heartsTotal: this.hearts.length,
      letter: !!this.letter?.taken,
      levelName: this.level.name,
    });
  }

  // ------------------------------------------------------------- Diálogos e cutscenes

  private say(lines: Line[]): Promise<number> {
    return new Promise((resolve) => {
      const off = bridge.on('dialogDone', (r) => {
        off();
        resolve(r?.dodges ?? 0);
      });
      this.cleanups.push(off);
      bridge.emit('dialog', lines);
    });
  }

  /** Congela a personagem enquanto o diálogo está aberto. */
  private async cutscene(lines: Line[]): Promise<void> {
    this.busy = true;
    this.player.frozen = true;
    await this.say(lines);
    this.player.frozen = false;
    this.busy = false;
    this.reader.sync();
  }

  private async talk(npc: Npc): Promise<void> {
    npc.talked = true;
    playSfx('tap');
    this.player.setFlipX(npc.sprite.x < this.player.x);
    await this.cutscene(npcText[npc.kind](this.profile));
  }

  private tween(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => this.tweens.add({ ...config, onComplete: () => resolve() }));
  }

  private async playIntro(): Promise<void> {
    const p = this.profile;
    const lines = gameText.intro(p);
    this.busy = true;
    this.player.frozen = true;
    const partner = this.add.sprite(this.player.x + 40, this.player.y, 'partner', 0).setOrigin(0.5, 1).setDepth(9).setFlipX(true);
    if (!this.anims.exists('partner-idle')) {
      this.anims.create({ key: 'partner-idle', frames: this.anims.generateFrameNumbers('partner', { frames: [0, 1] }), frameRate: 2, repeat: -1 });
    }
    partner.play('partner-idle');

    await this.say([lines[0]]);

    const tedio = this.add.sprite(partner.x + 120, partner.y - 120, 'tedio', 1).setDepth(12).setScale(0.8);
    playSfx('boing');
    await this.tween({ targets: tedio, x: partner.x + 4, y: partner.y - 36, duration: 900, ease: 'Sine.inOut' });
    this.cameras.main.shake(200, 0.006);
    await this.say([lines[1]]);

    partner.setFrame(7);
    partner.anims.stop();
    playSfx('error');
    await Promise.all([
      this.tween({ targets: tedio, x: partner.x + 260, y: partner.y - 140, duration: 1400, ease: 'Quad.in' }),
      this.tween({ targets: partner, x: partner.x + 256, y: partner.y - 108, angle: 20, duration: 1400, ease: 'Quad.in' }),
    ]);
    tedio.destroy();
    partner.destroy();

    await this.say([lines[2]]);
    bridge.emit('introSeen');
    this.player.frozen = false;
    this.busy = false;
    this.reader.sync();
  }
}

function pick(set: { single: number; left: number; mid: number; right: number }, openLeft: boolean, openRight: boolean): number {
  if (openLeft && openRight) return set.single;
  if (openLeft) return set.left;
  if (openRight) return set.right;
  return set.mid;
}

function rowFrames(set: { single: number; left: number; mid: number; right: number }, len: number): number[] {
  if (len === 1) return [set.single];
  return Array.from({ length: len }, (_, i) => (i === 0 ? set.left : i === len - 1 ? set.right : set.mid));
}

function hash(n: number): number {
  let x = (n * 2654435761) >>> 0;
  x ^= x >>> 16;
  return x;
}
