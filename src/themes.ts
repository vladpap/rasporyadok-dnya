/**
 * The colour themes a person can choose from.
 *
 * Every theme is one accent seed: the design system expands that single colour
 * into the whole palette, deriving a darker value for light mode and a lighter
 * one for dark mode, so a theme only has to name its accent and the rest follows.
 * That is also why the five seeds below need no hand tuning per mode: each one
 * comes out with a similar, comfortable contrast in both.
 *
 * Each theme carries its own name, because the provider keys its injected styles
 * by that name: two themes sharing one name would collide and the second palette
 * would never be applied.
 */

import {defineTheme, type DefinedTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

/** The colour themes a person may choose, in the order they are offered. */
export const THEME_KEYS = ['violet', 'blue', 'green', 'orange', 'pink'] as const;

/** Identifier of one colour theme. */
export type ThemeKey = (typeof THEME_KEYS)[number];

/** Russian names shown in the picker. */
const THEME_LABELS: Record<ThemeKey, string> = {
  violet: 'Фиолетовая',
  blue: 'Синяя',
  green: 'Зелёная',
  orange: 'Оранжевая',
  pink: 'Розовая',
};

/** The accent seed of each theme. */
const THEME_ACCENTS: Record<ThemeKey, string> = {
  violet: '#7C3AED',
  blue: '#2563EB',
  green: '#059669',
  orange: '#EA580C',
  pink: '#DB2777',
};

/**
 * What each accent seed expands to for the two colour modes.
 *
 * The design system derives these from the seed, but the progress bar override
 * below has to name the pair, because the bar reads a status token that the seed
 * does not reach. The values are the ones the palette itself produces for these
 * seeds, so the bars and the rest of the theme stay the same colour.
 */
const ACCENT_PAIRS: Record<ThemeKey, string> = {
  violet: 'light-dark(#7131E3, #DAB8FF)',
  blue: 'light-dark(#0055D9, #C0C1FF)',
  green: 'light-dark(#006E46, #63DCA9)',
  orange: 'light-dark(#B42800, #FFB593)',
  pink: 'light-dark(#BE0060, #FFB0C7)',
};

/**
 * The fill of the `accent` card and badge: the theme accent mixed into the card
 * background, so the surface reads as the chosen colour instead of staying pale.
 *
 * The share is a constant because one value has to serve both modes: the accent
 * is dark in light mode and light in dark mode, and the text on top is the body
 * text. Two fifths is the strongest share that keeps that text above the contrast
 * a reader needs in dark mode, where the mixture comes out lightest.
 */
const ACCENT_FILL = 'color-mix(in srgb, var(--color-accent) 40%, var(--color-background-card))';

/**
 * The icon scale, the progress bar and the accent card need the same treatment in
 * every theme.
 *
 * The icon scale stops at `lg` (1.5rem, 24px) and asks for size steps rather than
 * stray pixel values, so a quarter larger is a decision at the theme level.
 *
 * The progress bar reads the neutral theme's status accent, which stays blue even
 * after the accent seed re-seeds the rest of the ramp. Pointing it at the pair the
 * seed expands to is what makes the bars follow the chosen theme.
 *
 * The card variants that ship with the theme are a fixed categorical palette, so
 * `purple` stays purple under every accent. The `accent` variant added here is the
 * one that follows the choice: the page header and the marks that are done use it,
 * which is what makes the whole page change colour rather than only the marks that
 * read the accent directly.
 *
 * @param key Which colour theme.
 * @returns The parts a theme shares with the others.
 */
function themeParts(key: ThemeKey) {
  return {
    color: {
      accent: THEME_ACCENTS[key],
      neutralStyle: 'cool' as const,
      contrast: 'standard' as const,
    },
    components: {
      'progress-bar': {
        'variant:accent': {'--color-accent': ACCENT_PAIRS[key]},
      },
      card: {
        'variant:accent': {
          // The accent mixed into the card, at a share strong enough to read as
          // the theme colour. The built `--color-accent-muted` mixes only a fifth
          // of the accent, which came out too pale to tell one theme from another.
          // Two fifths is the strongest that still leaves the body text above the
          // contrast a reader needs in dark mode, where the fill comes out lightest.
          backgroundColor: ACCENT_FILL,
          borderColor: 'var(--color-border-emphasized)',
        },
      },
      badge: {
        'variant:accent': {
          // The badge is a solid accent rather than the mixed fill the accent
          // card uses: the running badge sits on a card that may itself be accent
          // coloured, and two surfaces of the same mixture came out identical, so
          // the badge disappeared exactly when the card was marked. A solid accent
          // stands out on both the plain card and the accent one.
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-on-accent)',
        },
      },
      icon: {
        'size:lg': {
          width: '1.875rem',
          height: '1.875rem',
        },
      },
    },
  };
}

/**
 * Build the theme for one accent seed.
 *
 * @param key Which colour theme.
 * @returns The defined theme.
 */
function buildTheme(key: ThemeKey): DefinedTheme {
  return defineTheme({
    name: `schedule-${key}`,
    extends: neutralTheme,
    ...themeParts(key),
  });
}

/** The built theme of every choice, made once so a render reuses them. */
const THEMES: Record<ThemeKey, DefinedTheme> = Object.fromEntries(
  THEME_KEYS.map((key) => [key, buildTheme(key)]),
) as Record<ThemeKey, DefinedTheme>;

/**
 * The theme of a choice.
 *
 * @param key Which colour theme.
 * @returns The defined theme.
 */
export function getTheme(key: ThemeKey): DefinedTheme {
  return THEMES[key];
}

/**
 * The Russian name of a choice, for the picker.
 *
 * @param key Which colour theme.
 * @returns The name to show.
 */
export function getThemeLabel(key: ThemeKey): string {
  return THEME_LABELS[key];
}

/**
 * The accent of a choice, for a swatch that previews it.
 *
 * @param key Which colour theme.
 * @returns The accent colour as written in the palette.
 */
export function getThemeAccent(key: ThemeKey): string {
  return THEME_ACCENTS[key];
}

/**
 * Whether a value is one of the known themes.
 *
 * Used when reading a stored or saved choice, which may be missing or stale.
 *
 * @param value Value to check.
 * @returns True when the value names a theme.
 */
export function isThemeKey(value: unknown): value is ThemeKey {
  return typeof value === 'string' && (THEME_KEYS as readonly string[]).includes(value);
}
