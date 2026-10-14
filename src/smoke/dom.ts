/**
 * Minimal browser environment for the render smoke test.
 *
 * React needs a DOM and the theme needs `matchMedia` while jsdom implements
 * neither, so both are provided here. The clock is frozen as well, which keeps
 * the test from depending on the moment it runs: with a fixed moment the set of
 * segments that already passed is always the same.
 *
 * Import this module before anything that touches the DOM.
 */

import {JSDOM} from 'jsdom';

/** Moment the smoke test pretends it is, in local time. */
const FIXED_NOW = '2026-10-14T09:30:00';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

const browserWindow = dom.window as unknown as Window & typeof globalThis;

/** Media query result stub, reported as "no match" for every query. */
const matchMediaStub = (query: string): MediaQueryList =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList;

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
