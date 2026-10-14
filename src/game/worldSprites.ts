// Pixel art das Fases 2 e 3 e do chefão: NPCs, inimigos, poderes e decoração.

import type * as Phaser from 'phaser';
import { makeSheet } from './sprites';

const SNAIL = [
  [
    '...........k..k.',
    '....kkkk....kk..',
    '...kppppk..kssk.',
    '..kppkkppk.kesk.',
    '..kpkPPkpk.kssk.',
    '..kpkPkkpkkssk..',
    '..kppkppkkssk...',
    '.kkkppppkksssk..',
    'kbbbkkkkksssssk.',
    'kssssssssssssssk',
    '.kkkkkkkkkkkkkk.',
  ],
];

const OWL_OPEN = [
  '..k........k..',
  '..kk......kk..',
  '..kbbbbbbbbk..',
  '.kbwwwbbwwwbk.',
  '.kbwekbbwekbk.',
  '.kbwwwyywwwbk.',
  '.kbbbbyybbbbk.',
  'kbBBbbbbbbBBbk',
  'kbBBbccccbBBbk',
  'kbBBbccccbBBbk',
  '.kbbbccccbbbk.',
  '..kbbbbbbbbk..',
  '...kyk..kyk...',
];
const OWL = [OWL_OPEN, OWL_OPEN.map((r, i) => (i === 4 ? '.kbkkkbbkkkbk.' : r))];

const CALANGO = [
  [
    '..........kkkk..',
    '.........kgggek.',
    '........kggggggk',
    '..kkkkkkggggkkk.',
    '.kgggGgggGgggk..',
    'kggGgggGgggggk..',
    'kgk.kgk...kgk...',
    'kk..kk....kk....',
  ],
];

const BEE_BODY = [
  '....kkkkkk..',
  '...kyykyykk.',
  '.kkyykyykeyk',
  '..kyykyykyyk',
  '...kyykyykk.',
  '....kkkkkk..',
];
const BEE = [
  ['....ww..ww..', '...wwww.www.', ...BEE_BODY],
  ['............', '...www..ww..', ...BEE_BODY],
];

const PIGEON = [
  [
    '......kkk.......',
    '.....kgggk......',
    '....kgegggkk....',
    '....kggggkoo....',
    '...kggggggk.....',
    '..kgGGggggggk...',
    '.kgGGGgggggggk..',
    'kgGGGggggggggk..',
    '.kkgggggggggk...',
    '...kkkkkkkkk....',
    '.....ko..ko.....',
  ],
  [
    '................',
    '......kkk.......',
    '.....kgggk......',
    '....kgegggkk....',
    '....kggggkoo....',
    '..kkgggggggk....',
    '.kgGGGgggggggk..',
    'kgGGGggggggggk..',
    '.kkgggggggggk...',
    '...kkkkkkkkk....',
    '....ko....ko....',
  ],
];

const CARIMBO = [['.kkkk.', 'krrrrk', 'krwwrk', 'krwwrk', 'krrrrk', '.kkkk.']];

const SPRING_STEM = ['.....kkgggkk....', '..kgg..kgk..ggk.', '...kgggkgkgggk..', '......kgggk.....'];
const SPRING = [
  [
    '......kkkkk.....',
    '....kkpppppkk...',
    '...kppPPPPPppk..',
    '..kpPPyyyyPPPpk.',
    '..kpPyyyyyyPPpk.',
    '..kppPPyyPPPppk.',
    '...kkppppppkk...',
    ...SPRING_STEM,
  ],
  [
    '................',
    '................',
    '................',
    '....kkkkkkkkk...',
    '..kkpppPPPpppkk.',
    '.kpPPyyyyyyPPPpk',
    '.kkppppppppppkk.',
    ...SPRING_STEM,
  ],
];

const WINGS = [
  [
    'kk..........kk',
    'kwkk......kkwk',
    'kwwwk.kk.kwwwk',
    '.kwwwkppkwwwk.',
    '.kwwwkppkwwwk.',
    '..kwwkkkkwwk..',
    '...kkk..kkk...',
  ],
];

const DASH_POWER = [
  [
    '..kk...kk..',
    '.kppk.kppk.',
    'kppppkppypk',
    'kpppppyypk.',
    '.kpppyypk..',
    '..kpyyyyk..',
    '...kyypk...',
    '...kypk....',
    '....kk.....',
  ],
];

const IPE = [
  [
    '.......yyyy.yyy........',
    '....yyyYYyyyyyYyyy.....',
    '..yyYYyyyyYYyyyyyYyy...',
    '.yyyyyyYyyyyyyyYyyyyy..',
    'yyYyyyyyyyYYyyyyyyyYyy.',
    'yyyyyYYyyyyyyyyYyyyyyy.',
    '.yyyyyyyyyYyyyyyyyyyy..',
    '..yyYyyyyyyyyyyYyyyy...',
    '....yyyyybbyyyyyy......',
    '.........bb............',
    '........bbb............',
    '.........bb............',
    '.........bb............',
    '........bbbb...........',
  ],
];

