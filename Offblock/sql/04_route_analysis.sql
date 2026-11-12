DROP VIEW IF EXISTS routes;

CREATE VIEW routes AS
SELECT
    route,
    origin,
    dest,
    COUNT(*) AS flights,
    SUM(arr_delay >= 15) AS delayed_flights,
    ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate,
    ROUND(AVG(arr_delay), 2) AS avg_arr_delay
FROM completed_flights
GROUP BY route, origin, dest
HAVING COUNT(*) >= (SELECT value FROM settings WHERE name = 'min_route_flights')
ORDER BY arr_delay_rate DESC
LIMIT 100;

SELECT * FROM routes LIMIT 25;

SELECT
    route,
    COUNT(*) AS flights,
    SUM(arr_delay >= 15) AS delayed_flights,
    ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate
FROM completed_flights
GROUP BY route
HAVING COUNT(*) >= (SELECT value FROM settings WHERE name = 'min_route_flights')
ORDER BY delayed_flights DESC
LIMIT 25;

SELECT
    route,
    month,
    COUNT(*) AS flights,
    ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate,
    ROUND(AVG(arr_delay), 2) AS avg_arr_delay
FROM completed_flights
WHERE route IN (SELECT route FROM routes LIMIT 10)
GROUP BY route, month
ORDER BY route, month;

WITH network AS (
    SELECT month, 100.0 * SUM(arr_delay >= 15) / COUNT(*) AS network_rate
    FROM completed_flights
    GROUP BY month
),
route_month AS (
    SELECT
        route,
        month,
        COUNT(*) AS flights,
        100.0 * SUM(arr_delay >= 15) / COUNT(*) AS rate
    FROM completed_flights
    GROUP BY route, month
)
SELECT
    route,
    COUNT(*) AS months_counted,
    SUM(rate > network_rate) AS months_above_network,
    SUM(flights) AS flights,
    ROUND(AVG(rate), 2) AS avg_monthly_rate
FROM route_month
JOIN network USING (month)
WHERE flights >= (SELECT value FROM settings WHERE name = 'min_route_flights')
GROUP BY route
HAVING SUM(rate > network_rate) = COUNT(*)
ORDER BY avg_monthly_rate DESC
LIMIT 50;
