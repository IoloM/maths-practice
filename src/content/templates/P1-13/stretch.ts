/** Pure Year 1, Chapter 13 — A* stretch: the tangent to a cubic meets it again; the area between them (differentiation, factor theorem, integration). */
import { Q } from '../../../engine/core/rational';
import { evaluate, num, sym } from '../../../engine/core/expr';
import { expect, expectClose, integrate } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, EquationSpec, ExactSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const Y = sym('y');
const br = (n: number) => (n < 0 ? `(${n})` : `${n}`);

const tangentAgain = defineTemplate({
  id: 'p1.13.stretch-tangent-meets-cubic-again',
  family: 'stretch.tangent-meets-cubic-again',
  title: 'A* stretch: the tangent to a cubic meets it again — the point and the area between them',
  spec: ['P7.3', 'P2.6', 'P8.3'],
  chapter: 'P1.13',
  level: 'AS',
  paper: [1, 2],
  difficulty: 5,
  marks: 11,
  time: 14,
  commands: ['Find'],
  tags: ['stretch', 'synoptic', 'tangents', 'factor theorem', 'area between curves', 'integration'],
  generate(r) {
    const a = r.int(-3, 3);
    const b = r.int(-4, 4);
    r.require(Math.abs(b - a) >= 2 && Math.abs(b - a) <= 5);
    const c = -(2 * a + b);
    const d = r.int(-6, 6);
    const e = r.int(-5, 5);
    const f = (x: number) => x ** 3 + c * x * x + d * x + e;
    const m = 3 * a * a + 2 * c * a + d;
    const k = f(a) - m * a;
    r.require(m !== 0 && Math.abs(m) <= 40 && Math.abs(k) <= 60 && Math.abs(f(b)) <= 99);
    const curve = sumTex([
      [1, 'x^{3}'],
      [c, 'x^{2}'],
      [d, 'x'],
      [e, ''],
    ]);
    const dTex = sumTex([
      [3, 'x^{2}'],
      [2 * c, 'x'],
      [d, ''],
    ]);
    const tTex = sumTex([
      [m, 'x'],
      [k, ''],
    ]);
    const E: EquationSpec = ans.eq(Y, ex(tTex), ['x', 'y'], ['y=mx+c']);
    const P: CoordSpec = ans.coord(ans.exact(num(b)), ans.exact(num(f(b))));
    const areaQ = Q.of((b - a) ** 4, 12);
    const AREA: ExactSpec = ans.exact(num(areaQ));
    // curve − tangent = (x − a)²(x − b)
    const diffTex = sumTex([
      [1, 'x^{3}'],
      [c, 'x^{2}'],
      [d - m, 'x'],
      [e - k, ''],
    ]);
    const factTex = `${a === 0 ? 'x^{2}' : `(${sumTex([[1, 'x'], [-a, '']])})^{2}`}(${sumTex([[1, 'x'], [-b, '']])})`;
    const lo = Math.min(a, b),
      hi = Math.max(a, b);
    const upper = b > a ? 'the curve' : 'the tangent';
    const integrand =
      b > a
        ? diffTex
        : sumTex([
            [-1, 'x^{3}'],
            [-c, 'x^{2}'],
            [m - d, 'x'],
            [k - e, ''],
          ]);
    return {
      stem: md`The curve $C$ has equation $y = ${curve}$. The point $P$ on $C$ has $x$-coordinate $${a}$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find an equation of the tangent to $C$ at $P$, in the form $y = mx + c$.`,
          answer: E,
          scheme: [M1(md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${dTex}$`), M1(md`Gradient $${m}$ and $y = ${f(a)}$ at $x = ${a}$`), A1(md`$${answerTex(E)}$`)],
          hints: ['Differentiate to get the gradient function, then put in the x-coordinate of P.', md`At $x = ${a}$: gradient $= ${m}$ and $y = ${f(a)}$.`, md`$y - ${br(f(a))} = ${m}(x - ${br(a)})$, then rearrange.`],
          solution: [md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = ${dTex}$, so the gradient at $P$ is $${m}$ and $P = (${a}, ${f(a)})$`, md`$y - ${br(f(a))} = ${m}(x - ${br(a)})$`, md`$${answerTex(E)}$`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: md`The tangent meets $C$ again at the point $Q$. Find the coordinates of $Q$.`,
          answer: P,
          scheme: [M1(md`Sets the curve equal to the tangent: $${diffTex} = 0$`), M1(md`Uses $(x ${a < 0 ? '+' : '-'} ${Math.abs(a)})^{2}$ as a factor (a tangent touches, so $x = ${a}$ is a repeated root)`), A1(md`$x = ${b}$`), A1(md`$${answerTex(P)}$`)],
          hints: [md`Where they meet, $${curve} = ${tTex}$. Collect everything on one side.`, md`The tangent touches $C$ at $x = ${a}$, so $x = ${a}$ is a repeated root: $(x - ${br(a)})^{2}$ is a factor.`, md`$${diffTex} = ${factTex}$`],
          errors: [err('gave-p', ans.coord(ans.exact(num(a)), ans.exact(num(f(a)))), 'That is P, where the tangent touches the curve. Q is the other point where they meet.')],
          solution: [md`$${diffTex} = 0$`, md`$x = ${a}$ is a repeated root, so $${diffTex} = ${factTex}$`, md`$x = ${b}$, $y = ${f(b)}$: $Q$ is $${answerTex(P)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`Find the exact area of the finite region bounded by $C$ and the tangent.`,
          answer: AREA,
          scheme: [M1(md`$\displaystyle\int_{${lo}}^{${hi}}$ (upper − lower) $\mathrm{d}x$, with ${upper} on top`), M1('Integrates a cubic correctly (at least two terms right)'), dM1(md`Substitutes the limits $${lo}$ and $${hi}$ and subtracts`), A1(md`$${answerTex(AREA)}$`)],
          hints: [md`Between $x = ${lo}$ and $x = ${hi}$, ${upper} is on top: sketch it or test a point.`, md`Area $= \displaystyle\int_{${lo}}^{${hi}} \left(${integrand}\right)\mathrm{d}x$`, md`Check: $(x - ${br(a)})^{2}(x - ${br(b)})$ has the same sign all the way between $${lo}$ and $${hi}$.`],
          errors: [err('quarter', ans.exact(num(Q.of((b - a) ** 4, 4))), 'Too big — check you integrated every term and subtracted the tangent (the line) as well.')],
          solution: [md`Area $= \displaystyle\int_{${lo}}^{${hi}} \left(${integrand}\right)\mathrm{d}x$`, md`$= \dfrac{(${hi} - ${br(lo)})^{4}}{12} = ${answerTex(AREA)}$ (the integral of $(x - a)^{2}(x - b)$ over $[a, b]$ is always $\dfrac{(b - a)^{4}}{12}$ in size)`],
        }),
      ],
      params: { a, b, c, d, e },
    };
  },
  verify(inst) {
    const { a, b, c, d, e } = inst.params as Record<string, number>;
    const f = (x: number) => x ** 3 + c * x * x + d * x + e;
    const E = inst.parts[0].answer as EquationSpec;
    const t = (x: number) => evaluate(E.rhs, { x });
    expectClose(t(a), f(a), 'tangent passes through P');
    expectClose(t(a + 1) - t(a), 3 * a * a + 2 * c * a + d, 'tangent gradient');
    const P = inst.parts[1].answer as CoordSpec;
    const qx = evaluate((P.x as ExactSpec).value);
    expect(Math.abs(f(qx) - t(qx)) < 1e-9 && qx !== a, 'Q is on both');
    expectClose(evaluate((P.y as ExactSpec).value), f(qx), 'y at Q');
    const area = integrate((x) => Math.abs(f(x) - t(x)), Math.min(a, b), Math.max(a, b));
    expectClose(evaluate((inst.parts[2].answer as ExactSpec).value), area, 'area');
  },
});

const templates: Template[] = [tangentAgain];
export default templates;
