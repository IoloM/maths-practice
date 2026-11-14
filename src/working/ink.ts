/**
 * The shape of a handwritten stroke (perfect-freehand), shared by the drawing canvas and the PDF of
 * Mr Astbury's booklet with your working on it, so the PDF looks like what you wrote.
 */
import { getStroke } from 'perfect-freehand';
import type { Stroke } from '../storage/types';

/** The outline of a stroke as a polygon (in the stroke's own units). */
export function strokeOutline(s: Stroke, live = false): number[][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < s.points.length; i += 3) pts.push([s.points[i], s.points[i + 1], s.points[i + 2]]);
  const hl = s.tool === 'highlighter';
  return getStroke(pts, {
    size: s.size,
    thinning: hl ? 0 : 0.55,
    smoothing: 0.5,
    streamline: 0.45,
    simulatePressure: pts.every((p) => p[2] === 0.5),
    last: !live,
    start: { cap: true },
    end: { cap: true },
  });
}

/** The outline as a closed path of smoothed curves: the same commands for a canvas and for SVG/PDF. */
function walk(poly: number[][], move: (x: number, y: number) => void, quad: (cx: number, cy: number, x: number, y: number) => void) {
  if (!poly.length) return;
  move(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) {
    const [x0, y0] = poly[i - 1];
    const [x1, y1] = poly[i];
    quad(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
}

export function strokePath2D(s: Stroke, live = false): Path2D {
  const path = new Path2D();
  walk(
    strokeOutline(s, live),
    (x, y) => path.moveTo(x, y),
    (cx, cy, x, y) => path.quadraticCurveTo(cx, cy, x, y),
  );
  path.closePath();
  return path;
}

const f = (n: number) => (Math.round(n * 100) / 100).toString();

/** SVG path data for a stroke's outline (empty when it has no points). */
export function strokeSvgPath(s: Stroke): string {
  let d = '';
  walk(
    strokeOutline(s),
    (x, y) => (d += `M${f(x)} ${f(y)}`),
    (cx, cy, x, y) => (d += `Q${f(cx)} ${f(cy)} ${f(x)} ${f(y)}`),
  );
  return d ? `${d}Z` : '';
}

/** Ink written as 'currentColor' (follows the theme on screen) is printed black on paper. */
export const paperColour = (c: string) => (c === 'currentColor' ? '#111111' : c);
