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
  components: {
    // The neutral theme keeps its status accent fill blue even after
    // `color.accent` re-seeds the general accent ramp, and the progress bar's
    // accent variant reads that status token instead of `--color-accent`. Both
    // pairs below are exactly the violet the accent seed expands to for the two
    // colour modes, so the bars match the accent rather than the inherited blue.
    'progress-bar': {
      'variant:accent': {'--color-accent': 'light-dark(#7131E3, #DAB8FF)'},
    },
    // The icon scale stops at `lg` (1.5rem, 24px) and the icon docs ask for the
    // size props rather than stray pixel values. A quarter larger is what the
    // schedule needs, so the scale step itself is lifted here. Only the segment
    // icons use `lg`; the check, badge and switch icons are smaller and stay as
    // they are. rem keeps the size tied to the root font size.
    icon: {
      'size:lg': {
        width: '1.875rem',
        height: '1.875rem',
      },
    },
  },
});
