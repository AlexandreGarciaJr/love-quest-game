import { useMemo } from 'react';

// Fundo: estrelas, corações flutuando e um chão de flores pixeladas.
export function Sky() {
  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        left: `${(i * 37.3) % 100}%`,
        top: `${(i * 23.7) % 72}%`,
        delay: `${(i % 7) * 0.6}s`,
        size: i % 5 === 0 ? 3 : 2,
      })),
    [],
  );

  return (
    <div className="sky" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="star"
          style={{ left: s.left, top: s.top, animationDelay: s.delay, width: s.size, height: s.size }}
        />
      ))}
      <div className="moon" />
      <svg className="ground" viewBox="0 0 120 16" preserveAspectRatio="none" shapeRendering="crispEdges">
        <path d="M0 10h8V8h10v2h14V7h12v2h16V8h14v2h12V7h10v2h12v1h12v6H0z" fill="#1d1640" />
        <path d="M0 12h20v-1h16v1h22v-1h18v1h20v-1h24v5H0z" fill="#150f30" />
      </svg>
      <div className="flowers">
        {[6, 19, 33, 48, 61, 74, 88].map((x, i) => (
          <svg key={x} className="flower" style={{ left: `${x}%`, animationDelay: `${i * 0.4}s` }} viewBox="0 0 5 7" shapeRendering="crispEdges">
            <rect x="2" y="3" width="1" height="4" fill="#3fb57a" />
            <rect x="3" y="5" width="1" height="1" fill="#3fb57a" />
            <rect x="1" y="0" width="3" height="3" fill={i % 2 ? 'var(--violet)' : 'var(--pink)'} />
            <rect x="0" y="1" width="5" height="1" fill={i % 2 ? 'var(--violet)' : 'var(--pink)'} />
            <rect x="2" y="1" width="1" height="1" fill="#ffe27a" />
          </svg>
        ))}
      </div>
    </div>
  );
}
