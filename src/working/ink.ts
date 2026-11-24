/**
 * How a handwritten stroke is drawn, shared by the drawing canvas, the record page (SVG) and the
 * PDF of Mr Astbury's booklet, so all three look the same.
 *
 * Ink is an even line (the same thickness all along, however hard you press), smoothed through the
 * points; shapes and straightened lines are straight between their points. A brush pen (`brush`)
 * is the one exception: its thickness follows the pressure, drawn with perfect-freehand.
 */
import { getStroke } from 'perfect-freehand';
import type { Stroke } from '../storage/types';

export type Cmd = ['M', number, number] | ['L', number, number] | ['Q', number, number, number, number] | ['Z'];

/** How see-through the highlighter is. */
export const HIGHLIGHT_ALPHA = 0.35;

const xy = (s: Stroke): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < s.points.length; i += 3) out.push([s.points[i], s.points[i + 1]]);
  return out;
};

/** Drawn as a filled outline (a brush pen) rather than an even line. */
export const isFilled = (s: Stroke) => !!s.brush && !s.poly && s.tool === 'pen';

/** The middle of the line: straight between the points of a shape, a smooth curve through handwriting. */
export function centreline(s: Stroke): Cmd[] {
  const p = xy(s);
  if (!p.length) return [];
  if (p.length === 1) return [['M', p[0][0], p[0][1]], ['L', p[0][0] + 0.01, p[0][1]]];
  const out: Cmd[] = [['M', p[0][0], p[0][1]]];
  if (s.poly || p.length === 2) {
    for (let i = 1; i < p.length; i++) out.push(['L', p[i][0], p[i][1]]);
    if (s.closed) out.push(['Z']);
    return out;
  }
  for (let i = 1; i < p.length - 1; i++) out.push(['Q', p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2]);
  out.push(['L', p[p.length - 1][0], p[p.length - 1][1]]);
  return out;
}

/** The arrowheads (open, two short lines) at the end, or both ends. */
export function arrowHeads(s: Stroke): Cmd[] {
  if (!s.arrow) return [];
  const p = xy(s);
  if (p.length < 2) return [];
  const len = Math.max(6, s.size * 4);
  const head = (pts: [number, number][]): Cmd[] => {
    const tip = pts[pts.length - 1];
    // a point far enough back along the line to give its direction at the tip
    let back = pts[pts.length - 2];
    for (let i = pts.length - 2; i >= 0; i--) {
      back = pts[i];
      if (Math.hypot(tip[0] - back[0], tip[1] - back[1]) >= len * 0.8) break;
    }
    const a = Math.atan2(back[1] - tip[1], back[0] - tip[0]);
    const w = (28 * Math.PI) / 180;
    return [
      ['M', tip[0] + len * Math.cos(a + w), tip[1] + len * Math.sin(a + w)],
      ['L', tip[0], tip[1]],
      ['L', tip[0] + len * Math.cos(a - w), tip[1] + len * Math.sin(a - w)],
    ];
  };
  const out = head(p);
  if (s.arrow === 2) out.push(...head([...p].reverse()));
  return out;
}

/** A brush pen's outline, from perfect-freehand (thicker where you pressed harder). */
export function brushOutline(s: Stroke, live = false): Cmd[] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i + 2 < s.points.length; i += 3) pts.push([s.points[i], s.points[i + 1], s.points[i + 2]]);
  const poly = getStroke(pts, {
    size: s.size * 1.25,
    thinning: 0.6,
    smoothing: 0.5,
    streamline: 0.4,
    simulatePressure: pts.every((p) => p[2] === 0.5),
    last: !live,
    start: { cap: true },
    end: { cap: true },
  });
  if (!poly.length) return [];
  const out: Cmd[] = [['M', poly[0][0], poly[0][1]]];
  for (let i = 1; i < poly.length; i++) {
    const [x0, y0] = poly[i - 1];
    const [x1, y1] = poly[i];
    out.push(['Q', x0, y0, (x0 + x1) / 2, (y0 + y1) / 2]);
  }
  out.push(['Z']);
  return out;
}

export function toPath2D(cmds: Cmd[]): Path2D {
  const p = new Path2D();
  for (const c of cmds) {
    if (c[0] === 'M') p.moveTo(c[1], c[2]);
    else if (c[0] === 'L') p.lineTo(c[1], c[2]);
    else if (c[0] === 'Q') p.quadraticCurveTo(c[1], c[2], c[3], c[4]);
    else p.closePath();
  }
  return p;
}

const f = (n: number) => (Math.round(n * 100) / 100).toString();
export function toSvg(cmds: Cmd[]): string {
  return cmds.map((c) => (c[0] === 'Z' ? 'Z' : `${c[0]}${c.slice(1).map((n) => f(n as number)).join(' ')}`)).join('');
}

/** Dashes for a dashed line, in the stroke's units. */
export const dashPattern = (s: Stroke) => [s.size * 3, s.size * 2.6];

/** Draw a stroke on a canvas (its colour already worked out, e.g. 'currentColor' → the text colour). */
export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, colour: string, live = false) {
  ctx.save();
  if (s.tool === 'highlighter') ctx.globalAlpha = HIGHLIGHT_ALPHA;
  if (isFilled(s)) {
    ctx.fillStyle = colour;
    ctx.fill(toPath2D(brushOutline(s, live)));
  } else {
    ctx.strokeStyle = colour;
    ctx.lineWidth = s.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (s.dash) ctx.setLineDash(dashPattern(s));
    ctx.stroke(toPath2D(centreline(s)));
    if (s.arrow) {
      ctx.setLineDash([]);
      ctx.stroke(toPath2D(arrowHeads(s)));
    }
  }
  ctx.restore();
}

/** A stroke as SVG/PDF path data: an outline to fill, or a line (and its arrowheads) to draw. */
export function strokeSvg(s: Stroke): { fill: string } | { line: string; heads: string } {
  if (isFilled(s)) return { fill: toSvg(brushOutline(s)) };
  return { line: toSvg(centreline(s)), heads: toSvg(arrowHeads(s)) };
}

/** Ink written as 'currentColor' (follows the theme on screen) is printed black on paper. */
export const paperColour = (c: string) => (c === 'currentColor' ? '#111111' : c);
