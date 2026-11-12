DROP VIEW IF EXISTS completed_flights;
DROP TABLE IF EXISTS flights;

CREATE TABLE flights AS
SELECT
    date(FlightDate) AS flight_date,
    strftime('%Y-%m', FlightDate) AS month,
    (CAST(strftime('%w', FlightDate) AS INTEGER) + 6) % 7 + 1 AS weekday_no,
    TRIM(Reporting_Airline) AS airline,
    CAST(NULLIF(TRIM(Flight_Number_Reporting_Airline), '') AS INTEGER) AS flight_number,
    TRIM(Origin) AS origin,
    TRIM(Dest) AS dest,
    TRIM(Origin) || '-' || TRIM(Dest) AS route,
    CAST(NULLIF(TRIM(CRSDepTime), '') AS INTEGER) AS sched_dep,
    CAST(NULLIF(TRIM(DepDelay), '') AS REAL) AS dep_delay,
    CAST(NULLIF(TRIM(ArrDelay), '') AS REAL) AS arr_delay,
    CAST(CAST(NULLIF(TRIM(Cancelled), '') AS REAL) AS INTEGER) AS cancelled,
    CAST(CAST(NULLIF(TRIM(Diverted), '') AS REAL) AS INTEGER) AS diverted,
    CAST(NULLIF(TRIM(CarrierDelay), '') AS REAL) AS carrier_delay,
    CAST(NULLIF(TRIM(WeatherDelay), '') AS REAL) AS weather_delay,
    CAST(NULLIF(TRIM(NASDelay), '') AS REAL) AS nas_delay,
    CAST(NULLIF(TRIM(SecurityDelay), '') AS REAL) AS security_delay,
    CAST(NULLIF(TRIM(LateAircraftDelay), '') AS REAL) AS late_aircraft_delay
FROM raw_flights;

CREATE INDEX idx_flights_month ON flights (month);
CREATE INDEX idx_flights_origin ON flights (origin);
CREATE INDEX idx_flights_dest ON flights (dest);
CREATE INDEX idx_flights_route ON flights (route);

CREATE VIEW completed_flights AS
SELECT * FROM flights
WHERE cancelled = 0 AND diverted = 0 AND arr_delay IS NOT NULL;

CREATE TABLE IF NOT EXISTS settings (name TEXT PRIMARY KEY, value INTEGER);
INSERT OR IGNORE INTO settings VALUES ('min_airline_flights', 1000);
INSERT OR IGNORE INTO settings VALUES ('min_airport_flights', 500);
INSERT OR IGNORE INTO settings VALUES ('min_route_flights', 100);
