/**
 * Tidying handwriting: recognising a line or shape you drew (hold the pen still at the end and it
 * snaps), straightening long lines, neatening wobbles, levelling a slanted line of writing, the
 * shape tools, the lasso, and a rubber that takes out only the part it touches. All in the
 * strokes' own units, with no knowledge of the screen.
 */
import type { Stroke } from '../storage/types';

export type P = [number, number];
type P3 = [number, number, number];

// ------------------------------------------------------------------ points

export const toP3 = (s: Stroke): P3[] => {
  const out: P3[] = [];
  for (let i = 0; i + 2 < s.points.length; i += 3) out.push([s.points[i], s.points[i + 1], s.points[i + 2]]);
  return out;
};
export const toP = (s: Stroke): P[] => toP3(s).map(([x, y]) => [x, y]);
const r1 = (n: number) => Math.round(n * 10) / 10;
const flat = (pts: (P | P3)[]) => pts.flatMap((p) => [r1(p[0]), r1(p[1]), p.length > 2 ? Math.round((p as P3)[2] * 100) / 100 : 0.5]);

export const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(p: P[]): number {
  let n = 0;
  for (let i = 1; i < p.length; i++) n += dist(p[i - 1], p[i]);
  return n;
}

export function distToSeg(p: P, a: P, b: P): number {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Evenly spaced points along a path (keeping the pressure along it). */
export function resample<T extends P | P3>(p: T[], spacing: number): T[] {
  if (p.length < 2 || spacing <= 0) return p.slice();
  const out: T[] = [p[0]];
  let carry = 0;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1],
      b = p[i];
    const d = dist(a as P, b as P);
    if (!d) continue;
    let t = spacing - carry;
    while (t <= d) {
      const k = t / d;
      out.push(a.map((v, j) => v + (b[j] - v) * k) as T);
      t += spacing;
    }
    carry = d - (t - spacing);
  }
  const last = p[p.length - 1];
  if (dist(out[out.length - 1] as P, last as P) > spacing * 0.3) out.push(last);
  else out[out.length - 1] = last;
  return out;
}

/** Ramer–Douglas–Peucker: the corners of a path, to within `eps`. */
export function rdp(p: P[], eps: number): P[] {
  if (p.length < 3) return p.slice();
  let best = 0,
    at = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = distToSeg(p[i], p[0], p[p.length - 1]);
    if (d > best) {
      best = d;
      at = i;
    }
  }
  if (best <= eps) return [p[0], p[p.length - 1]];
  return [...rdp(p.slice(0, at + 1), eps).slice(0, -1), ...rdp(p.slice(at), eps)];
}

function bbox(p: P[]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of p) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Snap the end of a line to level, upright or 45° when it's within a few degrees of it. */
export function snapAngle(a: P, b: P, within = 4): P {
  const d = dist(a, b);
  if (!d) return b;
  const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const near = Math.round(ang / 45) * 45;
  if (Math.abs(ang - near) > (near % 90 === 0 ? within : within * 0.75)) return b;
  const r = (near * Math.PI) / 180;
  return [a[0] + d * Math.cos(r), a[1] + d * Math.sin(r)];
}

// ------------------------------------------------------------------ shapes

import type { ShapeKind } from './tools';
export type { ShapeKind } from './tools';
export interface Look {
  tool: Stroke['tool'];
  color: string;
  size: number;
  dash?: boolean;
}

const poly = (look: Look, pts: P[], extra: Partial<Stroke> = {}): Stroke => ({ tool: look.tool, color: look.color, size: look.size, ...(look.dash ? { dash: true } : {}), points: flat(pts), poly: true, ...extra });

function ellipsePts(cx: number, cy: number, rx: number, ry: number): P[] {
  const n = 72;
  return Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((2 * Math.PI * i) / n), cy + ry * Math.sin((2 * Math.PI * i) / n)] as P);
}

