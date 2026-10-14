import * as Phaser from 'phaser';
import { PHYS, TILE } from '../config';
import { bridge } from '../bridge';
import { InputReader } from '../input';
import { Player } from '../entities/Player';
import { ThemeBackground } from '../themes';
import { bossText, carinhoText, type Line, type Profile } from '../../content';
import { playSfx, setMusicTheme } from '../../audio';

const COLS = 26;
// Arena com 12 blocos de altura (cabe inteira na tela); o chão fica na linha 8,
// deixando espaço embaixo para os controles de toque não cobrirem a personagem.
const ROWS = 12;
const FLOOR = 8;
const MAX_HP = 15;
const SHOT_COOLDOWN = 320;

type Phase = 1 | 2 | 3;

/** Luta contra o Chefão Tédio no Castelo nas Nuvens. */
export class BossScene extends Phaser.Scene {
  private profile!: Profile;
  private player!: Player;
  private mascot!: Phaser.GameObjects.Sprite;
  private boss!: Phaser.Physics.Arcade.Sprite;
  private partner!: Phaser.GameObjects.Sprite;
  private bubble!: Phaser.GameObjects.Arc;
  private reader!: InputReader;
  private background!: ThemeBackground;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private shots!: Phaser.Physics.Arcade.Group;
  private rain!: Phaser.Physics.Arcade.Group;
  private hp = MAX_HP;
  private phase: Phase = 1;
  private bossInvulnerableUntil = 0;
  private nextAttack = 0;
  private nextRain = 0;
  private nextShot = 0;
  private diving = false;
  private busy = true;
  private over = false;
  private deaths = 0;
  private carinhoOffered = false;
  private slowUntil = 0;
  private cleanups: (() => void)[] = [];

  constructor() {
    super('boss');
  }

  init(): void {
    this.hp = MAX_HP;
    this.phase = 1;
    this.diving = false;
    this.busy = true;
    this.over = false;
    this.deaths = 0;
    this.carinhoOffered = false;
    this.slowUntil = 0;
  }

  create(): void {
    this.profile = this.registry.get('profile') as Profile;
    this.physics.world.gravity.y = PHYS.gravity;
    this.background = new ThemeBackground(this, 'sky');
    this.background.setHorizon(FLOOR * TILE);
    this.createArena();

    const W = COLS * TILE;
    const H = ROWS * TILE;
    this.player = new Player(this, 5 * TILE, FLOOR * TILE);
    this.player.abilities = { doubleJump: true, dash: false };
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, W, H + 200);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.physics.add.collider(this.player, this.layer);
    this.mascot = this.add.sprite(this.player.x - 14, this.player.y - 26, 'mascot').setDepth(11);

    this.boss = this.physics.add.sprite(W / 2, 1.8 * TILE, 'tedio', 0).setScale(2).setDepth(9);
    const bb = this.boss.body as Phaser.Physics.Arcade.Body;
    bb.setAllowGravity(false).setImmovable(true).setSize(28, 14).setOffset(3, 2);

