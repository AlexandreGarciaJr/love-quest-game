// Fase 2 — Jardim Florido. Ensina o pulo duplo; flores-trampolim, abelhas e plataformas móveis.

import { LevelBuilder, type LevelData } from './builder';

export function level2(): LevelData {
  const b = new LevelBuilder(196, 20);

  // --- Asas do Amor ----------------------------------------------------
  b.ground(0, 30).start(2, 2);
  b.npc(6, 2, 'owl');
  b.power(11, 2, 'wings');
  b.sign(14, 2, 'Pulo duplo: aperte PULAR de novo lá no alto do pulo!');
  b.ground(19, 21, 6).hearts(19, 21, 7); // muro de 4 blocos: dá para subir com o pulo duplo
  b.hearts(16, 18, 5);
  b.spring(26, 2);
  b.hearts(26, 26, 5).hearts(26, 26, 8).heart(26, 11);
  b.cloud(24, 12, 4).hearts(24, 27, 13);
  b.checkpoint(29, 2);

  // --- Plataforma móvel sobre o abismo -------------------------------
  b.mover(32, 3, 3, 4, 0, 40);
  b.hearts(33, 38, 5);

  b.ground(41, 70);
  b.bee(47, 4, 2).enemy(53, 2).bee(57, 5, 1.5, true);
  b.spring(59, 2);
  b.spikes(61, 65, 2).arc(60, 66, 3, 3);
  b.checkpoint(69, 2);

  // --- Subida vertical (carta escondida no alto) ---------------------
  b.mover(73, 3, 2, 0, 4, 34);
  b.cloud(77, 8, 3).hearts(77, 79, 9);
  b.cloud(84, 12, 2).letter(84, 13);
  b.bee(81, 10, 2);
  b.mover(82, 6, 2, 5, 0, 45);
  b.cloud(90, 4, 3).hearts(90, 92, 5);

  b.ground(95, 120);
  b.enemy(101, 2).bee(106, 4, 3).enemy(111, 2);
  b.block(114, 4, 3).spring(115, 5);
  b.cloud(112, 13, 4).hearts(112, 115, 14);
  b.checkpoint(119, 2);

  // --- Trecho final ----------------------------------------------------
  b.block(123, 3, 2).hearts(123, 124, 5);
  b.bee(127, 9, 1.5, true);
  b.block(130, 5, 2).hearts(130, 131, 7);
  b.mover(134, 4, 2, 5, 0, 50);
  b.block(144, 6, 2).hearts(144, 145, 8);
  b.cloud(149, 4, 3).hearts(149, 151, 6);
  b.bee(153, 7, 1.5);
  b.block(156, 6, 2).hearts(156, 157, 8);

  b.ground(160, 195);
  b.enemy(167, 2).enemy(172, 2);
  b.hearts(175, 179, 3);
  b.goal(185, 2);

  return b.build('garden', 'Jardim Florido', 'garden');
}