/** A shape dragged out from `a` to `b` with a shape tool (axes are two strokes). */
export function makeShape(kind: ShapeKind, a: P, b: P, look: Look): Stroke[] {
  const x0 = Math.min(a[0], b[0]),
    x1 = Math.max(a[0], b[0]),
    y0 = Math.min(a[1], b[1]),
    y1 = Math.max(a[1], b[1]);
  switch (kind) {
    case 'line':
      return [poly(look, [a, snapAngle(a, b)])];
    case 'arrow':
      return [poly(look, [a, snapAngle(a, b)], { arrow: 1 })];
    case 'rect':
      return [poly(look, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { closed: true })];
    case 'ellipse': {
      let rx = (x1 - x0) / 2,
        ry = (y1 - y0) / 2;
      // nearly round: a circle
      if (Math.abs(rx - ry) < 0.1 * Math.max(rx, ry)) rx = ry = Math.max(rx, ry);
      return [poly(look, ellipsePts((x0 + x1) / 2, (y0 + y1) / 2, rx, ry), { closed: true })];
    }
    case 'triangle':
      return [poly(look, [[(x0 + x1) / 2, y0], [x1, y1], [x0, y1]], { closed: true })];
    case 'axes': {
      // pressed at the origin, dragged out: an x axis and a y axis through it, arrows at the positive ends
      const dx = Math.abs(b[0] - a[0]),
        dy = Math.abs(b[1] - a[1]);
      return [poly({ ...look, dash: false }, [[a[0] - dx, a[1]], [a[0] + dx, a[1]]], { arrow: 1 }), poly({ ...look, dash: false }, [[a[0], a[1] + dy], [a[0], a[1] - dy]], { arrow: 1 })];
    }
    case 'axes1': {
      // pressed at the origin, dragged up and right: just the positive axes
      const dx = Math.max(Math.abs(b[0] - a[0]), 1),
        dy = Math.max(Math.abs(b[1] - a[1]), 1);
      return [poly({ ...look, dash: false }, [a, [a[0] + dx, a[1]]], { arrow: 1 }), poly({ ...look, dash: false }, [a, [a[0], a[1] - dy]], { arrow: 1 })];
    }
  }
}

/** Remove corners that are really straight on (the start of a loop drawn mid-side, say). */
function dropFlatCorners(v: P[], maxTurn = 25): P[] {
  let out = v.slice();
  for (let changed = true; changed && out.length > 3; ) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      const a = out[(i - 1 + out.length) % out.length],
        b = out[i],
        c = out[(i + 1) % out.length];
      const t1 = Math.atan2(b[1] - a[1], b[0] - a[0]),
        t2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
      let turn = Math.abs(((t2 - t1) * 180) / Math.PI) % 360;
      if (turn > 180) turn = 360 - turn;
      if (turn < maxTurn || dist(a, b) < 1e-6) {
        out = out.filter((_, j) => j !== i);
        changed = true;
        break;
      }
    }
  }
  return out;
}

function polygonError(p: P[], v: P[], closed: boolean): number {
  let sum = 0;
  for (const q of p) {
    let best = Infinity;
    for (let i = 0; i < v.length - (closed ? 0 : 1); i++) best = Math.min(best, distToSeg(q, v[i], v[(i + 1) % v.length]));
    sum += best;
  }
  return sum / p.length;
}

function interiorAngles(v: P[]): number[] {
  return v.map((b, i) => {
    const a = v[(i - 1 + v.length) % v.length],
      c = v[(i + 1) % v.length];
    const u = [a[0] - b[0], a[1] - b[1]],
      w = [c[0] - b[0], c[1] - b[1]];
    return (Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]) || 1)))) * 180) / Math.PI;
  });
}

/**
 * What a freehand stroke was meant to be: a straight line, a circle or ellipse, a triangle, a
 * rectangle (or another polygon), or a few straight lines joined at corners. Null if none fits.
 */
