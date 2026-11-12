function median(list) {
  if (!list.length) return null;
  const s = [...list].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function tally(rows, key, limit) {
  const counts = new Map();
  rows.forEach(r => {
    const k = r[key] || "unstated";
    counts.set(k, (counts.get(k) || 0) + 1);
  });
  return [...counts.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n).slice(0, limit);
}

const TYPE = { AIRPORT_CLOSURE: "Closure", GROUND_STOP: "Ground stop", GROUND_DELAY: "Ground delay", ARRIVAL_DEPARTURE_DELAY: "Arr/dep delay" };

async function main() {
  const rows = parseCsv(await loadText("events.csv")).map(r => ({ ...r, minutes: Number(r.observed_minutes) }));
  if (!rows.length) {
    ["by-airport", "by-reason", "by-type", "by-hour", "recent"].forEach(id => {
      document.getElementById(id).innerHTML = '<p class="empty">No programs logged yet. Rows are added as programs end.</p>';
    });
    return;
  }

  const firsts = rows.map(r => Date.parse(r.first_seen)).sort((a, b) => a - b);
  const med = median(rows.map(r => r.minutes));
  document.getElementById("n-events").textContent = int(rows.length);
  document.getElementById("n-airports").textContent = new Set(rows.map(r => r.airport)).size;
  document.getElementById("n-median").textContent = med === null ? "\u2014" : Math.round(med) + " min";
  document.getElementById("n-since").textContent = new Date(firsts[0]).toISOString().slice(0, 10);

  bars("by-airport", tally(rows, "airport", 15), "name", "n", int);
  bars("by-reason", tally(rows, "reason", 12), "name", "n", int);
  bars("by-type", tally(rows.map(r => ({ ...r, type: TYPE[r.type] || r.type })), "type", 6), "name", "n", int);

  const hours = Array.from({ length: 24 }, (_, h) => ({ name: String(h).padStart(2, "0") + ":00", n: 0 }));
  rows.forEach(r => { hours[new Date(r.first_seen).getUTCHours()].n++; });
  bars("by-hour", hours, "name", "n", int);

  const latest = [...rows].sort((a, b) => Date.parse(b.last_seen) - Date.parse(a.last_seen)).slice(0, 25);
  table("recent", [
    { key: "airport", label: "Airport" },
    { key: "type", label: "Type", fmt: v => esc(TYPE[v] || v) },
    { key: "reason", label: "Reason" },
    { key: "first_seen", label: "First seen", fmt: v => esc(v.replace("T", " ").slice(0, 16) + "Z") },
    { key: "minutes", label: "Observed min", num: true, fmt: int }
  ], latest);
}

main();