const PLANE = [
  [
    '..........................kk....',
    '.........................kwwk...',
    '..kkkkkkkkkkkkkkkkkkkkkkkwwwk...',
    '.kwwwwwwwwwwwwwwwwwwwwwwwwwwk...',
    'kwbbwbbwbbwbbwbbwbbwbbwwwwwwwkk.',
    'kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk',
    '.kkkkkwwwwwkkkkkkkkkkkkkkkkkkkk.',
    '......kwwwwwk...................',
    '.......kkkkkk...................',
  ],
];

const FLOWER_DECOR = [['.kk.', 'kppk', 'kpyk', '.kk.', '..g.', '.gg.', '..g.']];

// Chefão Tédio: nuvenzona cinza com cara de sono (3 quadros: normal, bocejo, machucado).
const TEDIO_BASE = [
  '..........kkkkkk....kkkkk.........',
  '.......kkkggggggkkkkgggggkk.......',
  '.....kkggggwwggggggggggggggkk.....',
  '....kgggwwwwggggggggggggggggggk...',
  '...kggwwwggggggggggggggggggggggk..',
  '..kggggggggggggggggggggggggggggk..',
  '.kgggggggggggggggggggggggggggggk..',
  '.kggggEEEEEggggggggggEEEEEgggggk..',
  'kggggggggggggggggggggggggggggggk..',
  'kgggggggggggggMMMMMMggggggggggggk.',
  'kggggggggggggMMMMMMMMgggggggggggk.',
  'kgggggggggggggMMMMMMggggggggggggk.',
  '.kggggggggggggggggggggggggggggggk.',
  '.kGGgggggggggggggggggggggggggGGk..',
  '..kGGGgggggggggggggggggggggGGGk...',
  '...kkGGGGggggggggggggggGGGGkk.....',
  '.....kkkkGGGGGGGGGGGGGGkkkk.......',
  '.........kkkkkkkkkkkkkk...........',
];
const TEDIO = [
  TEDIO_BASE.map((r) => r.replace(/M/g, 'g')),
  TEDIO_BASE,
  TEDIO_BASE.map((r) => r.replace(/E/g, 'x').replace(/M/g, 'g')),
];

const HEART_SHOT = [['.kk.kk.', 'kppkppk', 'kpwpppk', '.kpppk.', '..kpk..', '...k...']];

export function createWorldTextures(scene: Phaser.Scene): void {
  const ink = '#2b1633';
  makeSheet(scene, 'npc-snail', SNAIL, { k: ink, p: '#ff86bb', P: '#d92f7a', s: '#ffe3b8', e: ink, b: '#5b8cff' });
  makeSheet(scene, 'npc-owl', OWL, { k: ink, b: '#9f6b4a', B: '#7a4a35', w: '#fff7ec', e: ink, y: '#ffd166', c: '#ffe3b8' });
  makeSheet(scene, 'npc-calango', CALANGO, { k: ink, g: '#7bc96f', G: '#3f8f4a', e: ink });
  makeSheet(scene, 'bee', BEE, { k: ink, y: '#ffd166', w: '#e8f4ff', e: '#ffffff' });
  makeSheet(scene, 'pigeon', PIGEON, { k: ink, g: '#9a9ab8', G: '#6d6d8f', e: '#ff4f9a', o: '#ffb347' });
  makeSheet(scene, 'carimbo', CARIMBO, { k: ink, r: '#e2364b', w: '#ffd1d8' });
  makeSheet(scene, 'spring', SPRING, { k: ink, p: '#ff86bb', P: '#ff4f9a', y: '#ffd166', g: '#3fb57a' });
  makeSheet(scene, 'power-wings', WINGS, { k: ink, w: '#ffffff', p: '#ff4f9a' });
  makeSheet(scene, 'power-dash', DASH_POWER, { k: ink, p: '#ff4f9a', y: '#ffd166' });
  makeSheet(scene, 'ipe', IPE, { y: '#ffd23f', Y: '#f5a623', b: '#6f3e43' });
  makeSheet(scene, 'plane', PLANE, { k: ink, w: '#eef2ff', b: '#ffd166' });
  makeSheet(scene, 'flower-decor', FLOWER_DECOR, { k: ink, p: '#ff86bb', y: '#ffd166', g: '#3fb57a' });
  makeSheet(scene, 'tedio', TEDIO, { k: '#3a3550', g: '#a9a4c0', G: '#7b7694', w: '#e8e6f2', E: '#3a3550', M: '#3a3550', x: '#ff4f9a' });
  makeSheet(scene, 'heart-shot', HEART_SHOT, { k: ink, p: '#ff4f9a', w: '#ffffff' });
}
