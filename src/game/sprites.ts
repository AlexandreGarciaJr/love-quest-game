// Pixel art própria, desenhada em código: personagens, mascote, Tedinhos e itens.
// Cada caractere de uma linha é um pixel; a paleta diz a cor de cada letra.

import * as Phaser from 'phaser';
import type { Gender } from '../content';

type Palette = Record<string, string>;

/** Cria uma textura com vários quadros lado a lado a partir de mapas de caracteres. */
export function makeSheet(scene: Phaser.Scene, key: string, rawFrames: string[][], palette: Palette): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  // Normaliza: todas as linhas e quadros com o mesmo tamanho.
  const w = Math.max(...rawFrames.flat().map((r) => r.length));
  const h = Math.max(...rawFrames.map((f) => f.length));
  const frames = rawFrames.map((f) => [...f, ...Array<string>(h - f.length).fill('')].map((r) => r.padEnd(w, '.')));
  const tex = scene.textures.createCanvas(key, w * frames.length, h)!;
  const ctx = tex.getContext();
  frames.forEach((rows, f) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(f * w + x, y, 1, 1);
      }
    });
    tex.add(f, 0, f * w, 0, w, h);
  });
  tex.refresh();
}

// ---------------------------------------------------------------- Personagens

const HEAD_F = [
  '......kkkkk.....',
  '....kkhhhhhkk...',
  '...khhhHHhhhhk..',
  '..khhhHhhhhhhhk.',
  '..khhhhhsssshhk.',
  '..khhhsssssssk..',
  '..khhssesssesk..',
  '..khhsbsssssbk..',
  '..khhhsssssssk..',
  '..khhhkksssk....',
];

const HEAD_M = [
  '......kkkkk.....',
  '....kkhhhhhkk...',
  '...khhhHHhhhhk..',
  '...khhHhhhhhhk..',
  '...khhhhsssshk..',
  '...khhsssssssk..',
  '...khssesssesk..',
  '...khsbssssbsk..',
  '...ksssssssssk..',
  '....kkkssssk....',
];

const TORSO_F = [
  '..khhkcccccck...',
  '..khkcccccccck..',
  '...kscccccccsk..',
  '...ksCCcccccsk..',
  '....kpppppppk...',
  '...kpppppppppk..',
];

const TORSO_M = [
  '....kccccccck...',
  '...kccccccccck..',
  '...kscccccccsk..',
  '...ksCCcccccsk..',
  '....kpppppppk...',
  '....kpppppppk...',
];

const punchTorso = (torso: string[]) => [
  torso[0],
  torso[1],
  '...kccccccccsssk',
  '...kCCcccccckkk.',
  torso[4],
  torso[5],
];

const LEGS = {
  stand: ['.....kLk.kLk....', '.....kLk.kLk....', '.....kfk.kfk....', '....kkfk.kfkk...'],
  run1: ['....kLk...kLk...', '...kLk.....kLk..', '..kfk.......kfk.', '..kk.........kk.'],
  run2: ['.....kLkk.......', '......kLk.......', '......kfk.......', '.....kkfk.......'],
  run3: ['.....kLk.kLk....', '....kLk...kLk...', '...kfk.....kfk..', '...kk.......kk..'],
  jump: ['....kLk..kLk....', '....kfk..kfk....', '....kk....kk....', '................'],
  fall: ['....kLk..kLk....', '...kLk....kLk...', '...kfk....kfk...', '...kk......kk...'],
};

const FRAME_ORDER = ['stand', 'stand', 'run1', 'run2', 'run3', 'run2', 'jump', 'fall', 'stand'] as const;
/** Índices dos quadros: 0-1 parado, 2-5 correndo, 6 subindo, 7 caindo, 8 soco. */
export const HERO_FRAMES = { idle: [0, 1], run: [2, 3, 4, 5], jump: 6, fall: 7, punch: 8 };

function heroFrames(gender: Gender): string[][] {
  const head = gender === 'f' ? HEAD_F : HEAD_M;
  const torso = gender === 'f' ? TORSO_F : TORSO_M;
  return FRAME_ORDER.map((leg, i) => {
    // Quadro 1 do "parado" respira: o corpo desce 1 pixel.
    const rows = [...head, ...(i === HERO_FRAMES.punch ? punchTorso(torso) : torso), ...LEGS[leg]];
    if (i === 1) return ['................', ...rows.slice(0, 19)];
    return rows;
  });
}