    this.bubble = this.add.circle(W - 3 * TILE, 2.4 * TILE, 16, 0xffc2dc, 0.35).setStrokeStyle(2, 0xffffff, 0.7).setDepth(8);
    this.partner = this.add.sprite(this.bubble.x, this.bubble.y + 10, 'partner', 7).setOrigin(0.5, 1).setDepth(8);
    this.tweens.add({ targets: [this.bubble, this.partner], y: '-=5', duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.shots = this.physics.add.group({ allowGravity: false });
    this.rain = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.shots, this.boss, (_b, s) => this.hitBoss(s as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, this.rain, (_p, r) => this.touchRain(r as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, this.boss, () => this.touchBoss());
    this.physics.add.collider(this.rain, this.layer, (r) => this.splash(r as Phaser.Physics.Arcade.Image));

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setRoundPixels(true);
    cam.setBounds(0, 0, W, H);
    cam.fadeIn(400, 11, 8, 32);

    this.reader = new InputReader(this);
    const onResize = () => this.background.layout();
    this.scale.on('resize', onResize);
    this.cleanups.push(() => this.scale.off('resize', onResize));
    this.events.once('shutdown', () => {
      this.cleanups.forEach((fn) => fn());
      this.cleanups = [];
      bridge.emit('bossHp', null);
      bridge.emit('hint', null);
    });
    this.events.on('resume', () => this.reader.sync());

    bridge.emit('scene', 'boss');
    setMusicTheme('boss');
    bridge.emit('hud', { hearts: 0, heartsTotal: 0, letter: false, levelName: bossText.name });
    this.emitHp();
    void this.intro();
  }

  private createArena(): void {
    // Chão de nuvens maciço + três nuvens atravessáveis.
    const data: number[][] = [];
    for (let y = 0; y < ROWS; y++) {
      const row: number[] = [];
      for (let x = 0; x < COLS; x++) {
        let idx = -1;
        if (y === FLOOR) idx = x === 0 ? 153 : x === COLS - 1 ? 155 : 154; // chão de nuvem
        if (y === FLOOR - 3 && ((x >= 3 && x <= 6) || (x >= 19 && x <= 22))) idx = x === 3 || x === 19 ? 153 : x === 6 || x === 22 ? 155 : 154;
        if (y === FLOOR - 5 && x >= 11 && x <= 14) idx = x === 11 ? 153 : x === 14 ? 155 : 154;
        row.push(idx);
      }
      data.push(row);
    }
    const map = this.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0)!;
    this.layer = (map.createLayer(0, tileset, 0, 0) as Phaser.Tilemaps.TilemapLayer).setDepth(4);
    this.layer.setCollisionByExclusion([-1]);
    this.layer.forEachTile((t) => {
      if (t.index >= 153 && t.index <= 156) t.setCollision(false, false, true, false);
    });

    // Torres do castelo ao fundo.
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x3b2b7a, 1);
    for (const [x, w, h] of [[2, 3, 5], [8, 2, 3], [16, 2, 4], [21, 3, 6]] as const) {
      g.fillRect(x * TILE, (FLOOR - h) * TILE, w * TILE, (h + ROWS - FLOOR) * TILE);
      for (let i = 0; i < w * 2; i++) g.fillRect(x * TILE + i * 9, (FLOOR - h) * TILE - 6, 5, 6);
      g.fillStyle(0xffd166, 0.8);
      g.fillRect((x + w / 2) * TILE - 2, (FLOOR - h + 1) * TILE, 4, 7);
      g.fillStyle(0x3b2b7a, 1);
    }
  }

  // ------------------------------------------------------------- Loop

  update(time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 1 / 30);
    const raw = this.reader.read();
    if (raw.pausePressed) bridge.emit('pauseRequest');
    this.player.speedMul = time < this.slowUntil ? 0.5 : 1;
    if (raw.actionPressed && !this.busy && !this.over && !this.player.dead) this.throwHeart(time);
    this.player.update(dt, { ...raw, actionPressed: false });
    this.background.update(this.cameras.main);
    this.followMascot(time, dt);
    this.frameCamera();

