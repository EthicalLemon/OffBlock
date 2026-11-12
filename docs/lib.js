async function loadText(file) {
  try {
    const res = await fetch("data/" + file);
    return res.ok ? await res.text() : "";
  } catch (err) {
    return "";
  }
}

async function loadJson(name) {
  try {
    return JSON.parse(await loadText(name + ".json"));
  } catch (err) {
    return null;
  }
}

async function load(name) {
  const rows = await loadJson(name);
  return Array.isArray(rows) ? rows : [];
}

const int = n => Number(n).toLocaleString("en-US");
const pct = n => Number(n).toFixed(1) + "%";
const min = n => Number(n).toFixed(1) + " min";
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function showEmpty(el) {
  el.innerHTML = '<p class="empty">No data loaded</p>';
}

function bars(id, rows, label, value, fmt) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!rows.length) return showEmpty(el);
  const top = Math.max(...rows.map(r => Number(r[value])));
  el.innerHTML = rows.map(r => {
    const w = top > 0 ? (Number(r[value]) / top) * 100 : 0;
    return `<div class="row${Number(r[value]) === top ? " hi" : ""}"><span class="name">${esc(r[label])}</span><span class="track"><i style="width:${w}%"></i></span><span class="val">${fmt(r[value])}</span></div>`;
  }).join("");
}

function table(id, cols, rows) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!rows.length) return showEmpty(el);
  const head = cols.map(c => `<th class="${c.num ? "r" : ""}">${c.label}</th>`).join("");
  const draw = list => {
    const body = list.map(r => "<tr>" + cols.map(c => `<td class="${c.num ? "r" : ""}">${c.fmt ? c.fmt(r[c.key]) : esc(r[c.key])}</td>`).join("") + "</tr>").join("");
    el.innerHTML = `<div class="scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  };
  draw(rows);
  const box = document.getElementById(id + "-filter");
  if (box) {
    box.addEventListener("input", () => {
      const q = box.value.trim().toLowerCase();
      draw(q ? rows.filter(r => String(r[cols[0].key]).toLowerCase().includes(q)) : rows);
    });
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c !== "\r") cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  if (!head) return [];
  return body.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
