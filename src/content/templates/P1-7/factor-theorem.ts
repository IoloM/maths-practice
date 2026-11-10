/** Pure Year 1, Chapter 7 — more factor theorem: show a factor and solve, one real root, and a long exam-style question. */
import { Q, surdSimplify } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import { contains, toNumSet } from '../../../engine/marking/intervals';
import type { ChoiceSpec, ExactSpec, ExprSpec, IntervalSpec, ListSpec } from '../../../engine/marking/types';
import { A1, A1cso, B1, M1, dM1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const INF = sym('infty');
/** (x − r) as LaTeX; x when r = 0. */
const fac = (r: number) => (r === 0 ? 'x' : `(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})`);
/** (kx − s) as LaTeX. */
const facK = (k: number, s: number) => (k === 1 ? fac(s) : `(${k}x ${s < 0 ? '+' : '-'} ${Math.abs(s)})`);
const cubicTex = (f: Poly) => sumTex([[f.coef(3), 'x^{3}'], [f.coef(2), 'x^{2}'], [f.coef(1), 'x'], [f.coef(0), '']]);
const quadTex = (f: Poly) => sumTex([[f.coef(2), 'x^{2}'], [f.coef(1), 'x'], [f.coef(0), '']]);
const exV = (s: ExactSpec) => evaluate(s.value);
/** Exact root as an answer: rational. */
const rootQ = (q: Q) => ans.exact(num(q));
/** −m ± s√r as LaTeX. */
const surdRoot = (m: number, s: number, rr: number, sign: 1 | -1) => `${m === 0 ? '' : String(-m)} ${sign > 0 ? (m === 0 ? '' : '+') : '-'} ${s === 1 ? '' : s}\\sqrt{${rr}}`.trim();

/** (a) show (x − r) is a factor, (b) hence solve f(x) = 0 — rational or surd roots. */
const showAndSolve = defineTemplate({
  id: 'p1.7.factor-theorem-show-and-solve',
  family: 'p1.7.factor-theorem',
  title: 'Show that (x − a) is a factor, then solve the cubic',
  spec: ['P2.6', 'P2.3'],
  chapter: 'P1.7',
  sections: ['7.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 7,
  commands: ['Show that', 'Hence', 'Solve'],
  tags: ['factor theorem', 'polynomials', 'solving cubics'],
  generate(r) {
    const root = r.intNZ(-4, 4);
    const kind = r.pick(['integer', 'rational', 'surd'] as const);
    let quad: Poly;
    let roots: ExactSpec[];
    let rootsTex: string;
    if (kind === 'integer') {
      const [b, c] = [r.intExcept(-5, 5, [root]), r.intExcept(-5, 5, [root])];
      r.require(b !== c);
      quad = Poly.fromRoots([b, c]);
      roots = [rootQ(Q.of(root)), rootQ(Q.of(b)), rootQ(Q.of(c))];
      rootsTex = `x = ${root}, \\; x = ${b}, \\; x = ${c}`;
    } else if (kind === 'rational') {
      const k = r.pick([2, 3]);
      const s = r.intNZ(-5, 5);
      r.require(s % k !== 0);
      const b = r.intExcept(-4, 4, [root]);
      quad = Poly.fromRoots([b]).mul(Poly.coeffs([-s, k]));
      roots = [rootQ(Q.of(root)), rootQ(Q.of(b)), rootQ(Q.of(s, k))];
      rootsTex = `x = ${root}, \\; x = ${b}, \\; x = ${Q.of(s, k).toLatex()}`;
    } else {
      // x² + 2mx + c with m² − c > 0 not a square: roots −m ± √(m² − c)
      const m = r.int(-3, 3),
        c = r.int(-6, 6);
      const D = m * m - c;
      r.require(D > 1 && !Number.isInteger(Math.sqrt(D)));
      quad = Poly.coeffs([c, 2 * m, 1]);
      const [s, rr] = surdSimplify(D);
      roots = [rootQ(Q.of(root)), ans.exact(ex(surdRoot(m, s, rr, 1)), ['exact']), ans.exact(ex(surdRoot(m, s, rr, -1)), ['exact'])];
      rootsTex = `x = ${root}, \\; x = ${surdRoot(m, s, rr, 1)}, \\; x = ${surdRoot(m, s, rr, -1)}`;
    }
    const f = Poly.fromRoots([root]).mul(quad);
    r.require(f.coef(0).value !== 0);
    const fTex = cubicTex(f);
    const terms = [3, 2, 1, 0].map((e) => `${f.coef(e).mul(Q.of(root).pow(e)).toLatex()}`);
    const L: ListSpec = ans.list(roots, { v: 'x' });
    const missing = ans.list(roots.slice(1), { v: 'x' });
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Use the factor theorem to show that $${fac(root)}$ is a factor of $\mathrm{f}(x)$.`,
          answer: ans.self(md`$\mathrm{f}(${root}) = ${terms.join(' + ').replace(/\+ -/g, '- ')} = 0$, so $${fac(root)}$ is a factor of $\mathrm{f}(x)$.`),
          scheme: [M1(md`Attempts $\mathrm{f}(${root})$`), A1cso(md`$\mathrm{f}(${root}) = 0$ and a conclusion: so $${fac(root)}$ is a factor`)],
          hints: [md`If $\mathrm{f}(a) = 0$ then $(x - a)$ is a factor.`, md`Substitute $x = ${root}$ into $\mathrm{f}(x)$.`, 'Show every term, get 0, then say what that means.'],
          solution: [md`$\mathrm{f}(${root}) = ${terms.join(' + ').replace(/\+ -/g, '- ')} = 0$`, md`So $${fac(root)}$ is a factor of $\mathrm{f}(x)$.`],
        }),
        part({
          label: 'b',
          marks: 4,
          prompt: md`Hence solve $\mathrm{f}(x) = 0$${kind === 'surd' ? ', giving the roots in exact form' : ''}.`,
          answer: L,
          scheme: [M1(md`Divides by $${fac(root)}$ or compares coefficients`), A1(md`$${quadTex(quad)}$`), dM1(kind === 'surd' ? 'Solves the quadratic: formula or completing the square' : 'Factorises the quadratic'), A1(md`$${rootsTex}$`)],
          hints: ['Divide f(x) by the factor from (a) to get a quadratic.', md`$\mathrm{f}(x) = ${fac(root)}\left(${quadTex(quad)}\right)$`, kind === 'surd' ? 'The quadratic does not factorise: complete the square or use the formula.' : 'Factorise the quadratic and set each factor to zero.'],
          errors: [err('missed-root', missing, md`Don't forget $x = ${root}$, from the factor in (a).`, 3)],
          solution: [md`$\mathrm{f}(x) = ${fac(root)}\left(${quadTex(quad)}\right)$`, md`$${rootsTex}$`],
        }),
      ],
      params: { c: [0, 1, 2, 3].map((e) => f.coef(e).value), root },
    };
  },
  verify(inst) {
    const { c, root } = inst.params as { c: number[]; root: number };
    const f = (x: number) => c[0] + c[1] * x + c[2] * x * x + c[3] * x ** 3;
    expectClose(f(root), 0, 'f(root) = 0', 1e-9);
    const items = (inst.parts[1].answer as ListSpec).items as ExactSpec[];
    expect(items.length === 3, 'three roots');
    for (const it of items) expect(Math.abs(f(exV(it))) < 1e-7, `root ${exV(it)}`);
    const vals = items.map(exV).sort((a, b) => a - b);
    expect(vals[1] - vals[0] > 1e-9 && vals[2] - vals[1] > 1e-9, 'distinct roots');
  },
});

