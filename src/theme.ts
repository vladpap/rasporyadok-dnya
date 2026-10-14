import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

/**
 * Violet theme for the schedule app.
 *
 * The built neutral theme is extended rather than replaced: the `color` scale
 * expands one accent seed into the neutral ramp, surfaces, text, icons, borders
 * and hover overlays for light and dark mode alike, so no component needs a
 * local colour override and both modes stay coherent.
 *
 * `--color-background-purple` is set because the app uses the `purple` card
 * variant for two jobs: the page header and the cards that are marked as done.
 * A soft tint in light mode and a deep violet in dark mode keep text readable on
 * both, which the categorical default does not guarantee once the accent moved.
 */
export const violetTheme = defineTheme({
  name: 'violet',
  extends: neutralTheme,
  color: {accent: '#7C3AED', neutralStyle: 'cool', contrast: 'standard'},
  tokens: {
    '--color-background-purple': ['#EFE7FE', '#2B1B5E'],
  },
});
