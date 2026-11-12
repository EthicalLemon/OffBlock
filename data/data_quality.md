# Data quality results

Fill this in after running `sql/01_data_quality.sql` on the downloaded files. Copy each result in as it came out, then write what was done about it.

| Check | Result | Action taken |
| --- | --- | --- |
| total_rows | | |
| missing_flight_date | | |
| missing_airline | | |
| missing_origin_or_dest | | |
| missing_cancelled_or_diverted | | |
| flag_not_0_or_1 | | |
| cancelled_and_diverted | | |
| completed_missing_arr_delay | | |
| not_cancelled_missing_dep_delay | | |
| cancelled_with_arr_delay | | |
| origin_equals_dest | | |
| arr_delay_outside_-120_to_1440 | | |
| duplicate_groups | | |
| duplicate_extra_rows | | |

Coverage by month: days present against days in month.

Delay-cause fields: how many delayed flights have cause values, and how many have causes that do not add up to the arrival delay.