export function recognise(s: Stroke): Stroke | null {
  const raw = toP(s);
  if (raw.length < 2) return null;
  const box = bbox(raw);
  const diag = Math.hypot(box.w, box.h);
  if (diag < 4) return null;
  const look: Look = { tool: s.tool, color: s.color, size: s.size, dash: s.dash };
  const a = raw[0],
    b = raw[raw.length - 1];
  const len = pathLength(raw);
  const chord = dist(a, b);
  // a straight line
  if (chord > 0 && len < chord * 1.15 && Math.max(...raw.map((q) => distToSeg(q, a, b))) < Math.max(chord * 0.07, s.size)) return poly(look, [a, snapAngle(a, b)], s.arrow ? { arrow: s.arrow } : {});
  const pts = resample(raw, diag / 64);
  const closed = dist(a, b) < 0.22 * diag && len > 1.6 * diag;
  if (closed) {
    // the corners of the loop
    const far = pts.reduce((best, q, i) => (dist(q, a) > dist(pts[best], a) ? i : best), 0);
    const v = dropFlatCorners([...rdp(pts.slice(0, far + 1), 0.07 * diag).slice(0, -1), ...rdp(pts.slice(far), 0.07 * diag).slice(0, -1)]);
    const pErr = polygonError(pts, v, true) / diag;
    if ((v.length === 3 || v.length === 4) && pErr < 0.035) {
      if (v.length === 4) {
        const right = interiorAngles(v).every((ang) => Math.abs(ang - 90) < 18);
        const level = v.every((q, i) => {
          const n = v[(i + 1) % 4];
          const ang = Math.abs((Math.atan2(n[1] - q[1], n[0] - q[0]) * 180) / Math.PI) % 90;
          return Math.min(ang, 90 - ang) < 12;
        });
        if (right && level) {
          const vb = bbox(v);
          return poly(look, [[vb.x0, vb.y0], [vb.x1, vb.y0], [vb.x1, vb.y1], [vb.x0, vb.y1]], { closed: true });
        }
      }
      return poly(look, v, { closed: true });
    }
    // an ellipse (or circle) in the box it fills
    const cx = (box.x0 + box.x1) / 2,
      cy = (box.y0 + box.y1) / 2;
    let rx = box.w / 2,
      ry = box.h / 2;
    if (rx > 0 && ry > 0) {
      const eErr = pts.reduce((t, q) => t + Math.abs(Math.hypot((q[0] - cx) / rx, (q[1] - cy) / ry) - 1), 0) / pts.length;
      if (eErr < 0.09) {
        if (Math.abs(rx - ry) < 0.12 * Math.max(rx, ry)) rx = ry = (rx + ry) / 2;
        return poly(look, ellipsePts(cx, cy, rx, ry), { closed: true });
      }
    }
    if (v.length >= 5 && v.length <= 6 && pErr < 0.03) return poly(look, v, { closed: true });
    return null;
  }
  // a few straight lines joined at corners (an L, a V, a zigzag)
  const v = rdp(pts, 0.05 * diag);
  if (v.length >= 3 && v.length <= 5 && polygonError(pts, v, false) / diag < 0.025) return poly(look, v, s.arrow ? { arrow: s.arrow } : {});
  return null;
}

/** A long stroke that is nearly straight, made straight (a fraction line, an underline, an axis); else null. */
export function straightenIfLine(s: Stroke, minLength: number): Stroke | null {
  if (s.poly) return null;
  const raw = toP(s);
  if (raw.length < 2) return null;
  const a = raw[0],
    b = raw[raw.length - 1];
  const chord = dist(a, b);
  if (chord < minLength) return null;
  if (pathLength(raw) > chord * 1.06) return null;
  if (Math.max(...raw.map((q) => distToSeg(q, a, b))) > Math.max(chord * 0.035, s.size * 0.8)) return null;
  return { ...s, brush: undefined, poly: true, points: flat([a, snapAngle(a, b, 3)]) };
}

/** Smooth out the wobble in handwriting, keeping its shape (and the pen's pressure). */
export function neaten(s: Stroke): Stroke {
  if (s.poly) return s;
  const p = toP3(s);
  if (p.length < 4) return s;
  let q = resample(p, Math.max(0.7, s.size * 0.5));
  if (q.length < 5) return s;
  const kernel = [1, 3, 4, 3, 1];
  for (let pass = 0; pass < 3; pass++) {
    q = q.map((pt, i) => {
      if (i === 0 || i === q.length - 1) return pt;
      const acc: P3 = [0, 0, 0];
      let w = 0;
      kernel.forEach((k, j) => {
        const n = q[Math.max(0, Math.min(q.length - 1, i + j - 2))];
        acc[0] += n[0] * k;
        acc[1] += n[1] * k;
        acc[2] += n[2] * k;
        w += k;
      });
      return [acc[0] / w, acc[1] / w, acc[2] / w];
    });
  }
  // fewer points where it's straight
  const keep = rdp(
    q.map(([x, y]) => [x, y] as P),
    s.size * 0.08,
  );
  const kept = new Set(keep.map((k) => `${k[0]},${k[1]}`));
  const out = q.filter(([x, y], i) => i === 0 || i === q.length - 1 || kept.has(`${x},${y}`) || i % 4 === 0);
  return { ...s, points: flat(out) };
}

// ------------------------------------------------------------------ moving, sizing, levelling

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function strokesBox(strokes: Stroke[]): Box | null {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const s of strokes)
    for (let i = 0; i + 1 < s.points.length; i += 3) {
      const h = s.size / 2 + (s.arrow ? s.size * 3 : 0);
      x0 = Math.min(x0, s.points[i] - h);
      x1 = Math.max(x1, s.points[i] + h);
      y0 = Math.min(y0, s.points[i + 1] - h);
      y1 = Math.max(y1, s.points[i + 1] + h);
    }
  return Number.isFinite(x0) ? { x0, y0, x1, y1 } : null;
}

export function mapStroke(s: Stroke, f: (p: P) => P): Stroke {
  const pts = s.points.slice();
  for (let i = 0; i + 1 < pts.length; i += 3) {
    const [x, y] = f([pts[i], pts[i + 1]]);
    pts[i] = r1(x);
    pts[i + 1] = r1(y);
  }
  return { ...s, points: pts };
}

