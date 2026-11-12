DROP VIEW IF EXISTS summary;
DROP VIEW IF EXISTS airlines;
DROP VIEW IF EXISTS monthly;
DROP VIEW IF EXISTS weekday;

CREATE VIEW summary AS
WITH scheduled AS (
    SELECT COUNT(*) AS flights, SUM(cancelled) AS cancelled, SUM(diverted) AS diverted
    FROM flights
),
done AS (
    SELECT
        COUNT(*) AS completed,
        SUM(arr_delay >= 15) AS delayed,
        AVG(arr_delay) AS avg_arr_delay,
        AVG(CASE WHEN arr_delay >= 15 THEN arr_delay END) AS avg_delay_when_delayed
    FROM completed_flights
),
span AS (
    SELECT MIN(month) AS first_month, MAX(month) AS last_month FROM flights
)
SELECT
    flights,
    cancelled,
    diverted,
    ROUND(100.0 * cancelled / flights, 2) AS cancel_rate,
    ROUND(100.0 * diverted / flights, 2) AS diversion_rate,
    completed,
    delayed,
    ROUND(100.0 * delayed / completed, 2) AS arr_delay_rate,
    ROUND(avg_arr_delay, 2) AS avg_arr_delay,
    ROUND(avg_delay_when_delayed, 2) AS avg_delay_when_delayed,
    CASE WHEN first_month = last_month THEN first_month
         ELSE first_month || ' to ' || last_month END AS period
FROM scheduled, done, span;

CREATE VIEW airlines AS
SELECT
    airline,
    COUNT(*) AS flights,
    SUM(arr_delay >= 15) AS delayed_flights,
    ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate,
    ROUND(AVG(arr_delay), 2) AS avg_arr_delay
FROM completed_flights
GROUP BY airline
HAVING COUNT(*) >= (SELECT value FROM settings WHERE name = 'min_airline_flights')
ORDER BY arr_delay_rate DESC;

CREATE VIEW monthly AS
SELECT
    month,
    COUNT(*) AS flights,
    ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate,
    ROUND(AVG(arr_delay), 2) AS avg_arr_delay
FROM completed_flights
GROUP BY month
ORDER BY month;

CREATE VIEW weekday AS
SELECT
    CASE weekday_no
        WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu'
        WHEN 5 THEN 'Fri' WHEN 6 THEN 'Sat' WHEN 7 THEN 'Sun'
    END AS weekday,
    COUNT(*) AS flights,
    ROUND(100.0 * SUM(arr_delay >= 15) / COUNT(*), 2) AS arr_delay_rate,
    ROUND(AVG(arr_delay), 2) AS avg_arr_delay
FROM completed_flights
WHERE weekday_no IS NOT NULL
GROUP BY weekday_no
ORDER BY weekday_no;

SELECT * FROM summary;

SELECT
    airline,
    COUNT(*) AS scheduled,
    SUM(cancelled) AS cancelled,
    ROUND(100.0 * SUM(cancelled) / COUNT(*), 2) AS cancel_rate,
    SUM(diverted) AS diverted,
    ROUND(100.0 * SUM(diverted) / COUNT(*), 2) AS diversion_rate
FROM flights
GROUP BY airline
ORDER BY cancel_rate DESC;

SELECT * FROM airlines;
SELECT * FROM monthly;
SELECT * FROM weekday;
