// Estado de entrada unificado: toque (botões na tela), teclado e controle.

import * as Phaser from 'phaser';

/** Escrito pelos botões de toque do React. */
export const touch = {
  left: false,
  right: false,
  jump: false,
  action: false,
};

export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  action: boolean;
  jumpPressed: boolean;
  actionPressed: boolean;
  pausePressed: boolean;
}

export class InputReader {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private prevJump = false;
  private prevAction = false;
  private prevPause = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP,
      a: K.A, d: K.D, w: K.W,
      space: K.SPACE, z: K.Z, x: K.X, k: K.K, j: K.J, shift: K.SHIFT,
      esc: K.ESC, p: K.P,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  read(): Controls {
    const k = this.keys;
    const pad = readGamepad();
    const left = k.left.isDown || k.a.isDown || touch.left || pad.left;
    const right = k.right.isDown || k.d.isDown || touch.right || pad.right;
    const jump = k.space.isDown || k.up.isDown || k.w.isDown || k.z.isDown || k.k.isDown || touch.jump || pad.jump;
    const action = k.x.isDown || k.j.isDown || k.shift.isDown || touch.action || pad.action;
    const pause = k.esc.isDown || k.p.isDown || pad.pause;

    const c: Controls = {
      left,
      right,
      jump,
      action,
      jumpPressed: jump && !this.prevJump,
      actionPressed: action && !this.prevAction,
      pausePressed: pause && !this.prevPause,
    };
    this.prevJump = jump;
    this.prevAction = action;
    this.prevPause = pause;
    return c;
  }

  /** Evita que um botão segurado durante a pausa conte como novo toque. */
  sync(): void {
    const c = this.read();
    this.prevJump = c.jump;
    this.prevAction = c.action;
  }
}

function readGamepad() {
  const none = { left: false, right: false, jump: false, action: false, pause: false };
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return none;
  for (const gp of navigator.getGamepads()) {
    if (!gp || !gp.connected) continue;
    const b = (i: number) => !!gp.buttons[i]?.pressed;
    const ax = gp.axes[0] ?? 0;
    return {
      left: ax < -0.4 || b(14),
      right: ax > 0.4 || b(15),
      jump: b(0),
      action: b(2) || b(1) || b(5),
      pause: b(9),
    };
  }
  return none;
}
