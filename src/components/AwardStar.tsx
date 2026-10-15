import type {ReactNode} from 'react';

/**
 * Award stars, drawn as inline SVG so they scale cleanly at any size.
 *
 * The design system has no star and no laurel, so these are drawn here. They take
 * their colours from the theme tokens rather than fixed values, so a star reads
 * correctly in both colour modes and follows the palette like every other mark.
 *
 * A star is decorative: the control or the group around it carries the accessible
 * name, so a screen reader hears what was earned once instead of once per shape.
 */

type StarProps = {
  /** Diameter in pixels. */
  size?: number;
  /** Whether the star carries the laurel wreath of the highest award. */
  hasLaurel?: boolean;
  /** Number drawn inside the star, when the star is worth more than one. */
  label?: string;
};

/** Star diameter used when the caller does not pick one. */
const DEFAULT_SIZE = 28;

/**
 * Five pointed star path, drawn in a 24 by 24 box.
 *
 * The points are computed rather than hand written so the shape stays regular:
 * ten alternating outer and inner points, starting at the top.
 */
const STAR_PATH = (() => {
  const outerRadius = 11;
  const innerRadius = 4.6;
  const points: string[] = [];

  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    // Start at the top (minus a quarter turn) and step by a fifth of a circle.
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const x = 12 + radius * Math.cos(angle);
    const y = 12 + radius * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  return `M${points.join('L')}Z`;
})();

/**
 * Draw one award star.
 *
 * @param props Size, whether it carries the wreath, and its number.
 * @returns An inline SVG star.
 */
export function AwardStar({size = DEFAULT_SIZE, hasLaurel = false, label}: StarProps): ReactNode {
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      data-award-star={label ?? '1'}
    >
      {hasLaurel ? (
        <g
          fill="none"
          stroke="var(--color-border-yellow)"
          strokeWidth={1.4}
          strokeLinecap="round"
        >
          {/* Two mirrored arcs of leaves around the star, the wreath of the top
              award. Each side is drawn as a stem with three pairs of leaves. */}
          <path d="M11.4 2.2C7.4 2.9 4.4 6.1 3.7 10.2" />
          <path d="M12.6 2.2c4 .7 7 3.9 7.7 8" />
          <path d="M11.4 2.2 9.6 4.6M9.6 4.6 7.6 3.7M9.6 4.6l-.5 2.1" />
          <path d="M12.6 2.2l1.8 2.4m0 0 2-.9m-2 .9.5 2.1" />
          <path d="M4.2 8.4l2.6.6m-2.6-.6-1 1.9m1-1.9-2-.5" />
          <path d="M19.8 8.4l-2.6.6m2.6-.6 1 1.9m-1-1.9 2-.5" />
          <path d="M3.7 10.2c-.2 3.8 1.6 7.4 4.7 9.5" />
          <path d="M20.3 10.2c.2 3.8-1.6 7.4-4.7 9.5" />
          <path d="M3.7 12.6l2.5-.6m-2.5.6-.6 2m.6-2-2.2-.8" />
          <path d="M20.3 12.6l-2.5-.6m2.5.6.6 2m-.6-2 2.2-.8" />
          <path d="M5.2 16.1l2.2-1.3m-2.2 1.3-1.3 1.6m1.3-1.6-2.3-.3" />
          <path d="M18.8 16.1l-2.2-1.3m2.2 1.3 1.3 1.6m-1.3-1.6 2.3-.3" />
        </g>
      ) : null}

      <path
        d={STAR_PATH}
        fill="var(--color-background-yellow)"
        stroke="var(--color-border-yellow)"
        strokeWidth={hasLaurel ? 1 : 0.8}
        strokeLinejoin="round"
      />

      {label ? (
        <text
          x={center}
          y={center + size * 0.03}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-icon-yellow)"
          fontSize={size * 0.36}
          fontWeight="var(--font-weight-semibold)"
        >
          {label}
        </text>
      ) : null}
    </svg>
  );
}
