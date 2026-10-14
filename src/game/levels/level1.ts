// Fase 1 — Céu Estrelado. Ensina andar, pular e pisar; termina com um trecho médio.

import { LevelBuilder, type LevelData } from './builder';

export function level1(): LevelData {
  const b = new LevelBuilder(182, 18);

  // --- Tutorial -------------------------------------------------------
  b.ground(0, 22).start(2, 2);
  b.sign(5, 2, 'Use ◀ ▶ para andar e pegue os corações!');
  b.hearts(7, 10, 2);
  b.block(13, 3, 3).hearts(13, 15, 5);
  b.sign(18, 2, 'Segure PULAR para ir mais alto.');
  b.npc(11, 2, 'snail');
  b.arc(22, 26, 3);

  b.ground(26, 50);
  b.ground(30, 31, 4).heart(30, 5).heart(31, 5);
  b.ground(34, 35, 5).heart(34, 6).heart(35, 6);
  b.sign(38, 2, 'Tedinhos roubam o romance! Pule em cima ou atire corações com B.');
  b.enemy(42, 2).enemy(47, 2);
  b.hearts(43, 46, 4);
  b.checkpoint(50, 2);

  // --- Nuvens sobre o abismo -------------------------------------------
  b.cloud(52, 3, 3).hearts(52, 54, 5);
  b.cloud(57, 4, 3).hearts(57, 59, 6);
  b.cloud(61, 3, 2);

  b.ground(65, 91);
  b.spikes(70, 71, 2).arc(69, 72, 3, 1);
  b.enemy(75, 2);

  // Caminho secreto para a carta: sobe pelas nuvens voltando para trás.
  b.ground(80, 81, 4);
  b.cloud(76, 5, 2).heart(76, 7);
  b.cloud(72, 7, 2).letter(72, 8);

  b.enemy(85, 2);
  b.arc(91, 95, 3, 2); // abismo de 3 blocos

  // --- Trecho final ----------------------------------------------------
  b.ground(95, 106).checkpoint(97, 2);
  b.sign(99, 2, 'Daqui pra frente o céu fica traiçoeiro…');
  b.ground(101, 102, 3).ground(103, 104, 4).ground(105, 106, 5);

  b.block(109, 4, 3).hearts(109, 111, 6);
  b.block(114, 5, 2).hearts(114, 115, 7);
  b.block(118, 4, 5).enemy(121, 5);
  b.cloud(125, 6, 2).hearts(125, 126, 8);
  b.block(129, 4, 6).spikes(132, 132, 5).heart(132, 7);
  b.cloud(137, 3, 3).hearts(137, 139, 5);
  b.block(142, 5, 3).hearts(142, 144, 7);

  b.ground(148, 181);
  b.enemy(156, 2).enemy(160, 2);
  b.hearts(163, 167, 3);
  b.goal(172, 2);

  return b.build('sky', 'Céu Estrelado', 'sky');
}
