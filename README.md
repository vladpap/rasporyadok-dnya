# rasporyadok_dnya

A weekly study schedule for one schoolchild, published as a small web app.
The repository separates the data from the code, so the schedule can be edited
without touching the application.

## Layers

| Layer | Path | Role |
| --- | --- | --- |
| Original input | `preparation/raspisanie.csv` | The schedule as it was first written, kept for reference. Never edited. |
| Canonical source | `data/schedule.csv` | The normalized schedule: one row per time segment. **This is the file to edit.** |
| Generated data | `data/schedule.json` | Built from the canonical source by the data step. Never edited by hand. |
| Application | `src/` | The web app that reads the generated data. |

## Why the schedule was normalized

The original file is a table of wide time bands, and a single band holds two or
three activities with their own times. Several cells are also ambiguous for a
machine: `То же`, `репетитор/секция`, and weekend rows that reach past the band
they sit in. Normalizing turns each activity into its own row with an explicit
start and end, which is what the app needs to sort segments and to grey out the
time that has already passed.

## Decisions behind the normalized source

| # | Decision |
| --- | --- |
| 1 | Weekday mornings are identical, Monday to Friday: 07:30 wake up and exercise, 08:00 breakfast, 08:30–09:00 plan the day and check homework. |
| 2 | Weekdays end with hygiene and reading 21:00–22:00 and an explicit sleep row 22:00–22:30. |
| 3 | Saturday keeps its own rhythm from the original file: break 11:00–11:15, exam preparation 11:15–12:30, lunch 12:30–13:00, lights out at 23:00. |
| 4 | Sunday morning is one row: 09:00–09:30 wake up and breakfast, 09:30–12:15 rest, walk, family. |
| 5 | Rows that offer a choice keep both options in the title, for example `Репетитор / секция`. The checkbox completes the whole slot. |
| 6 | Breaks, lunch and sleep are shown in grey, have no checkbox and stay out of the daily progress. |

## Entry schema

`data/schedule.csv` has one row per time segment and this header:

```
day,id,start,end,kind,title,note,tracked
```

