/**
 * Render smoke test: the app is mounted into a jsdom document and the rendered
 * markup is checked for the content a person must see.
 *
 * This is the closest check to opening the page that runs without a browser. It
 * catches a component that throws on render, a wrong prop that silently renders
 * nothing, and an import that only fails at runtime.
 *
 * Run it with `npm run smoke`.
 */

import './dom';

import {writeFileSync} from 'node:fs';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Theme} from '@astryxdesign/core/theme';

import {App} from '../App';
import {violetTheme} from '../theme';

/** How long to let React finish mounting and the marks load. */
const SETTLE_MS = 100;

/** Texts that must appear when the frozen clock sits inside the Wednesday morning. */
const EXPECTED_TEXTS = [
  'Распорядок дня',
  'Прогресс дня',
  'среда, 14 октября',
  'Физика / химия',
  'сейчас',
  'Подъём, зарядка, гигиена',
];

const container = document.getElementById('root');
if (!container) {
  throw new Error('the smoke document has no #root element');
}

createRoot(container).render(
  <StrictMode>
    <Theme theme={violetTheme}>
      <App />
    </Theme>
  </StrictMode>,
);

await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

const markup = container.innerHTML;

// A dump helps when a check fails and the reason has to be read in the markup.
if (process.env.SMOKE_DUMP) {
  writeFileSync(process.env.SMOKE_DUMP, markup);
}

const missing = EXPECTED_TEXTS.filter((text) => !markup.includes(text));

console.log(`Разметка отрисована: ${markup.length} символов`);
console.log(`Проверено фрагментов: ${EXPECTED_TEXTS.length}`);

if (missing.length > 0) {
  console.error(`Не найдено в разметке: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Все ожидаемые фрагменты на месте');

// jsdom keeps timers and animation frames alive, so the process is stopped
// explicitly instead of waiting for the event loop to drain.
process.exit(0);
