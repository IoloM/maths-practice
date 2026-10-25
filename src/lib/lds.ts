/**
 * The Edexcel large data set (Met Office daily weather, May–October 1987 and 2015), explored on
 * your own device from your own copy of Pearson's spreadsheet: nothing is uploaded or shared.
 * Parsing is forgiving about layout — each sheet (one station and year) needs a "Date" header row.
 */
import { mean, pmcc, sdPop } from '../engine/stats/distributions';

export type Cell = number | 'tr' | null;
export interface Sheet {
  station: string;
  year: number;
  /** YYYY-MM-DD for each row */
  dates: string[];
  /** variable → one value per row */
  cols: Record<string, Cell[]>;
}
export interface LdsData {
  sheets: Sheet[];
  variables: string[];
  file: string;
  loadedAt: number;
}

export const STATIONS = ['Camborne', 'Heathrow', 'Hurn', 'Leeming', 'Leuchars', 'Beijing', 'Jacksonville', 'Perth'];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** A spreadsheet cell as a value: numbers, "tr" (a trace), and n/a or blanks as missing. */
export function cellValue(v: unknown): Cell {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (s === 'tr') return 'tr';
  if (!s || s === 'n/a' || s === 'na') return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function dateOf(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return iso(v);
  if (typeof v === 'number' && v > 20000 && v < 60000) return iso(new Date(Date.UTC(1899, 11, 30) + v * 86_400_000));
  if (typeof v === 'string') {
    const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(v.trim());
    if (m) return `${m[3].length === 2 ? `19${m[3]}` : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return iso(d);
  }
  return null;
}

/** Tidy a column heading: one line, no doubled spaces. */
const heading = (h: unknown) => String(h ?? '').replace(/\s+/g, ' ').trim();

/** One sheet (rows of cells, as SheetJS gives them) → a station-year, or null if it isn't one. */
export function parseSheet(name: string, rows: unknown[][]): Sheet | null {
  const hi = rows.findIndex((r) => r.some((c) => /^date$/i.test(heading(c))));
  if (hi < 0) return null;
  const head = rows[hi].map(heading);
  const dateCol = head.findIndex((h) => /^date$/i.test(h));
  const above = rows.slice(0, hi).flat().map(heading).join(' ');
  const station = STATIONS.find((s) => new RegExp(s, 'i').test(name)) ?? STATIONS.find((s) => new RegExp(s, 'i').test(above)) ?? name.trim();
  const dates: string[] = [];
  const raw: unknown[][] = [];
  for (const r of rows.slice(hi + 1)) {
    const d = dateOf(r[dateCol]);
    if (!d) continue;
    dates.push(d);
    raw.push(r);
  }
  if (!dates.length) return null;
  const year = Number(/\b(19|20)\d{2}\b/.exec(name)?.[0]) || Number(dates[0].slice(0, 4));
  const cols: Record<string, Cell[]> = {};
  head.forEach((h, c) => {
    if (c === dateCol || !h) return;
    const vals = raw.map((r) => cellValue(r[c]));
    // keep columns that are mostly numbers (not descriptions such as compass points)
    const numeric = vals.filter((v) => v !== null).length;
    const words = raw.filter((r) => typeof r[c] === 'string' && cellValue(r[c]) === null && !/^\s*(n\/a|na)?\s*$/i.test(String(r[c]))).length;
    if (numeric > 0 && words < numeric) cols[h] = vals;
  });
  return { station, year, dates, cols };
}

export function fromSheets(file: string, sheets: { name: string; rows: unknown[][] }[]): LdsData | null {
  const out = sheets.map((s) => parseSheet(s.name, s.rows)).filter((s): s is Sheet => s !== null);
  if (!out.length) return null;
  const variables = [...new Set(out.flatMap((s) => Object.keys(s.cols)))];
  return { sheets: out, variables, file, loadedAt: Date.now() };
}

// ---------------------------------------------------------------- statistics, the Edexcel way
/** Values of a variable for some sheets: missing (n/a) left out; trace amounts as 0 unless told otherwise. */
export function values(sheets: Sheet[], variable: string, traceAsZero = true): { xs: number[]; missing: number; trace: number } {
  const xs: number[] = [];
  let missing = 0,
    trace = 0;
  for (const s of sheets)
    for (const v of s.cols[variable] ?? s.dates.map(() => null)) {
      if (v === null) missing++;
      else if (v === 'tr') {
        trace++;
        if (traceAsZero) xs.push(0);
      } else xs.push(v);
    }
  return { xs, missing, trace };
}

/** The value at a position for discrete data: n/4 etc. — a whole number averages it with the next, otherwise round up. */
function positional(sorted: number[], p: number): number {
  const k = sorted.length * p;
  return Number.isInteger(k) ? (sorted[k - 1] + sorted[k]) / 2 : sorted[Math.ceil(k) - 1];
}

export interface Summary {
  n: number;
  mean: number;
  sd: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** values beyond 1.5 × IQR from the quartiles */
  outliers: number[];
}

export function summary(xs: number[]): Summary | null {
  if (xs.length < 2) return null;
  const s = [...xs].sort((a, b) => a - b);
  const q1 = positional(s, 0.25),
    q3 = positional(s, 0.75);
  const iqr = q3 - q1;
  return { n: s.length, mean: mean(s), sd: sdPop(s), min: s[0], q1, median: positional(s, 0.5), q3, max: s[s.length - 1], outliers: s.filter((x) => x < q1 - 1.5 * iqr || x > q3 + 1.5 * iqr) };
}

/** Days where both variables have a value: PMCC and the least-squares line y = a + bx. */
export function relation(sheets: Sheet[], xv: string, yv: string, traceAsZero = true): { pts: [number, number][]; r: number; a: number; b: number } | null {
  const pts: [number, number][] = [];
  const num = (v: Cell) => (v === 'tr' ? (traceAsZero ? 0 : null) : v);
  for (const s of sheets) {
    const X = s.cols[xv] ?? [],
      Y = s.cols[yv] ?? [];
    s.dates.forEach((_, i) => {
      const x = num(X[i] ?? null),
        y = num(Y[i] ?? null);
      if (x !== null && y !== null) pts.push([x, y]);
    });
  }
  if (pts.length < 3) return null;
  const xs = pts.map((p) => p[0]),
    ys = pts.map((p) => p[1]);
  const mx = mean(xs),
    my = mean(ys);
  const sxx = xs.reduce((t, x) => t + (x - mx) ** 2, 0);
  if (!sxx || ys.every((y) => y === ys[0])) return null;
  const b = xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / sxx;
  return { pts, r: pmcc(xs, ys), a: my - b * mx, b };
}

/** A small seeded generator, so a sample can be shown again. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Row numbers (0-based) for a simple random sample of k days, or a systematic one (random start, every n/k-th day). */
export function sample(n: number, k: number, kind: 'random' | 'systematic', seed: number): number[] {
  const r = rng(seed);
  k = Math.max(1, Math.min(n, k));
  if (kind === 'systematic') {
    const step = Math.floor(n / k);
    const start = Math.floor(r() * step);
    return Array.from({ length: k }, (_, i) => start + i * step);
  }
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k).sort((a, b) => a - b);
}

// ---------------------------------------------------------------- kept on this device
const KEY = 'mp.lds.v1';
export function savedData(): LdsData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LdsData) : null;
  } catch {
    return null;
  }
}
export function saveData(d: LdsData | null): void {
  try {
    if (d) localStorage.setItem(KEY, JSON.stringify(d));
    else localStorage.removeItem(KEY);
  } catch {
    /* too big or private mode: it works until the page closes */
  }
}

/** Read a spreadsheet (xls, xlsx, ods or csv) with SheetJS, loaded only when needed. */
export async function readFile(file: File): Promise<LdsData | null> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  return fromSheets(
    file.name,
    wb.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: null }) })),
  );
}
