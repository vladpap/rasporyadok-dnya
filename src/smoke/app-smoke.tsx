/**
 * Render smoke test: the app is mounted into a jsdom document, the rendered
 * markup is checked for the content a person must see, one card is clicked to
 * check that marking a segment works and is stored, the colour mode is switched
 * and the layout is checked at three viewport widths.
 *
 * This is the closest check to opening the page that runs without a browser. It
 * catches a component that throws on render, a wrong prop that silently renders
 * nothing, an import that only fails at runtime, a broken mark toggle and a
 * column layout that drops cards.
 *
 * Run it with `npm run smoke`.
 */

import './dom';

import {writeFileSync} from 'node:fs';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import scheduleDocument from '../../data/schedule.json';
import {App} from '../App';
import {resetSimulatedNow, setSimulatedNow, setSimulatedWidth} from './dom';

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

/** Width the content checks run at. */
const MAIN_WIDTH = 1280;

/** Widths to check the column layout at, with the columns each one must give. */
const WIDTH_CASES = [
  {width: 600, expectedColumns: 1},
  {width: MAIN_WIDTH, expectedColumns: 2},
  {width: 1500, expectedColumns: 3},
];

/** Storage key the marks are written under. */
const MARKS_STORAGE_KEY = 'rasporyadok-dnya.marks';

/** Storage key the colour mode is written under. */
const THEME_MODE_STORAGE_KEY = 'rasporyadok-dnya.theme-mode';

/**
 * Read every segment title of the shown day from the generated data.
 *
 * @returns Titles of the shown day's segments, in time order.
 */
function readShownDayTitles(): string[] {
  const days = scheduleDocument.days as Array<{key: string; entries: Array<{title: string}>}>;
  return days.find((day) => day.key === SHOWN_DAY_KEY)?.entries.map((entry) => entry.title) ?? [];
}

/** Wait for React to settle. */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
}

/**
 * Mount the app at a simulated viewport width.
 *
 * @param width Viewport width in pixels.
 * @returns The element the app was rendered into.
 */
async function mountApp(width: number): Promise<HTMLElement> {
  setSimulatedWidth(width);
  const host = document.createElement('div');
  document.body.append(host);
  createRoot(host).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await settle();
  return host;
}

/**
 * Find the column containers of the card layout.
 *
 * The layout renders one stack of cards per column inside a horizontal stack,
 * which is what this looks for: a row whose every child holds a vertical stack.
 *
 * @param host Element the app was rendered into.
 * @returns One element per column, empty when the layout is not found.
 */
function readColumns(host: HTMLElement): HTMLElement[] {
  const rows = [...host.querySelectorAll<HTMLElement>('[data-direction="horizontal"]')];
  let widest: HTMLElement[] = [];

  for (const row of rows) {
    const children = [...row.children] as HTMLElement[];
    if (children.length === 0) {
      continue;
    }
    const everyChildHoldsCards = children.every(
      (child) => child.querySelector('[data-direction="vertical"]') !== null,
    );
    if (everyChildHoldsCards && children.length > widest.length) {
      widest = children;
    }
  }

  return widest;
}

/** Read the styles the theme injects into the document head. */
function readInjectedStyles(): string {
  return [...document.querySelectorAll('style')]
    .map((styleElement) => styleElement.textContent ?? '')
    .join('\n');
}

/** Stop the run with a failure after printing what went wrong. */
function fail(problems: string[]): never {
  for (const problem of problems) {
    console.error(problem);
  }
  process.exit(1);
}

const dayTitles = readShownDayTitles();
const host = await mountApp(MAIN_WIDTH);
const markup = host.innerHTML;

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

// The segment icons are lifted above the icon scale in the theme, so check the
// rule is emitted: without it the cards fall back to the standard large icon.
const injectedStyles = readInjectedStyles();
if (!injectedStyles.includes('.astryx-icon[data-size="lg"]')) {
  problems.push('Тема не задала размер крупных иконок');
}
if (!injectedStyles.includes('1.875rem')) {
  problems.push('Размер крупных иконок не задан');
}

console.log(`Разметка отрисована: ${markup.length} символов`);
console.log(`Карточек: ${cardCount}, из них кликабельных: ${clickableCount}`);

if (problems.length > 0) {
  fail(problems);
}

