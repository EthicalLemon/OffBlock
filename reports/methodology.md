# Methodology

## Scope

US domestic scheduled flights reported by carriers to BTS. International flights are not in the on-time data. The period is the latest three complete months available at download time, recorded in `data/source_information.md`.

## Populations

- Scheduled: every row in `flights`.
- Completed: not cancelled, not diverted, and with a valid arrival delay. This is the view `completed_flights`.
- Categorised delay: a completed flight delayed 15 minutes or more with all five cause values present. This is the view `categorised_delays`.

## Metrics

| Metric | Numerator | Denominator |
| --- | --- | --- |
| Arrival delay rate | Completed flights with arrival delay of 15 minutes or more | Completed flights |
| Average arrival delay | Sum of arrival delay minutes, early arrivals counted as negative | Completed flights |
| Average delay when delayed | Sum of arrival delay minutes | Completed flights delayed 15 minutes or more |
| Cancellation rate | Cancelled flights | Scheduled flights |
| Diversion rate | Diverted flights | Scheduled flights |
| Departure delay rate | Flights with departure delay of 15 minutes or more | Flights with a valid departure delay |

Airport arrival figures group by destination. Airport cancellation and departure figures group by origin. Route figures group by origin and destination in that direction.

Cancellation and diversion are reported separately and never merged into a single disruption figure.

A blank delay value is kept as missing and is never turned into zero. A row missing the field a metric needs drops out of that metric's denominator, and the data-quality queries count how many.

## Minimum counts

Airlines, airports and routes below a minimum number of completed flights are not ranked, so a handful of flights cannot top a list. The limits sit in the `settings` table (airline 1000, airport 500, route 100 to start). They are reviewed against the threshold query in `sql/03` and any change is written down here with the reason.

Recurring-disruption queries apply the airport and route limits to each month separately and only list places above the network rate in every month counted.

## Duplicates

Rows sharing date, airline, flight number, origin, destination and scheduled departure are counted in the data-quality checks. They are kept in the analysis because a repeated key cannot be told apart from a repeated record from this data alone. If the count is not zero, it is reported in `data/data_quality.md` together with its approximate effect on the headline rates.

## Delay categories

Carrier, weather, National Aviation System, security and late-aircraft delay are categories assigned by the reporting airline. They describe what was recorded and do not establish why a delay happened. Shares in the site are shares of categorised delay minutes only. The percentage of delayed flights that carry cause values is reported next to them.

## Interpretation

Patterns are described as observed. Differences between airports, routes and airlines are not treated as proof of cause, and no financial effect is estimated, because the source holds no cost data.

## Reproducibility

Every figure comes from a view or query in `sql/`, run on the files listed in `data/source_information.md`.
