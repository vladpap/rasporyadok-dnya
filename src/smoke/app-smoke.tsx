/**
 * Render smoke test: the app is mounted into a jsdom document, the rendered
 * markup is checked for the content a person must see, and one card is clicked
 * to check that marking a segment works and is stored.
 *
 * This is the closest check to opening the page that runs without a browser. It
 * catches a component that throws on render, a wrong prop that silently renders
 * nothing, an import that only fails at runtime, and a broken mark toggle.
 *
 * Run it with `npm run smoke`.
 */

import './dom';

import {writeFileSync} from 'node:fs';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {Theme} from '@astryxdesign/core/theme';

import scheduleDocument from '../../data/schedule.json';
import {App} from '../App';
import {violetTheme} from '../theme';

/** How long to let React finish mounting, loading marks and re-rendering. */
const SETTLE_MS = 100;

/** The frozen clock sits inside this weekday, so this is the shown day. */
const SHOWN_DAY_KEY = 'wed';

/** Calendar day the frozen clock belongs to, which is the marks storage key. */
const SHOWN_DATE_KEY = '2026-10-14';

/** Segment that runs at the frozen moment and carries a mark. */
const CLICKED_SEGMENT = 'Физика / химия, 09:00–10:30';

/** Identifier of that segment, as stored in the marks. */
const CLICKED_SEGMENT_ID = 'wed-0900-physics-chemistry';

/** Texts that must appear in the rendered page. */
const EXPECTED_TEXTS = [
  'Распорядок дня',
  'Прогресс дня',
  'среда, 14 октября',
  'Физика / химия',
  'сейчас',
  'Подъём, зарядка, гигиена',
];

/** How many of the shown day's segments carry a mark, and are clickable. */
const EXPECTED_TRACKED_COUNT = 7;

/** Storage key the marks are written under. */
const MARKS_STORAGE_KEY = 'rasporyadok-dnya.marks';

/**
 * Read every segment title of the shown day from the generated data, so a card
 * that stops rendering is caught rather than only the few texts listed above.
 *
 * @returns Titles of the shown day's segments.
 */
function readShownDayTitles(): string[] {
  const days = scheduleDocument.days as Array<{key: string; entries: Array<{title: string}>}>;
  return days.find((day) => day.key === SHOWN_DAY_KEY)?.entries.map((entry) => entry.title) ?? [];
}

/** Stop the run with a failure after printing what went wrong. */
function fail(problems: string[]): never {
  for (const problem of problems) {
    console.error(problem);
  }
  process.exit(1);
}

/**
 * Read the styles the theme injects into the document head.
 *
 * @returns The concatenated CSS text.
 */
function readInjectedStyles(): string {
  return [...document.querySelectorAll('style')]
    .map((styleElement) => styleElement.textContent ?? '')
    .join('\n');
}

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
  writeFileSync(`${process.env.SMOKE_DUMP}.head.css`, readInjectedStyles());
}

const problems: string[] = [];

const missingTexts = EXPECTED_TEXTS.filter((text) => !markup.includes(text));
if (missingTexts.length > 0) {
  problems.push(`Не найдено в разметке: ${missingTexts.join(', ')}`);
}

const dayTitles = readShownDayTitles();
const missingTitles = dayTitles.filter((title) => !markup.includes(title));
if (missingTitles.length > 0) {
  problems.push(`Не найдено названий отрезков: ${missingTitles.join(', ')}`);
}

const cardCount = markup.split('astryx-card').length - 1;
const clickableCount = markup.split('astryx-clickable-card').length - 1;
// The page header is a card too, so the card count is at least the segment count.
if (cardCount < dayTitles.length) {
  problems.push(`Карточек ${cardCount}, а отрезков ${dayTitles.length}`);
}
if (clickableCount !== EXPECTED_TRACKED_COUNT) {
  problems.push(`Кликабельных карточек ${clickableCount}, ожидалось ${EXPECTED_TRACKED_COUNT}`);
}

// The accent header is painted by a component override in the theme, so check
// that the theme emitted it: without this rule the header falls back to a tint.
const injectedStyles = readInjectedStyles();
if (!injectedStyles.includes('.astryx-card[data-variant="purple"]')) {
  problems.push('Тема не перекрасила вариант карточки purple');
}
if (!injectedStyles.includes('background-color: var(--color-accent)')) {
  problems.push('Акцентный фон карточки не задан');
}

console.log(`Разметка отрисована: ${markup.length} символов`);
console.log(`Карточек: ${cardCount}, из них кликабельных: ${clickableCount}`);

if (problems.length > 0) {
  fail(problems);
}

// Mark the running segment by clicking its card, the way a person would.
const cardButton = container.querySelector<HTMLButtonElement>(
  `button[aria-label^="${CLICKED_SEGMENT}"]`,
);
if (!cardButton) {
  fail([`Не найдена кнопка карточки: ${CLICKED_SEGMENT}`]);
}

cardButton.click();
await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

const markupAfterClick = container.innerHTML;
const storedMarks = window.localStorage.getItem(MARKS_STORAGE_KEY) ?? '';
const clickProblems: string[] = [];

if (!markupAfterClick.includes(`${CLICKED_SEGMENT}, отмечено`)) {
  clickProblems.push('После нажатия карточка не отмечена');
}
if (!markupAfterClick.includes(`сделано 1 из ${EXPECTED_TRACKED_COUNT}`)) {
  clickProblems.push('После нажатия прогресс дня не изменился');
}
if (!storedMarks.includes(CLICKED_SEGMENT_ID)) {
  clickProblems.push('Отметка не сохранена в хранилище');
}
if (!storedMarks.includes(SHOWN_DATE_KEY)) {
  clickProblems.push('Отметка сохранена не под датой показанного дня');
}

if (clickProblems.length > 0) {
  fail(clickProblems);
}

console.log(`Нажатие карточки: отметка поставлена, прогресс 1 из ${EXPECTED_TRACKED_COUNT}, сохранено под ${SHOWN_DATE_KEY}`);

// Switch the colour mode, the way a person would.
const darkModeRadio = container.querySelector<HTMLElement>('[role="radio"][data-value="dark"]');
if (!darkModeRadio) {
  fail(['Не найден переключатель тёмной темы']);
}

darkModeRadio.click();
await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

const lightRadio = container.querySelector<HTMLElement>('[role="radio"][data-value="light"]');
const modeProblems: string[] = [];

if (darkModeRadio.getAttribute('aria-checked') !== 'true') {
  modeProblems.push('После нажатия тёмная тема не выбрана');
}
if (lightRadio?.getAttribute('aria-checked') !== 'false') {
  modeProblems.push('Светлая тема осталась выбранной');
}
if (window.localStorage.getItem('rasporyadok-dnya.theme-mode') !== 'dark') {
  modeProblems.push('Выбор темы не сохранён в хранилище');
}

if (modeProblems.length > 0) {
  fail(modeProblems);
}

console.log('Переключатель темы: тёмная выбрана и сохранена');
console.log('Все проверки пройдены');

// jsdom keeps timers and animation frames alive, so the process is stopped
// explicitly instead of waiting for the event loop to drain.
process.exit(0);
