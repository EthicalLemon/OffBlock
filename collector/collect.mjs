import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FAA_URL = "https://nasstatus.faa.gov/api/airport-status-information";
const METAR_URL = "https://aviationweather.gov/api/data/metar";
const HUBS = ["ATL", "DFW", "DEN", "ORD", "LAX", "JFK", "LAS", "MCO", "MIA", "CLT", "SEA", "PHX", "EWR", "SFO", "IAH", "BOS", "FLL", "MSP", "LGA", "DTW", "PHL", "SLC", "DCA", "SAN", "BWI", "TPA", "AUS", "IAD", "MDW", "BNA"];
const OVERSEAS = { HNL: "PHNL", OGG: "PHOG", ANC: "PANC", SJU: "TJSJ" };
const BACK = Object.fromEntries(Object.entries(OVERSEAS).map(([k, v]) => [v, k]));
const CSV_HEAD = "airport,type,reason,first_seen,last_seen,observed_minutes";

const icao = code => OVERSEAS[code] || (/^[A-Z]{3}$/.test(code) ? "K" + code : null);
const iata = id => BACK[id] || id.replace(/^K/, "");

const tag = (s, name) => {
  const m = s.match(new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">"));
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
};

const kindOf = name => {
  const n = name.toLowerCase();
  if (n.includes("ground stop")) return "GROUND_STOP";
  if (n.includes("ground delay")) return "GROUND_DELAY";
  if (n.includes("closure")) return "AIRPORT_CLOSURE";
  if (n.includes("arrival") || n.includes("departure")) return "ARRIVAL_DEPARTURE_DELAY";
  return null;
};

function describe(type, s) {
  const end = tag(s, "End_Time");
  const avg = tag(s, "Avg");
  const max = tag(s, "Max");
  const min = tag(s, "Min");
  const trend = tag(s, "Trend");
  const reopen = tag(s, "Reopen");
  const dir = (s.match(/Type="([^"]+)"/) || [])[1];
  if (type === "GROUND_STOP") return end ? "until " + end : "";
  if (type === "GROUND_DELAY") return [avg && "avg " + avg, max && "max " + max].filter(Boolean).join(", ");
  if (type === "AIRPORT_CLOSURE") return reopen ? "reopens " + reopen : "";
  return [dir, min && max ? min + " to " + max : min || max, trend].filter(Boolean).join(", ");
}

export function parseFaa(xml) {
  if (!xml.includes("AIRPORT_STATUS_INFORMATION")) throw new Error("unexpected FAA response");
  const events = [];
  for (const block of xml.matchAll(/<Delay_type>([\s\S]*?)<\/Delay_type>/g)) {
    const type = kindOf(tag(block[1], "Name") || "");
    if (!type) continue;
    for (const part of block[1].split("<ARPT>").slice(1)) {
      const [airport, ...tail] = part.split("</ARPT>");
      const rest = tail.join("");
      if (!airport.trim()) continue;
      events.push({ airport: airport.trim(), type, reason: tag(rest, "Reason"), detail: describe(type, rest) });
    }
  }
  return { updated: tag(xml, "Update_Time"), events };
}

const ceilingOf = clouds => {
  const bases = (clouds || []).filter(c => ["BKN", "OVC", "VV"].includes(c.cover) && c.base != null).map(c => c.base);
  return bases.length ? Math.min(...bases) : null;
};

async function getText(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "offblock-collector" }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(url + " returned " + res.status);
      return await res.text();
    } catch (err) {
      last = err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw last;
}

async function fetchWeather(codes) {
  const ids = [...new Set(codes.map(icao).filter(Boolean))];
  const list = JSON.parse(await getText(METAR_URL + "?format=json&ids=" + ids.join(",")));
  const out = {};
  for (const m of list) {
    out[iata(m.icaoId)] = {
      cat: m.fltCat || null,
      wind: m.wspd ?? null,
      gust: m.wgst ?? null,
      vis: m.visib ?? null,
      ceiling: ceilingOf(m.clouds),
      wx: m.wxString || null,
      obs: m.obsTime ?? null
    };
  }
  return out;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    return null;
  }
}

const quote = v => (/[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v);

export async function run(options = {}) {
  const root = options.root || process.env.OFFBLOCK_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const now = options.now || new Date().toISOString();
  const dir = path.join(root, "docs", "data");
  const livePath = path.join(dir, "live.json");
  const ledgerPath = path.join(dir, "events.csv");
  await mkdir(dir, { recursive: true });

  let faa;
  try {
    faa = parseFaa(await getText(FAA_URL));
  } catch (err) {
    console.error("FAA feed skipped:", err.message);
    return;
  }

  const prev = await readJson(livePath);
  const before = new Map(((prev && prev.events) || []).map(e => [e.key, e]));
  const current = new Map();
  for (const e of faa.events) {
    const key = e.airport + "|" + e.type;
    if (current.has(key)) continue;
    const old = before.get(key);
    current.set(key, { ...e, key, first_seen: old ? old.first_seen : now, last_seen: now });
  }

  const closed = [...before.values()].filter(e => !current.has(e.key));
  if (closed.length) {
    let text = "";
    try {
      await readFile(ledgerPath, "utf8");
    } catch (err) {
      text = CSV_HEAD + "\n";
    }
    text += closed.map(e => {
      const minutes = Math.round((Date.parse(e.last_seen) - Date.parse(e.first_seen)) / 60000);
      return [e.airport, e.type, quote(e.reason || ""), e.first_seen, e.last_seen, minutes].join(",");
    }).join("\n") + "\n";
    await appendFile(ledgerPath, text);
  }

  let weather = {};
  try {
    weather = await fetchWeather([...HUBS, ...[...current.values()].map(e => e.airport)]);
  } catch (err) {
    console.error("Weather skipped:", err.message);
  }

  const events = [...current.values()];
  await writeFile(livePath, JSON.stringify({ updated: now, source_updated: faa.updated, hubs: HUBS, events, weather }, null, 1) + "\n");
  console.log(`events ${events.length}, closed ${closed.length}, weather stations ${Object.keys(weather).length}`);
  if (!events.length && !faa.updated) console.error("Warning: feed parsed but no update time found");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