function heroPalette(gender: Gender, variant: 'player' | 'partner'): Palette {
  const base: Palette = { k: '#2b1633', s: '#f7c9a3', e: '#2b1633', b: '#ff8fb1', f: '#2b1633' };
  if (gender === 'f') {
    const shirt = variant === 'player' ? ['#ff4f9a', '#d92f7a'] : ['#ffd166', '#e0a93a'];
    return { ...base, h: '#8a3b2a', H: '#c0634a', c: shirt[0], C: shirt[1], p: '#9b6bff', L: '#f7c9a3' };
  }
  const shirt = variant === 'player' ? ['#5b8cff', '#3d63c9'] : ['#3fb57a', '#2b8a5a'];
  return { ...base, h: '#4a2a1e', H: '#7a4a35', c: shirt[0], C: shirt[1], p: '#3a3160', L: '#3a3160' };
}

// ---------------------------------------------------------------- Outros

const MASCOT = [
  [
    '..kkk...kkk..',
    '.kpppk.kpppk.',
    'kpwwpppppppk.',
    'kpwppppppppk.',
    'kppkpppkpppk.',
    'kppkpppkpppk.',
    '.kbppppppbk..',
    '..kppkkppk...',
    '...kppppk....',
    '....kppk.....',
    '.....kk......',
  ].map((r) => r.padEnd(13, '.')),
];

const TEDINHO = [
  [
    '....kkkk..kkk...',
    '..kkggggkkgggk..',
    '.kgggwwggggggk..',
    'kggwwgggggggggk.',
    'kgggggggggggggk.',
    'kggkkggggkkgggk.',
    'kgggggggggggggk.',
    'kggggggGGgggggk.',
    '.kgggggggggggk..',
    '..kkgggggggkk...',
    '....kkkkkkk.....',
    '.....kk..kk.....',
  ],
  [
    '................',
    '....kkkk..kkk...',
    '..kkggggkkgggk..',
    '.kgggwwggggggk..',
    'kggwwgggggggggk.',
    'kggkkggggkkgggk.',
    'kgggggggggggggk.',
    'kggggggGGgggggk.',
    '.kgggggggggggk..',
    '..kkgggggggkk...',
    '....kkkkkkk.....',
    '....kk....kk....',
  ],
];

const LETTER = [
  [
    'kkkkkkkkkkkk',
    'kwkwwwwwwkwk',
    'kwwkwwwwkwwk',
    'kwwwkwwkwwwk',
    'kwwwwkkwwwwk',
    'kwwwwppwwwwk',
    'kwwwwwwwwwwk',
    'kkkkkkkkkkkk',
  ],
];

const CHECKPOINT_ROWS = (heart: string) => [
  '..kk.kk....',
  '.kHHkHHk...',
  '.kHwHHHk...',
  '..kHHHk....',
  '...kHk.....',
  '....k......',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '....kb.....',
  '...kkbk....',
  '..kbbbbk...',
].map((r) => r.replace(/H/g, heart));

const SPARK = [['.w.', 'www', '.w.']];

export function createTextures(scene: Phaser.Scene, playerGender: Gender, partnerGender: Gender): void {
  makeSheet(scene, 'hero', heroFrames(playerGender), heroPalette(playerGender, 'player'));
  makeSheet(scene, 'partner', heroFrames(partnerGender), heroPalette(partnerGender, 'partner'));
  makeSheet(scene, 'mascot', MASCOT, { k: '#2a0f2a', p: '#ff4f9a', w: '#ffc2dc', b: '#ff86bb' });
  makeSheet(scene, 'tedinho', TEDINHO, { k: '#3a3550', g: '#b8b4cc', G: '#6d6880', w: '#e8e6f2' });
  makeSheet(scene, 'letter', LETTER, { k: '#6f3e43', w: '#fff7ec', p: '#ff4f9a' });
  makeSheet(scene, 'checkpoint', [CHECKPOINT_ROWS('O'), CHECKPOINT_ROWS('P')], {
    k: '#2a0f2a', O: '#6d6880', P: '#ff4f9a', w: '#ffffff', b: '#9f5a52',
  });
  makeSheet(scene, 'spark', SPARK, { w: '#ffffff' });
}
