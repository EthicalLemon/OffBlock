# Data dictionary

Columns Offblock reads from the BTS Reporting Carrier On-Time Performance table, and the columns derived from them. Field names are the ones published for that table. The Check column stays open until the header row of the file you downloaded has been compared against the official BTS table description.

## Source columns

| Column | Meaning | Check |
| --- | --- | --- |
| FlightDate | Date of the scheduled flight | open |
| Reporting_Airline | Unique carrier code | open |
| Flight_Number_Reporting_Airline | Flight number | open |
| Origin | Origin airport code | open |
| Dest | Destination airport code | open |
| CRSDepTime | Scheduled departure time, local, hhmm | open |
| DepDelay | Departure delay in minutes, negative if early, blank if cancelled | open |
| ArrDelay | Arrival delay in minutes, negative if early, blank if cancelled or diverted | open |
| Cancelled | 1 if cancelled | open |
| Diverted | 1 if diverted | open |
| CarrierDelay | Carrier delay in minutes | open |
| WeatherDelay | Weather delay in minutes | open |
| NASDelay | National Air System delay in minutes | open |
| SecurityDelay | Security delay in minutes | open |
| LateAircraftDelay | Late aircraft delay in minutes | open |

The meanings of the delay-minute fields and the blank rules above are what the pipeline assumes. `sql/01_data_quality.sql` tests them against the real data.

## Derived columns in `flights`

| Column | Built from |
| --- | --- |
| flight_date | FlightDate as an ISO date |
| month | year and month of flight_date, as `YYYY-MM` |
| weekday_no | weekday of flight_date, Monday = 1 to Sunday = 7 |
| route | Origin and Dest joined as `ORIGIN-DEST` |
| airline, flight_number, origin, dest, sched_dep | trimmed or converted copies of the source columns |
| dep_delay, arr_delay, cancelled, diverted | numeric copies; blanks become missing, not zero |
| carrier_delay, weather_delay, nas_delay, security_delay, late_aircraft_delay | numeric copies; blanks become missing, not zero |

## Views

| View | Contents |
| --- | --- |
| completed_flights | not cancelled, not diverted, valid arrival delay |
| categorised_delays | completed flights delayed 15 minutes or more with all five cause values present |
