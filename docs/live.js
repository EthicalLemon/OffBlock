const WEIGHT = { AIRPORT_CLOSURE: 5, GROUND_STOP: 4, GROUND_DELAY: 3, ARRIVAL_DEPARTURE_DELAY: 2 };
const LABEL = { AIRPORT_CLOSURE: "Closure", GROUND_STOP: "Ground stop", GROUND_DELAY: "Ground delay", ARRIVAL_DEPARTURE_DELAY: "Arr/dep delay" };
const POOR = { LIFR: 2, IFR: 1 };
const DAY = 86400000;

function weatherText(w) {
  if (!w) return "\u2014";
  const parts = [w.cat, w.wind !== null ? w.wind + (w.gust ? "G" + w.gust : "") + " kt" : null, w.vis !== null ? "vis " + w.vis : null, w.ceiling ? "ceil " + w.ceiling : null, w.wx];
  return parts.filter(Boolean).join(" ");
}

function common(list) {
  const counts = new Map();
  list.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
}

async function main() {
  const [live, csv] = await Promise.all([loadJson("live"), loadText("events.csv")]);
  const brief = document.getElementById("brief");
  if (!live || !Array.isArray(live.events)) {
    brief.textContent = "No snapshot yet. The collector writes one on its first run.";
    showEmpty(document.getElementById("board"));
    return;
  }

  const ledger = parseCsv(csv);
  const weather = live.weather || {};
  const asOf = Date.parse(live.updated);
  const recent = new Map();
  ledger.forEach(r => {
    if (asOf - Date.parse(r.first_seen) <= 30 * DAY) recent.set(r.airport, (recent.get(r.airport) || 0) + 1);
  });

  const byAirport = new Map();
  live.events.forEach(e => {
    const row = byAirport.get(e.airport) || { airport: e.airport, types: [], reasons: [], details: [], weight: 0 };
    row.types.push(LABEL[e.type] || e.type);
    if (e.reason) row.reasons.push(e.reason);
    if (e.detail) row.details.push(e.detail);
    row.weight = Math.max(row.weight, WEIGHT[e.type] || 1);
    byAirport.set(e.airport, row);
  });

  const rows = [...byAirport.values()].map(r => ({
    airport: r.airport,
    score: r.weight + ((weather[r.airport] && POOR[weather[r.airport].cat]) || 0),
    active: r.types.join(" + "),
    reason: [...new Set(r.reasons)].join(", ") || "\u2014",
    detail: r.details.join("; ") || "\u2014",
    wx: weatherText(weather[r.airport]),
    recent: recent.get(r.airport) || 0
  })).sort((a, b) => b.score - a.score || a.airport.localeCompare(b.airport));

  const count = type => live.events.filter(e => e.type === type).length;
  const hubs = live.hubs || [];
  const poorHubs = hubs.filter(h => weather[h] && POOR[weather[h].cat]);

  document.getElementById("n-airports").textContent = rows.length;
  document.getElementById("n-stops").textContent = count("GROUND_STOP");
  document.getElementById("n-gdp").textContent = count("GROUND_DELAY");
  document.getElementById("n-closures").textContent = count("AIRPORT_CLOSURE");
  document.getElementById("n-ifr").textContent = poorHubs.length;

  const ageMin = Math.round((Date.now() - asOf) / 60000);
  document.getElementById("period").textContent = (live.source_updated ? "FAA " + live.source_updated : "") + (ageMin > 60 ? " (collector data is " + ageMin + " min old)" : "");

  if (!rows.length) {
    brief.textContent = `The FAA reports no active programs. ${poorHubs.length} of ${hubs.length} monitored hubs are IFR or worse.`;
    document.getElementById("board").innerHTML = '<p class="empty">No active FAA programs</p>';
  } else {
    const top = common(live.events.map(e => e.reason).filter(Boolean));
    brief.textContent = `${rows.length} airport${rows.length === 1 ? "" : "s"} under FAA programs: ${count("GROUND_STOP")} ground stop${count("GROUND_STOP") === 1 ? "" : "s"}, ${count("GROUND_DELAY")} ground delay program${count("GROUND_DELAY") === 1 ? "" : "s"}, ${count("AIRPORT_CLOSURE")} closure${count("AIRPORT_CLOSURE") === 1 ? "" : "s"}.` +
      (top && top[1] > 1 ? ` The most common stated reason is ${top[0]} (${top[1]} airports).` : "") +
      ` ${poorHubs.length} of ${hubs.length} monitored hubs report IFR or worse.`;
    table("board", [
      { key: "airport", label: "Airport" },
      { key: "active", label: "Active" },
      { key: "reason", label: "Reason" },
      { key: "detail", label: "Detail" },
      { key: "wx", label: "Weather" },
      { key: "recent", label: "30 days", num: true, fmt: int }
    ], rows);
  }

  const grid = document.getElementById("hubs");
  const known = hubs.filter(h => weather[h]);
  grid.innerHTML = known.length
    ? `<div class="hubs">${known.map(h => `<div class="hub ${weather[h].cat || ""}">${esc(h)}<i>${esc(weather[h].cat || "\u2014")}</i></div>`).join("")}</div>`
    : '<p class="empty">No weather loaded</p>';
}

main();
