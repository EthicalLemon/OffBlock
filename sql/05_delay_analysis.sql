DROP VIEW IF EXISTS categorised_delays;
DROP VIEW IF EXISTS delay_causes;

CREATE VIEW categorised_delays AS
SELECT * FROM completed_flights
WHERE arr_delay >= 15
  AND carrier_delay IS NOT NULL
  AND weather_delay IS NOT NULL
  AND nas_delay IS NOT NULL
  AND security_delay IS NOT NULL
  AND late_aircraft_delay IS NOT NULL;

CREATE VIEW delay_causes AS
WITH totals AS (
    SELECT 'Carrier' AS category, SUM(carrier_delay) AS minutes FROM categorised_delays
    UNION ALL SELECT 'Weather', SUM(weather_delay) FROM categorised_delays
    UNION ALL SELECT 'NAS', SUM(nas_delay) FROM categorised_delays
    UNION ALL SELECT 'Security', SUM(security_delay) FROM categorised_delays
    UNION ALL SELECT 'Late aircraft', SUM(late_aircraft_delay) FROM categorised_delays
)
SELECT
    category,
    minutes,
    ROUND(100.0 * minutes / (SELECT SUM(minutes) FROM totals), 2) AS share
FROM totals
ORDER BY minutes DESC;

SELECT
    (SELECT COUNT(*) FROM completed_flights WHERE arr_delay >= 15) AS delayed_flights,
    (SELECT COUNT(*) FROM categorised_delays) AS with_all_cause_values,
    ROUND(100.0 * (SELECT COUNT(*) FROM categorised_delays)
        / (SELECT COUNT(*) FROM completed_flights WHERE arr_delay >= 15), 2) AS pct_categorised;

SELECT * FROM delay_causes;

SELECT
    airline,
    COUNT(*) AS categorised_flights,
    ROUND(100.0 * SUM(carrier_delay) / SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay), 2) AS carrier_share,
    ROUND(100.0 * SUM(weather_delay) / SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay), 2) AS weather_share,
    ROUND(100.0 * SUM(nas_delay) / SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay), 2) AS nas_share,
    ROUND(100.0 * SUM(security_delay) / SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay), 2) AS security_share,
    ROUND(100.0 * SUM(late_aircraft_delay) / SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay), 2) AS late_aircraft_share
FROM categorised_delays
GROUP BY airline
HAVING SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay) > 0
ORDER BY categorised_flights DESC;

SELECT
    month,
    SUM(carrier_delay) AS carrier,
    SUM(weather_delay) AS weather,
    SUM(nas_delay) AS nas,
    SUM(security_delay) AS security,
    SUM(late_aircraft_delay) AS late_aircraft
FROM categorised_delays
GROUP BY month
ORDER BY month;

SELECT
    dest AS airport,
    COUNT(*) AS categorised_flights,
    SUM(carrier_delay) AS carrier,
    SUM(weather_delay) AS weather,
    SUM(nas_delay) AS nas,
    SUM(security_delay) AS security,
    SUM(late_aircraft_delay) AS late_aircraft
FROM categorised_delays
GROUP BY dest
ORDER BY SUM(carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay) DESC
LIMIT 20;