// The columns must read downwards: the first column takes the earliest segments
// and the last one takes the latest, which a row-by-row grid would not do.
const mainColumns = readColumns(host);
const firstColumnText = mainColumns[0]?.textContent ?? '';
const lastColumnText = mainColumns.at(-1)?.textContent ?? '';
const columnProblems: string[] = [];

if (mainColumns.length !== 2) {
  columnProblems.push(`При ширине ${MAIN_WIDTH} колонок ${mainColumns.length}, ожидалось 2`);
}
if (!firstColumnText.includes(dayTitles[0])) {
  columnProblems.push(`Первая колонка не начинается с «${dayTitles[0]}»`);
}
if (firstColumnText.includes(dayTitles.at(-1) ?? '')) {
  columnProblems.push('Первая колонка содержит последний отрезок дня');
}
if (!lastColumnText.includes(dayTitles.at(-1) ?? '')) {
  columnProblems.push(`Последняя колонка не содержит «${dayTitles.at(-1)}»`);
}

if (columnProblems.length > 0) {
  fail(columnProblems);
}

console.log(`Колонки при ширине ${MAIN_WIDTH}: ${mainColumns.length}, порядок идёт сверху вниз`);

// Mark the running segment by clicking its card, the way a person would.
const cardButton = host.querySelector<HTMLButtonElement>(
  `button[aria-label^="${CLICKED_SEGMENT}"]`,
);
if (!cardButton) {
  fail([`Не найдена кнопка карточки: ${CLICKED_SEGMENT}`]);
}

cardButton.click();
await settle();

const markupAfterClick = host.innerHTML;
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
const darkModeRadio = host.querySelector<HTMLElement>('[role="radio"][data-value="dark"]');
if (!darkModeRadio) {
  fail(['Не найден переключатель тёмной темы']);
}

darkModeRadio.click();
await settle();

const lightRadio = host.querySelector<HTMLElement>('[role="radio"][data-value="light"]');
const modeProblems: string[] = [];

if (darkModeRadio.getAttribute('aria-checked') !== 'true') {
  modeProblems.push('После нажатия тёмная тема не выбрана');
}
if (lightRadio?.getAttribute('aria-checked') !== 'false') {
  modeProblems.push('Светлая тема осталась выбранной');
}
if (window.localStorage.getItem(THEME_MODE_STORAGE_KEY) !== 'dark') {
  modeProblems.push('Выбор темы не сохранён в хранилище');
}

if (modeProblems.length > 0) {
  fail(modeProblems);
}

console.log('Переключатель темы: тёмная выбрана и сохранена');

// Check the layout at every width it switches at.
for (const {width, expectedColumns} of WIDTH_CASES) {
  const wideHost = await mountApp(width);
  const columns = readColumns(wideHost);
  const allTitlesPresent = dayTitles.every((title) => wideHost.innerHTML.includes(title));

  if (columns.length !== expectedColumns) {
    fail([`При ширине ${width} колонок ${columns.length}, ожидалось ${expectedColumns}`]);
  }
  if (!allTitlesPresent) {
    fail([`При ширине ${width} часть отрезков не отрисована`]);
  }
  console.log(`Ширина ${width}: колонок ${columns.length}, все отрезки на месте`);
}

// The week view sums the whole week in its header. The marked day is a weekday
// inside October 2026, so the week and the month both run over five tracked
// weekdays plus Saturday and Sunday: 5 * 7 + 3 + 3 = 41 countable segments.
const weekHost = await mountApp(MAIN_WIDTH);
const weekRadio = weekHost.querySelector<HTMLElement>('[role="radio"][data-value="week"]');
if (!weekRadio) {
  fail(['Не найден переключатель недели']);
}

weekRadio.click();
await settle();

const weekMarkup = weekHost.innerHTML;
const WEEK_TOTAL = 41;
const WEEK_DONE = 1;
const weekProblems: string[] = [];

if (!weekMarkup.includes('Прогресс недели')) {
  weekProblems.push('Нет итогового прогресса недели');
}
if (!weekMarkup.includes(`сделано ${WEEK_DONE} из ${WEEK_TOTAL}`)) {
  weekProblems.push(
    `Итог недели не ${WEEK_DONE} из ${WEEK_TOTAL}, как ожидалось после одной отметки`,
  );
}
if (!weekMarkup.includes('astryx-divider')) {
  weekProblems.push('Итог недели не отделён от списка дней деливером');
}

