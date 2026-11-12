function stats(row) {
  document.querySelectorAll("[data-stat]").forEach(el => {
    const key = el.dataset.stat;
    const fmt = { flights: int, arr_delay_rate: pct, avg_arr_delay: min, cancel_rate: pct, diversion_rate: pct }[key];
    el.textContent = row && row[key] !== undefined && row[key] !== null ? fmt(row[key]) : "\u2014";
  });
  const period = document.getElementById("period");
  if (period) period.textContent = row && row.period ? row.period : "";
}

async function start() {
  const page = document.body.dataset.page;
  const summary = await load("summary");
  stats(summary[0]);

  if (page === "overview") {
    const [airlines, airports, monthly] = await Promise.all([load("airlines"), load("airports"), load("monthly")]);
    bars("airlines", airlines, "airline", "arr_delay_rate", pct);
    bars("airports", airports.slice(0, 10), "airport", "arr_delay_rate", pct);
    bars("monthly", monthly, "month", "arr_delay_rate", pct);
  }

  if (page === "network") {
    const [airports, routes, weekday] = await Promise.all([load("airports"), load("routes"), load("weekday")]);
    table("airport-table", [
      { key: "airport", label: "Airport" },
      { key: "flights", label: "Arrivals", num: true, fmt: int },
      { key: "arr_delay_rate", label: "Arr delay", num: true, fmt: pct },
      { key: "dep_delay_rate", label: "Dep delay", num: true, fmt: pct },
      { key: "cancel_rate", label: "Cancelled", num: true, fmt: pct }
    ], airports);
    table("route-table", [
      { key: "route", label: "Route" },
      { key: "flights", label: "Flights", num: true, fmt: int },
      { key: "arr_delay_rate", label: "Arr delay", num: true, fmt: pct },
      { key: "avg_arr_delay", label: "Avg delay", num: true, fmt: min }
    ], routes);
    bars("weekday", weekday, "weekday", "arr_delay_rate", pct);
  }

  if (page === "delays") {
    const causes = await load("delay_causes");
    bars("causes", causes, "category", "minutes", int);
    bars("share", causes, "category", "share", pct);
  }
}

start();
