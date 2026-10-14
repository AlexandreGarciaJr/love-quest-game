// Constantes de física e jogo. Ajuste aqui a "sensação" do controle.

export const TILE = 18;

/** Quantos blocos de altura a câmera mostra (deitado / em pé). */
export const VIEW_TILES_LANDSCAPE = 12;
export const VIEW_TILES_PORTRAIT = 14;

export const PHYS = {
  gravity: 1000,
  runSpeed: 120,
  groundAccel: 1500,
  airAccel: 1000,
  groundDecel: 1800,
  jumpVelocity: 348,
  /** Ao soltar o pulo cedo, a velocidade de subida é multiplicada por isso. */
  jumpCut: 0.45,
  maxFall: 430,
  /** Tolerância para pular logo depois de sair da plataforma (s). */
  coyoteTime: 0.12,
  /** Pulo apertado um pouco antes de tocar o chão ainda conta (s). */
  jumpBuffer: 0.15,
  doubleJumpVelocity: 340,
  dashSpeed: 280,
  dashTime: 0.16,
  stompBounce: 260,
  stompBounceHeld: 340,
  /** Corações arremessados com B: pose, intervalo mínimo, velocidade e alcance (s). */
  throwTime: 0.16,
  throwCooldown: 0.28,
  shotSpeed: 240,
  shotLife: 0.6,
};

export const COLORS = {
  night: 0x0b0820,
  night2: 0x1a1240,
  pink: 0xff4f9a,
  pinkLight: 0xffc2dc,
  violet: 0x9b6bff,
  moon: 0xfff7ec,
};
