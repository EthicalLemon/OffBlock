# Offblock: executive report

Independent portfolio project built on public BTS data. Not prepared for, or endorsed by, any airline.

Sections marked **From results** are written after the SQL has run on the downloaded files, using the view named beside each. Nothing in those sections is pre-filled.

## 1. Executive summary

From results. Three short paragraphs: the headline rates (`summary`), the two or three places most worth a look (`airports`, `routes`), and the most important caveat.

## 2. Business problem

A network operations team at a US domestic carrier sees delays every day but struggles to tell which airports, routes and delay categories are persistent problems and which are one-off bad days. This report looks at carrier-reported data for a recent period and narrows the list of places that deserve investigation.

## 3. Dataset and methodology

Source, period and file list are in `data/source_information.md`. Metric definitions, populations, thresholds and the handling of missing values are in `reports/methodology.md`. Data-quality results are in `data/data_quality.md`.

## 4. Key findings

From results. One short block per question, each citing its view.

| Question | Source |
| --- | --- |
| Airports with the highest arrival disruption | `airports` |
| Routes with recurring delays | `routes`, recurring query in `sql/04` |
| Airlines with higher delay rates | `airlines` |
| Weekday and month patterns | `weekday`, `monthly` |
| Reported delay categories | `delay_causes` |
| Cancellations and diversions | `summary`, airline query in `sql/02` |

## 5. Significant operational patterns

From results. Only patterns that hold across months, using the recurring-disruption queries in `sql/03` and `sql/04`.

## 6. Limitations

- Domestic flights only, for carriers that report to BTS.
- Three months cannot show seasonality, so month-to-month differences are not a trend.
- Delay categories are reported by airlines and are not independently verified.
- Cause fields exist only for some delayed flights, and the share is reported.
- Cancelled and diverted flights have no arrival delay, so they sit outside the arrival delay rate.
- Rankings depend on the minimum counts in `settings`.
- Rates compare places with different traffic mixes, schedules and aircraft types without adjusting for them.
- The data has no costs, passenger numbers, crew, aircraft rotations or gate information.

## 7. Areas requiring further investigation

From results, chosen from airports and routes that rank high and stay high across months. For each, the next data to request from an airline, such as aircraft rotations, turnaround times, air traffic management programmes and hourly weather.

## 8. Recommended interventions

From results. Each recommendation states five things: the problem, the evidence in this data, the department involved, how it could be tested, and how success would be measured.

Candidate directions, to be adopted only where the data supports them:

- Where late-aircraft delay is the largest category at a station, review inbound schedule buffers and turnaround planning for the flights feeding it.
- Where carrier delay stands out for one airline against its peers, review the operational processes behind the reporting category with that airline's own records.
- Where weather delay dominates, review contingency planning and recovery procedures, not the schedule.
- Where a route is above the network rate every month, test a schedule change on that route and compare it with a similar route that is left alone.

## 9. Expected business value

Not quantified. The data holds no cost per delay minute, passenger counts or crew costs, so no saving is claimed. Estimating value would need cost per delay minute, passengers per flight, and compensation and rebooking costs.

## 10. Suggested performance indicators

- Arrival delay rate, with the 15-minute threshold and the completed-flight denominator
- Average delay when delayed
- Cancellation rate and diversion rate, tracked separately
- Share of categorised delay minutes by category
- Months above network rate, by airport and by route
