SELECT 'total_rows' AS check_name, COUNT(*) AS value FROM flights
UNION ALL SELECT 'missing_flight_date', COUNT(*) FROM flights WHERE flight_date IS NULL
UNION ALL SELECT 'missing_airline', COUNT(*) FROM flights WHERE airline IS NULL OR airline = ''
UNION ALL SELECT 'missing_origin_or_dest', COUNT(*) FROM flights WHERE origin = '' OR dest = ''
UNION ALL SELECT 'missing_cancelled_or_diverted', COUNT(*) FROM flights WHERE cancelled IS NULL OR diverted IS NULL
UNION ALL SELECT 'flag_not_0_or_1', COUNT(*) FROM flights WHERE cancelled NOT IN (0, 1) OR diverted NOT IN (0, 1)
UNION ALL SELECT 'cancelled_and_diverted', COUNT(*) FROM flights WHERE cancelled = 1 AND diverted = 1
UNION ALL SELECT 'completed_missing_arr_delay', COUNT(*) FROM flights WHERE cancelled = 0 AND diverted = 0 AND arr_delay IS NULL
UNION ALL SELECT 'not_cancelled_missing_dep_delay', COUNT(*) FROM flights WHERE cancelled = 0 AND dep_delay IS NULL
UNION ALL SELECT 'cancelled_with_arr_delay', COUNT(*) FROM flights WHERE cancelled = 1 AND arr_delay IS NOT NULL
UNION ALL SELECT 'origin_equals_dest', COUNT(*) FROM flights WHERE origin = dest
UNION ALL SELECT 'arr_delay_outside_-120_to_1440', COUNT(*) FROM flights WHERE arr_delay < -120 OR arr_delay > 1440
UNION ALL SELECT 'duplicate_groups', COUNT(*) FROM (
    SELECT 1 FROM flights
    GROUP BY flight_date, airline, flight_number, origin, dest, sched_dep
    HAVING COUNT(*) > 1)
UNION ALL SELECT 'duplicate_extra_rows', COALESCE(SUM(n - 1), 0) FROM (
    SELECT COUNT(*) AS n FROM flights
    GROUP BY flight_date, airline, flight_number, origin, dest, sched_dep
    HAVING COUNT(*) > 1);

SELECT
    month,
    COUNT(*) AS rows_loaded,
    MIN(flight_date) AS first_date,
    MAX(flight_date) AS last_date,
    COUNT(DISTINCT flight_date) AS days_present,
    CAST(strftime('%d', date(month || '-01', '+1 month', '-1 day')) AS INTEGER) AS days_in_month
FROM flights
GROUP BY month
ORDER BY month;

SELECT
    arr_delay >= 15 AS delayed_15_plus,
    COUNT(*) AS flights,
    SUM(carrier_delay IS NOT NULL) AS with_cause_values,
    SUM(carrier_delay IS NOT NULL
        AND carrier_delay + weather_delay + nas_delay + security_delay + late_aircraft_delay <> arr_delay) AS cause_sum_differs
FROM completed_flights
GROUP BY arr_delay >= 15;
