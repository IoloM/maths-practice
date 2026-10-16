/** Pure Year 1, Chapter 2 — quadratics: solving, completing the square, discriminant, hidden quadratics, modelling. */
import { Q, surdSimplify, gcd } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num, neg, sym } from '../../../engine/core/expr';
import { expect, expectClose, rootsIn } from '../../../engine/core/numeric';
import { fmtNum, fmtSF } from '../../../engine/core/format';
import { answerTex } from '../../../engine/marking/mark';
import type { CoordSpec, ExactSpec, ExprSpec, IntervalSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, dM1, ans, defineTemplate, err, iv, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const INF = sym('infty');
const vals = (spec: ListSpec) => spec.items.map((i) => (i.type === 'exact' ? evaluate(i.value) : i.value)).sort((a, b) => a - b);

const factorise = defineTemplate({
  id: 'p1.2.solve-by-factorising',
  family: 'p1.2.solving',
  title: 'Solve a quadratic equation by factorising',
  spec: ['P2.3'],
  chapter: 'P1.2',
  sections: ['2.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 1,
  marks: 3,
  time: 3,
  commands: ['Solve'],
  tags: ['quadratics', 'factorising'],
  generate(r) {
    const a = r.pick([1, 1, 2, 3, 4, 5, 6]);
    const p = r.intNZ(-6, 6),
      s = r.intNZ(-6, 6);
    const q = r.pick([1, 1, 2, 3].filter((x) => gcd(x, Math.abs(p)) === 1));
    // (q x − p)(a/q... keep simple: (qx − p)(r2 x − s) with r2 = a/q integer
    r.require(a % q === 0);
    const r2 = a / q;
    r.require(gcd(r2, Math.abs(s)) === 1);
    const poly = Poly.coeffs([-p, q]).mul(Poly.coeffs([-s, r2]));
    const roots = [Q.of(p, q), Q.of(s, r2)];
    r.require(!roots[0].eq(roots[1]));
    const L = ans.list(roots.map((x) => ans.exact(num(x))), { v: 'x' });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Solve $${poly.toLatex()} = 0$.`,
          answer: L,
          scheme: [M1('Attempts to factorise (or uses the formula)'), A1(md`$(${sumTex([[q, 'x'], [-p, '']])})(${sumTex([[r2, 'x'], [-s, '']])}) = 0$`), A1(md`$${answerTex(L)}$`)],
          hints: [poly.coef(2).eq(1) ? 'Find two numbers that multiply to give the constant and add to give the x-coefficient.' : 'Multiply a × c, then find two numbers that multiply to give this and add to give b.', 'Then set each bracket equal to zero.', md`$${poly.toLatex()} = (${sumTex([[q, 'x'], [-p, '']])})(${sumTex([[r2, 'x'], [-s, '']])})$`],
          errors: [err('signs', ans.list(roots.map((x) => ans.exact(num(x.neg()))), { v: 'x' }), 'Check the signs: if (x − a) = 0 then x = a, not −a.')],
          solution: [md`$${poly.toLatex()} = (${sumTex([[q, 'x'], [-p, '']])})(${sumTex([[r2, 'x'], [-s, '']])}) = 0$`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { c: [poly.coef(0).value, poly.coef(1).value, poly.coef(2).value] },
    };
  },
  verify(inst) {
    const { c } = inst.params as { c: number[] };
    for (const x of vals(inst.parts[0].answer as ListSpec)) expectClose(c[0] + c[1] * x + c[2] * x * x, 0, 'root', 1e-9);
  },
});

const completeSquare = defineTemplate({
  id: 'p1.2.complete-the-square',
  family: 'p1.2.completing-square',
  title: 'Complete the square and find the turning point',
  spec: ['P2.3'],
  chapter: 'P1.2',
  sections: ['2.2', '2.4'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 5,
  time: 6,
  commands: ['Write', 'Hence', 'State'],
  tags: ['quadratics', 'completing the square', 'turning point'],
  generate(r) {
    const a = r.pick([1, 1, 1, 2, 3, -1, -2]);
    const p = r.intNZ(-6, 6),
      q = r.int(-12, 12);
    // a(x + p)² + q
    const poly = Poly.coeffs([a * p * p + q, 2 * a * p, a]);
    const cs = sumTex([[a, `\\left(x ${p < 0 ? '-' : '+'} ${Math.abs(p)}\\right)^{2}`], [q, '']]);
    const E = ans.expr(ex(cs), ['x'], { forms: ['completed-square'], domain: { x: [-5, 5] } });
    const T: CoordSpec = ans.coord(ans.exact(num(-p)), ans.exact(num(q)));
    return {
      stem: md`$\mathrm{f}(x) = ${poly.toLatex()}$.`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Write $\mathrm{f}(x)$ in the form $a(x + p)^{2} + q$, where $a$, $p$ and $q$ are constants.`,
          answer: E,
          scheme: [B1(a === 1 ? md`$(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2}$` : md`Takes out $${a}$: $${a}\left(x^{2} ${2 * p < 0 ? '-' : '+'} ${Math.abs(2 * p)}x\right)$`), M1('Completes the square'), A1(md`$${answerTex(E)}$`)],
          hints: [a === 1 ? 'Halve the coefficient of x.' : md`Take out the factor $${a}$ from the $x^{2}$ and $x$ terms first.`, md`$x^{2} + 2px = (x + p)^{2} - p^{2}$`, md`$p = ${p}$`],
          errors: [err('forgot-subtract', ans.expr(ex(sumTex([[a, `\\left(x ${p < 0 ? '-' : '+'} ${Math.abs(p)}\\right)^{2}`], [q + a * p * p, '']])), ['x'], { domain: { x: [-5, 5] } }), md`When you complete the square you must subtract $${a === 1 ? '' : a}(${p})^{2}$.`, 1)],
          solution: [md`$\mathrm{f}(x) = ${a === 1 ? '' : a === -1 ? '-' : a}\left[(x ${p < 0 ? '-' : '+'} ${Math.abs(p)})^{2} - ${p * p}\right] ${sumTex([[a * p * p + q, '']]).startsWith('-') ? '' : '+'} ${a * p * p + q}$`, md`$= ${answerTex(E)}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Hence write down the coordinates of the turning point of $y = \mathrm{f}(x)$.`,
          answer: T,
          scheme: [B1(md`$x = ${-p}$`), B1(md`$y = ${q}$`)],
          hints: ['The squared bracket is zero at the turning point.', md`That happens when $x = ${-p}$.`, 'The y-coordinate is the constant q.'],
          solution: [md`Turning point $${answerTex(T)}$, a ${a > 0 ? 'minimum' : 'maximum'}`],
        }),
      ],
      params: { a, p, q },
    };
  },
  verify(inst) {
    const { a, p, q } = inst.params as Record<string, number>;
    const e = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [-3, 0.5, 2]) expectClose(evaluate(e, { x }), a * x * x + 2 * a * p * x + a * p * p + q, 'identity');
    // turning point where derivative is zero
    expectClose(2 * a * -p + 2 * a * p, 0, 'stationary at −p');
  },
});

