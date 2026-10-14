// Construtor de fases: as fases são descritas com chamadas simples
// (chão, nuvem, inimigo…) em coordenadas de bloco, com y contado de baixo para cima.

export type Cell = '.' | 'G' | 'B' | 'C' | '^';
// G = chão maciço, B = bloco flutuante, C = plataforma atravessável por baixo, ^ = espinhos

export type Theme = 'sky' | 'garden' | 'city';

export type NpcKind = 'snail' | 'owl' | 'calango';
export type PowerKind = 'wings' | 'dash';

export type EntityDef =
  | { kind: 'start'; x: number; y: number }
  | { kind: 'goal'; x: number; y: number }
  | { kind: 'heart'; x: number; y: number }
  | { kind: 'letter'; x: number; y: number }
  | { kind: 'checkpoint'; x: number; y: number }
  | { kind: 'sign'; x: number; y: number; text: string }
  | { kind: 'tedinho'; x: number; y: number }
  | { kind: 'bee'; x: number; y: number; range: number; vertical: boolean }
  | { kind: 'pigeon'; x: number; y: number }
  | { kind: 'spring'; x: number; y: number }
  | { kind: 'mover'; x: number; y: number; len: number; dx: number; dy: number; speed: number }
  | { kind: 'faller'; x: number; y: number; len: number }
  | { kind: 'npc'; x: number; y: number; npc: NpcKind }
  | { kind: 'power'; x: number; y: number; power: PowerKind }
  | { kind: 'decor'; x: number; y: number; decor: string };

export interface LevelData {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: Cell[][]; // grid[linha de cima para baixo][coluna]
  entities: EntityDef[];
  theme: Theme;
}

export class LevelBuilder {
  readonly grid: Cell[][];
  readonly entities: EntityDef[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.grid = Array.from({ length: height }, () => Array<Cell>(width).fill('.'));
  }

  private set(x: number, y: number, c: Cell) {
    const row = this.height - 1 - y;
    if (x < 0 || x >= this.width || row < 0 || row >= this.height) return;
    this.grid[row][x] = c;
  }

  /** Chão maciço da coluna x0 até x1 (inclusive), com a superfície na altura h. */
  ground(x0: number, x1: number, h = 2): this {
    for (let x = x0; x <= x1; x++) for (let y = 0; y < h; y++) this.set(x, y, 'G');
    return this;
  }

  /** Plataforma de blocos flutuante com `len` blocos, topo na altura y+1. */
  block(x: number, y: number, len = 1): this {
    for (let i = 0; i < len; i++) this.set(x + i, y, 'B');
    return this;
  }

  /** Plataforma atravessável por baixo (nuvem, andaime…). */
  cloud(x: number, y: number, len = 3): this {
    for (let i = 0; i < len; i++) this.set(x + i, y, 'C');
    return this;
  }

  spikes(x0: number, x1: number, y: number): this {
    for (let x = x0; x <= x1; x++) this.set(x, y, '^');
    return this;
  }

  heart(x: number, y: number): this {
    this.entities.push({ kind: 'heart', x, y });
    return this;
  }

  /** Fileira horizontal de corações. */
  hearts(x0: number, x1: number, y: number): this {
    for (let x = x0; x <= x1; x++) this.heart(x, y);
    return this;
  }

  /** Arco de corações indicando um pulo de x0 até x1. */
  arc(x0: number, x1: number, y: number, peak = 2): this {
    const n = x1 - x0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      this.heart(x0 + i, y + Math.round(4 * peak * t * (1 - t)));
    }
    return this;
  }

  enemy(x: number, y: number): this {
    this.entities.push({ kind: 'tedinho', x, y });
    return this;
  }

  /** Abelha: voa `range` blocos para os lados (ou para cima e para baixo). */
  bee(x: number, y: number, range = 3, vertical = false): this {
    this.entities.push({ kind: 'bee', x, y, range, vertical });
    return this;
  }

  pigeon(x: number, y: number): this {
    this.entities.push({ kind: 'pigeon', x, y });
    return this;
  }

  spring(x: number, y: number): this {
    this.entities.push({ kind: 'spring', x, y });
    return this;
  }

  /** Plataforma móvel: anda dx/dy blocos e volta. */
  mover(x: number, y: number, len: number, dx: number, dy: number, speed = 40): this {
    this.entities.push({ kind: 'mover', x, y, len, dx, dy, speed });
    return this;
  }

  /** Plataforma que cai pouco depois de ser pisada. */
  faller(x: number, y: number, len = 2): this {
    this.entities.push({ kind: 'faller', x, y, len });
    return this;
  }

  npc(x: number, y: number, npc: NpcKind): this {
    this.entities.push({ kind: 'npc', x, y, npc });
    return this;
  }

  power(x: number, y: number, power: PowerKind): this {
    this.entities.push({ kind: 'power', x, y, power });
    return this;
  }

  decor(x: number, y: number, decor: string): this {
    this.entities.push({ kind: 'decor', x, y, decor });
    return this;
  }

  checkpoint(x: number, y: number): this {
    this.entities.push({ kind: 'checkpoint', x, y });
    return this;
  }

  letter(x: number, y: number): this {
    this.entities.push({ kind: 'letter', x, y });
    return this;
  }

  sign(x: number, y: number, text: string): this {
    this.entities.push({ kind: 'sign', x, y, text });
    return this;
  }

  start(x: number, y: number): this {
    this.entities.push({ kind: 'start', x, y });
    return this;
  }

  goal(x: number, y: number): this {
    this.entities.push({ kind: 'goal', x, y });
    return this;
  }

  build(id: string, name: string, theme: Theme): LevelData {
    return { id, name, theme, width: this.width, height: this.height, grid: this.grid, entities: this.entities };
  }
}