export const moveStroke = (s: Stroke, dx: number, dy: number) => mapStroke(s, ([x, y]) => [x + dx, y + dy]);
export const scaleStroke = (s: Stroke, ax: number, ay: number, k: number) => mapStroke(s, ([x, y]) => [ax + (x - ax) * k, ay + (y - ay) * k]);

/** Turn a slanted line of writing level: the angle its points run at, undone about its middle. */
export function level(strokes: Stroke[]): Stroke[] {
  const pts = strokes.flatMap((s) => toP(s));
  if (pts.length < 6) return strokes;
  const mx = pts.reduce((t, p) => t + p[0], 0) / pts.length,
    my = pts.reduce((t, p) => t + p[1], 0) / pts.length;
  let sxx = 0,
    sxy = 0,
    syy = 0;
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2;
    sxy += (x - mx) * (y - my);
    syy += (y - my) ** 2;
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  if (Math.abs(ang) > (40 * Math.PI) / 180 || Math.abs(ang) < (0.5 * Math.PI) / 180) return strokes;
  const c = Math.cos(-ang),
    sn = Math.sin(-ang);
  return strokes.map((s) => mapStroke(s, ([x, y]) => [mx + (x - mx) * c - (y - my) * sn, my + (x - mx) * sn + (y - my) * c]));
}

// ------------------------------------------------------------------ the lasso and the rubber

export function insidePolygon(p: P, poly: P[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi || 1e-9) + xi) inside = !inside;
  }
  return inside;
}

/** The strokes (by index) mostly inside a lasso loop. */
export function lassoSelect(strokes: Stroke[], loop: P[]): number[] {
  if (loop.length < 3) return [];
  const out: number[] = [];
  strokes.forEach((s, i) => {
    const pts = s.poly ? resample(toP(s), 4) : toP(s);
    if (!pts.length) return;
    const n = pts.filter((p) => insidePolygon(p, loop)).length;
    if (n / pts.length >= 0.6) out.push(i);
  });
  return out;
}

export function strokeHits(s: Stroke, x: number, y: number, r: number): boolean {
  const p = toP(s);
  const rr = r + s.size / 2;
  if (p.length === 1) return dist(p[0], [x, y]) < rr;
  for (let i = 1; i < p.length; i++) if (distToSeg([x, y], p[i - 1], p[i]) < rr) return true;
  if (s.closed && p.length > 2 && distToSeg([x, y], p[p.length - 1], p[0]) < rr) return true;
  return false;
}

/**
 * The rubber that takes out only what it touches: strokes under it are cut, and the pieces either
 * side kept. Returns the same array when nothing was touched.
 */
export function partialErase(strokes: Stroke[], x: number, y: number, r: number): Stroke[] {
  let changed = false;
  const out: Stroke[] = [];
  for (const s of strokes) {
    if (!strokeHits(s, x, y, r)) {
      out.push(s);
      continue;
    }
    changed = true;
    const rr = r + s.size / 2;
    let pts = toP3(s);
    if (s.closed && pts.length > 1) pts = [...pts, pts[0]];
    pts = resample(pts, Math.max(0.5, rr / 3));
    const runs: { pts: P3[]; first: boolean; last: boolean }[] = [];
    let cur: P3[] = [];
    let startIdx = 0;
    pts.forEach((p, i) => {
      if (Math.hypot(p[0] - x, p[1] - y) < rr) {
        if (cur.length) runs.push({ pts: cur, first: startIdx === 0, last: false });
        cur = [];
      } else {
        if (!cur.length) startIdx = i;
        cur.push(p);
      }
    });
    if (cur.length) runs.push({ pts: cur, first: startIdx === 0, last: true });
    for (const run of runs) {
      if (run.pts.length < 2 && !(run.pts.length === 1 && s.points.length === 3)) continue;
      if (pathLength(run.pts.map(([px, py]) => [px, py] as P)) < s.size * 0.5) continue;
      const piece: Stroke = { ...s, points: flat(run.pts), closed: undefined, arrow: undefined };
      // an arrowhead stays with the piece that still has its tip
      if (s.arrow && run.last) piece.arrow = 1;
      else if (s.arrow === 2 && run.first) {
        piece.points = flat([...run.pts].reverse());
        piece.arrow = 1;
      }
      if (s.arrow === 2 && run.first && run.last) {
        piece.points = flat(run.pts);
        piece.arrow = 2;
      }
      out.push(piece);
    }
  }
  return changed ? out : strokes;
}