const discriminant = defineTemplate({
  id: 'p1.2.discriminant-unknown-k',
  family: 'p1.2.discriminant',
  title: 'Use the discriminant to find a range of k',
  spec: ['P2.3', 'P2.5'],
  chapter: 'P1.2',
  sections: ['2.5'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 4,
  marks: 5,
  time: 7,
  commands: ['Show that', 'Find'],
  tags: ['quadratics', 'discriminant', 'inequalities'],
  generate(r) {
    // x² + kx + c = 0 → k² − 4c; or kx² + bx + k = 0 → b² − 4k²
    const variant = r.pick(['linear-k', 'k-both'] as const);
    const cond = r.pick(['no real roots', 'two distinct real roots'] as const);
    let disc: Poly, eqTex: string;
    if (variant === 'linear-k') {
      const c = r.pick([1, 4, 9, 16, 25, 36]);
      const shift = r.int(-4, 4);
      // x² + (k + shift)x + c = 0: disc = (k + s)² − 4c
      disc = Poly.coeffs([shift * shift - 4 * c, 2 * shift, 1]);
      eqTex = `x^{2} + (k ${shift < 0 ? '-' : '+'} ${Math.abs(shift)})x + ${c} = 0`.replace(' + 0)', ')').replace('(k + 0)', 'k');
    } else {
      const b = r.pick([2, 4, 6, 8, 10, 12]);
      disc = Poly.coeffs([b * b, 0, -4]);
      eqTex = `kx^{2} + ${b}x + k = 0`;
    }
    const roots = rootsIn((k) => disc.eval(k), -50, 50).map((x) => Math.round(x * 1e6) / 1e6);
    r.require(roots.length === 2);
    const [lo, hi] = roots.map((x) => Q.from(x));
    const leading = disc.coef(2).sign;
    // where disc < 0 (no real roots) or > 0 (two roots)
    const inside = (cond === 'no real roots') === leading > 0;
    let set = inside ? [iv(num(lo), num(hi), false, false)] : [iv(neg(INF), num(lo), false, false), iv(num(hi), INF, false, false)];
    if (variant === 'k-both') {
      // k ≠ 0 for a quadratic
      set = inside ? [iv(num(lo), num(0), false, false), iv(num(0), num(hi), false, false)] : set;
    }
    const I: IntervalSpec = ans.interval(set, 'k');
    return {
      stem: md`The equation $${eqTex}$, where $k$ is a ${variant === 'k-both' ? 'non-zero ' : ''}constant, has ${cond}.`,
      parts: [
        part({
          marks: 5,
          prompt: md`Find the set of possible values of $k$.`,
          answer: I,
          scheme: [M1(md`Uses $b^{2} - 4ac$ with $a$, $b$, $c$ from the equation`), A1(md`$${disc.toLatex({ v: 'k' })} ${cond === 'no real roots' ? '<' : '>'} 0$`), M1('Finds the critical values'), A1(md`$k = ${lo.toLatex()}$, $k = ${hi.toLatex()}$`), A1(md`$${answerTex(I)}$`)],
          hints: [md`${cond === 'no real roots' ? 'No real roots' : 'Two distinct real roots'} means $b^{2} - 4ac ${cond === 'no real roots' ? '<' : '>'} 0$.`, md`Here $b^{2} - 4ac = ${disc.toLatex({ v: 'k' })}$.`, 'Solve the quadratic inequality: find the critical values, sketch, then choose the region.'],
          solution: [md`$b^{2} - 4ac = ${disc.toLatex({ v: 'k' })} ${cond === 'no real roots' ? '<' : '>'} 0$`, md`Critical values $k = ${lo.toLatex()}$ and $k = ${hi.toLatex()}$`, md`$${answerTex(I)}$`],
        }),
      ],
      params: { d: [disc.coef(0).value, disc.coef(1).value, disc.coef(2).value], cond, variant },
    };
  },
  verify(inst) {
    const { d, cond } = inst.params as { d: number[]; cond: string };
    const I = inst.parts[0].answer as IntervalSpec;
    const inSet = (k: number) => I.set.some((s) => k > evaluate(s.lo) && k < evaluate(s.hi));
    for (let k = -30; k <= 30; k += 0.37) {
      const D = d[0] + d[1] * k + d[2] * k * k;
      if (Math.abs(D) < 1e-6 || Math.abs(k) < 1e-9) continue;
      expect(inSet(k) === (cond === 'no real roots' ? D < 0 : D > 0), `membership at k=${k}`);
    }
  },
});

const formula = defineTemplate({
  id: 'p1.2.quadratic-formula-surds',
  family: 'p1.2.solving',
  title: 'Solve with the formula, giving exact surd answers',
  spec: ['P2.3', 'P2.2'],
  chapter: 'P1.2',
  sections: ['2.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 2,
  marks: 3,
  time: 4,
  commands: ['Solve'],
  tags: ['quadratics', 'quadratic formula', 'surds'],
  generate(r) {
    const a = r.pick([1, 1, 2, 3]),
      b = r.int(-8, 8),
      c = r.int(-9, 9);
    const D = b * b - 4 * a * c;
    r.require(D > 0 && Math.sqrt(D) % 1 !== 0);
    const [s, rr] = surdSimplify(D);
    const poly = Poly.coeffs([c, b, a]);
    const p = Q.of(-b, 2 * a),
      q = Q.of(s, 2 * a);
    const L = ans.list([ans.exact(ex(sumTex([[p, ''], [q, `\\sqrt{${rr}}`]]))), ans.exact(ex(sumTex([[p, ''], [q.neg(), `\\sqrt{${rr}}`]])))], { v: 'x' });
    return {
      parts: [
        part({
          marks: 3,
          prompt: md`Solve $${poly.toLatex()} = 0$, giving your answers in simplest surd form.`,
          answer: L,
          scheme: [M1(md`Uses $x = \dfrac{-b \pm \sqrt{b^{2} - 4ac}}{2a}$ with $b^{2} - 4ac = ${D}$`), M1(md`$\sqrt{${D}} = ${s === 1 ? '' : s}\sqrt{${rr}}$`), A1(md`$${answerTex(L)}$`)],
          hints: ['It does not factorise, so use the quadratic formula.', md`$b^{2} - 4ac = (${b})^{2} - 4(${a})(${c}) = ${D}$`, md`Simplify $\sqrt{${D}}$.`],
          errors: [err('decimals', ans.list([ans.num(p.value + q.value * Math.sqrt(rr), { sf: 3 }), ans.num(p.value - q.value * Math.sqrt(rr), { sf: 3 })], { v: 'x' }), 'Give exact answers in surd form, not decimals.', 2)],
          solution: [md`$x = \dfrac{${-b} \pm \sqrt{${D}}}{${2 * a}} = \dfrac{${-b} \pm ${s === 1 ? '' : s}\sqrt{${rr}}}{${2 * a}}$`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as Record<string, number>;
    for (const x of vals(inst.parts[0].answer as ListSpec)) expectClose(a * x * x + b * x + c, 0, 'root', 1e-9);
  },
});

const hidden = defineTemplate({
  id: 'p1.2.hidden-quadratic',
  family: 'p1.2.hidden-quadratic',
  title: 'Quadratic equations in a function of x',
  spec: ['P2.3', 'P2.1'],
  chapter: 'P1.2',
  sections: ['2.1'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Solve'],
  tags: ['quadratics', 'substitution', 'indices'],
  generate(r) {
    const variant = r.pick(['x4', 'root', 'recip'] as const);
    const u1 = r.pick([1, 4, 9, 16]),
      u2 = r.pick([1, 4, 9, 16, 25].filter((v) => v !== u1));
    let eqTex: string, xs: Q[], sub: string;
    if (variant === 'x4') {
      eqTex = `${sumTex([[1, 'x^{4}'], [-(u1 + u2), 'x^{2}'], [u1 * u2, '']])} = 0`;
      xs = [u1, u2].flatMap((u) => [Q.of(Math.sqrt(u)), Q.of(-Math.sqrt(u))]);
      sub = 'u = x^{2}';
    } else if (variant === 'root') {
      const a = Math.sqrt(u1),
        b = Math.sqrt(u2);
      eqTex = `${sumTex([[1, 'x'], [-(a + b), '\\sqrt{x}'], [a * b, '']])} = 0`;
      xs = [Q.of(u1), Q.of(u2)];
      sub = 'u = \\sqrt{x}';
    } else {
      const a = r.intNZ(-5, 5),
        b = r.intNZ(-5, 5);
      r.require(a !== b);
      eqTex = `${sumTex([[a * b, 'x^{-2}'], [-(a + b), 'x^{-1}'], [1, '']])} = 0`;
      xs = [Q.of(a), Q.of(b)];
      sub = 'u = x^{-1}';
    }
    const L = ans.list(xs.map((x) => ans.exact(num(x))), { v: 'x' });
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Solve $${eqTex}$.`,
          answer: L,
          scheme: [M1(md`Uses $${sub}$ to obtain a quadratic`), A1('Solves the quadratic in u'), M1('Converts back to x'), A1(md`$${answerTex(L)}$`)],
          hints: [md`This is a quadratic in disguise: let $${sub}$.`, 'Solve the quadratic in u by factorising.', md`Then use $${sub}$ to find x — check every solution is valid.`],
          errors: variant === 'x4' ? [err('only-positive', ans.list([u1, u2].map((u) => ans.exact(num(Math.sqrt(u)))), { v: 'x' }), md`$x^{2} = k$ gives $x = \pm\sqrt{k}$ — include the negative roots.`, 3)] : [],
          solution: [md`Let $${sub}$ and solve the quadratic in $u$, then convert back.`, md`$${answerTex(L)}$`],
        }),
      ],
      params: { eqTex, variant },
    };
  },
  verify(inst) {
    const { eqTex } = inst.params as { eqTex: string };
    const f = ex(eqTex.replace(' = 0', ''));
    for (const x of vals(inst.parts[0].answer as ListSpec)) expectClose(evaluate(f, { x }), 0, 'satisfies equation', 1e-9);
  },
});

const model = defineTemplate({
  id: 'p1.2.quadratic-model',
  family: 'p1.2.modelling',
  title: 'Modelling with a quadratic: maximum height and landing time',
  spec: ['P2.11', 'P2.3'],
  chapter: 'P1.2',
  sections: ['2.6'],
  level: 'AS',
  paper: [1, 2],
  difficulty: 3,
  marks: 6,
  time: 8,
  commands: ['Find', 'State'],
  tags: ['quadratics', 'modelling', 'completing the square', 'context'],
  generate(r) {
    const a = r.pick([4.9, 5, 2.5]);
    const b = r.int(8, 25),
      c = r.int(1, 15);
    const tMax = b / (2 * a),
      hMax = c + (b * b) / (4 * a);
    const land = (b + Math.sqrt(b * b + 4 * a * c)) / (2 * a);
    const H = ans.num(hMax, { sf: 3 }, { unit: '\\text{m}' }),
      T = ans.num(land, { sf: 3 }, { unit: '\\text{s}' });
    const ctx = r.pick(['a ball is kicked from a platform', 'a stone is thrown upwards from a cliff top', 'a firework is launched from a raised stand']);
    const opts = r.shuffle(['The model ignores air resistance.', 'The model gives negative heights after the object lands.', 'The model assumes the object is very heavy.']);
    return {
      stem: md`The height $h$ metres of an object, $t$ seconds after ${ctx}, is modelled by $h = ${c} + ${b}t - ${fmtNum(a)}t^{2}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: 'Find the maximum height reached.', answer: H, scheme: [M1('Completes the square or differentiates / uses t = −b/2a'), A1(md`$t = ${fmtSF(tMax, 3)}$`), A1(md`$${answerTex(H)}$`)], hints: ['The maximum of a quadratic is at its vertex.', md`Vertex at $t = \dfrac{${b}}{2 \times ${fmtNum(a)}}$.`, 'Substitute this t back into h.'], solution: [md`Maximum at $t = \frac{${b}}{${fmtNum(2 * a)}} = ${fmtSF(tMax, 4)}$`, md`$h = ${c} + ${b}(${fmtSF(tMax, 4)}) - ${fmtNum(a)}(${fmtSF(tMax, 4)})^{2} = ${answerTex(H)}$`] }),
        part({ label: 'b', marks: 2, prompt: 'Find the time at which the object hits the ground.', answer: T, scheme: [M1('Solves h = 0 with the formula'), A1(md`$${answerTex(T)}$ (rejecting the negative root)`)], hints: ['The object hits the ground when h = 0.', 'Use the quadratic formula.', 'Reject the negative solution: time cannot be negative.'], errors: [err('negative-root', ans.num((b - Math.sqrt(b * b + 4 * a * c)) / (2 * a), { sf: 3 }), 'Time must be positive — use the other root.')], solution: [md`$${fmtNum(a)}t^{2} - ${b}t - ${c} = 0 \Rightarrow t = ${answerTex(T)}$`] }),
        part({ label: 'c', marks: 1, prompt: 'Give one limitation of the model.', answer: ans.choice(opts, opts.indexOf('The model ignores air resistance.')), scheme: [B1('Air resistance / spin / ground not flat, in context')], hints: ['What real effects are missing?', 'Think about forces other than gravity.', 'A modelling limitation refers to the real situation.'], solution: ['The model ignores air resistance (and treats the object as a particle).'] }),
      ],
      params: { a, b, c },
    };
  },
  verify(inst) {
    const { a, b, c } = inst.params as Record<string, number>;
    const h = (t: number) => c + b * t - a * t * t;
    const H = (inst.parts[0].answer as NumericSpec).value,
      T = (inst.parts[1].answer as NumericSpec).value;
    expectClose(h(T), 0, 'lands', 1e-9);
    expect(h(b / (2 * a) + 0.01) <= H + 1e-9 && h(b / (2 * a) - 0.01) <= H + 1e-9, 'maximum');
  },
});

void dM1;
void B1;

const templates: Template[] = [factorise, completeSquare, discriminant, formula, hidden, model];
export default templates;
export type { ExactSpec };
