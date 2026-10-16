/** Pure Year 1, Chapter 13 — areas under curves, below the axis, and between curves and lines (13.5–13.7). */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expect, expectClose, integrate, rootsIn } from '../../../engine/core/numeric';
import { plot, yRangeOf } from '../../../engine/core/svg';
import { parseExpr } from '../../../engine/marking/parse';
import { answerTex } from '../../../engine/marking/mark';
import type { EquationSpec, ExactSpec, ExprSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1ft, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { dx, unsimplifiedIntegral } from '../shared/calculus';

const fnOf = (tex: string) => {
  const e = parseExpr(tex);
  return (x: number) => evaluate(e, { x });
};

function rootsList(xs: number[]): ListSpec {
  return ans.list(
    xs.map((x) => ans.exact(num(Q.from(x)))),
    { v: 'x' },
  );
}

const lin = (m: number, c: number) => Poly.coeffs([c, m]);

// ---------------------------------------------------------------- 13.5
const areaQuadratic = defineTemplate({
  id: 'p1.13.area-under-quadratic',
  family: 'p1.13.area-under',
  title: 'Area between a quadratic curve and the x-axis',
  spec: ['P8.3'],
  chapter: 'P1.13',
  sections: ['13.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 6,
  time: 7,
  commands: ['Find', 'Use'],
  tags: ['integration', 'area', 'quadratic', 'diagram'],
  generate(r) {
    const r1 = r.int(-3, 3);
    const d = r.int(2, 6);
    const r2 = r1 + d;
    const k = r.pick([1, 1, 2, 3]);
    // y = k(x - r1)(r2 - x)
    const f = Poly.fromRoots([r1, r2], -k);
    const fTex = f.toLatex();
    const F = f.integ();
    const area = F.evalQ(r2).sub(F.evalQ(r1));
    const L = rootsList([r1, r2]);
    const A = ans.exact(num(area), ['exact']);
    const fx = (x: number) => f.eval(x);
    const xr: [number, number] = [Math.min(r1 - 1, -0.6), r2 + 1];
    const svg = plot({
      x: xr,
      y: yRangeOf([fx], r1 - 0.6, r2 + 0.6, 0.15),
      curves: [{ f: fx, from: r1 - 0.7, to: r2 + 0.7, label: 'C', labelAt: r2 + 0.45 }],
      shade: [{ upper: fx, from: r1, to: r2, label: 'R' }],
    });
    return {
      stem: md`The diagram shows part of the curve $C$ with equation $y = ${fTex}$. The region $R$, shown shaded, is bounded by $C$ and the $x$-axis.`,
      diagram: { svg, alt: `Graph of the curve C, an upside-down parabola crossing the x-axis twice; the region R between the curve and the x-axis is shaded.` },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Find the $x$-coordinates of the points where $C$ meets the $x$-axis.`,
          answer: L,
          scheme: [M1(md`Sets $y = 0$ and solves the quadratic (e.g. factorises)`), A1(md`$${answerTex(L)}$`)],
          hints: ['The curve meets the x-axis where y = 0.', md`Set $${fTex} = 0$ and factorise (take out a common factor first if you can).`, md`$${fTex} = ${k === 1 ? '-' : `-${k}`}\left(x ${r1 < 0 ? '+' : '-'} ${Math.abs(r1)}\right)\left(x - ${r2}\right)$`.replace('\\left(x - 0\\right)', 'x').replace('\\left(x + 0\\right)', 'x')],
          solution: [md`Set $y = 0$: $${fTex} = 0$.`, md`Factorising gives roots at $${answerTex(L)}$.`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: md`Use algebraic integration to find the exact area of $R$.`,
          answer: A,
          scheme: [
            M1(md`Integrates $${fTex}$: $x^{n} \to x^{n+1}$ on at least one term`),
            A1(md`$${F.toLatex()}$`),
            dM1(md`Uses limits $${r2}$ and $${r1}$ from part (a) and subtracts`),
            A1(md`Area $= ${answerTex(A)}$`),
          ],
          hints: [
            'The area under a curve (above the axis) is the definite integral between the points where it crosses the axis.',
            md`Integrate $${fTex}$, then evaluate between $x = ${r1}$ and $x = ${r2}$.`,
            md`$\displaystyle\int \left(${fTex}\right)${dx} = ${F.toLatex()}$`,
          ],
          errors: [err('negative', ans.exact(num(area.neg())), 'An area is always positive — check the order of the limits.', 3)],
          solution: [
            md`Area $= \displaystyle\int_{${r1}}^{${r2}} \left(${fTex}\right)${dx} = \left[${unsimplifiedIntegral(f)}\right]_{${r1}}^{${r2}}$`,
            md`$= \left(${F.evalQ(r2).toLatex()}\right) - \left(${F.evalQ(r1).toLatex()}\right) = ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    const f = fnOf(inst.params.fTex as string);
    const roots = rootsIn(f, -10, 15, 5000);
    const L = inst.parts[0].answer as ListSpec;
    const given = L.items.map((i) => evaluate((i as ExactSpec).value)).sort((a, b) => a - b);
    expect(roots.length === 2, 'two roots');
    roots.forEach((x, i) => expectClose(x, given[i], 'root', 1e-7));
    const area = integrate((x) => Math.abs(f(x)), roots[0], roots[1]);
    expectClose(area, evaluate((inst.parts[1].answer as ExactSpec).value), 'area');
  },
});

// ---------------------------------------------------------------- 13.6
const areaBelowAxis = defineTemplate({
  id: 'p1.13.area-below-axis-quadratic',
  family: 'p1.13.area-below',
  title: 'Region below the x-axis: signed integral and area',
  spec: ['P8.3'],
  chapter: 'P1.13',
  sections: ['13.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'Hence', 'Write down'],
  tags: ['integration', 'area', 'below axis', 'diagram'],
  generate(r) {
    const r1 = r.int(-2, 4);
    const r2 = r1 + r.int(2, 6);
    const k = r.pick([1, 2, 3]);
    const f = Poly.fromRoots([r1, r2], k);
    const fTex = f.toLatex();
    const F = f.integ();
    const I = F.evalQ(r2).sub(F.evalQ(r1));
    const fx = (x: number) => f.eval(x);
    const svg = plot({
      x: [Math.min(-0.8, r1 - 1), r2 + 1],
      y: yRangeOf([fx], r1 - 0.6, r2 + 0.6, 0.15),
      curves: [{ f: fx, from: r1 - 0.7, to: r2 + 0.7, label: 'C', labelAt: r2 + 0.4 }],
      shade: [{ upper: () => 0, lower: fx, from: r1, to: r2, label: 'R' }],
    });
    const Ia = ans.exact(num(I), ['exact']);
    const Ab = ans.exact(num(I.neg()), ['exact']);
    return {
      stem: md`The curve $C$ has equation $y = ${fTex}$. The shaded region $R$ is bounded by $C$ and the $x$-axis, and lies below the $x$-axis between $x = ${r1}$ and $x = ${r2}$.`,
      diagram: { svg, alt: 'Graph of a U-shaped parabola C crossing the x-axis twice; the region R between the curve and the x-axis lies below the axis and is shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`Find the exact value of $\displaystyle\int_{${r1}}^{${r2}} \left(${fTex}\right)${dx}$.`,
          answer: Ia,
          scheme: [
            M1(md`Integrates: $x^{n} \to x^{n+1}$ on at least one term`),
            A1(md`$${F.toLatex()}$`),
            dM1(md`Substitutes $${r2}$ and $${r1}$ and subtracts`),
            A1(md`$${answerTex(Ia)}$`),
          ],
          hints: [
            'Integrate, then use F(upper) − F(lower). The answer will be negative — that is expected here.',
            md`$\displaystyle\int \left(${fTex}\right)${dx} = ${F.toLatex()}$`,
            md`Evaluate $\left[${F.toLatex()}\right]_{${r1}}^{${r2}}$.`,
          ],
          errors: [err('made-positive-early', ans.exact(num(I.neg())), md`That is the area of $R$ — but the integral itself is negative because $R$ lies below the $x$-axis.`, 3)],
          solution: [
            md`$\left[${F.toLatex()}\right]_{${r1}}^{${r2}} = \left(${F.evalQ(r2).toLatex()}\right) - \left(${F.evalQ(r1).toLatex()}\right)$`,
            md`$= ${answerTex(Ia)}$`,
          ],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`Hence write down the area of $R$.`,
          answer: Ab,
          ft: (prev) => {
            const v = prev.a?.value;
            if (v === undefined || !Number.isFinite(v) || v === 0) return null;
            return ans.num(Math.abs(v), { tol: 1e-9 }, { exactAllowed: true });
          },
          scheme: [B1ft(md`Area $= ${answerTex(Ab)}$ (the positive value of their answer to (a))`)],
          hints: [
            'An area is always positive.',
            'The integral of a region below the x-axis is negative; the area is its magnitude.',
            md`Take the modulus of your answer to part (a).`,
          ],
          errors: [err('negative-area', ans.exact(num(I)), 'An area cannot be negative — take the positive value.')],
          solution: [md`The region lies below the axis, so the area is the modulus of the integral: area $= ${answerTex(Ab)}$.`],
        }),
      ],
      params: { fTex },
    };
  },
  verify(inst) {
    const f = fnOf(inst.params.fTex as string);
    const roots = rootsIn(f, -10, 15, 5000);
    expect(roots.length === 2, 'two roots');
    const I = integrate(f, roots[0], roots[1]);
    expectClose(I, evaluate((inst.parts[0].answer as ExactSpec).value), 'signed integral');
    expect(I < 0, 'region below axis');
    expectClose(-I, evaluate((inst.parts[1].answer as ExactSpec).value), 'area');
  },
});

const cubicRegions = defineTemplate({
  id: 'p1.13.area-cubic-two-regions',
  family: 'p1.13.area-below',
  title: 'Total area of regions above and below the axis (cubic)',
  spec: ['P8.3', 'P2.6'],
  chapter: 'P1.13',
  sections: ['13.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 7,
  time: 9,
  commands: ['Find', 'Use'],
  tags: ['integration', 'area', 'below axis', 'cubic', 'diagram'],
  generate(r) {
    const p = r.int(-3, 2);
    const q = p + r.int(1, 4);
    const t = q + r.int(1, 4);
    const k = r.pick([1, 1, 2, -1]);
    const f = Poly.fromRoots([p, q, t], k);
    const F = f.integ();
    const I1 = F.evalQ(q).sub(F.evalQ(p));
    const I2 = F.evalQ(t).sub(F.evalQ(q));
    const A1v = I1.abs();
    const A2v = I2.abs();
    const total = A1v.add(A2v);
    const signed = I1.add(I2);
    r.require(!signed.abs().eq(total) && !signed.isZero);
    const fx = (x: number) => f.eval(x);
    const kTex = k === 1 ? '' : k === -1 ? '-' : `${k}`;
    const fac = (v: number) => (v === 0 ? 'x' : `(x ${v < 0 ? '+' : '-'} ${Math.abs(v)})`);
    const factTex = `${kTex}${fac(p)}${fac(q)}${fac(t)}`;
    const above1 = I1.sign > 0;
    const svg = plot({
      x: [Math.min(-0.9, p - 1), Math.max(t + 1, 0.9)],
      y: yRangeOf([fx], p - 0.4, t + 0.4, 0.15),
      curves: [{ f: fx, from: p - 0.5, to: t + 0.45, label: 'C', labelAt: t + 0.3 }],
      shade: [
        above1 ? { upper: fx, from: p, to: q, label: 'R₁' } : { upper: () => 0, lower: fx, from: p, to: q, label: 'R₁' },
        above1 ? { upper: () => 0, lower: fx, from: q, to: t, label: 'R₂' } : { upper: fx, from: q, to: t, label: 'R₂' },
      ],
    });
    const E: ExprSpec = ans.expr(f.toExpr(), ['x'], { forms: ['expanded'], domain: { x: [-4, 8] }, label: 'y =' });
    const T = ans.exact(num(total), ['exact']);
    const below = above1 ? 'R_2' : 'R_1';
    return {
      stem: md`The curve $C$ has equation $y = ${factTex}$. The shaded regions $R_1$ and $R_2$ are bounded by $C$ and the $x$-axis.`,
      diagram: { svg, alt: 'Graph of a cubic curve C crossing the x-axis three times; one shaded region lies above the axis and the other below it.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Write $y$ as a polynomial in $x$, in expanded form.`,
          answer: E,
          scheme: [M1(md`Attempts to multiply out all three factors`), A1(md`$y = ${f.toLatex()}$`)],
          hints: [
            'Multiply two brackets first, then multiply the result by the third.',
            md`Start with $${fac(p)}${fac(q)} = ${Poly.fromRoots([p, q]).toLatex()}$.`,
            md`Now multiply $${Poly.fromRoots([p, q]).toLatex()}$ by $${fac(t)}$${k !== 1 ? md` and by $${k}$` : ''}.`,
          ],
          solution: [md`$${fac(p)}${fac(q)} = ${Poly.fromRoots([p, q]).toLatex()}$`, md`$${answerTex(E)}$`],
        }),
        part({
          label: 'b',
          marks: 5,
          prompt: md`Use algebraic integration to find the total area of the shaded regions.`,
          answer: T,
          scheme: [
            M1(md`Integrates their expanded polynomial: $x^{n} \to x^{n+1}$`),
            A1(md`$${F.toLatex()}$`),
            M1(md`Uses limits $${p}$ to $${q}$ and $${q}$ to $${t}$ separately`),
            A1(md`$R_1 = ${A1v.toLatex()}$ and $R_2 = ${A2v.toLatex()}$ (as positive areas)`),
            A1(md`Total area $= ${answerTex(T)}$`),
          ],
          hints: [
            md`$${below}$ is below the $x$-axis, so its integral is negative. Find each area separately.`,
            md`Work out $\int_{${p}}^{${q}}$ and $\int_{${q}}^{${t}}$ separately, make both positive, then add.`,
            md`$\displaystyle\int \left(${f.toLatex()}\right)${dx} = ${F.toLatex()}$`,
          ],
          errors: [
            err('single-integral', ans.exact(num(signed.abs())), md`You integrated from $${p}$ to $${t}$ in one go, so the region below the axis cancelled part of the other. Find the two areas separately.`, 2),
            ...(A1v.sub(A2v).abs().eq(signed.abs()) ? [] : [err('subtracted-regions', ans.exact(num(A1v.sub(A2v).abs())), 'Add the two areas, both as positive values.', 3)]),
          ],
          solution: [
            md`$\displaystyle\int \left(${f.toLatex()}\right)${dx} = ${F.toLatex()}$`,
            md`$\left[\,\dots\right]_{${p}}^{${q}} = ${I1.toLatex()}$, so the area of $R_1$ is $${A1v.toLatex()}$`,
            md`$\left[\,\dots\right]_{${q}}^{${t}} = ${I2.toLatex()}$, so the area of $R_2$ is $${A2v.toLatex()}$`,
            md`Total area $= ${A1v.toLatex()} + ${A2v.toLatex()} = ${answerTex(T)}$`,
          ],
        }),
      ],
      params: { p, q, t, k },
    };
  },
  verify(inst) {
    const { p, q, t, k } = inst.params as { p: number; q: number; t: number; k: number };
    const f = (x: number) => k * (x - p) * (x - q) * (x - t);
    const total = integrate((x) => Math.abs(f(x)), p, q) + integrate((x) => Math.abs(f(x)), q, t);
    expectClose(total, evaluate((inst.parts[1].answer as ExactSpec).value), 'total area');
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [-1.3, 0.7, 2.2, 4.1]) expectClose(evaluate(e, { x }), f(x), 'expansion');
  },
});

