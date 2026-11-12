# Offblock

A disruption ledger for US domestic flights.

Offblock does two jobs. It watches US airports live, combining the FAA's airport status feed with NOAA weather, and it keeps a permanent ledger of every disruption program it sees start and end. Alongside that sits a historical layer built from BTS on-time data and SQL.

This is an independently developed portfolio project. It is not affiliated with the FAA, NOAA, BTS, the US Department of Transportation or any airline. The consulting framing is a way to structure the work, not a real client. It is not for operational or flight-planning use.

## What it answers

Live:

- Which airports are under FAA ground stops, ground delay programs, closures or arrival and departure delays right now, and why?
- Is the weather at those airports poor, and which major hubs are IFR or worse?

Ledger, which improves as it collects:

- Which airports and reasons come up most often?
- How long do programs last, and at what hour do they start?

History from BTS:

- Which airports, routes and airlines have the highest delay rates, and what delay categories are reported?

Findings are observed patterns. The FAA states a reason for a program and airlines report a delay category. Neither is an independently established cause, and nothing here claims otherwise.

## How the live part works

A scheduled GitHub Actions job runs `collector/collect.mjs` about every 15 minutes. It uses no server, no key and no packages.

1. It fetches the FAA airport status feed and parses ground stops, ground delay programs, closures and arrival or departure delays.
2. It fetches the latest METAR for 30 major hubs and for every affected airport.
3. It compares the programs with the previous snapshot. A program that has disappeared is written to `docs/data/events.csv` with its first and last sighting.
4. It writes `docs/data/live.json` and commits the changes.

If the FAA feed fails or returns something unexpected, the job leaves the last good snapshot alone.

Observed minutes in the ledger run from first sighting to last sighting, so they are a lower bound with a granularity of about 15 minutes. GitHub may delay scheduled runs, and it can pause them in inactive repositories. If the ledger stops growing, check the Actions tab.

The severity ranking on the board is a simple score: closure 5, ground stop 4, ground delay 3, arrival or departure delay 2, plus 1 for IFR or 2 for LIFR weather at the airport. It is a way to sort the list and nothing more.

The XML layout for ground stops, ground delay programs and closures follows the FAA feed's published structure. The layout for arrival and departure delays is parsed tolerantly, because it was the one section I could not check against a live feed.

## Turn it on

1. Push the repository to GitHub.
2. In Settings, Actions, General, set workflow permissions to read and write.
3. Open the Actions tab, choose `collect`, and click Run workflow. It should add a commit that creates `docs/data/live.json`.
4. In Settings, Pages, choose the `main` branch and the `/docs` folder.

## Status

Built and tested with mocked feeds:

- [x] Collector, workflow, live board and ledger
- [x] SQL suite `sql/00` to `sql/05` for the BTS layer, tested on synthetic rows
- [x] Metric definitions, data-quality checks, report outline, demo script

Needs real runs:

- [ ] First live collector run and a check of the output
- [ ] A few weeks of ledger data
- [ ] BTS download, SQL run and export to `docs/data/`
- [ ] Findings written in `reports/executive_report.md`

The BTS pages show "No data loaded" until their files exist, and the ledger shows nothing until programs have ended. The repository holds no sample data.

## Stack

A dependency-free Node script and GitHub Actions for collection. SQLite, DB Browser for SQLite and SQL for the BTS analysis. Plain HTML, CSS and JavaScript for the site, hosted on GitHub Pages.

## Data

Source: BTS TranStats, Airline On-Time Performance Data, Reporting Carrier table. Raw files are not committed. Source, download date, reporting period and file checksums go in `data/source_information.md`.

## Layout

```
Offblock/
  .github/workflows/collect.yml
  collector/collect.mjs
  data/
    data_dictionary.md
    source_information.md
    data_quality.md
    raw/
  sql/
    00_build_flights.sql
    01_data_quality.sql
    02_flight_performance.sql
    03_airport_analysis.sql
    04_route_analysis.sql
    05_delay_analysis.sql
  docs/
    index.html
    ledger.html
    bts.html
    network.html
    delays.html
    lib.js
    live.js
    ledger.js
    app.js
    style.css
    data/
  reports/
    methodology.md
    executive_report.md
  screenshots/
  presentation/
    product_demo.md
```

The site lives in `docs/` because GitHub Pages can publish from that folder.

## Reproducing the analysis

1. **Download.** On transtats.bts.gov open Airline On-Time Performance Data, then the Reporting Carrier On-Time Performance table. Use the pre-zipped monthly files for the latest three complete months, unzip them into `data/raw/`, and fill in `data/source_information.md`. Do not edit the CSVs.
2. **Open DB Browser for SQLite.** New Database, save it as `data/offblock.db`, and close the table-creation dialog. Choose File, Import, Table from CSV file, select all the monthly CSVs, name the table `raw_flights`, tick column names in first line and trim fields, and import them into one table.
3. **Build.** In the Execute SQL tab open `sql/00_build_flights.sql`, run all (Ctrl+Return), then Write Changes (Ctrl+S). Check that `SELECT COUNT(*) FROM flights` matches the imported row count.
4. **Check quality.** Open `sql/01_data_quality.sql`, select one statement at a time and run it. Record the results in `data/data_quality.md`.
5. **Analyse.** Run `sql/02` to `sql/05` the same way. Running a whole file creates its views. Select a single query to see its result.
6. **Export.** File, Export, Table(s) as JSON. Export the views `summary`, `airlines`, `airports`, `routes`, `monthly`, `weekday` and `delay_causes`, each as `<name>.json` into `docs/data/`. If the dialog only writes one file at a time, repeat it per view.
7. **Preview** the site, then publish it.

The minimum flight counts for ranking live in the `settings` table. Look at the threshold query in `sql/03` first, then change a value with `UPDATE settings SET value = 300 WHERE name = 'min_airport_flights';` and re-run the file that uses it.

## Site data

Each page reads JSON files from `docs/data/`. A file is a list of rows. Rates are percentages from 0 to 100, already rounded in SQL. Rows should arrive in the order they should be shown. The views in `sql/` already produce exactly these fields, plus a few extra columns the site ignores.

| File | Fields |
| --- | --- |
| `summary.json` | one row: `flights`, `arr_delay_rate`, `avg_arr_delay`, `cancel_rate`, `diversion_rate`, `period` |
| `airlines.json` | `airline`, `arr_delay_rate` |
| `airports.json` | `airport`, `flights` (completed arrivals), `arr_delay_rate`, `dep_delay_rate`, `cancel_rate` |
| `routes.json` | `route`, `flights`, `arr_delay_rate`, `avg_arr_delay` |
| `monthly.json` | `month`, `arr_delay_rate` |
| `weekday.json` | `weekday`, `arr_delay_rate` |
| `delay_causes.json` | `category`, `minutes`, `share` |

A missing or empty file shows "No data loaded" for that chart.

## Preview and publish

Browsers will not load data files from a page opened by double-clicking it, so a local preview needs a small web server. The Live Server extension in VS Code does this with one click on `docs/index.html`.

To publish: on GitHub open Settings, then Pages, set the source to the `main` branch and the `/docs` folder, and save. The live address appears on that page after a minute or two.

## Metrics

Every metric, with its denominator and its handling of missing values, is defined in `reports/methodology.md`.

## Design

Dark, flat and sparse, with faint scanlines drawn in CSS. IBM Plex Mono for figures, IBM Plex Sans for text, loaded from Google Fonts under the SIL Open Font License. If the font host is unreachable the page falls back to Consolas and Segoe UI.
