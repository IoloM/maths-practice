/**
 * SVG diagram kit. Diagrams are drawn from the same parameters as the question.
 * Styling comes from CSS classes (dg-*) so they follow light/dark themes.
 */

export interface Curve {
  f?: (x: number) => number;
  /** parametric alternative */
  para?: { x: (t: number) => number; y: (t: number) => number; t: [number, number] };
  from?: number;
  to?: number;
  label?: string;
  /** x at which to place the label (or t for parametric) */
  labelAt?: number;
  labelDx?: number;
  labelDy?: number;
  dash?: boolean;
  cls?: 'dg-curve' | 'dg-curve2' | 'dg-line';
}

export interface Shade {
  upper: (x: number) => number;
  lower?: (x: number) => number;
  from: number;
  to: number;
  label?: string;
  labelAt?: [number, number];
}

export interface PointMark {
  x: number;
  y: number;
  label?: string;
  dx?: number;
  dy?: number;
  dot?: boolean;
}

export interface PlotSpec {
  x: [number, number];
  y: [number, number];
  w?: number;
  h?: number;
  curves?: Curve[];
  shade?: Shade[];
  points?: PointMark[];
  vlines?: { x: number; label?: string; dash?: boolean; from?: number; to?: number }[];
  hlines?: { y: number; label?: string; dash?: boolean }[];
  xTicks?: { v: number; label: string }[];
  yTicks?: { v: number; label: string }[];
  axes?: { x?: string; y?: string };
  origin?: boolean;
}

const f2 = (n: number) => (Math.round(n * 10) / 10).toString();

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
/** "x^2 - 3x" → "x² − 3x" for SVG labels. */
export function uni(s: string): string {
  return s.replace(/\^(-?\d+)/g, (_, d: string) => [...d].map((c) => SUP[c] ?? c).join('')).replace(/-/g, '−');
}

