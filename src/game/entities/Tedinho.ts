import * as Phaser from 'phaser';

const SPEED = 26;

/** Nuvenzinha cinza que anda de um lado para o outro e vira na beirada. */
export class Tedinho extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  private dir = -1;
  alive = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private layer: Phaser.Tilemaps.TilemapLayer,
  ) {
    super(scene, x, y, 'tedinho', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.body.setSize(12, 9).setOffset(2, 3);
    this.setDepth(8);
    if (!scene.anims.exists('tedinho-walk')) {
      scene.anims.create({ key: 'tedinho-walk', frames: scene.anims.generateFrameNumbers('tedinho', { frames: [0, 1] }), frameRate: 4, repeat: -1 });
    }
    this.anims.play('tedinho-walk');
  }

  update(): void {
    if (!this.alive) return;
    const body = this.body;
    if (body.blocked.left) this.dir = 1;
    else if (body.blocked.right) this.dir = -1;
    else if (body.blocked.down) {
      // Vira antes de cair da beirada.
      const aheadX = this.dir > 0 ? body.right + 2 : body.left - 2;
      const tile = this.layer.getTileAtWorldXY(aheadX, body.bottom + 2);
      if (!tile || tile.index < 0) this.dir *= -1;
    }
    body.setVelocityX(this.dir * SPEED);
    this.setFlipX(this.dir > 0);
  }

  squash(): void {
    this.alive = false;
    this.body.enable = false;
    this.anims.stop();
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      scaleX: 1.4,
      alpha: 0,
      duration: 260,
      onComplete: () => this.destroy(),
    });
  }
}