/** (a) show a factor, (b) quadratic factor, (c) why only one real root, (d) the root. */
const oneRealRoot = defineTemplate({
  id: 'p1.7.factor-theorem-one-real-root',
  family: 'p1.7.factor-theorem',
  title: 'Factor theorem, then show a cubic has only one real root',
  spec: ['P2.6', 'P2.3'],
  chapter: 'P1.7',
  sections: ['7.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Show that', 'Find', 'Hence', 'Write down'],
  tags: ['factor theorem', 'discriminant', 'polynomials'],
  generate(r) {
    const root = r.intNZ(-4, 4);
    const a = r.pick([1, 1, 2, 3]),
      b = r.int(-5, 5),
      c = r.int(1, 9);
    const disc = b * b - 4 * a * c;
    r.require(disc < 0);
    const quad = Poly.coeffs([c, b, a]);
    const f = Poly.fromRoots([root]).mul(quad);
    const fTex = cubicTex(f);
    const terms = [3, 2, 1, 0].map((e) => `${f.coef(e).mul(Q.of(root).pow(e)).toLatex()}`);
    const QF: ExprSpec = ans.expr(quad.toExpr(), ['x'], { forms: ['expanded'] });
    const why = [
      md`The discriminant of the quadratic factor is $${disc} < 0$, so it has no real roots; the only real root comes from $${fac(root)}$.`,
      md`The discriminant of the quadratic factor is $${disc} < 0$, so the quadratic factor has a repeated root.`,
      md`The discriminant of the quadratic factor is $${-disc} > 0$, so $\mathrm{g}(x) = 0$ has two real roots.`,
      md`A cubic always has exactly one real root.`,
    ];
    const C: ChoiceSpec = ans.choice(why, 0);
    const R: ExactSpec = ans.exact(num(root));
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 2,
          prompt: md`Use the factor theorem to show that $${fac(root)}$ is a factor of $\mathrm{f}(x)$.`,
          answer: ans.self(md`$\mathrm{f}(${root}) = ${terms.join(' + ').replace(/\+ -/g, '- ')} = 0$, so $${fac(root)}$ is a factor.`),
          scheme: [M1(md`Attempts $\mathrm{f}(${root})$`), A1cso(md`$\mathrm{f}(${root}) = 0$, so $${fac(root)}$ is a factor`)],
          hints: [md`If $\mathrm{f}(a) = 0$ then $(x - a)$ is a factor.`, md`Substitute $x = ${root}$.`, 'Show it comes to 0, then conclude.'],
          solution: [md`$\mathrm{f}(${root}) = ${terms.join(' + ').replace(/\+ -/g, '- ')} = 0$, so $${fac(root)}$ is a factor.`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the quadratic $\mathrm{g}(x)$ such that $\mathrm{f}(x) = ${fac(root)}\,\mathrm{g}(x)$.`,
          answer: QF,
          scheme: [M1('Divides, or compares coefficients'), A1(md`$${answerTex(QF)}$`)],
          hints: ['Divide f(x) by the factor.', md`The first term of $\mathrm{g}(x)$ is $${a === 1 ? '' : a}x^{2}$.`, 'Check by expanding.'],
          solution: [md`$\mathrm{f}(x) = ${fac(root)}\left(${quadTex(quad)}\right)$`],
        }),
        part({
          label: 'c',
          marks: 2,
          prompt: md`Hence explain why the equation $\mathrm{f}(x) = 0$ has only one real root.`,
          answer: C,
          scheme: [M1(md`Discriminant of $\mathrm{g}(x)$: $${b * b} - ${4 * a * c} = ${disc}$`), A1('Negative, so no real roots from g: one real root only')],
          hints: [md`A quadratic $ax^{2} + bx + c$ has no real roots when $b^{2} - 4ac < 0$.`, md`Work out $b^{2} - 4ac$ for $\mathrm{g}(x)$.`, md`$(${b})^{2} - 4(${a})(${c}) = ${disc}$`],
          solution: [md`$b^{2} - 4ac = ${disc} < 0$, so $\mathrm{g}(x) = 0$ has no real roots; the only real root is from $${fac(root)}$.`],
        }),
        part({
          label: 'd',
          marks: 1,
          prompt: md`Write down the real root of $\mathrm{f}(x) = 0$.`,
          answer: R,
          scheme: [B1(md`$x = ${root}$`)],
          hints: ['It comes from the linear factor.', md`Solve $${fac(root)} = 0$.`, md`$x = ${root}$`],
          errors: [err('sign', ans.exact(num(-root)), md`$${fac(root)} = 0$ when $x = ${root}$: watch the sign.`)],
          solution: [md`$x = ${root}$`],
        }),
      ],
      params: { c: [0, 1, 2, 3].map((e) => f.coef(e).value), root, abc: [a, b, c] },
    };
  },
  verify(inst) {
    const { c, root, abc } = inst.params as { c: number[]; root: number; abc: number[] };
    const f = (x: number) => c[0] + c[1] * x + c[2] * x * x + c[3] * x ** 3;
    expectClose(f(root), 0, 'f(root) = 0', 1e-9);
    const g = (inst.parts[1].answer as ExprSpec).value;
    for (const x of [-2.3, 0.4, 3.7]) expectClose(evaluate(g, { x }) * (x - root), f(x), 'f = (x − r) g');
    expect(abc[1] ** 2 - 4 * abc[0] * abc[2] < 0, 'no other real roots');
    // f changes sign only once
    let changes = 0;
    for (let x = -20; x < 20; x += 0.01) if (Math.sign(f(x)) !== Math.sign(f(x + 0.01)) && f(x + 0.01) !== 0) changes++;
    expect(changes === 1, 'exactly one real root');
  },
});

/** Long: two conditions give two constants; factorise; a cubic inequality. */
const longFactor = defineTemplate({
  id: 'p1.7.long-factor-theorem-and-inequality',
  family: 'p1.7.factor-theorem',
  title: 'Exam-style: find two constants from a factor and a point, factorise, then a cubic inequality',
  spec: ['P2.6', 'P2.5', 'P2.7'],
  chapter: 'P1.7',
  sections: ['7.3'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 11,
  time: 13,
  commands: ['Find', 'Hence', 'Factorise'],
  tags: ['exam-style', 'factor theorem', 'simultaneous equations', 'inequalities'],
  generate(r) {
    const k = r.pick([1, 1, 2]);
    const r1 = r.intNZ(-4, 4);
    const r2 = r.intExcept(-4, 4, [r1]);
    const s = r.intExcept(-5, 5, k === 1 ? [r1, r2] : []);
    r.require(k === 1 || s % 2 !== 0);
    const f = Poly.fromRoots([r1, r2]).mul(Poly.coeffs([-s, k]));
    const lead = f.coef(3).value,
      d = f.coef(0).value,
      p = f.coef(2).value,
      q = f.coef(1).value;
    r.require(p !== 0 && q !== 0 && d !== 0);
    // a point on the curve, not a root, to pin down the second equation
    const x0 = r.intExcept(-3, 3, [0, r1, r2, k === 1 ? s : 999]);
    const y0 = f.eval(x0);
    r.require(y0 !== 0 && Math.abs(y0) <= 200);
    const roots = [Q.of(r1), Q.of(r2), Q.of(s, k)].sort((a, b) => a.cmp(b));
    const [lo, mid, hi] = roots;
    const op = r.pick(['>', '<', '\\geqslant', '\\leqslant'] as const);
    const strict = op === '<' || op === '>';
    const positive = op === '>' || op === '\\geqslant';
    // leading coefficient positive: f > 0 on (lo, mid) ∪ (hi, ∞)
    const set = positive ? [iv(num(lo), num(mid), !strict, !strict), iv(num(hi), INF, !strict, false)] : [iv(neg(INF), num(lo), false, !strict), iv(num(mid), num(hi), !strict, !strict)];
    const wrongSide = positive ? [iv(neg(INF), num(lo), false, !strict), iv(num(mid), num(hi), !strict, !strict)] : [iv(num(lo), num(mid), !strict, !strict), iv(num(hi), INF, !strict, false)];
    const I: IntervalSpec = ans.interval(set, 'x', { setNotation: true });
    const P: ExactSpec = ans.exact(num(p)),
      Qa: ExactSpec = ans.exact(num(q));
    const factTex = `${fac(r1)}${fac(r2)}${facK(k, s)}`;
    // what f(−r1) = 0 (the wrong sign) would give for p
    const wrongDen = r1 * r1 * x0 + x0 * x0 * r1;
    const FE: ExprSpec = ans.expr(ex(factTex), ['x'], { forms: ['fully-factorised'], domain: { x: [-5, 5] } });
    const fTex = sumTex([[lead, 'x^{3}'], [1, 'px^{2}'], [1, 'qx'], [d, '']]);
    // equations: f(r1) = 0 and f(x0) = y0, rearranged for p and q
    const e1 = `${r1 * r1}p ${r1 < 0 ? '-' : '+'} ${Math.abs(r1)}q = ${-(lead * r1 ** 3 + d)}`.replace(/^1p/, 'p').replace(/ 1q/, ' q');
    const e2 = `${x0 * x0}p ${x0 < 0 ? '-' : '+'} ${Math.abs(x0)}q = ${y0 - lead * x0 ** 3 - d}`.replace(/^1p/, 'p').replace(/ 1q/, ' q');
    return {
      stem: md`$\mathrm{f}(x) = ${fTex}$, where $p$ and $q$ are constants. Given that $${fac(r1)}$ is a factor of $\mathrm{f}(x)$, and that the curve $y = \mathrm{f}(x)$ passes through the point $(${x0}, ${y0})$,`,
      parts: [
        part({
          label: 'a',
          marks: 4,
          prompt: md`find the value of $p$`,
          answer: P,
          scheme: [M1(md`Uses $\mathrm{f}(${r1}) = 0$: $${e1}$`), M1(md`Uses $\mathrm{f}(${x0}) = ${y0}$: $${e2}$`), dM1('Solves the two equations simultaneously'), A1(md`$p = ${p}$`)],
          hints: [md`The factor theorem gives one equation: $\mathrm{f}(${r1}) = 0$. The point gives another.`, md`$${e1}$ and $${e2}$`, 'Eliminate q, then solve for p.'],
          errors: wrongDen === 0 ? [] : [err('sign-of-root', ans.exact(num(Q.of(-(lead * (-r1) ** 3 + d) * x0 + (y0 - lead * x0 ** 3 - d) * r1, wrongDen))), md`For the factor $${fac(r1)}$, substitute $x = ${r1}$.`)],
          solution: [md`$\mathrm{f}(${r1}) = 0$: $${e1}$`, md`$\mathrm{f}(${x0}) = ${y0}$: $${e2}$`, md`Solving: $p = ${p}$, $q = ${q}$`],
        }),
        part({
          label: 'b',
          marks: 1,
          prompt: md`and the value of $q$.`,
          answer: Qa,
          scheme: [A1(md`$q = ${q}$`)],
          hints: ['Substitute your p into either equation.', md`$${e1}$`, 'Solve for q.'],
          solution: [md`$q = ${q}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`Hence factorise $\mathrm{f}(x)$ completely.`,
          answer: FE,
          scheme: [M1(md`Divides by $${fac(r1)}$ (or compares coefficients)`), A1(md`Correct quadratic factor $${quadTex(f.divLinear(r1).q)}$`), A1(md`$${answerTex(FE)}$`)],
          hints: [md`$\mathrm{f}(x) = ${cubicTex(f)}$: divide by $${fac(r1)}$.`, md`$\mathrm{f}(x) = ${fac(r1)}\left(${quadTex(f.divLinear(r1).q)}\right)$`, 'Factorise the quadratic.'],
          solution: [md`$\mathrm{f}(x) = ${cubicTex(f)} = ${fac(r1)}\left(${quadTex(f.divLinear(r1).q)}\right) = ${factTex}$`],
        }),
        part({
          label: 'd',
          marks: 3,
          prompt: md`Find the set of values of $x$ for which $\mathrm{f}(x) ${op} 0$, giving your answer in set notation.`,
          answer: I,
          scheme: [B1(md`Critical values $x = ${lo.toLatex()}, ${mid.toLatex()}, ${hi.toLatex()}$`), M1('Sketch of a positive cubic or a sign table'), A1(md`$${answerTex(I)}$`)],
          hints: ['The roots from (c) split the number line into four parts.', `The curve is a positive cubic: it comes up from below, crosses at ${lo.toLatex()}, ${mid.toLatex()} and ${hi.toLatex()}.`, md`f is ${positive ? 'positive' : 'negative'} where the curve is ${positive ? 'above' : 'below'} the x-axis.`],
          errors: [err('wrong-regions', ans.interval(wrongSide, 'x', { setNotation: true }), 'Check with a sketch: a positive cubic is negative to the left of its smallest root.', 1)],
          solution: [md`Roots: $${lo.toLatex()}$, $${mid.toLatex()}$, $${hi.toLatex()}$; the cubic is positive for large $x$.`, md`$${answerTex(I)}$`],
        }),
      ],
      params: { c: [d, q, p, lead], r1, x0, y0, op },
    };
  },
  verify(inst) {
    const { c, r1, x0, y0, op } = inst.params as { c: number[]; r1: number; x0: number; y0: number; op: string };
    const p = exV(inst.parts[0].answer as ExactSpec),
      q = exV(inst.parts[1].answer as ExactSpec);
    const f = (x: number) => c[0] + q * x + p * x * x + c[3] * x ** 3;
    expectClose(f(r1), 0, 'factor', 1e-9);
    expectClose(f(x0), y0, 'point', 1e-9);
    const e = (inst.parts[2].answer as ExprSpec).value;
    for (const x of [-2.7, 0.3, 1.9]) expectClose(evaluate(e, { x }), f(x), 'factorised');
    const S = toNumSet((inst.parts[3].answer as IntervalSpec).set);
    for (let x = -9; x <= 9; x += 0.07) {
      const v = f(x);
      if (Math.abs(v) < 1e-9) continue;
      const truth = op === '>' || op === '\\geqslant' ? v > 0 : v < 0;
      expect(contains(S, x) === truth, `inequality at x = ${x}`);
    }
  },
});

export default [showAndSolve, oneRealRoot, longFactor] satisfies Template[];