// ---------------------------------------------------------------- 13.7
const areaLineCurve = defineTemplate({
  id: 'p1.13.area-between-line-and-curve',
  family: 'p1.13.area-between',
  title: 'Area between a curve and a straight line',
  spec: ['P8.3', 'P2.4'],
  chapter: 'P1.13',
  sections: ['13.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'Use'],
  tags: ['integration', 'area', 'between curves', 'simultaneous', 'diagram'],
  generate(r) {
    const x1 = r.int(-1, 3);
    const x2 = x1 + r.int(2, 5);
    const m = r.intNZ(-3, 3);
    const c = r.int(1, 8);
    const line = lin(m, c);
    // curve = line - (x - x1)(x - x2)
    const curve = line.sub(Poly.fromRoots([x1, x2]));
    r.require(!curve.coef(1).isZero && !curve.coef(0).isZero);
    const diff = curve.sub(line);
    const Fd = diff.integ();
    const area = Fd.evalQ(x2).sub(Fd.evalQ(x1));
    const cTex = curve.toLatex();
    const lTex = line.toLatex();
    const L = rootsList([x1, x2]);
    const A = ans.exact(num(area), ['exact']);
    const fc = (x: number) => curve.eval(x),
      fl = (x: number) => line.eval(x);
    const svg = plot({
      x: [Math.min(-0.8, x1 - 1.2), x2 + 1.2],
      y: yRangeOf([fc, fl], x1 - 1, x2 + 1, 0.12),
      curves: [
        { f: fc, from: x1 - 1.1, to: x2 + 1.1, label: 'C', labelAt: x1 - 0.9, labelDx: -16 },
        { f: fl, from: x1 - 1.1, to: x2 + 1.1, label: 'l', labelAt: x2 + 0.8, cls: 'dg-line' },
      ],
      shade: [{ upper: fc, lower: fl, from: x1, to: x2, label: 'R' }],
      points: [
        { x: x1, y: fl(x1), label: 'A', dx: -14 },
        { x: x2, y: fl(x2), label: 'B' },
      ],
    });
    return {
      stem: md`The diagram shows the curve $C$ with equation $y = ${cTex}$ and the line $l$ with equation $y = ${lTex}$. The line meets the curve at the points $A$ and $B$. The shaded region $R$ is bounded by $C$ and $l$.`,
      diagram: { svg, alt: 'Graph of an upside-down parabola C and a straight line l crossing it at A and B; the region R between them is shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the $x$-coordinates of $A$ and $B$.`,
          answer: L,
          scheme: [
            M1(md`Equates $${cTex} = ${lTex}$ and collects terms into a 3-term quadratic`),
            dM1(md`Solves their quadratic`),
            A1(md`$${answerTex(L)}$`),
          ],
          hints: [
            'At the points of intersection the y-values of the curve and the line are equal.',
            md`Set $${cTex} = ${lTex}$ and rearrange to $\dots = 0$.`,
            md`This gives $${diff.neg().toLatex()} = 0$.`,
          ],
          solution: [md`$${cTex} = ${lTex} \Rightarrow ${diff.neg().toLatex()} = 0$`, md`$\Rightarrow (x ${x1 <= 0 ? '+' : '-'} ${Math.abs(x1)})(x - ${x2}) = 0$, so $${answerTex(L)}$`.replace('(x + 0)', 'x').replace('(x - 0)', 'x')],
        }),
        part({
          label: 'b',
          marks: 5,
          prompt: md`Use algebraic integration to find the exact area of $R$.`,
          answer: A,
          scheme: [
            M1(md`Uses $\displaystyle\int (\text{curve} - \text{line})\,\mathrm{d}x$ or area under curve $-$ area under line`),
            A1(md`Correct integrand $${diff.toLatex()}$ (or equivalent method)`),
            M1(md`Integrates: $x^{n} \to x^{n+1}$`),
            dM1(md`Uses the limits $${x1}$ and $${x2}$ from part (a)`),
            A1(md`Area $= ${answerTex(A)}$`),
          ],
          hints: [
            'Area between two graphs = ∫ (top − bottom) dx between the intersection points.',
            md`The curve is above the line between $A$ and $B$, so integrate $\left(${cTex}\right) - \left(${lTex}\right)$ from $${x1}$ to $${x2}$.`,
            md`The integrand simplifies to $${diff.toLatex()}$.`,
          ],
          errors: [
            err('line-minus-curve', ans.exact(num(area.neg())), 'Your answer is negative: integrate (top − bottom). The curve is above the line here.', 4),
            ...(Fd.evalQ(x2).sub(Fd.evalQ(x1)).eq(curve.integ().evalQ(x2).sub(curve.integ().evalQ(x1)))
              ? []
              : [err('curve-only', ans.exact(num(curve.integ().evalQ(x2).sub(curve.integ().evalQ(x1)))), 'That is the area under the curve only — subtract the area under the line.', 2)]),
          ],
          solution: [
            md`Area $= \displaystyle\int_{${x1}}^{${x2}} \left[\left(${cTex}\right) - \left(${lTex}\right)\right]${dx} = \int_{${x1}}^{${x2}} \left(${diff.toLatex()}\right)${dx}$`,
            md`$= \left[${Fd.toLatex()}\right]_{${x1}}^{${x2}} = \left(${Fd.evalQ(x2).toLatex()}\right) - \left(${Fd.evalQ(x1).toLatex()}\right)$`,
            md`$= ${answerTex(A)}$`,
          ],
        }),
      ],
      params: { cTex, lTex },
    };
  },
  verify(inst) {
    const fc = fnOf(inst.params.cTex as string),
      fl = fnOf(inst.params.lTex as string);
    const xs = rootsIn((x) => fc(x) - fl(x), -10, 15, 5000);
    expect(xs.length === 2, 'two intersections');
    const given = (inst.parts[0].answer as ListSpec).items.map((i) => evaluate((i as ExactSpec).value)).sort((a, b) => a - b);
    xs.forEach((x, i) => expectClose(x, given[i], 'intersection', 1e-7));
    expectClose(integrate((x) => Math.abs(fc(x) - fl(x)), xs[0], xs[1]), evaluate((inst.parts[1].answer as ExactSpec).value), 'area');
  },
});

