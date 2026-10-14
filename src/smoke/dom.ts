/**
 * Minimal browser environment for the render smoke test.
 *
 * React needs a DOM and the theme needs `matchMedia` while jsdom implements
 * neither, so both are provided here. The clock is frozen as well, which keeps
 * the test from depending on the moment it runs: with a fixed moment the set of
 * segments that already passed is always the same.
 *
 * Width media queries are answered from a simulated viewport width, so the test
 * can check the same page at several widths without a browser.
 *
 * Import this module before anything that touches the DOM.
 */

import {JSDOM} from 'jsdom';

/** Moment the smoke test pretends it is, in local time. */
const FIXED_NOW = '2026-10-14T09:30:00';

/** Viewport width used until the test asks for another one. */
const DEFAULT_SIMULATED_WIDTH = 1280;

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const browserWindow = dom.window as unknown as Window & typeof globalThis;

let simulatedWidth = DEFAULT_SIMULATED_WIDTH;

/**
 * Simulate a viewport width for the width media queries.
 *
 * @param width Viewport width in pixels.
 */
export function setSimulatedWidth(width: number): void {
  simulatedWidth = width;
}

/** Width pattern inside a media query, for example `min-width: 900px`. */
const MIN_WIDTH_PATTERN = /min-width:\s*(\d+)px/;
const MAX_WIDTH_PATTERN = /max-width:\s*(\d+)px/;

/**
 * Answer a media query from the simulated width.
 *
 * Queries that are not about width (colour scheme, motion preference) report no
 * match, which keeps the app in light mode with motion enabled.
 *
 * @param query Media query text.
 * @returns A stub result object, as jsdom does not implement the real thing.
 */
const matchMediaStub = (query: string): MediaQueryList => {
  const minWidth = MIN_WIDTH_PATTERN.exec(query);
  const maxWidth = MAX_WIDTH_PATTERN.exec(query);
  const isWidthQuery = Boolean(minWidth ?? maxWidth);

  const matches =
    isWidthQuery &&
    (minWidth ? simulatedWidth >= Number(minWidth[1]) : true) &&
    (maxWidth ? simulatedWidth <= Number(maxWidth[1]) : true);

  return {
    matches,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
};

browserWindow.matchMedia = matchMediaStub;
globalThis.matchMedia = matchMediaStub;

/** Observer stub: the app never needs to know about element sizes. */
class ObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ObserverStub as unknown as typeof ResizeObserver;
globalThis.IntersectionObserver = ObserverStub as unknown as typeof IntersectionObserver;

/** Date that always answers with the frozen moment when called without arguments. */
class FixedDate extends Date {
  constructor(...args: unknown[]) {
    if (args.length === 0) {
      super(FIXED_NOW);
      return;
    }
    super(...(args as [string | number | Date]));
  }

  static override now(): number {
    return new Date(FIXED_NOW).getTime();
  }
}

globalThis.Date = FixedDate as unknown as DateConstructor;

/**
 * Publish a value as a global, replacing a getter-only definition when needed.
 *
 * Node already defines some of these names (for example `navigator`) as
 * read-only accessors, so a plain assignment would throw.
 *
 * @param name Global name.
 * @param value Value to publish.
 */
function publishGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

publishGlobal('window', browserWindow);
publishGlobal('document', browserWindow.document);
publishGlobal('navigator', browserWindow.navigator);
publishGlobal('HTMLElement', browserWindow.HTMLElement);
publishGlobal('Element', browserWindow.Element);
publishGlobal('Node', browserWindow.Node);
publishGlobal('getComputedStyle', browserWindow.getComputedStyle.bind(browserWindow));
publishGlobal('requestAnimationFrame', browserWindow.requestAnimationFrame.bind(browserWindow));
publishGlobal('cancelAnimationFrame', browserWindow.cancelAnimationFrame.bind(browserWindow));

export {browserWindow};