export function plot(p: PlotSpec): string {
  const W = p.w ?? 360,
    H = p.h ?? 260,
    pad = 26;
  const [x0, x1] = p.x,
    [y0, y1] = p.y;
  const X = (x: number) => pad + ((x - x0) / (x1 - x0)) * (W - 2 * pad);
  const Y = (y: number) => H - pad - ((y - y0) / (y1 - y0)) * (H - 2 * pad);
  const inY = (y: number) => y >= y0 - (y1 - y0) * 0.02 && y <= y1 + (y1 - y0) * 0.02;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="dg" role="img">`);
  out.push(
    `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-arrow"/></marker></defs>`,
  );
  // shading first
  for (const s of p.shade ?? []) {
    const n = 120;
    const top: string[] = [],
      bot: string[] = [];
    for (let i = 0; i <= n; i++) {
      const x = s.from + ((s.to - s.from) * i) / n;
      const u = clampY(s.upper(x), y0, y1),
        l = clampY(s.lower ? s.lower(x) : 0, y0, y1);
      top.push(`${f2(X(x))},${f2(Y(u))}`);
      bot.unshift(`${f2(X(x))},${f2(Y(l))}`);
    }
    out.push(`<polygon class="dg-shade" points="${[...top, ...bot].join(' ')}"/>`);
    if (s.label) {
      const [lx, ly] = s.labelAt ?? [(s.from + s.to) / 2, ((s.upper((s.from + s.to) / 2) + (s.lower ? s.lower((s.from + s.to) / 2) : 0)) / 2)];
      out.push(`<text class="dg-label dg-region" x="${f2(X(lx))}" y="${f2(Y(ly) + 5)}" text-anchor="middle">${esc(s.label)}</text>`);
    }
  }
  // axes
  const ax = Math.min(Math.max(0, x0), x1),
    ay = Math.min(Math.max(0, y0), y1);
  out.push(`<line class="dg-axis" x1="${f2(X(x0))}" y1="${f2(Y(ay))}" x2="${f2(X(x1) + 8)}" y2="${f2(Y(ay))}" marker-end="url(#ah)"/>`);
  out.push(`<line class="dg-axis" x1="${f2(X(ax))}" y1="${f2(Y(y0))}" x2="${f2(X(ax))}" y2="${f2(Y(y1) - 8)}" marker-end="url(#ah)"/>`);
  out.push(`<text class="dg-label dg-var" x="${f2(X(x1) + 4)}" y="${f2(Y(ay) + 16)}">${esc(p.axes?.x ?? 'x')}</text>`);
  out.push(`<text class="dg-label dg-var" x="${f2(X(ax) + 6)}" y="${f2(Y(y1) - 4)}">${esc(p.axes?.y ?? 'y')}</text>`);
  if (p.origin !== false && x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0)
    out.push(`<text class="dg-label" x="${f2(X(0) - 12)}" y="${f2(Y(0) + 14)}">O</text>`);
  for (const t of p.xTicks ?? []) {
    out.push(`<line class="dg-tick" x1="${f2(X(t.v))}" y1="${f2(Y(ay) - 3)}" x2="${f2(X(t.v))}" y2="${f2(Y(ay) + 3)}"/>`);
    out.push(`<text class="dg-label dg-small" x="${f2(X(t.v))}" y="${f2(Y(ay) + 15)}" text-anchor="middle">${esc(uni(t.label))}</text>`);
  }
  for (const t of p.yTicks ?? []) {
    out.push(`<line class="dg-tick" x1="${f2(X(ax) - 3)}" y1="${f2(Y(t.v))}" x2="${f2(X(ax) + 3)}" y2="${f2(Y(t.v))}"/>`);
    out.push(`<text class="dg-label dg-small" x="${f2(X(ax) - 6)}" y="${f2(Y(t.v) + 4)}" text-anchor="end">${esc(uni(t.label))}</text>`);
  }
  for (const v of p.vlines ?? []) {
    const a = v.from ?? y0,
      b = v.to ?? y1;
    out.push(`<line class="dg-line${v.dash ? ' dg-dash' : ''}" x1="${f2(X(v.x))}" y1="${f2(Y(a))}" x2="${f2(X(v.x))}" y2="${f2(Y(b))}"/>`);
    if (v.label) out.push(`<text class="dg-label" x="${f2(X(v.x) + 4)}" y="${f2(Y(b) + 12)}">${esc(uni(v.label))}</text>`);
  }
  for (const h of p.hlines ?? []) {
    out.push(`<line class="dg-line${h.dash ? ' dg-dash' : ''}" x1="${f2(X(x0))}" y1="${f2(Y(h.y))}" x2="${f2(X(x1))}" y2="${f2(Y(h.y))}"/>`);
    if (h.label) out.push(`<text class="dg-label" x="${f2(X(x1) - 4)}" y="${f2(Y(h.y) - 5)}" text-anchor="end">${esc(uni(h.label))}</text>`);
  }
  // curves
  for (const c of p.curves ?? []) {
    const segs: string[][] = [[]];
    const n = 240;
    if (c.para) {
      const [t0, t1] = c.para.t;
      for (let i = 0; i <= n; i++) {
        const t = t0 + ((t1 - t0) * i) / n;
        const x = c.para.x(t),
          y = c.para.y(t);
        if (Number.isFinite(x) && Number.isFinite(y) && inY(y) && x >= x0 && x <= x1) segs[segs.length - 1].push(`${f2(X(x))},${f2(Y(y))}`);
        else if (segs[segs.length - 1].length) segs.push([]);
      }
    } else if (c.f) {
      const a = c.from ?? x0,
        b = c.to ?? x1;
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        const y = c.f(x);
        if (Number.isFinite(y) && inY(y)) segs[segs.length - 1].push(`${f2(X(x))},${f2(Y(y))}`);
        else if (segs[segs.length - 1].length) segs.push([]);
      }
    }
    for (const s of segs) if (s.length > 1) out.push(`<polyline class="${c.cls ?? 'dg-curve'}${c.dash ? ' dg-dash' : ''}" points="${s.join(' ')}"/>`);
    if (c.label) {
      let lx: number, ly: number;
      if (c.para) {
        const t = c.labelAt ?? (c.para.t[0] + c.para.t[1]) / 2;
        lx = c.para.x(t);
        ly = c.para.y(t);
      } else {
        lx = c.labelAt ?? (c.to ?? x1) - (x1 - x0) * 0.08;
        ly = c.f ? c.f(lx) : 0;
      }
      if (Number.isFinite(ly)) {
        ly = clampY(ly, y0, y1);
        out.push(`<text class="dg-label" x="${f2(X(lx) + (c.labelDx ?? 6))}" y="${f2(Y(ly) + (c.labelDy ?? -6))}">${esc(uni(c.label))}</text>`);
      }
    }
  }
  for (const pt of p.points ?? []) {
    if (pt.dot !== false) out.push(`<circle class="dg-point" cx="${f2(X(pt.x))}" cy="${f2(Y(pt.y))}" r="2.6"/>`);
    if (pt.label) out.push(`<text class="dg-label" x="${f2(X(pt.x) + (pt.dx ?? 6))}" y="${f2(Y(pt.y) + (pt.dy ?? -6))}">${esc(uni(pt.label))}</text>`);
  }
  out.push('</svg>');
  return out.join('');
}

function clampY(y: number, y0: number, y1: number): number {
  if (!Number.isFinite(y)) return y > 0 ? y1 : y0;
  return Math.max(y0, Math.min(y1, y));
}

/** Nice axis range around values with padding. */
export function range(vals: number[], padFrac = 0.15, includeZero = true): [number, number] {
  const vs = vals.filter(Number.isFinite);
  let lo = Math.min(...vs, ...(includeZero ? [0] : [])),
    hi = Math.max(...vs, ...(includeZero ? [0] : []));
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const d = hi - lo;
  return [lo - d * padFrac, hi + d * padFrac];
}

/** Sample y-range of a function on [a, b]. */
export function yRangeOf(fs: ((x: number) => number)[], a: number, b: number, pad = 0.15): [number, number] {
  const ys: number[] = [];
  for (const f of fs)
    for (let i = 0; i <= 200; i++) {
      const y = f(a + ((b - a) * i) / 200);
      if (Number.isFinite(y)) ys.push(y);
    }
  return range(ys, pad);
}
