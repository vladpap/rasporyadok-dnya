# rasporyadok_dnya

A weekly study schedule for one schoolchild, published as a small web application.
The repository separates the data from the code, so the schedule can be edited
without touching the application.

## Layers

| Layer | Path | Role |
| --- | --- | --- |
| Original input | `preparation/raspisanie.csv` | The schedule as it was first written, kept for reference. Never edited. |
| Canonical source | `data/schedule.csv` | The normalized schedule: one row per time segment. **This is the file to edit.** |
| Generated data | `data/schedule.json` | Built from the canonical source by `scripts/build-schedule.mjs`. Never edited by hand. |

The application reads `data/schedule.json`.

## Why the schedule was normalized

The original file is a table of wide time bands, and a single band holds two or
three activities with their own times. Several cells are also ambiguous for a
machine: `То же`, `репетитор/секция`, and weekend rows that reach past the band
they sit in. Normalizing turns each activity into its own row with an explicit
start and end, which is what the web application needs to sort activities and to
grey out the time that has already passed.

## Decisions behind the normalized source

| # | Decision |
| --- | --- |
| 1 | Weekday mornings are identical, Monday to Friday: 07:30 wake up and exercise, 08:00 breakfast, 08:30-09:00 plan the day and check homework. |
| 2 | Weekdays end with hygiene and reading 21:00-22:00 and an explicit sleep row 22:00-22:30. |
| 3 | Saturday keeps its own rhythm from the original file: break 11:00-11:15, exam preparation 11:15-12:30, lunch 12:30-13:00, lights out at 23:00. |
| 4 | Sunday morning is one row: 09:00-09:30 wake up and breakfast, 09:30-12:15 rest, walk, family. |
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
| `title` | Short Russian title shown in the list. |
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

## Commands

```sh
node scripts/build-schedule.mjs          # validate the source and write data/schedule.json
node scripts/build-schedule.mjs --check  # validate only, used by CI
node --test scripts/tests                # run the tests
```

The build fails on a broken schedule, so a wrong edit cannot reach the site. It
reports these problems: an unknown day or kind, an id that does not match its day
or repeats, a time that is not `HH:MM`, an end that is not later than the start,
an empty title, an overlap inside one day and a day without entries. Gaps inside
a day are printed as warnings, because a gap is sometimes intended.