const areaCurveChord = defineTemplate({
  id: 'p1.13.area-curve-chord-axis',
  family: 'p1.13.area-between',
  title: 'Region bounded by a curve, a chord and the x-axis',
  spec: ['P8.3', 'P3.1'],
  chapter: 'P1.13',
  sections: ['13.7'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 5,
  marks: 9,
  time: 12,
  commands: ['Find', 'Use'],
  tags: ['integration', 'area', 'straight line', 'synoptic', 'diagram'],
  generate(r) {
    const r1 = r.int(-1, 3);
    const r2 = r1 + r.int(4, 7);
    const s = r.int(r1 + 1, r2 - 2);
    const k = r.pick([1, 1, 2]);
    const f = Poly.fromRoots([r1, r2], -k);
    const ys = f.evalQ(s);
    r.require(ys.gt(0));
    const m = ys.neg().div(r2 - s);
    const cc = m.mul(-r2);
    const line = Poly.coeffs([cc, m]);
    const F = f.integ();
    const under = F.evalQ(s).sub(F.evalQ(r1));
    const tri = ys.mul(r2 - s).div(2);
    const total = under.add(tri);
    const fx = (x: number) => f.eval(x);
    const lx = (x: number) => line.eval(x);
    const svg = plot({
      x: [Math.min(-0.8, r1 - 1), r2 + 1],
      y: yRangeOf([fx], r1 - 0.5, r2 + 0.5, 0.15),
      curves: [
        { f: fx, from: r1 - 0.6, to: r2 + 0.6, label: 'C', labelAt: r2 + 0.35 },
        { f: lx, from: s - 0.8, to: r2 + 0.3, label: 'l', labelAt: s - 0.7, labelDx: -12, cls: 'dg-line' },
      ],
      shade: [{ upper: (x) => (x <= s ? fx(x) : lx(x)), from: r1, to: r2, label: 'R', labelAt: [(r1 + s) / 2, ys.value / 3] }],
      points: [
        { x: s, y: ys.value, label: 'A' },
        { x: r2, y: 0, label: 'B', dy: 14 },
      ],
    });
    const fTex = f.toLatex();
    const Eq: EquationSpec = ans.eq({ k: 'sym', n: 'y' }, line.toExpr(), ['x', 'y'], ['y=mx+c']);
    const T = ans.exact(num(total), ['exact']);
    return {
      stem: md`The curve $C$ has equation $y = ${fTex}$ and meets the $x$-axis at the points $(${r1}, 0)$ and $B(${r2}, 0)$. The point $A$ on $C$ has $x$-coordinate $${s}$. The straight line $l$ passes through $A$ and $B$. The shaded region $R$ is bounded by $C$, the line $l$ and the $x$-axis.`,
      diagram: { svg, alt: 'Graph of an upside-down parabola C; a straight line l joins the point A on the curve to the point B where the curve meets the x-axis. The region R under the curve up to A and under the line from A to B is shaded.' },
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find an equation of $l$, giving your answer in the form $y = mx + c$.`,
          answer: Eq,
          scheme: [
            B1ft(md`$A = (${s}, ${ys.toLatex()})$`),
            M1(md`Gradient $= \dfrac{0 - ${ys.toLatex()}}{${r2} - ${s}}$ and uses it with $A$ or $B$`),
            A1(md`$${answerTex(Eq)}$`),
          ],
          hints: [
            md`First find the $y$-coordinate of $A$ by substituting $x = ${s}$ into the equation of $C$.`,
            'Gradient = change in y ÷ change in x between A and B, then use y − y₁ = m(x − x₁).',
            md`$A = (${s}, ${ys.toLatex()})$ and $B = (${r2}, 0)$.`,
          ],
          solution: [
            md`At $x = ${s}$: $y = ${ys.toLatex()}$, so $A = (${s}, ${ys.toLatex()})$.`,
            md`Gradient of $l$ $= \dfrac{0 - ${ys.toLatex()}}{${r2} - ${s}} = ${m.toLatex()}$`,
            md`$y - 0 = ${m.toLatex()}(x - ${r2}) \Rightarrow ${answerTex(Eq)}$`,
          ],
        }),
        part({
          label: 'b',
          marks: 6,
          prompt: md`Use algebraic integration to find the exact area of $R$.`,
          answer: T,
          scheme: [
            M1(md`Integrates $${fTex}$: $x^{n} \to x^{n+1}$`),
            A1(md`$${F.toLatex()}$`),
            dM1(md`Uses limits $${r1}$ and $${s}$`),
            A1(md`Area under $C$ from $x = ${r1}$ to $x = ${s}$ is $${under.toLatex()}$`),
            M1(md`Area of triangle under $l$: $\tfrac{1}{2} \times ${r2 - s} \times ${ys.toLatex()}$`),
            A1(md`Area of $R = ${answerTex(T)}$`),
          ],
          hints: [
            md`Split $R$ at $x = ${s}$: the part under the curve, and the triangle under the line.`,
            md`Area under $C$ from $${r1}$ to $${s}$ by integration; the triangle has base $${r2 - s}$ and height $${ys.toLatex()}$.`,
            md`$\displaystyle\int \left(${fTex}\right)${dx} = ${F.toLatex()}$`,
          ],
          errors: [
            err('whole-curve', ans.exact(num(F.evalQ(r2).sub(F.evalQ(r1)))), md`That is the whole area under $C$. $R$ only follows the curve as far as $A$, then the line.`, 2),
            err('curve-only', ans.exact(num(under)), 'You have the area under the curve up to A — now add the triangle under the line from A to B.', 4),
          ],
          solution: [
            md`Area under $C$ for $${r1} \leqslant x \leqslant ${s}$: $\left[${F.toLatex()}\right]_{${r1}}^{${s}} = ${under.toLatex()}$`,
            md`Triangle under $l$: $\tfrac{1}{2} \times ${r2 - s} \times ${ys.toLatex()} = ${tri.toLatex()}$`,
            md`Area of $R = ${under.toLatex()} + ${tri.toLatex()} = ${answerTex(T)}$`,
          ],
        }),
      ],
      params: { fTex, r1, r2, s },
    };
  },
  verify(inst) {
    const { fTex, r1, r2, s } = inst.params as { fTex: string; r1: number; r2: number; s: number };
    const f = fnOf(fTex);
    const eq = inst.parts[0].answer as EquationSpec;
    const l = (x: number) => evaluate(eq.rhs, { x });
    expectClose(l(s), f(s), 'line through A', 1e-9);
    expectClose(l(r2), 0, 'line through B', 1e-9);
    const area = integrate((x) => (x <= s ? f(x) : l(x)), r1, s) + integrate(l, s, r2);
    expectClose(area, evaluate((inst.parts[1].answer as ExactSpec).value), 'area of R');
  },
});

const templates: Template[] = [areaQuadratic, areaBelowAxis, cubicRegions, areaLineCurve, areaCurveChord];
export default templates;
