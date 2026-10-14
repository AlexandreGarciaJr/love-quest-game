interface Props {
  size?: number;
  color?: string;
}

export function PixelHeart({ size = 24, color = 'var(--pink)' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z" fill={color} />
      <rect x="1" y="1" width="1" height="1" fill="#fff" opacity="0.7" />
    </svg>
  );
}
