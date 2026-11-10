/** Pure Year 1, Chapter 3 — where a line meets a curve, then inequalities that define the region between them. */
import { Q } from '../../../engine/core/rational';
import { evaluate, num } from '../../../engine/core/expr';
import { expect } from '../../../engine/core/numeric';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { sumTex } from '../shared/calculus';

const regions = defineTemplate({
  id: 'p1.3.region-between-line-and-curve',
  family: 'p1.3.inequalities',
  title: 'Where a line meets a quadratic, and inequalities for the region between them',
  spec: ['P2.5', 'P2.4'],
  chapter: 'P1.3',
  sections: ['3.6', '3.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Use'],
  tags: ['inequalities', 'regions', 'simultaneous equations'],
  generate(r) {
    const a = r.pick([1, 1, 2, -1]);
    const p = r.int(-4, 2),
      q = r.int(p + 2, 6);
    // curve y = a(x − p)(x − q); the line joins the points at x = u and x = w
    const u = r.int(p - 2, q),
      w = r.int(u + 2, q + 3);
    const f = (x: number) => a * (x - p) * (x - q);
    const m = Q.of(f(w) - f(u), w - u);
    r.require(m.isInt && !m.isZero);
    const c = f(u) - m.value * u;
    const quad = sumTex([[a, 'x^{2}'], [-a * (p + q), 'x'], [a * p * q, '']]);
    const lineTex = sumTex([[m, 'x'], [c, '']]);
    const L: ListSpec = ans.list([ans.exact(num(u)), ans.exact(num(w))], { v: 'x' });
    const boundary = r.bool();
    const lt = boundary ? '\\leqslant' : '<',
      gt = boundary ? '\\geqslant' : '>';
    // a > 0: the line is above the curve between u and w; a < 0: below
    const [upper, lower] = a > 0 ? [lineTex, quad] : [quad, lineTex];
    const right = md`$y ${lt} ${upper}$ and $y ${gt} ${lower}$`;
    const flipped = md`$y ${gt} ${upper}$ and $y ${lt} ${lower}$`;
    const bothAbove = md`$y ${gt} ${upper}$ and $y ${gt} ${lower}$`;
    const wrongStrict = boundary ? md`$y < ${upper}$ and $y > ${lower}$` : md`$y \leqslant ${upper}$ and $y \geqslant ${lower}$`;
    const C: ChoiceSpec = ans.choice([right, flipped, bothAbove, wrongStrict], 0);
    const lo = Math.min(p, u) - 1.5,
      hi = Math.max(q, w) + 1.5;
    const ys = [f(lo), f(hi), f((p + q) / 2), m.value * lo + c, m.value * hi + c, 0];
    const svg = plot({
      x: [lo, hi],
      y: [Math.min(...ys) - 1, Math.max(...ys) + 1],
      w: 300,
      h: 280,
      curves: [
        { f, label: 'C', cls: 'dg-curve' },
        { f: (x) => m.value * x + c, label: 'l', cls: 'dg-line' },
      ],
      shade: [{ upper: a > 0 ? (x) => m.value * x + c : f, lower: a > 0 ? f : (x) => m.value * x + c, from: u, to: w, label: 'R' }],
    });
    const diff = sumTex([[a, 'x^{2}'], [-a * (p + q) - m.value, 'x'], [a * p * q - c, '']]);
    return {
      stem: md`The curve $C$ has equation $y = ${quad}$ and the line $l$ has equation $y = ${lineTex}$. The region $R$, shown shaded, is bounded by $C$ and $l$${boundary ? ', and includes its boundary' : ', and does not include its boundary'}.`,
      diagram: { svg, alt: 'A parabola C and a straight line l crossing it twice, with the region R between them shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the $x$-coordinates of the points where $l$ meets $C$.`,
          answer: L,
          scheme: [M1(md`Sets $${quad} = ${lineTex}$`), dM1(md`Solves $${diff} = 0$`), A1(md`$x = ${u}$, $x = ${w}$`)],
          hints: ['Where they meet, the y-values are equal.', md`$${quad} = ${lineTex}$`, md`Rearrange to $${diff} = 0$ and solve.`],
          solution: [md`$${diff} = 0 \Rightarrow x = ${u}$ or $x = ${w}$`, md`$${answerTex(L)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Use inequalities to define the region $R$.`,
          answer: C,
          scheme: [B1(md`$y ${lt} ${upper}$`), B1(md`$y ${gt} ${lower}$`)],
          hints: [`R is ${a > 0 ? 'below the line and above the curve' : 'below the curve and above the line'}.`, 'Below a graph means y is less than it; above means y is greater.', boundary ? 'The boundary is included, so use ⩽ and ⩾.' : 'The boundary is not included, so use strict < and >.'],
          solution: [md`$R$ lies ${a > 0 ? 'below $l$ and above $C$' : 'below $C$ and above $l$'}: ${right}`],
        }),
      ],
      params: { a, p, q, m: m.value, c, u, w, boundary },
    };
  },
  verify(inst) {
    const { a, p, q, m, c, u, w } = inst.params as Record<string, number>;
    const f = (x: number) => a * (x - p) * (x - q);
    const xs = (inst.parts[0].answer as ListSpec).items.map((i) => evaluate((i as ExactSpec).value));
    for (const x of xs) expect(Math.abs(f(x) - (m * x + c)) < 1e-9, 'line meets curve');
    // a point in the middle of R satisfies the chosen inequalities; a point beyond it does not
    const xm = (u + w) / 2;
    const ym = (f(xm) + m * xm + c) / 2;
    const [up, low] = a > 0 ? [m * xm + c, f(xm)] : [f(xm), m * xm + c];
    expect(ym < up && ym > low, 'mid-point of R');
    // the boundary named first in the right option (the upper one) really is above the other across R
    for (let x = u + 0.01; x < w; x += 0.05) expect(a > 0 ? m * x + c > f(x) : f(x) > m * x + c, 'upper boundary');
  },
});

export default [regions] satisfies Template[];
