/**
 * The `accent` variants the app adds to the design system.
 *
 * The variants that ship with the theme are a fixed categorical palette, so a
 * `purple` card or badge stays purple whatever accent the palette is built from.
 * The app needs the opposite for the page header and for the marks that are done:
 * those should follow the chosen theme. Declaring the variants here is what lets a
 * component name one, and each theme in `src/themes.ts` gives it a colour drawn
 * from the accent.
 */

declare module '@astryxdesign/core/Card' {
  interface CardVariantMap {
    accent: true;
  }
}

declare module '@astryxdesign/core/Badge' {
  interface BadgeVariantMap {
    accent: true;
  }
}

export {};
