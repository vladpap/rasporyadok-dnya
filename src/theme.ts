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
 * The `purple` card variant is repainted as a saturated accent surface with the
 * matching on-accent text. That variant carries the page header and the cards
 * that are marked done, so the accent marks both the top of the page and the
 * progress down it, and the text stays readable because the surface and its text
 * colour move together.
 */
export const violetTheme = defineTheme({
  name: 'violet',
  extends: neutralTheme,
  color: {accent: '#7C3AED', neutralStyle: 'cool', contrast: 'standard'},
  components: {
    card: {
      'variant:purple': {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
      },
    },
  },
});
