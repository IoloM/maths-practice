/**
 * Tidying handwriting: wobbly lines and shapes drawn by hand are recognised (and handwriting
 * isn't), long lines straighten, wobbles smooth out, slanted writing levels, and the lasso and
 * the part-rubber pick out the right ink.
 */
import { describe, expect, it } from 'vitest';
import type { Stroke } from '../src/storage/types';
import { level, lassoSelect, makeShape, neaten, partialErase, recognise, snapAngle, straightenIfLine, strokesBox, toP, type P } from '../src/working/shapes';
import { arrowHeads, centreline, isFilled, strokeSvg, toSvg } from '../src/working/ink';

// a steady "random" wobble, so the tests always draw the same hand
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const wobble = (pts: P[], amp: number): Stroke => ({ tool: 'pen', color: '#111', size: 2, points: pts.flatMap(([x, y]) => [x + rnd() * amp, y + rnd() * amp, 0.5]) });
const along = (a: P, b: P, n: number): P[] => Array.from({ length: n }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / (n - 1), a[1] + ((b[1] - a[1]) * i) / (n - 1)]);
const loop = (corners: P[], n = 20): P[] => corners.flatMap((c, i) => along(c, corners[(i + 1) % corners.length], n).slice(0, -1)).concat([corners[0]]);

describe('recognising what you drew', () => {
  it('a wobbly line becomes straight, and level when it is nearly level', () => {
    const s = recognise(wobble(along([10, 100], [200, 103], 40), 1.5))!;
    expect(s.poly).toBe(true);
    const p = toP(s);
    expect(p).toHaveLength(2);
    expect(Math.abs(p[1][1] - p[0][1])).toBeLessThan(0.2); // snapped level
  });

  it('a wobbly rectangle becomes a rectangle with square corners', () => {
    const s = recognise(wobble(loop([[20, 20], [180, 20], [180, 110], [20, 110]]), 2))!;
    expect(s.closed).toBe(true);
    const p = toP(s);
    expect(p).toHaveLength(4);
    expect(p[0][1]).toBeCloseTo(p[1][1], 5);
    expect(p[1][0]).toBeCloseTo(p[2][0], 5);
  });

  it('a rectangle started half way along a side still has four corners', () => {
    const s = recognise(wobble(loop([[100, 20], [180, 20], [180, 110], [20, 110], [20, 20]]), 1.5))!;
    expect(toP(s)).toHaveLength(4);
  });

  it('a triangle', () => {
    const s = recognise(wobble(loop([[100, 10], [190, 160], [10, 160]]), 2))!;
    expect(s.closed).toBe(true);
    expect(toP(s)).toHaveLength(3);
  });

  it('a wobbly circle becomes a circle, and an oval an ellipse', () => {
    const circle = Array.from({ length: 60 }, (_, i) => [100 + 50 * Math.cos((i / 59) * 2 * Math.PI), 100 + 50 * Math.sin((i / 59) * 2 * Math.PI)] as P);
    const c = recognise(wobble(circle, 2.5))!;
    expect(c.closed).toBe(true);
    const box = strokesBox([{ ...c, size: 0 }])!;
    expect(box.x1 - box.x0).toBeCloseTo(box.y1 - box.y0, 0);
    const oval = Array.from({ length: 60 }, (_, i) => [100 + 80 * Math.cos((i / 59) * 2 * Math.PI), 100 + 40 * Math.sin((i / 59) * 2 * Math.PI)] as P);
    const o = strokesBox([{ ...recognise(wobble(oval, 2))!, size: 0 }])!;
    expect(o.x1 - o.x0).toBeGreaterThan(1.7 * (o.y1 - o.y0));
  });

  it('a corner (two lines) becomes two straight lines', () => {
    const s = recognise(wobble([...along([20, 20], [20, 150], 30), ...along([20, 150], [170, 150], 30).slice(1)], 1.5))!;
    expect(s.closed).toBeFalsy();
    expect(toP(s)).toHaveLength(3);
  });

  it('handwriting is left alone', () => {
    // a loopy "e"-like scribble and a "2"
    const scribble = Array.from({ length: 80 }, (_, i) => {
      const t = i / 79;
      return [10 + t * 120 + 12 * Math.cos(t * 6 * 2 * Math.PI), 50 + 12 * Math.sin(t * 6 * 2 * Math.PI)] as P;
    });
    expect(recognise(wobble(scribble, 0.5))).toBeNull();
    const two = [...Array.from({ length: 20 }, (_, i) => [20 + 15 * Math.cos(Math.PI + (i / 19) * Math.PI), 30 + 15 * Math.sin(Math.PI + (i / 19) * Math.PI)] as P), ...along([35, 30], [5, 70], 15), ...along([5, 70], [40, 70], 10)];
    expect(recognise(wobble(two, 0.3))).toBeNull();
  });
});

