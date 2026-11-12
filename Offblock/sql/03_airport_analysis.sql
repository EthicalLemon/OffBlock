DROP VIEW IF EXISTS airports;

CREATE VIEW airports AS
WITH arrivals AS (
    SELECT
        dest AS airport,
        COUNT(*) AS flights,
        ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate,
        ROUND(AVG(arr_delay), 2) AS avg_arr_delay
    FROM completed_flights
    GROUP BY dest
),
departures AS (
    SELECT
        origin AS airport,
        COUNT(*) AS departures,
        ROUND(100.0 * SUM(cancelled) / COUNT(*), 2) AS cancel_rate
    FROM flights
    GROUP BY origin
),
departure_delays AS (
    SELECT
        origin AS airport,
        ROUND(100.0 * SUM(dep_delay >= 15) / COUNT(*), 2) AS dep_delay_rate
    FROM flights
    WHERE dep_delay IS NOT NULL
    GROUP BY origin
)
SELECT
    a.airport,
    a.flights,
    a.arr_delay_rate,
    a.avg_arr_delay,
    d.departures,
    dd.dep_delay_rate,
    d.cancel_rate,
    RANK() OVER (ORDER BY a.arr_delay_rate DESC) AS arr_rank
FROM arrivals a
LEFT JOIN departures d ON d.airport = a.airport
LEFT JOIN departure_delays dd ON dd.airport = a.airport
WHERE a.flights >= (SELECT value FROM settings WHERE name = 'min_airport_flights')
ORDER BY a.arr_delay_rate DESC;

SELECT
    COUNT(*) AS airports,
    SUM(arrivals >= 100) AS at_100,
    SUM(arrivals >= 300) AS at_300,
    SUM(arrivals >= 500) AS at_500,
    SUM(arrivals >= 1000) AS at_1000
FROM (SELECT dest, COUNT(*) AS arrivals FROM completed_flights GROUP BY dest);

SELECT * FROM airports LIMIT 25;

SELECT
    airport,
    arr_delay_rate,
    dep_delay_rate,
    ROUND(arr_delay_rate - dep_delay_rate, 2) AS arrival_minus_departure
FROM airports
WHERE dep_delay_rate IS NOT NULL
ORDER BY arrival_minus_departure DESC
LIMIT 25;

WITH network AS (
    SELECT month, 100.0 * SUM(arr_delay >= 15) / COUNT(*) AS network_rate
    FROM completed_flights
    GROUP BY month
),
airport_month AS (
    SELECT
        dest AS airport,
        month,
        COUNT(*) AS flights,
        100.0 * SUM(arr_delay >= 15) / COUNT(*) AS rate
    FROM completed_flights
    GROUP BY dest, month
)
SELECT
    airport,
    COUNT(*) AS months_counted,
    SUM(rate > network_rate) AS months_above_network,
    SUM(flights) AS flights,
    ROUND(AVG(rate), 2) AS avg_monthly_rate
FROM airport_month
JOIN network USING (month)
WHERE flights >= (SELECT value FROM settings WHERE name = 'min_airport_flights')
GROUP BY airport
HAVING SUM(rate > network_rate) = COUNT(*)
ORDER BY avg_monthly_rate DESC;
