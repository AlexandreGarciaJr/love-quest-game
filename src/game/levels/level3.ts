// Fase 3 — Cidade à Noite (inspirada em Brasília). Impulso no ar, plataformas que caem e pombos.

import { LevelBuilder, type LevelData } from './builder';

export function level3(): LevelData {
  const b = new LevelBuilder(212, 20);

  // --- Chegada no aeroporto --------------------------------------------
  b.ground(0, 25).start(3, 2);
  b.decor(8, 2, 'plane');
  b.decor(17, 2, 'airport');
  b.npc(21, 2, 'calango');
  b.power(24, 2, 'dash');

  // --- Telhados ----------------------------------------------------------
  b.ground(27, 35, 4).hearts(28, 34, 4);
  b.ground(38, 45, 5).pigeon(42, 5);
  b.ground(48, 57, 3).decor(51, 3, 'ipe');
  b.sign(49, 3, 'Vão grande! Pulo, pulo duplo e PULAR de novo: impulso!');
  b.arc(57, 67, 4, 3); // vão de 9 blocos
  b.ground(67, 77, 3).checkpoint(69, 3).decor(74, 3, 'ipe');

  // --- Plataformas que caem --------------------------------------------
  b.faller(80, 4, 2).hearts(80, 81, 6);
  b.faller(85, 5, 2).hearts(85, 86, 7);
  b.faller(90, 4, 2).hearts(90, 91, 6);
  b.faller(95, 5, 2).hearts(95, 96, 7);
  b.ground(100, 113, 4).pigeon(106, 4).decor(103, 4, 'ipe').decor(111, 4, 'ipe');
  b.checkpoint(112, 4);

  // --- Ponte JK: tabuleiro sob os três arcos ---------------------------
  b.sign(115, 4, 'Ponte JK: cuidado com os vãos!');
  for (let i = 0; i < 3; i++) {
    const x0 = 116 + i * 13;
    b.block(x0, 3, 10);
    b.decor(x0 - 1, 4, 'jk-arch');
    b.cloud(x0 + 4, 9, 3).hearts(x0 + 4, x0 + 6, 10);
  }
  b.pigeon(122, 4).pigeon(148, 4);
  b.hearts(127, 128, 6).hearts(140, 141, 6);
  b.letter(156, 12);
  b.cloud(152, 7, 2).cloud(155, 11, 3);

  b.ground(155, 163, 4).checkpoint(157, 4);

  // --- Corrida final pelos telhados ------------------------------------
  b.arc(163, 170, 5, 3);
  b.ground(170, 178, 6).pigeon(174, 6);
  b.faller(181, 7, 2).faller(186, 8, 2);
  b.ground(190, 211, 5).decor(193, 5, 'ipe');
  b.enemy(197, 5);
  b.sign(200, 5, 'O castelo do Tédio fica logo acima das nuvens!');
  b.goal(205, 5);

  return b.build('city', 'Cidade à Noite', 'city');
}
