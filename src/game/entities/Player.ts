import * as Phaser from 'phaser';
import { PHYS } from '../config';
import type { Controls } from '../input';
import { HERO_FRAMES } from '../sprites';
import { playSfx } from '../../audio';

export interface Abilities {
  doubleJump: boolean;
  dash: boolean;
}

const approach = (v: number, target: number, delta: number) =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  abilities: Abilities = { doubleJump: false, dash: false };
  dead = false;
  frozen = false;
  invincibleUntil = 0;
  /** Modo Carinho: pulo extra no ar e imunidade a inimigos e espinhos. */
  carinho = false;
  /** Multiplicador de velocidade (o bocejo do Tédio deixa mais lento). */
  speedMul = 1;

  private coyote = 0;
  private buffer = 0;
  private jumping = false;
  private airJumps = 0;
  private canDash = true;
  private dashTimer = 0;
  private dashDir = 1;
  private throwTimer = 0;
  private throwCooldown = 0;
  private shotRequested = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(8, 15).setOffset(4, 5);
    this.setDepth(10);

    const anims = scene.anims;
    if (!anims.exists('hero-idle')) {
      anims.create({ key: 'hero-idle', frames: anims.generateFrameNumbers('hero', { frames: HERO_FRAMES.idle }), frameRate: 2, repeat: -1 });
      anims.create({ key: 'hero-run', frames: anims.generateFrameNumbers('hero', { frames: HERO_FRAMES.run }), frameRate: 12, repeat: -1 });
    }
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  get isDashing(): boolean {
    return this.dashTimer > 0;
  }

  get maxAirJumps(): number {
    return (this.abilities.doubleJump ? 1 : 0) + (this.carinho ? 1 : 0);
  }

  /** true uma vez por arremesso: a cena cria o coração. */
  takeShot(): boolean {
    const s = this.shotRequested;
    this.shotRequested = false;
    return s;
  }

  update(dt: number, c: Controls): void {
    if (this.dead) return;
    const body = this.body;

    // Limita só a queda (setMaxVelocity limitaria também o impulso das flores-trampolim).
    if (this.body.velocity.y > PHYS.maxFall) this.body.setVelocityY(PHYS.maxFall);

    if (this.frozen) {
      body.setVelocityX(approach(body.velocity.x, 0, PHYS.groundDecel * dt));
      this.animate();
      return;
    }

    if (this.onGround) {
      this.coyote = PHYS.coyoteTime;
      this.airJumps = 0;
      this.canDash = true;
    } else {
      this.coyote -= dt;
    }
    this.buffer = c.jumpPressed ? PHYS.jumpBuffer : this.buffer - dt;
    this.throwTimer -= dt;
    this.throwCooldown -= dt;

    // Dash: impulso horizontal rápido, sem gravidade.
    if (this.isDashing) {
      this.dashTimer -= dt;
      body.setVelocity(this.dashDir * PHYS.dashSpeed, 0);
      if (this.dashTimer <= 0) {
        body.setAllowGravity(true);
        body.setVelocityX(this.dashDir * PHYS.runSpeed);
      }
      this.animate();
      return;
    }

    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir !== 0) {
      const accel = this.onGround ? PHYS.groundAccel : PHYS.airAccel;
      body.setVelocityX(approach(body.velocity.x, dir * PHYS.runSpeed * this.speedMul, accel * dt));
      this.setFlipX(dir < 0);
    } else {
      const decel = this.onGround ? PHYS.groundDecel : PHYS.airAccel * 0.5;
      body.setVelocityX(approach(body.velocity.x, 0, decel * dt));
    }

    if (this.buffer > 0 && this.coyote > 0) {
      this.jump(PHYS.jumpVelocity);
      playSfx('jump');
    } else if (c.jumpPressed && !this.onGround && this.airJumps < this.maxAirJumps) {
      this.airJumps++;
      this.jump(PHYS.doubleJumpVelocity);
      // O pulo duplo sai sempre inteiro: toques rápidos no celular não o encurtam.
      this.jumping = false;
      playSfx('doubleJump');
      this.emitSparks(6);
    } else if (c.jumpPressed && !this.onGround && this.abilities.dash && this.canDash) {
      // Sem pulos no ar sobrando, apertar PULAR de novo vira o impulso (Saudade Acelerada).
      this.startDash(dir);
    }

    // Soltar o pulo cedo = pulo mais baixo.
    if (this.jumping && !c.jump && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PHYS.jumpCut);
      this.jumping = false;
    }
    if (body.velocity.y >= 0) this.jumping = false;

    // Ação: arremessa um coração para a frente.
    if (c.actionPressed && this.throwCooldown <= 0) {
      this.throwTimer = PHYS.throwTime;
      this.throwCooldown = PHYS.throwCooldown;
      this.shotRequested = true;
      playSfx('punch');
    }

    this.animate();
  }

  private startDash(dir: number): void {
    this.canDash = false;
    this.dashTimer = PHYS.dashTime;
    this.dashDir = dir !== 0 ? dir : this.flipX ? -1 : 1;
    this.setFlipX(this.dashDir < 0);
    this.body.setAllowGravity(false);
    playSfx('dash');
    this.emitSparks(8);
  }

  private jump(velocity: number): void {
    this.body.setVelocityY(-velocity);
    this.jumping = true;
    this.buffer = 0;
    this.coyote = 0;
  }

  /** Quique depois de pisar num inimigo. */
  bounce(held: boolean): void {
    this.body.setVelocityY(-(held ? PHYS.stompBounceHeld : PHYS.stompBounce));
    this.jumping = held;
    this.airJumps = 0;
    this.canDash = true;
  }

  private animate(): void {
    if (this.throwTimer > 0 || this.isDashing) {
      this.anims.stop();
      this.setFrame(HERO_FRAMES.punch);
      return;
    }
    if (this.onGround) {
      if (Math.abs(this.body.velocity.x) > 10) this.anims.play('hero-run', true);
      else this.anims.play('hero-idle', true);
    } else {
      this.anims.stop();
      this.setFrame(this.body.velocity.y < 0 ? HERO_FRAMES.jump : HERO_FRAMES.fall);
    }
  }

  emitSparks(n: number): void {
    for (let i = 0; i < n; i++) {
      const s = this.scene.add.image(this.x, this.y - 8, 'spark').setDepth(9).setTint(0xffc2dc);
      this.scene.tweens.add({
        targets: s,
        x: this.x + Phaser.Math.Between(-14, 14),
        y: this.y - 8 + Phaser.Math.Between(-12, 10),
        alpha: 0,
        duration: 380,
        onComplete: () => s.destroy(),
      });
    }
  }

  respawn(x: number, y: number, now: number): void {
    this.dead = false;
    this.dashTimer = 0;
    this.throwTimer = 0;
    this.shotRequested = false;
    this.jumping = false;
    this.body.setAllowGravity(true);
    this.body.enable = true;
    this.setPosition(x, y);
    this.body.reset(x, y);
    this.setAlpha(1).setAngle(0);
    this.invincibleUntil = now + 1000;
  }
}
