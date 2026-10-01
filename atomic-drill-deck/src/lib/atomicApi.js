// Data access for the Atomic Red Team library.
// Sources: raw.githubusercontent.com (CORS-enabled, no auth) + the repo's
// generated index.csv for a compact technique/test catalogue.

const RAW_BASE = "https://raw.githubusercontent.com/redcanaryco/atomic-red-team/master";
export const INDEX_CSV_URL = `${RAW_BASE}/atomics/Indexes/Indexes-CSV/index.csv`;
export const REPO_URL = "https://github.com/redcanaryco/atomic-red-team/tree/master/atomics";

const INDEX_CACHE_KEY = "art_index_v1";
const INDEX_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

// ---------------------------------------------------------------------------
// CSV parsing (handles quoted fields + escaped "" quotes)
// ---------------------------------------------------------------------------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ",") { row.push(field); field = ""; i++; continue; }
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    if (ch === "\r") { i++; continue; }
    field += ch; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function sortTechniqueId(a, b) {
  const pa = a.id.replace(/^T/, "").split(".").map(Number);
  const pb = b.id.replace(/^T/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? -1;
    const db = pb[i] ?? -1;
    if (da !== db) return da - db;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Technique index (list)
// ---------------------------------------------------------------------------
export async function fetchTechniques({ force = false } = {}) {
  if (!force) {
    try {
      const raw = localStorage.getItem(INDEX_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.ts && Date.now() - cached.ts < INDEX_TTL) return cached.data;
      }
    } catch { /* ignore */ }
  }

  const res = await fetch(INDEX_CSV_URL);
  if (!res.ok) throw new Error(`Could not load technique index (${res.status}).`);
  const text = await res.text();
  const rows = parseCSV(text);
  const header = rows[0] || [];
  const idx = {
    tactic: header.findIndex(h => /^tactic$/i.test(h.trim())),
    tid: header.findIndex(h => /technique\s*#/i.test(h)),
    tname: header.findIndex(h => /technique\s*name/i.test(h)),
    testNum: header.findIndex(h => /test\s*#/i.test(h)),
    testName: header.findIndex(h => /test\s*name/i.test(h)),
    guid: header.findIndex(h => /guid/i.test(h)),
    executor: header.findIndex(h => /executor/i.test(h)),
  };

  const byId = new Map();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    const tid = (row[idx.tid] ?? "").trim();
    if (!/^T\d/.test(tid)) continue;
    if (!byId.has(tid)) {
      byId.set(tid, { id: tid, name: (row[idx.tname] ?? "").trim(), tactics: new Set(), tests: [], _seenGuids: new Set() });
    }
    const t = byId.get(tid);
    const tac = (row[idx.tactic] ?? "").trim();
    if (tac) t.tactics.add(tac);
    const guid = (row[idx.guid] ?? "").trim();
    if (guid && t._seenGuids.has(guid)) continue;
    if (guid) t._seenGuids.add(guid);
    t.tests.push({
      num: parseInt((row[idx.testNum] ?? "0").trim(), 10),
      name: (row[idx.testName] ?? "").trim(),
      guid,
      executor: (row[idx.executor] ?? "").trim(),
    });
  }

  const data = [...byId.values()]
    .map(({ _seenGuids, ...t }) => ({ ...t, tactics: [...t.tactics], testCount: t.tests.length }))
    .sort(sortTechniqueId);

  try { localStorage.setItem(INDEX_CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch { /* quota */ }
  return data;
}

// ---------------------------------------------------------------------------
// Technique markdown (detail)
// ---------------------------------------------------------------------------
const mdCache = new Map();
export async function fetchTechniqueMarkdown(id) {
  if (mdCache.has(id)) return mdCache.get(id);
  const url = `${RAW_BASE}/atomics/${id}/${id}.md`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${id} (${res.status}).`);
  const md = await res.text();
  mdCache.set(id, md);
  return md;
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------
function decodeEntities(str = "") {
  return str
    .replace(/&#92;/g, "\\")
    .replace(/&#124;/g, "|")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractFirstCodeBlock(text) {
  const m = text.match(/```([\w+-]*)\r?\n([\s\S]*?)```/);
  if (!m) return null;
  return { language: (m[1] || "").trim(), code: m[2].replace(/\n+$/, "") };
}

function sectionAfter(body, headingRe) {
  const m = body.match(headingRe);
  if (!m) return null;
  const after = body.slice(m.index + m[0].length);
  const next = after.search(/^#{2,4}\s/m);
  return { heading: m[0], text: next === -1 ? after : after.slice(0, next) };
}

function extractDescription(body) {
  const stop = body.search(/\*\*Supported Platforms:\*\*|\*\*auto_generated_guid:\*\*|^####\s/m);
  const desc = stop === -1 ? body : body.slice(0, stop);
  return desc.trim();
}

function matchField(body, re) {
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

function parseInputsTable(body) {
  const sec = sectionAfter(body, /^####\s+Inputs.*$/m);
  if (!sec) return [];
  const rows = sec.text.split("\n").map(l => l.trim()).filter(l => l.startsWith("|"));
  if (rows.length < 2) return [];
  const dataRows = rows.slice(2);
  return dataRows
    .map(row => {
      const cells = row.replace(/^\|/, "").replace(/\|$/, "").split("|").map(c => decodeEntities(c.trim()));
      return { name: cells[0], description: cells[1], type: cells[2], default: cells[3] };
    })
    .filter(r => r.name);
}

function parseDependencies(body) {
  const sec = sectionAfter(body, /^####\s+Dependencies.*$/m);
  if (!sec) return [];
  const blocks = sec.text.split(/^#####\s/m).slice(1);
  return blocks.map(b => {
    const descStop = b.search(/^######\s/m);
    const description = (descStop === -1 ? b : b.slice(0, descStop))
      .replace(/^Description:\s*/, "").trim();
    const check = extractSubBlock(b, "Check Prereq Commands");
    const get = extractSubBlock(b, "Get Prereq Commands");
    return { description, check, get };
  }).filter(d => d.description || d.check || d.get);
}

function extractSubBlock(text, heading) {
  const re = new RegExp("^######\\s+" + heading + ".*$", "m");
  const m = text.match(re);
  if (!m) return null;
  const after = text.slice(m.index + m[0].length);
  const next = after.search(/^#{3,}\s/m);
  const section = next === -1 ? after : after.slice(0, next);
  return extractFirstCodeBlock(section);
}

export function parseCommandHeading(heading = "") {
  const execM = heading.match(/`([^`]+)`/);
  return {
    executor: execM?.[1] || null,
    elevation: /elevation required/i.test(heading),
    manual: /manual/i.test(heading),
    raw: heading,
  };
}

export function parseTechniqueMarkdown(md) {
  const titleMatch = md.match(/^#\s+(T[\d.]+)\s*-\s*(.+)$/m);
  const id = titleMatch?.[1];
  const title = titleMatch?.[2]?.trim();

  const descSection = md.split("## Description from ATT&CK")[1] || "";
  const attackDescription = (descSection.split(/## Atomic Tests/)[0] || "")
    .split("\n").filter(l => l.startsWith(">")).map(l => l.replace(/^>\s?/, "")).join("\n").trim();
  const sourceUrl = (descSection.match(/\[Source\]\(([^)]+)\)/) || [])[1];

  const parts = md.split(/^### Atomic Test #/m).slice(1);
  const tests = parts.map(part => {
    const head = part.match(/^(\d+):\s*(.+?)(\r?\n|$)/);
    const num = head ? parseInt(head[1], 10) : 0;
    const name = head ? head[2].trim() : "";
    const body = part.slice(head ? head[0].length : 0);

    const platformsRaw = matchField(body, /\*\*Supported Platforms:\*\*\s*(.+)/);
    const platforms = platformsRaw ? platformsRaw.split(",").map(s => s.trim()) : [];

    const inputs = parseInputsTable(body);

    const attackSec = sectionAfter(body, /^####\s+Attack Commands.*$/m);
    const attack = attackSec ? { ...parseCommandHeading(attackSec.heading), ...extractFirstCodeBlock(attackSec.text) || {} } : null;

    const cleanupSec = sectionAfter(body, /^####\s+Cleanup Commands.*$/m);
    const cleanup = cleanupSec ? extractFirstCodeBlock(cleanupSec.text) : null;

    const dependencies = parseDependencies(body);

    return { num, name, description: extractDescription(body), platforms, inputs, attack, cleanup, dependencies };
  });

  return { id, title, attackDescription, sourceUrl, tests };
}