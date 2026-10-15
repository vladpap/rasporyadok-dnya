import type {ReactNode} from 'react';

/**
 * Circular progress ring.
 *
 * The design system ships a linear `ProgressBar` and no circular equivalent, so
 * the month view draws its own: two circles in inline SVG, where the filled one
 * is the same circle shortened with `stroke-dasharray`. Colours come from the
 * theme tokens, so the ring follows the accent and both colour modes.
 *
 * The ring is decorative: it carries no accessible name, and the control that
 * holds it names itself, so a screen reader hears the day once instead of twice.
 */

type ProgressRingProps = {
  value: number;
  max: number;
  /** Diameter in pixels. */
  size?: number;
  /** Ring thickness in pixels. */
  thickness?: number;
  /** Text drawn in the middle, usually the day number. */
  text?: string;
  /** Font size of that text, as a theme token. */
  textSize?: string;
};

/** Diameter used when the caller does not pick one. */
const DEFAULT_SIZE = 42;

/** Ring thickness used when the caller does not pick one. */
const DEFAULT_THICKNESS = 4;

/** Text size used when the caller does not pick one. */
const DEFAULT_TEXT_SIZE = 'var(--font-size-sm)';

/**
 * Draw the ring.
 *
 * @param props Progress, geometry and the centred text.
 * @returns An inline SVG ring.
 */
export function ProgressRing({
  value,
  max,
  size = DEFAULT_SIZE,
  thickness = DEFAULT_THICKNESS,
  text,
  textSize = DEFAULT_TEXT_SIZE,
}: ProgressRingProps): ReactNode {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const radius = (size - thickness) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--color-track)"
        strokeWidth={thickness}
      />
      {ratio > 0 && (
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      )}
      {text ? (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill="var(--color-text-primary)"
          fontSize={textSize}
          fontWeight="var(--font-weight-semibold)"
        >
          {text}
        </text>
      ) : null}
    </svg>
  );
}