if (weekProblems.length > 0) {
  fail(weekProblems);
}

console.log(`Неделя: итог ${WEEK_DONE} из ${WEEK_TOTAL} показан в шапке`);

// The month view draws every day of October 2026 as a progress ring. One segment
// was marked earlier, so exactly one ring must carry a filled arc.
const monthHost = await mountApp(MAIN_WIDTH);
const monthRadio = monthHost.querySelector<HTMLElement>('[role="radio"][data-value="month"]');
if (!monthRadio) {
  fail(['Не найден переключатель месяца']);
}

monthRadio.click();
await settle();

const monthMarkup = monthHost.innerHTML;
const monthCells = monthMarkup.split('astryx-clickable-card').length - 1;
const filledRings = monthMarkup.split('stroke-dasharray').length - 1;
const dayCellButton = monthHost.querySelector<HTMLButtonElement>(
  'button[aria-label^="среда, 14 октября"]',
);
const monthProblems: string[] = [];

if (!monthMarkup.includes('октябрь 2026')) {
  monthProblems.push('Месяц не подписан');
}
if (!monthMarkup.includes('За месяц сделано')) {
  monthProblems.push('Нет итога по месяцу');
}
if (!monthMarkup.includes('Прогресс месяца')) {
  monthProblems.push('Нет итогового прогресса месяца');
}
if (!monthMarkup.includes('Пн') || !monthMarkup.includes('Вс')) {
  monthProblems.push('Нет заголовков дней недели');
}
if (monthCells < 28 || monthCells > 42) {
  monthProblems.push(`Дней в сетке месяца ${monthCells}, ожидалось от 28 до 42`);
}
if (filledRings !== 1) {
  monthProblems.push(`Колец с прогрессом ${filledRings}, ожидалось 1`);
}
if (!dayCellButton) {
  monthProblems.push('День месяца не кликабелен');
}

if (monthProblems.length > 0) {
  fail(monthProblems);
}

console.log(`Месяц: дней ${monthCells}, кольцо с прогрессом ${filledRings}, день открывается`);

// Opening a day from the month must land in the day view for that date. The
// guard above already failed if the button is missing, so it is non-null here.
dayCellButton?.click();
await settle();

if (!monthHost.innerHTML.includes('Прогресс дня')) {
  fail(['Клик по дню месяца не открыл день']);
}

console.log('Клик по дню месяца открыл этот день');

// A segment closes an hour after it ends, so later in the same day the morning
// segments can no longer be marked. At 13:30 two of the seven have closed, and
// the one marked earlier keeps its mark without staying changeable.
setSimulatedNow('2026-10-14T13:30:00');
const lateHost = await mountApp(MAIN_WIDTH);
const lateClickableCount = lateHost.innerHTML.split('astryx-clickable-card').length - 1;
const closedCardButton = lateHost.querySelector<HTMLButtonElement>(
  `button[aria-label^="${CLICKED_SEGMENT}"]`,
);
const lockProblems: string[] = [];

if (lateClickableCount !== EXPECTED_TRACKED_COUNT - 2) {
  lockProblems.push(
    `В 13:30 кликабельных карточек ${lateClickableCount}, ожидалось ${EXPECTED_TRACKED_COUNT - 2}`,
  );
}
if (closedCardButton) {
  lockProblems.push(`Закрытый отрезок остался кликабельным: ${CLICKED_SEGMENT}`);
}
if (!lateHost.querySelector('[aria-label="отмечено"]')) {
  lockProblems.push('Отметка, поставленная до закрытия окна, пропала');
}
if (!lateHost.innerHTML.includes('в течение часа после его окончания')) {
  lockProblems.push('На странице нет пояснения про окно отметки');
}

if (lockProblems.length > 0) {
  fail(lockProblems);
}

console.log(
  `Окно отметки: в 13:30 закрыто 2 отрезка из ${EXPECTED_TRACKED_COUNT}, отметка сохранилась, карточка не кликабельна`,
);
resetSimulatedNow();

console.log('Все проверки пройдены');

// jsdom keeps timers and animation frames alive, so the process is stopped
// explicitly instead of waiting for the event loop to drain.
process.exit(0);
