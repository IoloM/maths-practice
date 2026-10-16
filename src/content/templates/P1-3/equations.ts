/** Pure Year 1, Chapter 3 — simultaneous equations and inequalities. */
import { Q, gcd } from '../../../engine/core/rational';
import { evaluate, num, neg, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import { contains, toNumSet } from '../../../engine/marking/intervals';
import type { CoordSpec, ExactSpec, IntervalSpec, ListSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { linTex, sumTex } from '../shared/calculus';

const INF = sym('infty');
const exV = (s: ExactSpec) => evaluate(s.value);

const linearSim = defineTemplate({
  id: 'p1.3.linear-simultaneous',
  family: 'p1.3.simultaneous',
  title: 'Linear simultaneous equations',
  spec: ['P2.4'],
  chapter: 'P1.3',
  sections: ['3.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Solve'],
  tags: ['simultaneous equations', 'elimination'],
  generate(r) {
    const x = r.int(-6, 6),
      y = r.int(-6, 6);
    const a = r.intNZ(-5, 5),
      b = r.intNZ(-5, 5),
      c = r.intNZ(-5, 5),
      d = r.intNZ(-5, 5);
    r.require(a * d - b * c !== 0);
    const e1 = `${sumTex([[a, 'x'], [b, 'y']])} = ${a * x + b * y}`,
      e2 = `${sumTex([[c, 'x'], [d, 'y']])} = ${c * x + d * y}`;
    const C: CoordSpec = ans.coord(ans.exact(num(x)), ans.exact(num(y)), { label: '(x, y) =' });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Solve the simultaneous equations $${e1}$ and $${e2}$. Give your answer as $(x, y)$.`,
          answer: C,
          scheme: [M1('Eliminates one variable (or substitutes)'), A1(md`$x = ${x}$ or $y = ${y}$`), A1(md`$${answerTex(C)}$`)],
          hints: ['Multiply one or both equations so that one variable has the same coefficient.', 'Add or subtract the equations to eliminate it.', 'Substitute back to find the other variable.'],
          solution: [md`Eliminating gives $x = ${x}$; substituting gives $y = ${y}$.`, md`$${answerTex(C)}$`],
        }),
      ],
      params: { a, b, c, d, rhs: [a * x + b * y, c * x + d * y] },
    };
  },
  verify(inst) {
    const { a, b, c, d, rhs } = inst.params as { a: number; b: number; c: number; d: number; rhs: number[] };
    const C = inst.parts[0].answer as CoordSpec;
    const x = exV(C.x as ExactSpec),
      y = exV(C.y as ExactSpec);
    expectClose(a * x + b * y, rhs[0], 'eq1');
    expectClose(c * x + d * y, rhs[1], 'eq2');
  },
});

const linQuad = defineTemplate({
  id: 'p1.3.linear-quadratic-simultaneous',
  family: 'p1.3.simultaneous',
  title: 'One linear and one quadratic equation',
  spec: ['P2.4', 'P2.3'],
  chapter: 'P1.3',
  sections: ['3.2'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Solve'],
  tags: ['simultaneous equations', 'substitution', 'quadratics'],
  generate(r) {
    // line y = mx + k, curve y = x² + px + q meeting at x1, x2
    const x1 = r.int(-4, 4),
      x2 = r.intExcept(-4, 5, [x1]);
    const m = r.intNZ(-3, 4),
      k = r.int(-6, 6);
    // x² + px + q − (mx + k) = (x − x1)(x − x2)
    const p = m - (x1 + x2),
      q = k + x1 * x2;
    const yv = (x: number) => m * x + k;
    const Lx = ans.list([ans.exact(num(x1)), ans.exact(num(x2))], { v: 'x' });
    const Ly = ans.list([ans.exact(num(yv(x1))), ans.exact(num(yv(x2)))], { v: 'y' });
    const lineTex = `y = ${linTex(m, k)}`,
      curveTex = `y = ${sumTex([[1, 'x^{2}'], [p, 'x'], [q, '']])}`;
    return {
      stem: md`Solve the simultaneous equations $${lineTex}$ and $${curveTex}$.`,
      parts: [
        part({ label: 'a', marks: 4, prompt: 'Find the values of x.', answer: Lx, scheme: [M1('Substitutes the linear equation into the quadratic'), A1(md`$${sumTex([[1, 'x^{2}'], [-(x1 + x2), 'x'], [x1 * x2, '']])} = 0$`), dM1('Solves the quadratic'), A1(md`$${answerTex(Lx)}$`)], hints: ['Set the two expressions for y equal.', 'Rearrange to a quadratic equal to zero.', md`$${sumTex([[1, 'x^{2}'], [p, 'x'], [q, '']])} = ${linTex(m, k)}$`], solution: [md`$${sumTex([[1, 'x^{2}'], [p, 'x'], [q, '']])} = ${linTex(m, k)} \Rightarrow ${sumTex([[1, 'x^{2}'], [-(x1 + x2), 'x'], [x1 * x2, '']])} = 0$`, md`$${answerTex(Lx)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the corresponding values of y.', answer: Ly, scheme: [M1('Substitutes x values into the linear equation'), A1(md`$${answerTex(Ly)}$`)], hints: ['Use the simpler (linear) equation.', md`$y = ${linTex(m, k)}$`, 'One y for each x.'], solution: [md`$x = ${x1}$: $y = ${yv(x1)}$; $x = ${x2}$: $y = ${yv(x2)}$`, md`$${answerTex(Ly)}$`] }),
      ],
      params: { m, k, p, q },
    };
  },
  verify(inst) {
    const { m, k, p, q } = inst.params as Record<string, number>;
    for (const it of (inst.parts[0].answer as ListSpec).items) {
      const x = exV(it as ExactSpec);
      expectClose(x * x + p * x + q, m * x + k, 'meets');
    }
  },
});

const tangency = defineTemplate({
  id: 'p1.3.line-tangent-to-curve',
  family: 'p1.3.simultaneous',
  title: 'Find k so that a line is a tangent to a curve',
  spec: ['P2.4', 'P2.3'],
  chapter: 'P1.3',
  sections: ['3.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Find'],
  tags: ['simultaneous equations', 'discriminant', 'tangent'],
  generate(r) {
    // y = x² + bx + c and y = mx + k tangent: x² + (b − m)x + (c − k) = 0 has disc 0 → k = c − (b − m)²/4
    const b = r.int(-6, 6),
      c = r.int(-8, 8),
      m = r.intNZ(-5, 5);
    r.require((b - m) % 2 === 0);
    const k = c - ((b - m) * (b - m)) / 4;
    const xt = -(b - m) / 2;
    const A = ans.list([ans.exact(num(k))], { v: 'k' });
    return {
      stem: md`The line $y = ${linTex(m, 0) === '0' ? '' : `${m === 1 ? '' : m === -1 ? '-' : m}x`} + k$ is a tangent to the curve $y = ${sumTex([[1, 'x^{2}'], [b, 'x'], [c, '']])}$.`,
      parts: [
        part({ marks: 5, prompt: md`Find the value of $k$.`, answer: A, scheme: [M1('Equates and rearranges to a quadratic'), A1(md`$x^{2} ${b - m < 0 ? '-' : '+'} ${Math.abs(b - m)}x + ${c} - k = 0$`.replace('+ 0x', '')), M1(md`Uses $b^{2} - 4ac = 0$`), dM1('Solves for k'), A1(md`$k = ${k}$`)], hints: ['A tangent meets the curve at exactly one point.', 'Set the equations equal and rearrange into a quadratic in x.', 'For exactly one root, the discriminant must be zero.'], solution: [md`$x^{2} + ${b - m}x + (${c} - k) = 0$`, md`$b^{2} - 4ac = ${(b - m) ** 2} - 4(${c} - k) = 0 \Rightarrow ${answerTex(A)}$`, md`(The point of contact is at $x = ${xt}$.)`] }),
      ],
      params: { b, c, m },
    };
  },
  verify(inst) {
    const { b, c, m } = inst.params as Record<string, number>;
    const k = exV((inst.parts[0].answer as ListSpec).items[0] as ExactSpec);
    const D = (b - m) ** 2 - 4 * (c - k);
    expectClose(D, 0, 'discriminant zero', 1e-12);
  },
});

const linearIneq = defineTemplate({
  id: 'p1.3.linear-inequality',
  family: 'p1.3.inequalities',
  title: 'Solve a linear inequality',
  spec: ['P2.5'],
  chapter: 'P1.3',
  sections: ['3.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 2,
  time: 2,
  commands: ['Solve'],
  tags: ['inequalities', 'linear'],
  generate(r) {
    const a = r.intNZ(-6, 6),
      b = r.int(-10, 10),
      c = r.intExcept(-6, 6, [a]),
      d = r.int(-10, 10);
    const op = r.pick(['<', '>', '\\leqslant', '\\geqslant'] as const);
    const coef = a - c;
    const bound = Q.of(d - b, coef);
    // ax + b op cx + d → (a − c)x op d − b → flip if negative
    const flip = coef < 0;
    const strict = op === '<' || op === '>';
    const less = (op === '<' || op === '\\leqslant') !== flip;
    const set = less ? [iv(neg(INF), num(bound), false, !strict)] : [iv(num(bound), INF, !strict, false)];
    const I = ans.interval(set, 'x');
    return {
      parts: [
        part({
          marks: 2,
          prompt: md`Solve $${linTex(a, b)} ${op} ${linTex(c, d)}$.`,
          answer: I,
          scheme: [M1('Collects x terms and constants'), A1(md`$${answerTex(I)}$`)],
          hints: ['Collect the x terms on one side and the numbers on the other.', 'If you multiply or divide by a negative number, reverse the inequality sign.', md`$${coef}x ${op} ${d - b}$`],
          errors: [err('no-flip', ans.interval(less ? [iv(num(bound), INF, !strict, false)] : [iv(neg(INF), num(bound), false, !strict)], 'x'), 'Dividing by a negative number reverses the inequality sign.', 1)],
          solution: [md`$${coef}x ${op} ${d - b}$`, md`$${answerTex(I)}$`],
        }),
      ],
      params: { a, b, c, d, op },
    };
  },
  verify(inst) {
    const { a, b, c, d, op } = inst.params as { a: number; b: number; c: number; d: number; op: string };
    const S = toNumSet((inst.parts[0].answer as IntervalSpec).set);
    for (let x = -20; x <= 20; x += 0.3) {
      const L = a * x + b,
        R = c * x + d;
      if (Math.abs(L - R) < 1e-9) continue;
      const truth = op === '<' ? L < R : op === '>' ? L > R : op === '\\leqslant' ? L <= R : L >= R;
      expect(contains(S, x) === truth, `x = ${x}`);
    }
  },
});

const quadIneq = defineTemplate({
  id: 'p1.3.quadratic-inequality',
  family: 'p1.3.inequalities',
  title: 'Solve a quadratic inequality',
  spec: ['P2.5', 'P2.3'],
  chapter: 'P1.3',
  sections: ['3.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 4,
  time: 5,
  commands: ['Find', 'Solve'],
  tags: ['inequalities', 'quadratics', 'set notation'],
  generate(r) {
    const a = r.pick([1, 1, 2, 3, -1]);
    const p = r.int(-6, 5),
      q = r.intExcept(-5, 7, [p]);
    const [lo, hi] = [Math.min(p, q), Math.max(p, q)];
    const poly = [a * p * q, -a * (p + q), a];
    const op = r.pick(['<', '>', '\\leqslant', '\\geqslant'] as const);
    const strict = op === '<' || op === '>';
    const negWanted = op === '<' || op === '\\leqslant';
    const inside = negWanted === a > 0;
    const set = inside ? [iv(num(lo), num(hi), !strict, !strict)] : [iv(neg(INF), num(lo), false, !strict), iv(num(hi), INF, !strict, false)];
    const useSet = r.bool(0.4);
    const I = ans.interval(set, 'x', { setNotation: useSet });
    const qTex = sumTex([[poly[2], 'x^{2}'], [poly[1], 'x'], [poly[0], '']]);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Find the set of values of $x$ for which $${qTex} ${op} 0$${useSet ? ', giving your answer in set notation' : ''}.`,
          answer: I,
          scheme: [M1('Finds the critical values'), A1(md`$x = ${lo}$, $x = ${hi}$`), M1(inside ? 'Chooses the inside region' : 'Chooses the outside region'), A1(md`$${answerTex(I)}$`)],
          hints: ['Find where the quadratic equals zero (critical values).', md`Sketch $y = ${qTex}$: it is ${a > 0 ? 'U' : '∩'}-shaped.`, md`You need where the graph is ${negWanted ? 'below' : 'above'} the $x$-axis.`],
          errors: [err('wrong-region', ans.interval(inside ? [iv(neg(INF), num(lo), false, !strict), iv(num(hi), INF, !strict, false)] : [iv(num(lo), num(hi), !strict, !strict)], 'x'), 'Check the region with a sketch: you have chosen the wrong side of the critical values.', 2)],
          solution: [md`$${qTex} = 0$ when $x = ${lo}$ or $x = ${hi}$.`, md`$${answerTex(I)}$`],
        }),
      ],
      params: { poly, op },
    };
  },
  verify(inst) {
    const { poly, op } = inst.params as { poly: number[]; op: string };
    const S = toNumSet((inst.parts[0].answer as IntervalSpec).set);
    for (let x = -12; x <= 12; x += 0.13) {
      const v = poly[0] + poly[1] * x + poly[2] * x * x;
      if (Math.abs(v) < 1e-9) continue;
      const truth = op === '<' ? v < 0 : op === '>' ? v > 0 : op === '\\leqslant' ? v <= 0 : v >= 0;
      expect(contains(S, x) === truth, `x = ${x}`);
    }
  },
});

const combined = defineTemplate({
  id: 'p1.3.combined-inequalities',
  family: 'p1.3.inequalities',
  title: 'Values satisfying a linear and a quadratic inequality',
  spec: ['P2.5'],
  chapter: 'P1.3',
  sections: ['3.4', '3.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 6,
  time: 8,
  commands: ['Find'],
  tags: ['inequalities', 'set notation', 'intersection'],
  generate(r) {
    const p = r.int(-5, 2),
      q = r.int(p + 3, 8);
    const c = r.int(p + 1, q - 1);
    // (x − p)(x − q) < 0 and x > c (or x < c)
    const right = r.bool();
    const set = right ? [iv(num(c), num(q), false, false)] : [iv(num(p), num(c), false, false)];
    const I = ans.interval(set, 'x', { setNotation: true });
    const a = r.pick([2, 3]);
    const lin = right ? `${a}x - ${a * c} > 0` : `${a * c} - ${a}x > 0`;
    const qTex = sumTex([[1, 'x^{2}'], [-(p + q), 'x'], [p * q, '']]);
    return {
      parts: [
        part({
          marks: 6,
          prompt: md`Find the set of values of $x$ for which both $${lin}$ and $${qTex} < 0$. Give your answer in set notation.`,
          answer: I,
          scheme: [B1(md`Linear: $x ${right ? '>' : '<'} ${c}$`), M1('Critical values of the quadratic'), A1(md`$${p} < x < ${q}$`), M1('Combines the two regions'), A1(md`Correct intersection`), A1(md`$${answerTex(I)}$`)],
          hints: ['Solve each inequality separately.', 'A number line helps you see where both are true.', md`Quadratic: $${p} < x < ${q}$.`],
          solution: [md`$x ${right ? '>' : '<'} ${c}$ and $${p} < x < ${q}$`, md`Both: $${answerTex(I)}$`],
        }),
      ],
      params: { p, q, c, right },
    };
  },
  verify(inst) {
    const { p, q, c, right } = inst.params as { p: number; q: number; c: number; right: boolean };
    const S = toNumSet((inst.parts[0].answer as IntervalSpec).set);
    for (let x = -10; x <= 10; x += 0.17) {
      const truth = (x - p) * (x - q) < 0 && (right ? x > c : x < c);
      if ([p, q, c].some((v) => Math.abs(x - v) < 1e-9)) continue;
      expect(contains(S, x) === truth, `x = ${x}`);
    }
  },
});

const fractionIneq = defineTemplate({
  id: 'p1.3.inequality-with-fraction',
  family: 'p1.3.inequalities',
  title: 'Inequality with x in the denominator',
  spec: ['P2.5'],
  chapter: 'P1.3',
  sections: ['3.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 4,
  time: 6,
  commands: ['Solve'],
  tags: ['inequalities', 'fractions', 'multiply by x squared'],
  generate(r) {
    const a = r.intNZ(-12, 12),
      b = r.intNZ(-6, 6);
    const t = Q.of(a, b);
    const op = r.pick(['<', '>'] as const);
    // a/x op b, x ≠ 0 → multiply by x²: a x op b x² → b x² − a x (op reversed) 0 → x(bx − a) ...
    // solution: analyse sign of g(x) = a/x − b
    const crit = [0, t.value].sort((u, v) => u - v);
    const test = (x: number) => (op === '<' ? a / x < b : a / x > b);
    const mid = (crit[0] + crit[1]) / 2;
    const insideTrue = test(mid);
    const lo = crit[0] === 0 ? num(0) : num(t),
      hi = crit[1] === 0 ? num(0) : num(t);
    const set = insideTrue ? [iv(lo, hi, false, false)] : [iv(neg(INF), lo, false, false), iv(hi, INF, false, false)];
    const I = ans.interval(set, 'x');
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Solve $\dfrac{${a}}{x} ${op} ${b}$, $x \neq 0$.`,
          answer: I,
          scheme: [M1(md`Multiplies both sides by $x^{2}$`), A1(md`$${a}x ${op} ${b}x^{2}$`), M1(md`Critical values $x = 0$ and $x = ${t.toLatex()}$`), A1(md`$${answerTex(I)}$`)],
          hints: [md`You cannot multiply by $x$ (it could be negative). Multiply by $x^{2}$, which is always positive.`, md`$${a}x ${op} ${b}x^{2}$`, 'Rearrange, factorise and sketch.'],
          errors: [err('times-x', ans.interval(op === '<' ? (b > 0 ? [iv(num(t), INF, false, false)] : [iv(neg(INF), num(t), false, false)]) : b > 0 ? [iv(neg(INF), num(t), false, false)] : [iv(num(t), INF, false, false)], 'x'), 'Multiplying by x assumes x is positive. Multiply by x² instead.', 1)],
          solution: [md`$\times x^{2}$: $${a}x ${op} ${b}x^{2}$, so $x(${sumTex([[b, 'x'], [-a, '']])}) ${op === '<' ? '>' : '<'} 0$`, md`$${answerTex(I)}$`],
        }),
      ],
      params: { a, b, op },
    };
  },
  verify(inst) {
    const { a, b, op } = inst.params as { a: number; b: number; op: string };
    const S = toNumSet((inst.parts[0].answer as IntervalSpec).set);
    for (let x = -15; x <= 15; x += 0.093) {
      if (Math.abs(x) < 1e-6 || Math.abs(x - a / b) < 1e-6) continue;
      expect(contains(S, x) === (op === '<' ? a / x < b : a / x > b), `x = ${x}`);
    }
  },
});

void gcd;
void dM1;

const templates: Template[] = [linearSim, linQuad, tangency, linearIneq, quadIneq, combined, fractionIneq];
export default templates;
