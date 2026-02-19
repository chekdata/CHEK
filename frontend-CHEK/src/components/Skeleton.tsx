import type { CSSProperties } from 'react';

type SkeletonBlockProps = {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
  style?: CSSProperties;
  className?: string;
};

export function SkeletonBlock({
  width = '100%',
  height = 14,
  radius = 10,
  style,
  className = '',
}: SkeletonBlockProps) {
  const classes = ['chek-loading-shimmer', className].filter(Boolean).join(' ');
  return (
    <div
      aria-hidden
      className={classes}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}

type SkeletonLinesProps = {
  lines?: number;
  widths?: Array<CSSProperties['width']>;
  gap?: number;
  lineHeight?: number;
  radius?: CSSProperties['borderRadius'];
};

export function SkeletonLines({
  lines = 3,
  widths,
  gap = 8,
  lineHeight = 12,
  radius = 8,
}: SkeletonLinesProps) {
  const total = Math.max(1, lines);
  return (
    <div style={{ display: 'grid', gap }}>
      {Array.from({ length: total }).map((_, index) => (
        <SkeletonBlock key={index} width={widths?.[index] || '100%'} height={lineHeight} radius={radius} />
      ))}
    </div>
  );
}