describe('straightening and neatening as you write', () => {
  it('a long, nearly straight line is straightened; a short or curved one is not', () => {
    expect(straightenIfLine(wobble(along([0, 0], [150, 2], 30), 0.8), 60)?.poly).toBe(true);
    expect(straightenIfLine(wobble(along([0, 0], [40, 0], 10), 0.5), 60)).toBeNull();
    const arc = Array.from({ length: 30 }, (_, i) => [i * 5, 0.02 * (i * 5 - 75) ** 2] as P);
    expect(straightenIfLine(wobble(arc, 0.3), 60)).toBeNull();
  });

  it('snaps to level, upright and 45° only when close', () => {
    expect(snapAngle([0, 0], [100, 3])[1]).toBeCloseTo(0, 5);
    expect(snapAngle([0, 0], [3, 100])[0]).toBeCloseTo(0, 5);
    const d = snapAngle([0, 0], [100, 98]);
    expect(d[0]).toBeCloseTo(d[1], 5);
    expect(snapAngle([0, 0], [100, 30])).toEqual([100, 30]);
  });

  it('neatening smooths the wobble but keeps the shape and its ends', () => {
    const shaky = wobble(along([0, 0], [100, 50], 60), 2);
    const tidy = neaten(shaky);
    const p = toP(tidy);
    const q = toP(shaky);
    expect(p[0]).toEqual([Math.round(q[0][0] * 10) / 10, Math.round(q[0][1] * 10) / 10]);
    // much closer to the true line than the shaky one
    const off = (pts: P[]) => pts.reduce((t, [x, y]) => t + Math.abs(y - x / 2), 0) / pts.length;
    expect(off(p.slice(3, -3))).toBeLessThan(off(q) * 0.7);
  });

  it('levels a slanted line of writing', () => {
    const word = (x: number) => wobble(Array.from({ length: 20 }, (_, i) => [x + i, 5 * Math.sin(i / 3)] as P), 0.2);
    const slanted = [word(0), word(25), word(50), word(75)].map((s) => ({ ...s, points: s.points.map((v, i) => (i % 3 === 1 ? v + s.points[i - 1] * 0.25 : v)) }));
    const flatLine = level(slanted);
    const pts = flatLine.flatMap(toP);
    const n = pts.length;
    const mx = pts.reduce((t, p) => t + p[0], 0) / n,
      my = pts.reduce((t, p) => t + p[1], 0) / n;
    const slope = pts.reduce((t, p) => t + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((t, p) => t + (p[0] - mx) ** 2, 0);
    expect(Math.abs(slope)).toBeLessThan(0.03);
  });
});

describe('shape tools, the lasso and the rubber', () => {
  const look = { tool: 'pen' as const, color: '#111', size: 2 };
  it('makes shapes from a drag', () => {
    expect(toP(makeShape('rect', [10, 10], [50, 40], look)[0])).toHaveLength(4);
    expect(makeShape('arrow', [0, 0], [100, 2], look)[0]).toMatchObject({ arrow: 1, poly: true });
    const axes = makeShape('axes', [100, 100], [150, 60], look);
    expect(axes).toHaveLength(2);
    expect(toP(axes[0])).toEqual([[50, 100], [150, 100]]);
    expect(toP(axes[1])).toEqual([[100, 140], [100, 60]]);
    expect(makeShape('line', [0, 0], [100, 0], { ...look, dash: true })[0].dash).toBe(true);
    const circle = strokesBox([{ ...makeShape('ellipse', [0, 0], [100, 95], look)[0], size: 0 }])!;
    expect(circle.x1 - circle.x0).toBeCloseTo(circle.y1 - circle.y0, 0);
  });

  it('the lasso picks the strokes inside it', () => {
    const strokes = [wobble(along([10, 10], [40, 10], 5), 0), wobble(along([200, 200], [240, 200], 5), 0)];
    expect(lassoSelect(strokes, [[0, 0], [60, 0], [60, 30], [0, 30]])).toEqual([0]);
  });

  it('the part rubber cuts a stroke in two, and leaves the rest alone', () => {
    const line = wobble(along([0, 0], [100, 0], 11), 0);
    const other = wobble(along([0, 50], [100, 50], 11), 0);
    const out = partialErase([line, other], 50, 0, 5);
    expect(out).toHaveLength(3);
    expect(out[2]).toBe(other);
    expect(Math.max(...toP(out[0]).map((p) => p[0]))).toBeLessThan(45);
    expect(Math.min(...toP(out[1]).map((p) => p[0]))).toBeGreaterThan(55);
    const same = [line];
    expect(partialErase(same, 50, 30, 5)).toBe(same);
    // an arrow keeps its head on the piece with the tip
    const arrow = makeShape('arrow', [0, 0], [100, 0], look)[0];
    const cut = partialErase([arrow], 30, 0, 4);
    expect(cut.map((s) => s.arrow)).toEqual([undefined, 1]);
  });
});

describe('drawing the ink', () => {
  it('ink is an even line through the points; a brush pen is a filled outline', () => {
    const s = wobble(along([0, 0], [50, 10], 6), 0);
    expect(isFilled(s)).toBe(false);
    expect(toSvg(centreline(s))).toMatch(/^M0 0(Q[\d.]+ [\d.]+ [\d.]+ [\d.]+)+L50 10$/);
    expect(strokeSvg(s)).toMatchObject({ heads: '' });
    expect(strokeSvg({ ...s, brush: true })).toHaveProperty('fill');
    const shape = makeShape('rect', [0, 0], [10, 10], { tool: 'pen', color: '#111', size: 2 })[0];
    expect(toSvg(centreline(shape))).toBe('M0 0L10 0L10 10L0 10Z');
    const arrow = makeShape('arrow', [0, 0], [100, 0], { tool: 'pen', color: '#111', size: 2 })[0];
    expect(arrowHeads(arrow).filter((c) => c[0] === 'L')).toHaveLength(2);
  });
});