| Column | Meaning |
| --- | --- |
| `day` | Week day key: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`. |
| `id` | Stable identifier, must start with the day key, for example `mon-0900-math`. Progress marks are stored against it, so renaming a title never loses history. |
| `start`, `end` | Time of day as `HH:MM`, 24-hour clock. |
| `kind` | Activity kind, see below. |
| `icon` | Icon name the app looks up in its registry, for example `Dumbbell` or `Calculator`. An unknown name renders a question mark instead of breaking the page. |
| `title` | Short Russian title shown in the card. |
| `note` | Optional Russian clarification, for example `алгебра / геометрия`. |
| `tracked` | `yes` when the row has a checkbox and counts toward the daily progress, otherwise `no`. |

Activity kinds:

| Kind | Covers |
| --- | --- |
| `routine` | Wake up, exercise, hygiene, breakfast, day planning. |
| `study` | Lessons, practice, homework, tutor, revision, projects. |
| `sport` | Walks, sport, active rest. |
| `break` | Short breaks between lessons. |
| `rest` | Lunch, dinner, free time, family time. |
| `sleep` | Sleep. |

## Application

| Path | Role |
| --- | --- |
| `src/main.tsx` | Entry point: base CSS and the app. |
| `src/theme.ts` | The violet theme, built by extending the shipped neutral theme. |
| `src/themeMode.ts` | Light or dark colour mode, remembered in local storage. |
| `src/App.tsx` | Theme provider and application shell. |
| `src/pages/schedule/page.tsx` | The page: accent header with the view switch and an icon-only light/dark switch on the right, selected date, clock, and the day, week and month views. |
| `src/components/DayView.tsx` | One day: header with the date and progress, then the segment cards in as many columns as the width allows. |
| `src/components/WeekView.tsx` | The week: a header with the summed week progress, a divider, then one row per day with its own progress, opening a day. |
| `src/components/MonthView.tsx` | The month: a header with the summed month progress and prev/next buttons, then one progress ring per day, opening a day. |
| `src/components/ProgressRing.tsx` | The small SVG ring a month day is drawn with, one ring per shape. |
| `src/components/EntryCard.tsx` | One segment as a card, clickable when it carries a mark. |
| `src/columns.ts` | How many columns the width fits, and how segments are spread across them. |
| `src/icons.ts` | Icon names from the data mapped to icon components. |
| `src/schedule.ts` | Typed access to the generated data and the time rules. |
| `src/month.ts` | Month arithmetic: month titles, whole-week grids and navigating between months. |
| `src/marks.ts` | Where the done marks live. |
| `src/useMarks.ts` | Hooks that load and update marks for a day and a range of days. |
| `src/useCurrentTime.ts` | Clock that refreshes the page while it stays open. |

The day view is a column layout of tall cards, in time order, under an accent
header card that also holds the view switch and the light/dark switch. The cards
read downwards: a column is filled to its end before the next one starts, so the
sequence follows the clock instead of jumping across rows. The width decides how
many columns there are — one below 900px, two from there, three from 1400px —
and the split is done by `src/columns.ts`, because `Grid` fills row by row and
cannot express that order. Every card carries its own state, which keeps passed
time and service rows readable without a colour override:

| Card state | Look |
| --- | --- |
| Marked | Accent background with a check |
| Time already passed, not marked | Muted background |
| Break, meal or sleep | Muted background, no mark, not clickable |
| Still ahead | Standard card surface |

The segment running now also carries a `сейчас` badge, so the state never rests on
colour alone. A card that carries a mark is one control: the whole card toggles
the mark and its accessible name states the segment and whether it is marked, so
there is no second checkbox to tab to. The card icon is centred against the card,
so a three-line segment and a one-line segment look deliberate next to each other.

### The marking window

A segment can be marked or unmarked for one hour after it ends, and the window is
measured on the day being shown: a future day is open, a past day is closed, and
today closes segment by segment. `MARKING_GRACE_MINUTES` in `src/schedule.ts` holds
that hour, and `isMarkingOpen()` decides it.

Once the window closes the card becomes a plain card: it stops being clickable, it
turns muted, and it keeps the mark it already earned rather than losing it. The day
header states the rule in one line, so a card that does not respond is explained
where the person is looking.

### The month view

The month view is a seven-column grid, one column per weekday, that starts on
Monday like the schedule weeks do (`src/month.ts`). Each day is one cell drawn as a
small progress ring: the day number in the middle, the achieved share as the filled
arc, and the routed part of the ring left as the track. The ring is a tiny inline
SVG (`src/components/ProgressRing.tsx`) rather than a chart component, because the
design system has no ring primitive and a dedicated dependency would be heavy for a
single circle; it still reads its two colours from the theme tokens, so it follows
the light/dark mode and the violet accent without hardcoded values.

A whole week always fits the grid, so the month starts on the Monday of or before
the first day and ends on the Sunday of or after the last day — that is why a month
cell count runs between 28 and 42. Days outside the month are left transparent,
today is the accent variant, and past days keep the marks they have. The grid
header shows the nominative month (`октябрь 2026`), a badge and progress bar over
every countable segment of the month, and the total marked in the month; chevron
buttons move to the previous and next month. Clicking any day opens that day's
view. The week view has the same summed progress in its own header, so both views
answer "how much of this whole period is done" at a glance; in the week the summed
bar is set apart from the list of days by a strong divider, because the total is a
different reading than the per-day rows.

### Where marks are stored

`src/marks.ts` defines a `MarkStore` interface, and `createMarkStore()` returns
the store the app uses, currently one backed by local storage. Marks are kept per
calendar day, so history accumulates and the week view can read any day.

Local storage means marks stay on one device and disappear when site data is
cleared. Moving them to Supabase means implementing the same methods and
returning that store from `createMarkStore()`; no view changes.

### Theme

The violet theme extends `@astryxdesign/theme-neutral` and re-seeds the palette
from one accent colour, which expands into surfaces, text, borders and overlays
for light and dark mode. The accent stays an accent: the `purple` card variant
keeps the tinted surface the theme derives, and that one variant carries both the
page header and the cards that are marked done, so the header and the progress
speak the same colour without either of them being filled with it.

The progress bars would otherwise be a different colour than the rest of the app.
The neutral theme keeps its status accent fill blue even after `color.accent`
re-seeds the general accent ramp, and the `ProgressBar` accent variant reads that
status token rather than `--color-accent`. A `progress-bar` component override
re-points the accent fill to the violet, so the day, week and month bars all match
the accent:

```ts
components: {
  'progress-bar': {
    'variant:accent': {'--color-accent': 'light-dark(#7131E3, #DAB8FF)'},
  },
  ...
}
```

The two hex values are exactly what the accent seed expands to in light and dark
mode, so the bar matches the accent instead of inheriting the neutral blue.

The theme also lifts the largest icon step from 1.5rem to 1.875rem:

```ts
components: {
  icon: {
    'size:lg': {width: '1.875rem', height: '1.875rem'},
  },
},
```

The icon scale stops at `lg`, and its documentation asks for the size steps rather
than stray pixel values, so a quarter larger is a theme decision rather than a
value at the call site. Only the segment icons use `lg`, while the check, badge
and switch icons are smaller and keep their size; the smoke test checks that this
rule is emitted.

The light/dark switch shows a sun and a moon instead of text, with the labels kept
as accessible names, and sits on the right of the header. It sets the `mode` of the
theme provider, and the choice is remembered in local storage; before the first
choice the operating system preference decides.

Doing the palette at runtime makes the theme inject its styles on start, which
the console reports once. Before a production push the theme can be built into
static CSS instead:

```sh
npx astryx theme build src/theme.ts
```

`astryx-themes.js` and `theme.template.ts` are written by the Astryx CLI and are
its record of the installed theme; the app imports the theme CSS directly.

## Commands

```sh
npm run data        # validate data/schedule.csv and write data/schedule.json
npm run data:check  # validate only, used by CI
npm test            # tests for the CSV helpers and the schedule rules
npm run dev         # data step, then the development server
npm run build       # data step, type check, production build
npm run smoke       # render the app in jsdom and check the visible content
```

The data step fails on a broken schedule, so a wrong edit cannot reach the app.
It reports an unknown day or kind, an id that does not match its day or repeats,
a time that is not `HH:MM`, an end that is not later than the start, an empty
title, an overlap inside one day and a day without entries. Gaps inside a day are
printed as warnings, because a gap is sometimes intended.

`npm run smoke` is the closest check to opening the page that runs without a
browser: it mounts the app into a jsdom document with a frozen clock, checks that
every segment of the shown day renders as a card, that the columns read downwards
with the earliest segment in the first column, clicks the running card and
verifies that the mark appears, that the day progress moves and that the mark is
stored under that calendar day, switches the colour mode and verifies that the
choice is stored, renders the page at 600, 1280 and 1500 pixels wide and checks
that it gives one, two and three columns with every segment present, opens the
month view and verifies its title, the daily weekday labels, the cell count, the
single filled ring for the marked day and that clicking a day returns to that day,
and finally moves the clock to 13:30 to check that the morning segments closed
their marking window, that a closed card is not clickable and that a mark taken
earlier survived. Set `SMOKE_DUMP=/tmp/page.html` to write the rendered markup and
the theme's injected styles for inspection.
