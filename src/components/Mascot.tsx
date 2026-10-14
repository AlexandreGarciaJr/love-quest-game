export type Mood = 'happy' | 'wow' | 'smug' | 'love';

interface Props {
  mood?: Mood;
  size?: number;
}

// Coração pixelado 13x12 desenhado com retângulos.
const HEART = [
  '..XXX...XXX..',
  '.XXXXX.XXXXX.',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  'XXXXXXXXXXXXX',
  '.XXXXXXXXXXX.',
  '..XXXXXXXXX..',
  '...XXXXXXX...',
  '....XXXXX....',
  '.....XXX.....',
  '......X......',
];

const SHINE: [number, number][] = [[2, 2], [3, 2], [2, 3], [1, 3]];

const EYES: Record<Mood, [number, number][]> = {
  happy: [[4, 5], [4, 4], [8, 5], [8, 4]],
  wow: [[3, 4], [4, 4], [3, 5], [4, 5], [8, 4], [9, 4], [8, 5], [9, 5]],
  smug: [[3, 5], [4, 5], [8, 5], [9, 5]],
  love: [[4, 4], [4, 5], [8, 4], [8, 5]],
};

const MOUTH: Record<Mood, [number, number][]> = {
  happy: [[5, 7], [6, 8], [7, 7]],
  wow: [[6, 7], [6, 8]],
  smug: [[6, 7], [7, 7], [8, 6]],
  love: [[4, 7], [5, 8], [6, 8], [7, 8], [8, 7]],
};

export function Mascot({ mood = 'happy', size = 88 }: Props) {
  return (
    <svg
      className="mascot"
      width={size}
      height={(size * 12) / 13}
      viewBox="0 0 13 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {HEART.flatMap((row, y) =>
        [...row].map((c, x) => (c === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--pink)" /> : null)),
      )}
      {SHINE.map(([x, y]) => (
        <rect key={`s${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--pink-light)" />
      ))}
      {EYES[mood].map(([x, y]) => (
        <rect key={`e${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--ink)" />
      ))}
      {MOUTH[mood].map(([x, y]) => (
        <rect key={`m${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--ink)" />
      ))}
      <rect x={2} y={6} width={1} height={1} fill="#ff86bb" />
      <rect x={10} y={6} width={1} height={1} fill="#ff86bb" />
    </svg>
  );
}
