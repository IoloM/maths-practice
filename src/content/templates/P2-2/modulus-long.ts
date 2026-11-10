/** Pure Year 2, Chapter 2 — long exam-style modulus question: vertex, range, intersections with a line, and an inequality. */
import { Q } from '../../../engine/core/rational';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { plot } from '../../../engine/core/svg';
import { answerTex } from '../../../engine/marking/mark';
import { contains, toNumSet } from '../../../engine/marking/intervals';
import type { CoordSpec, ExactSpec, IntervalSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, iv, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { sumTex } from '../shared/calculus';

const INF = sym('infty');
const exq = (q: Q | number) => num(Q.from(q));

const longModulus = defineTemplate({
  id: 'p2.2.long-modulus-graph-line-and-inequality',
  family: 'p2.2.modulus',
  title: 'Exam-style: y = a|x − b| + c — vertex, range, where a line meets it, and an inequality',
  spec: ['P2.7', 'P2.8'],
  chapter: 'P2.2',
  sections: ['2.1', '2.2', '2.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 10,
  time: 12,
  commands: ['State', 'Solve', 'Hence'],
  tags: ['exam-style', 'modulus', 'graphs', 'inequalities'],
  generate(r) {
    const a = r.pick([2, 3, 4]),
      b = r.int(-4, 4),
      c = r.int(-6, 5);
    const m = r.pick([-1, 0, 1]);
    // the line passes above the vertex, so it meets both arms
    const above = r.int(2, 9);
    const k = c + above - m * b;
    const xL = Q.of(a * b + c - k, a + m),
      xR = Q.of(a * b - c + k, a - m);
    r.require(xL.d <= 5 && xR.d <= 5);
    const fTex = `${a}\\left|${sumTex([[1, 'x'], [-b, '']])}\\right|${c === 0 ? '' : sgn(c)}`;
    const lTex = m === -1 ? sumTex([[k, ''], [-1, 'x']]) : sumTex([[m, 'x'], [k, '']]);
    const V: CoordSpec = ans.coord(ans.exact(exq(b)), ans.exact(exq(c)));
    const R: IntervalSpec = ans.interval([iv(exq(c), INF, true, false)], 'y', { aliases: ['f(x)', 'f', 'y'], display: '\\mathrm{f}(x)' });
    const L: ListSpec = ans.list([ans.exact(exq(xL)), ans.exact(exq(xR))], { v: 'x' });
    const op = r.pick(['<', '\\geqslant'] as const);
    const inside = op === '<';
    const I: IntervalSpec = ans.interval(inside ? [iv(exq(xL), exq(xR), false, false)] : [iv(neg(INF), exq(xL), false, true), iv(exq(xR), INF, true, false)], 'x', { setNotation: true });
    const f = (x: number) => a * Math.abs(x - b) + c;
    const line = (x: number) => m * x + k;
    const lo = Math.min(xL.value, b) - 2,
      hi = Math.max(xR.value, b) + 2;
    const svg = plot({
      x: [lo, hi],
      y: [Math.min(c, 0, line(lo), line(hi)) - 2, Math.max(f(lo), f(hi), line(lo), line(hi), 0) + 1],
      w: 300,
      h: 260,
      curves: [
        { f, label: 'y = f(x)', cls: 'dg-curve' },
        { f: line, cls: 'dg-line', label: 'l' },
      ],
      points: [{ x: b, y: c, label: 'V', dot: true, dy: 14 }],
    });
    return {
      stem: md`The function $\mathrm{f}$ is defined by $\mathrm{f}(x) = ${fTex}$, $x \in \mathbb{R}$. The graph of $y = \mathrm{f}(x)$ has a vertex at $V$. The line $l$ has equation $y = ${lTex}$.`,
      diagram: { svg, alt: 'A V-shaped graph with its vertex V, and a straight line l crossing both arms of the V.' },
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`State the coordinates of $V$.`,
          answer: V,
          scheme: [B1(md`$x = ${b}$`), B1(md`$y = ${c}$`)],
          hints: ['The vertex is where the expression inside the modulus is zero.', md`Solve $${sumTex([[1, 'x'], [-b, '']])} = 0$.`, md`At that point $\mathrm{f}(x) = ${c}$.`],
          errors: [err('sign', ans.coord(ans.exact(exq(-b)), ans.exact(exq(c))), md`$|x - a|$ is zero when $x = a$: check the sign.`, 1)],
          solution: [md`$V${answerTex(V)}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`State the range of $\mathrm{f}$.`,
          answer: R,
          scheme: [B1(md`$${answerTex(R)}$`)],
          hints: ['The lowest point of the graph is the vertex.', 'The arms go up forever.', md`So $\mathrm{f}(x) \geqslant ${c}$.`],
          solution: [md`$${answerTex(R)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`Solve the equation $\mathrm{f}(x) = ${lTex}$.`,
          answer: L,
          scheme: [M1(md`Right arm: $${a}(${sumTex([[1, 'x'], [-b, '']])}) ${c === 0 ? '' : sgn(c)} = ${lTex}$`), A1(md`$x = ${xR.toLatex()}$`), M1(md`Left arm: $-${a}(${sumTex([[1, 'x'], [-b, '']])}) ${c === 0 ? '' : sgn(c)} = ${lTex}$`), A1(md`$x = ${xL.toLatex()}$`)],
          hints: ['The line meets both arms, so there are two equations to solve.', md`Right arm ($x \geqslant ${b}$): $\mathrm{f}(x) = ${sumTex([[a, 'x'], [c - a * b, '']])}$. Left arm ($x < ${b}$): $\mathrm{f}(x) = ${sumTex([[-a, 'x'], [c + a * b, '']])}$.`, 'Set each equal to the line and solve.'],
          errors: [err('one-arm', ans.list([ans.exact(exq(xR))], { v: 'x' }), 'The line crosses both arms of the V: solve for the left arm too.', 2)],
          solution: [md`$${sumTex([[a, 'x'], [c - a * b, '']])} = ${lTex} \Rightarrow x = ${xR.toLatex()}$`, md`$${sumTex([[-a, 'x'], [c + a * b, '']])} = ${lTex} \Rightarrow x = ${xL.toLatex()}$`, md`$${answerTex(L)}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`Hence, or otherwise, find the set of values of $x$ for which $\mathrm{f}(x) ${op} ${lTex}$, giving your answer in set notation.`,
          answer: I,
          scheme: [M1('Uses the two values from (c) as critical values'), dM1(inside ? 'Chooses the region between them (graph below the line)' : 'Chooses the regions outside them (graph on or above the line)'), A1(md`$${answerTex(I)}$`)],
          hints: ['Look at the sketch: where is the V below the line?', md`The V and the line cross at $x = ${xL.toLatex()}$ and $x = ${xR.toLatex()}$.`, inside ? 'Between the crossing points the V is below the line.' : 'Outside the crossing points the V is above the line; include the crossing points themselves.'],
          errors: [err('wrong-region', ans.interval(inside ? [iv(neg(INF), exq(xL), false, false), iv(exq(xR), INF, false, false)] : [iv(exq(xL), exq(xR), true, true)], 'x', { setNotation: true }), 'Check the sketch: you have the wrong side of the crossing points.', 1)],
          solution: [md`The V is ${inside ? 'below' : 'above'} $l$ ${inside ? 'between' : 'outside'} $x = ${xL.toLatex()}$ and $x = ${xR.toLatex()}$.`, md`$${answerTex(I)}$`],
        }),
      ],
      params: { a, b, c, m, k, op },
    };
  },
  verify(inst) {
    const { a, b, c, m, k, op } = inst.params as { a: number; b: number; c: number; m: number; k: number; op: string };
    const f = (x: number) => a * Math.abs(x - b) + c;
    const V = inst.parts[0].answer as CoordSpec;
    const vx = evaluate((V.x as ExactSpec).value),
      vy = evaluate((V.y as ExactSpec).value);
    for (let x = -20; x <= 20; x += 0.1) expect(f(x) >= vy - 1e-9, 'vertex is the minimum');
    expectClose(f(vx), vy, 'vertex on the graph');
    const xs = (inst.parts[2].answer as ListSpec).items.map((i) => evaluate((i as ExactSpec).value));
    for (const x of xs) expectClose(f(x) + 50, m * x + k + 50, 'meets the line');
    const S = toNumSet((inst.parts[3].answer as IntervalSpec).set);
    for (let x = -30; x <= 30; x += 0.07) {
      const d = f(x) - (m * x + k);
      if (Math.abs(d) < 1e-9) continue;
      expect(contains(S, x) === (op === '<' ? d < 0 : d > 0), `inequality at ${x}`);
    }
  },
});

export default [longModulus] satisfies Template[];
