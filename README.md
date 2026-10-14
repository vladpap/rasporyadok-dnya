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
| `src/main.tsx` | Entry point: base CSS, the theme provider, the app. |
| `src/theme.ts` | The violet theme, built by extending the shipped neutral theme. |
| `src/App.tsx` | Application shell. |
| `src/pages/schedule/page.tsx` | The page: selected date, clock, day and week views. |
| `src/components/DayView.tsx` | One day: header with the date and progress, then the segment cards in a responsive grid. |
| `src/components/WeekView.tsx` | The week: one row per day with its progress, opening a day. |
| `src/components/EntryCard.tsx` | One segment as a card, clickable when it carries a mark. |
| `src/icons.ts` | Icon names from the data mapped to icon components. |
| `src/schedule.ts` | Typed access to the generated data and the time rules. |
| `src/marks.ts` | Where the done marks live. |
| `src/useMarks.ts` | Hooks that load and update marks for a day and a week. |
| `src/useCurrentTime.ts` | Clock that refreshes the page while it stays open. |

The day view is a card grid: `Grid` picks the column count from the available
width, so a phone gets one column, a tablet two and a desktop up to three. Each
card carries its own state, which keeps passed time and service rows readable
without a colour override:

| Card state | Look |
| --- | --- |
| Marked | Accent background with a check |
| Time already passed, not marked | Muted background |
| Break, meal or sleep | Muted background, no mark, not clickable |
| Still ahead | Standard card surface |

The segment running now also carries a `сейчас` badge, so the state never rests on
colour alone. A card that carries a mark is one control: the whole card toggles
the mark and its accessible name states the segment and whether it is marked, so
there is no second checkbox to tab to.

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
for light and dark mode. Doing that at runtime makes the theme inject its styles
on start, which the console reports once. Before a production push the theme can
be built into static CSS instead:

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
every segment of the shown day renders as a card, clicks the running card and
verifies that the mark appears, that the day progress moves and that the mark is
stored under that calendar day. Set `SMOKE_DUMP=/tmp/page.html` to write the
rendered markup for inspection.
