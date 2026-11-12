# Product demo script

About five minutes. Say the figures from the screen, not from memory.

## Open (30 seconds)

Offblock is a small dashboard for an airline network operations team, built on public US flight data. The question it answers is where disruption concentrates and which places deserve investigation first.

## Overview page (90 seconds)

- Read the five figures across the top and say what each one is a share of.
- Point to the amber bars. In each chart the longest bar is highlighted.
- Say that rates are shares of completed flights, and that cancellations and diversions are shown separately.

## Airports and routes (90 seconds)

- Type an airport code into the filter.
- Explain that small airports and routes are left out so a few flights cannot top the list.
- Show the weekday chart and say which day stands out, and that this is an observed pattern.

## Delay causes (60 seconds)

- Read the categories as recorded by airlines.
- Say plainly that these are reported categories, not proven causes.

## Close (30 seconds)

The analysis is SQL against the downloaded files, every metric is defined in the methodology file, and the limits are written down.

## Questions to expect

- Why 15 minutes? It is the threshold BTS uses for a delayed arrival, and it is stated on the site.
- Why are some airports missing? They are under the minimum count, set in the settings table.
- Can you say what caused the delays? No. The data only has the category an airline reported.
- How would you extend it? More months, then aircraft rotation data to test whether late-aircraft delay spreads along a day.
