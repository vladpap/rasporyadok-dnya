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
 * The accent is used as an accent, not as a fill: the `purple` card variant
 * keeps the tinted categorical surface that ships with the theme, so the header
 * and the cards that are done stand out without shouting.
 */
export const violetTheme = defineTheme({
  name: 'violet',
  extends: neutralTheme,
  color: {accent: '#7C3AED', neutralStyle: 'cool', contrast: 'standard'},
});