    if (this.busy || this.over) return;
    this.bossAi(time);
  }

  /** A arena cabe inteira na altura da tela: a câmera só acompanha na horizontal. */
  private frameCamera(): void {
    this.cameras.main.followOffset.y = 0;
  }

  private followMascot(time: number, dt: number): void {
    const tx = this.player.x + (this.player.flipX ? 16 : -16);
    const ty = this.player.y - 28 + Math.sin(time / 300) * 3;
    const k = 1 - Math.pow(0.002, dt);
    this.mascot.x += (tx - this.mascot.x) * k;
    this.mascot.y += (ty - this.mascot.y) * k;
  }

  private bossAi(time: number): void {
    const W = COLS * TILE;
    if (!this.diving) {
      // Flutua acompanhando a personagem devagar.
      const targetX = Phaser.Math.Clamp(this.player.x + Math.sin(time / 900) * 60, 50, W - 50);
      this.boss.x += (targetX - this.boss.x) * 0.015;
      this.boss.y = 1.8 * TILE + Math.sin(time / 500) * 5;
      (this.boss.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    }

    const rainEvery = this.phase === 1 ? 650 : this.phase === 2 ? 1300 : 520;
    if (time > this.nextRain) {
      this.nextRain = time + rainEvery;
      this.dropRain();
    }

    if (time > this.nextAttack && !this.diving) {
      if (this.phase === 2) {
        this.nextAttack = time + 3400;
        this.dive();
      } else if (this.phase === 3) {
        this.nextAttack = time + 4200;
        this.yawn();
      }
    }
  }

  private dropRain(): void {
    const x = Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-70, 70), 10, COLS * TILE - 10);
    const drop = this.rain.create(x, this.boss.y + 10, 'spark') as Phaser.Physics.Arcade.Image;
    drop.setTint(0x8c88a0).setScale(1.6, 3).setDepth(8);
    (drop.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(3, 3);
    drop.setVelocityY(this.phase === 3 ? 190 : 160);
    this.time.delayedCall(4000, () => drop.active && drop.destroy());
  }

  private splash(drop: Phaser.Physics.Arcade.Image): void {
    this.burst(drop.x, drop.y, 0x8c88a0, 3);
    drop.destroy();
  }

  private dive(): void {
    this.diving = true;
    const tx = this.player.x;
    const startX = this.boss.x;
    const startY = this.boss.y;
    this.tweens.add({
      targets: this.boss,
      x: startX + 2,
      duration: 60,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        playSfx('dash');
        this.tweens.add({
          targets: this.boss,
          x: tx,
          y: (FLOOR - 1) * TILE,
          duration: 650,
          ease: 'Quad.in',
          onUpdate: () => (this.boss.body as Phaser.Physics.Arcade.Body).updateFromGameObject(),
          onComplete: () => {
            this.cameras.main.shake(160, 0.006);
            this.tweens.add({
              targets: this.boss,
              y: startY,
              delay: 450,
              duration: 900,
              ease: 'Sine.out',
              onUpdate: () => (this.boss.body as Phaser.Physics.Arcade.Body).updateFromGameObject(),
              onComplete: () => (this.diving = false),
            });
          },
        });
      },
    });
  }

  private yawn(): void {
    this.boss.setFrame(1);
    playSfx('boing');
    const wave = this.add.circle(this.boss.x, this.boss.y, 10, 0xb8b4cc, 0.0).setStrokeStyle(4, 0xb8b4cc, 0.8).setDepth(7);
    this.tweens.add({
      targets: wave,
      radius: 150,
      duration: 1400,
      onUpdate: () => {
        const d = Phaser.Math.Distance.Between(wave.x, wave.y, this.player.x, this.player.y - 8);
        if (Math.abs(d - wave.radius) < 8 && !this.player.carinho && this.time.now > this.slowUntil) {
          this.slowUntil = this.time.now + 2500;
          bridge.emit('hint', bossText.slowed);
          this.time.delayedCall(2500, () => bridge.emit('hint', null));
        }
      },
      onComplete: () => {
        wave.destroy();
        this.boss.setFrame(0);
      },
    });
  }

  private throwHeart(time: number): void {
    if (time < this.nextShot) return;
    this.nextShot = time + SHOT_COOLDOWN;
    const s = this.shots.create(this.player.x, this.player.y - 12, 'heart-shot') as Phaser.Physics.Arcade.Image;
    s.setDepth(10);
    (s.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(6, 6);
    // Mira automática no Tédio: no toque, acertar não pode depender de precisão.
    const angle = Phaser.Math.Angle.Between(s.x, s.y, this.boss.x, this.boss.y) + Phaser.Math.FloatBetween(-0.08, 0.08);
    this.physics.velocityFromRotation(angle, 300, (s.body as Phaser.Physics.Arcade.Body).velocity);
    this.player.setFlipX(this.boss.x < this.player.x);
    playSfx('punch');
    this.time.delayedCall(1600, () => s.active && s.destroy());
  }

  // ------------------------------------------------------------- Dano

  private hitBoss(shot: Phaser.Physics.Arcade.Image): void {
    shot.destroy();
    if (this.over || this.time.now < this.bossInvulnerableUntil) return;
    this.damageBoss();
  }

  private damageBoss(): void {
    this.hp--;
    this.bossInvulnerableUntil = this.time.now + 1000;
    playSfx('stomp');
    this.burst(this.boss.x, this.boss.y, 0xff4f9a, 10);
    this.boss.setFrame(2);
    this.tweens.add({ targets: this.boss, alpha: 0.4, duration: 80, yoyo: true, repeat: 3, onComplete: () => this.boss.setFrame(0) });
    this.emitHp();

    if (this.hp <= 0) {
      void this.victory();
      return;
    }
    const newPhase: Phase = this.hp > 10 ? 1 : this.hp > 5 ? 2 : 3;
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.nextAttack = this.time.now + 1500;
      void this.cutscene([newPhase === 2 ? bossText.phase2 : bossText.phase3]);
    }
  }

  private touchBoss(): void {
    if (this.over || this.player.dead || this.busy) return;
    const pb = this.player.body;
    const bb = this.boss.body as Phaser.Physics.Arcade.Body;
    // Durante a investida dá para pular na cabeça do Tédio.
    if (pb.velocity.y > 0 && pb.bottom <= bb.top + 10) {
      this.player.bounce(true);
      if (this.time.now >= this.bossInvulnerableUntil) this.damageBoss();
      return;
    }
    if (this.diving && !this.player.carinho && this.time.now >= this.player.invincibleUntil) this.die();
  }

  private touchRain(drop: Phaser.Physics.Arcade.Image): void {
    drop.destroy();
    if (this.over || this.player.dead || this.player.carinho || this.time.now < this.player.invincibleUntil) return;
    this.die();
  }

  private die(): void {
    if (this.player.dead || this.over) return;
    this.player.dead = true;
    this.deaths++;
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
      onComplete: () => {
        this.player.respawn(5 * TILE, FLOOR * TILE, this.time.now);
        this.tweens.add({ targets: this.player, alpha: { from: 0.3, to: 1 }, duration: 120, repeat: 4, yoyo: true });
        if (this.deaths >= 5 && !this.carinhoOffered && !this.player.carinho) void this.offerCarinho();
      },
    });
  }

  private async offerCarinho(): Promise<void> {
    this.carinhoOffered = true;
    await this.cutscene([carinhoText.offer(this.profile)]);
    this.player.carinho = true;
    this.player.setTint(0xffc2dc);
    playSfx('success');
    await this.cutscene([carinhoText.on]);
  }

  // ------------------------------------------------------------- Roteiro

  private say(lines: Line[]): Promise<void> {
    return new Promise((resolve) => {
      const off = bridge.on('dialogDone', () => {
        off();
        resolve();
      });
      this.cleanups.push(off);
      bridge.emit('dialog', lines);
    });
  }

  private async cutscene(lines: Line[]): Promise<void> {
    this.busy = true;
    this.player.frozen = true;
    this.physics.world.pause();
    await this.say(lines);
    this.physics.world.resume();
    this.player.frozen = false;
    this.busy = false;
    this.reader.sync();
  }

  private async intro(): Promise<void> {
    this.player.frozen = true;
    await new Promise((r) => this.time.delayedCall(500, r));
    await this.cutscene(bossText.intro(this.profile));
    bridge.emit('hint', bossText.hint);
    this.time.delayedCall(4000, () => bridge.emit('hint', null));
    this.nextRain = this.time.now + 1200;
    this.nextAttack = this.time.now + 2000;
  }

  private async victory(): Promise<void> {
    this.over = true;
    this.busy = true;
    this.player.frozen = true;
    this.rain.clear(true, true);
    this.shots.clear(true, true);
    playSfx('fanfare');
    this.cameras.main.flash(300, 255, 194, 220);
    this.tweens.killTweensOf(this.boss);
    await new Promise<void>((resolve) =>
      this.tweens.add({ targets: this.boss, scale: 0.2, alpha: 0, angle: 360, duration: 1400, onComplete: () => resolve() }),
    );
    for (let i = 0; i < 4; i++) this.burst(this.boss.x + Phaser.Math.Between(-30, 30), this.boss.y + Phaser.Math.Between(-15, 15), 0xff4f9a, 12);

    // A bolha estoura e o par desce até a jogadora.
    this.tweens.killTweensOf([this.bubble, this.partner]);
    this.bubble.destroy();
    playSfx('pop');
    const floorY = FLOOR * TILE;
    const landX = Phaser.Math.Clamp(this.player.x + (this.player.x < COLS * TILE - 60 ? 26 : -26), 20, COLS * TILE - 20);
    await new Promise<void>((resolve) =>
      this.tweens.add({ targets: this.partner, x: landX, y: floorY, duration: 1100, ease: 'Bounce.out', onComplete: () => resolve() }),
    );
    this.partner.setFrame(0).setFlipX(landX > this.player.x);
    this.player.setFlipX(landX < this.player.x);
    this.cameras.main.pan((this.player.x + landX) / 2, floorY - 40, 600);
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 140, () => this.floatHeart((this.player.x + landX) / 2, floorY - 24));
    }
    await this.say(bossText.defeated(this.profile));
    bridge.emit('bossDefeated');
  }

  private floatHeart(x: number, y: number): void {
    const h = this.add.image(x + Phaser.Math.Between(-12, 12), y, 'tiles', 44).setDepth(12).setScale(0.7);
    this.tweens.add({ targets: h, y: y - 50, alpha: 0, duration: 1200, onComplete: () => h.destroy() });
  }

  private burst(x: number, y: number, tint: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x, y, 'spark').setTint(tint).setDepth(12);
      const a = (i / n) * Math.PI * 2;
      this.tweens.add({
        targets: s,
        x: x + Math.cos(a) * Phaser.Math.Between(10, 22),
        y: y + Math.sin(a) * Phaser.Math.Between(10, 22),
        alpha: 0,
        duration: 420,
        onComplete: () => s.destroy(),
      });
    }
  }

  private emitHp(): void {
    bridge.emit('bossHp', { hp: Math.max(0, this.hp), max: MAX_HP });
  }

  /** Chamado pelo menu de pausa. */
  restartFromCheckpoint(): void {
    this.die();
  }

}
