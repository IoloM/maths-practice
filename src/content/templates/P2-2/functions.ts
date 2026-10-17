/** Pure Year 2, Chapter 2 — functions: composite and inverse functions, domain and range, modulus, modelling. */
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, neg, num, sym } from '../../../engine/core/expr';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ChoiceSpec, ExactSpec, ExprSpec, IntervalSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, dM1, err, iv, md, part, sgn } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';
import { contains, toNumSet } from '../../../engine/marking/intervals';

const INF = sym('infty');
const NINF = neg(INF);
const exq = (q: Q | number) => num(Q.from(q));
const valOf = (s: ExactSpec | NumericSpec) => (s.type === 'exact' ? evaluate(s.value) : s.value);
const F = (n: string) => `\\mathrm{${n}}`;
const lin = (a: number, b: number) => `${a === 1 ? '' : a === -1 ? '-' : a}x${b === 0 ? '' : sgn(b)}`;
const rangeOpts = (name: string) => {
  const [base, sup] = name.split('^');
  return { aliases: [`${name}(x)`, name, 'y'], display: `${F(base)}${sup ? `^${sup}` : ''}(x)` };
};

// ---------------------------------------------------------------- 2.3 composite functions
const composite = defineTemplate({
  id: 'p2.2.composite-functions',
  family: 'p2.2.composite-inverse',
  title: 'Composite functions fg(x) and gf(x), and solving fg(x) = k',
  spec: ['P2.8'],
  chapter: 'P2.2',
  sections: ['2.3'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 7,
  time: 8,
  commands: ['Find', 'Solve'],
  tags: ['functions', 'composite functions'],
  generate(r) {
    const p = r.pick([2, 3, 4, 5, -2, -3]),
      q = r.int(-6, 6);
    const gv = r.pick(['sq', 'recip', 'exp'] as const);
    const fTex = lin(p, q);
    let gTex: string, fgTex: string, gfTex: string, domain: Record<string, [number, number]>, gDom: string;
    let L: ListSpec, solveFor: number | string, solveSol: string, GFA: ExactSpec, V: number;
    let c = 0,
      k = 0;
    const a = r.intNZ(-3, 3);
    const fa = p * a + q;
    if (gv === 'sq') {
      c = r.int(-5, 5);
      gTex = `x^{2}${c === 0 ? '' : sgn(c)}`;
      GFA = ans.exact(exq(fa * fa + c));
      fgTex = sumTex([[p, 'x^{2}'], [p * c + q, '']]);
      gfTex = `(${fTex})^{2}${c === 0 ? '' : sgn(c)}`;
      domain = { x: [-3, 3] };
      gDom = 'x \\in \\mathbb{R}';
      const x0 = r.int(1, 5);
      V = p * x0 * x0 + p * c + q;
      solveFor = V;
      L = ans.list([ans.exact(exq(x0)), ans.exact(exq(-x0))], { v: 'x' });
      solveSol = md`$${fgTex} = ${V} \Rightarrow x^{2} = ${x0 * x0} \Rightarrow x = \pm ${x0}$`;
    } else if (gv === 'recip') {
      k = r.int(1, 6);
      c = r.intNZ(-4, 4);
      gTex = `\\frac{${k}}{x${sgn(c)}}`;
      r.require(fa + c !== 0);
      GFA = ans.exact(exq(Q.of(k, fa + c)));
      fgTex = `\\frac{${p * k}}{x${sgn(c)}}${q === 0 ? '' : sgn(q)}`;
      gfTex = `\\frac{${k}}{${lin(p, q + c)}}`;
      domain = { x: [-c + 0.5, -c + 5] };
      gDom = `x \\in \\mathbb{R},\\ x \\neq ${-c}`;
      let x0: number;
      do x0 = r.intNZ(-5, 5);
      while (x0 + c === 0);
      const Vq = Q.of(p * k, x0 + c).add(q);
      V = Vq.value;
      solveFor = Vq.toLatex();
      L = ans.list([ans.exact(exq(x0))], { v: 'x' });
      solveSol = md`$\dfrac{${p * k}}{x${sgn(c)}} = ${Vq.sub(q).toLatex()} \Rightarrow x${sgn(c)} = ${Q.of(x0 + c).toLatex()} \Rightarrow x = ${x0}$`;
    } else {
      c = r.int(-5, 5);
      gTex = `e^{x}${c === 0 ? '' : sgn(c)}`;
      r.require(fa !== 0);
      GFA = ans.exact(ex(`e^{${fa}}${c === 0 ? '' : sgn(c)}`), ['exact']);
      fgTex = `${p}e^{x}${p * c + q === 0 ? '' : sgn(p * c + q)}`;
      gfTex = `e^{${fTex}}${c === 0 ? '' : sgn(c)}`;
      domain = { x: [-2, 2] };
      gDom = 'x \\in \\mathbb{R}';
      const t = r.pick([2, 3, 5, 7]);
      V = p * t + p * c + q;
      solveFor = V;
      L = ans.list([ans.exact(ex(`\\ln ${t}`), ['exact'])], { v: 'x' });
      solveSol = md`$${p}e^{x}${p * c + q === 0 ? '' : sgn(p * c + q)} = ${V} \Rightarrow e^{x} = ${t} \Rightarrow x = \ln ${t}$`;
    }
    const FG: ExprSpec = ans.expr(ex(fgTex), ['x'], { domain });
    return {
      stem: md`The functions $${F('f')}$ and $${F('g')}$ are defined by $${F('f')}(x) = ${fTex}$, $x \in \mathbb{R}$, and $${F('g')}(x) = ${gTex}$, $${gDom}$.`,
      parts: [
        part({ label: 'a', marks: 2, prompt: md`Find $${F('fg')}(x)$, simplifying your answer.`, answer: FG, scheme: [M1(md`$${F('f')}\left(${gTex}\right)$`), A1(md`$${fgTex}$`)], hints: [md`$${F('fg')}(x) = ${F('f')}\big(${F('g')}(x)\big)$: apply $${F('g')}$ first, then $${F('f')}$.`, md`Replace the $x$ in $${F('f')}(x) = ${fTex}$ with $${gTex}$.`, 'Simplify.'], errors: [err('wrong-order', ans.expr(ex(gfTex), ['x'], { domain }), md`That is $${F('gf')}(x)$. For $${F('fg')}(x)$, apply $${F('g')}$ first.`)], solution: [md`$${F('fg')}(x) = ${p}\left(${gTex}\right)${q === 0 ? '' : sgn(q)} = ${answerTex(FG)}$`] }),
        part({ label: 'b', marks: 2, prompt: md`Find the exact value of $${F('gf')}(${a})$.`, answer: GFA, scheme: [M1(md`$${F('f')}(${a}) = ${p * a + q}$`), A1(md`$${answerTex(GFA)}$`)], hints: [md`Work out $${F('f')}(${a})$ first.`, md`$${F('f')}(${a}) = ${p * a + q}$`, md`Now apply $${F('g')}$ to that.`], solution: [md`$${F('f')}(${a}) = ${p * a + q}$, so $${F('gf')}(${a}) = ${F('g')}(${p * a + q}) = ${answerTex(GFA)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Solve $${F('fg')}(x) = ${solveFor}$.`, answer: L, scheme: [M1('Sets their fg(x) equal to the value'), dM1('Rearranges to solve'), A1(md`$${answerTex(L)}$`)], hints: ['Use your answer to (a).', `Rearrange to make the ${gv === 'sq' ? 'x² term' : gv === 'exp' ? 'eˣ term' : 'fraction'} the subject.`, gv === 'sq' ? 'Remember the negative square root.' : gv === 'exp' ? 'Take natural logs.' : 'Take reciprocals.'], solution: [solveSol, md`$${answerTex(L)}$`] }),
      ],
      params: { p, q, a, gv, c, k, V },
    };
  },
  verify(inst) {
    const { p, q, a, gv, c, k, V } = inst.params as { p: number; q: number; a: number; gv: string; c: number; k: number; V: number };
    const g = (x: number) => (gv === 'sq' ? x * x + c : gv === 'recip' ? k / (x + c) : Math.exp(x) + c);
    const FG = (inst.parts[0].answer as ExprSpec).value;
    for (const x of [-c + 0.7, -c + 2.9]) expectClose(evaluate(FG, { x }), p * g(x) + q, 'fg(x)');
    expectClose(valOf(inst.parts[1].answer as ExactSpec), g(p * a + q), 'gf(a)');
    for (const x of (inst.parts[2].answer as ListSpec).items.map(valOf)) expectClose(p * g(x) + q, V, 'fg(x) = V');
  },
});

// ---------------------------------------------------------------- 2.4 inverse functions
const inverse = defineTemplate({
  id: 'p2.2.inverse-functions',
  family: 'p2.2.composite-inverse',
  title: 'Find an inverse function and its domain',
  spec: ['P2.8'],
  chapter: 'P2.2',
  sections: ['2.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 5,
  time: 6,
  commands: ['Find', 'State'],
  tags: ['functions', 'inverse functions', 'domain', 'range'],
  generate(r) {
    const v = r.pick(['sqrt', 'exp', 'ln', 'frac'] as const);
    let fTex: string, fDom: string, invTex: string, dom: [number, number], invDomSet: IntervalSpec, invNote: string, which: 'domain' | 'range';
    if (v === 'sqrt') {
      const m = r.pick([1, 2, 3]),
        a = r.int(-4, 4),
        b = r.int(-5, 5);
      fTex = `${m === 1 ? '' : m}\\sqrt{${lin(1, -a)}}${b === 0 ? '' : sgn(b)}`;
      fDom = `x \\geqslant ${a}`;
      invTex = `${m === 1 ? `(${lin(1, -b)})^{2}` : `\\left(\\frac{${lin(1, -b)}}{${m}}\\right)^{2}`}${a === 0 ? '' : sgn(a)}`;
      dom = [b + 0.2, b + 6];
      invDomSet = ans.interval([iv(exq(b), INF, true, false)], 'x');
      invNote = md`The domain of $${F('f')}^{-1}$ is the range of $${F('f')}$: $\sqrt{\phantom{x}} \geqslant 0$, so $${F('f')}(x) \geqslant ${b}$.`;
      which = 'domain';
    } else if (v === 'exp') {
      const k = r.pick([1, 2, 3]),
        c = r.int(-5, 5);
      fTex = `e^{${k === 1 ? '' : k}x}${c === 0 ? '' : sgn(c)}`;
      fDom = 'x \\in \\mathbb{R}';
      invTex = `${k === 1 ? '' : `\\frac{1}{${k}}`}\\ln(${lin(1, -c)})`;
      dom = [c + 0.3, c + 8];
      invDomSet = ans.interval([iv(exq(c), INF, false, false)], 'x');
      invNote = md`$e^{${k === 1 ? '' : k}x} > 0$, so the range of $${F('f')}$ is $${F('f')}(x) > ${c}$; this is the domain of $${F('f')}^{-1}$.`;
      which = 'domain';
    } else if (v === 'ln') {
      const k = r.pick([1, 2, 3]),
        a = r.intNZ(-4, 4),
        b = r.int(-3, 3);
      fTex = `\\ln(${lin(k, a)})${b === 0 ? '' : sgn(b)}`;
      fDom = `x > ${Q.of(-a, k).toLatex()}`;
      invTex = k === 1 ? `e^{${lin(1, -b)}}${sgn(-a)}` : `\\frac{e^{${lin(1, -b)}}${sgn(-a)}}{${k}}`;
      dom = [-3, 3];
      invDomSet = ans.interval([iv(exq(Q.of(-a, k)), INF, false, false)], 'y', rangeOpts('f^{-1}'));
      invNote = md`The range of $${F('f')}^{-1}$ is the domain of $${F('f')}$.`;
      which = 'range';
    } else {
      const a = r.intNZ(-4, 4),
        b = r.int(-6, 6),
        c = r.intNZ(-4, 4);
      r.require(b - a * c !== 0);
      fTex = `\\frac{${lin(a, b)}}{${lin(1, c)}}`;
      fDom = `x > ${-c}`;
      invTex = `\\frac{${sumTex([[b, ''], [-c, 'x']])}}{${lin(1, -a)}}`;
      const up = b - a * c > 0;
      dom = up ? [a + 0.3, a + 6] : [a - 6, a - 0.3];
      invDomSet = ans.interval([up ? iv(exq(a), INF, false, false) : iv(NINF, exq(a), false, false)], 'x');
      invNote = md`$${F('f')}(x) = ${a} ${up ? '+' : '-'} \dfrac{${Math.abs(b - a * c)}}{x${sgn(c)}}$ and $x${sgn(c)} > 0$, so the range of $${F('f')}$ is $${F('f')}(x) ${up ? '>' : '<'} ${a}$.`;
      which = 'domain';
    }
    const INV: ExprSpec = ans.expr(ex(invTex), ['x'], { domain: { x: dom } });
    return {
      stem: md`The function $${F('f')}$ is defined by $${F('f')}(x) = ${fTex}$, $${fDom}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find $${F('f')}^{-1}(x)$.`, answer: INV, scheme: [M1(md`Writes $y = ${fTex}$ and starts to make $x$ the subject`), dM1('Correct inverse operations in the right order'), A1(md`$${F('f')}^{-1}(x) = ${invTex}$`)], hints: [md`Let $y = ${fTex}$ and rearrange to make $x$ the subject.`, v === 'exp' ? 'Take natural logs once the exponential is on its own.' : v === 'ln' ? 'Apply e to both sides once the logarithm is on its own.' : v === 'sqrt' ? 'Square both sides once the square root is on its own.' : 'Multiply by the denominator, collect the x terms, and factorise.', md`Finally swap $x$ and $y$ to write $${F('f')}^{-1}(x)$.`], errors: v === 'sqrt' ? [] : [err('reciprocal', ans.expr(ex(`\\frac{1}{${fTex}}`), ['x'], { domain: { x: dom } }), md`$${F('f')}^{-1}$ is the inverse function, not the reciprocal $\dfrac{1}{${F('f')}(x)}$.`)], solution: [md`$y = ${fTex} \Rightarrow x = ${invTex.replace(/x/g, 'y')}$`, md`$${F('f')}^{-1}(x) = ${answerTex(INV)}$`] }),
        part({ label: 'b', marks: 2, prompt: which === 'domain' ? md`State the domain of $${F('f')}^{-1}$.` : md`State the range of $${F('f')}^{-1}$.`, answer: invDomSet, scheme: [M1(which === 'domain' ? md`Uses domain of $${F('f')}^{-1}$ = range of $${F('f')}$` : md`Uses range of $${F('f')}^{-1}$ = domain of $${F('f')}$`), A1(md`$${answerTex(invDomSet)}$`)], hints: [which === 'domain' ? md`The domain of $${F('f')}^{-1}$ is the range of $${F('f')}$.` : md`The range of $${F('f')}^{-1}$ is the domain of $${F('f')}$.`, 'Sketch the graph of f to see which values it takes.', 'Watch whether the end point is included.'], solution: [invNote, md`$${answerTex(invDomSet)}$`] }),
      ],
      params: { v, x0: dom[0] + 1.1, fTex },
    };
  },
  verify(inst) {
    const { x0, fTex } = inst.params as { x0: number; fTex: string };
    const g = (x: number) => evaluate((inst.parts[0].answer as ExprSpec).value, { x });
    const f = (x: number) => evaluate(ex(fTex), { x });
    expectClose(f(g(x0)), x0, 'f(f⁻¹(x)) = x', 1e-9);
    expectClose(f(g(x0 + 1.7)), x0 + 1.7, 'f(f⁻¹(x)) = x', 1e-9);
    const set = toNumSet((inst.parts[1].answer as IntervalSpec).set);
    if ((inst.parts[1].answer as IntervalSpec).v === 'x') expect(contains(set, x0) && contains(set, x0 + 1.7), 'sample points lie in the domain of f⁻¹');
  },
});

// ---------------------------------------------------------------- 2.2 range and one-to-one
const rangeOneToOne = defineTemplate({
  id: 'p2.2.range-and-restricted-inverse',
  family: 'p2.2.domain-range',
  title: 'Range of a quadratic function; restricting the domain to find an inverse',
  spec: ['P2.8', 'P2.3'],
  chapter: 'P2.2',
  sections: ['2.2', '2.4'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 4,
  marks: 8,
  time: 10,
  commands: ['Find', 'Explain', 'State'],
  tags: ['functions', 'range', 'one-to-one', 'inverse functions', 'completing the square'],
  generate(r) {
    const p = r.intNZ(-4, 4),
      q = r.int(-6, 6);
    const c = p * p + q;
    const fq = Poly.coeffs([c, -2 * p, 1]);
    const R = ans.interval([iv(exq(q), INF, true, false)], 'y', rangeOpts('f'));
    const opts = [md`$${F('f')}$ is not one-to-one: for example $${F('f')}(${p - 1}) = ${F('f')}(${p + 1})$`, md`$${F('f')}(x)$ can be negative`, md`$${F('f')}$ is not defined for every real number`];
    const C: ChoiceSpec = ans.choice(opts, 0);
    const INV: ExprSpec = ans.expr(ex(`${p}+\\sqrt{${lin(1, -q)}}`), ['x'], { domain: { x: [q + 0.2, q + 7] } });
    const D = ans.interval([iv(exq(q), INF, true, false)], 'x');
    return {
      stem: md`The function $${F('f')}$ is defined by $${F('f')}(x) = ${fq.toLatex()}$, $x \in \mathbb{R}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the range of $${F('f')}$.`, answer: R, scheme: [M1(md`Completes the square: $(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^{2}${q === 0 ? '' : sgn(q)}$`), A1('Minimum value correct'), A1(md`$${answerTex(R)}$`)], hints: ['Complete the square.', md`$${fq.toLatex()} = (x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^{2}${q === 0 ? '' : sgn(q)}$`, 'A square is never negative — what is the smallest value of f(x)?'], solution: [md`$${F('f')}(x) = (x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^{2}${q === 0 ? '' : sgn(q)}$, so the minimum value is $${q}$.`, md`Range: $${answerTex(R)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`Explain why $${F('f')}^{-1}$ does not exist.`, answer: C, scheme: [B1('Not one-to-one, with a reason')], hints: ['An inverse must undo f — so each output must come from only one input.', 'The graph is a parabola: does a horizontal line hit it twice?', 'Find two different x-values with the same f(x).'], solution: [opts[0]] }),
        part({ label: 'c', marks: 3, prompt: md`The function $${F('g')}$ is defined by $${F('g')}(x) = ${fq.toLatex()}$, $x \geqslant ${p}$. Find $${F('g')}^{-1}(x)$.`, answer: INV, scheme: [M1(md`$y = (x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^{2}${q === 0 ? '' : sgn(q)}$`), M1('Rearranges, taking a square root'), A1(md`$${F('g')}^{-1}(x) = ${p} + \sqrt{${lin(1, -q)}}$ (positive root)`)], hints: ['Use your completed square form.', md`$y = (x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^{2}${q === 0 ? '' : sgn(q)} \Rightarrow x ${p < 0 ? '+' : '-'} ${Math.abs(p)} = \pm\sqrt{y${q === 0 ? '' : sgn(-q)}}$`, md`Since $x \geqslant ${p}$, take the positive square root.`], errors: [err('wrong-branch', ans.expr(ex(`${p}-\\sqrt{${lin(1, -q)}}`), ['x'], { domain: { x: [q + 0.2, q + 7] } }), md`The domain of $${F('g')}$ is $x \geqslant ${p}$, so the inverse must give values $\geqslant ${p}$: take the positive root.`, 2)], solution: [md`$x = ${p} + \sqrt{y${q === 0 ? '' : sgn(-q)}}$ (positive root since $x \geqslant ${p}$)`, md`$${F('g')}^{-1}(x) = ${answerTex(INV)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`State the domain of $${F('g')}^{-1}$.`, answer: D, scheme: [B1(md`$${answerTex(D)}$`)], hints: ['The domain of the inverse is the range of g.', md`With $x \geqslant ${p}$, $${F('g')}(x)$ still has minimum $${q}$.`, 'Include the end point.'], solution: [md`$${answerTex(D)}$`] }),
      ],
      params: { p, q },
    };
  },
  verify(inst) {
    const { p, q } = inst.params as Record<string, number>;
    const g = (x: number) => x * x - 2 * p * x + p * p + q;
    const inv = (inst.parts[2].answer as ExprSpec).value;
    for (const x of [q + 0.5, q + 3.2]) {
      const y = evaluate(inv, { x });
      expect(y >= p - 1e-12, 'inverse lands in the restricted domain');
      expectClose(g(y), x, 'g(g⁻¹(x)) = x');
    }
    expectClose(g(p - 1), g(p + 1), 'not one-to-one witness');
  },
});

// ---------------------------------------------------------------- 2.1/2.7 modulus equations
const modulus = defineTemplate({
  id: 'p2.2.modulus-equations',
  family: 'p2.2.modulus',
  title: 'Solve equations involving the modulus of a linear function',
  spec: ['P2.7'],
  chapter: 'P2.2',
  sections: ['2.1', '2.7'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 4,
  time: 5,
  commands: ['Solve'],
  tags: ['modulus', 'equations', 'graphs'],
  generate(r) {
    const both = r.bool(0.4);
    const a = r.pick([1, 2, 3, 4]),
      b = r.int(-8, 8),
      c = r.pick([-3, -2, -1, 1, 2, 3, 5]),
      d = r.int(-9, 9);
    r.require(Math.abs(a) !== Math.abs(c));
    const x1 = Q.of(d - b, a - c),
      x2 = Q.of(-(b + d), a + c);
    const ok = (x: Q) => both || c * x.value + d >= 0;
    const valid = [x1, x2].filter(ok);
    const invalid = [x1, x2].filter((x) => !ok(x));
    r.require(valid.length >= 1 && valid.every((x) => x.d <= 6));
    r.require(!x1.eq(x2));
    const L = ans.list(valid.map((x) => ans.exact(exq(x))), { v: 'x' });
    const lhs = `\\left|${lin(a, b)}\\right|`;
    const rhs = both ? `\\left|${lin(c, d)}\\right|` : lin(c, d);
    return {
      parts: [
        part({
          marks: 4,
          prompt: md`Solve $${lhs} = ${rhs}$.`,
          answer: L,
          scheme: [M1(md`$${lin(a, b)} = ${lin(c, d)}$ leading to $x = ${x1.toLatex()}$`), M1(md`$${lin(a, b)} = -(${lin(c, d)})$ leading to $x = ${x2.toLatex()}$`), A1('Both critical values'), A1(both ? md`$${answerTex(L)}$` : md`$${answerTex(L)}$ only, having checked each value`)],
          hints: [both ? 'If |A| = |B| then A = B or A = −B.' : 'Solve the two cases: the inside equals the right-hand side, or the inside equals minus the right-hand side.', md`Case 1: $${lin(a, b)} = ${lin(c, d)}$. Case 2: $${lin(a, b)} = -(${lin(c, d)})$.`, both ? 'Both solutions are valid here.' : md`Check each answer: the right-hand side $${lin(c, d)}$ must not be negative.`],
          errors: invalid.length ? [err('not-checked', ans.list([x1, x2].map((x) => ans.exact(exq(x))), { v: 'x' }), md`Check each solution in the original equation: a modulus cannot equal a negative number.`, 3)] : [],
          solution: [md`$${lin(a, b)} = ${lin(c, d)} \Rightarrow x = ${x1.toLatex()}$`, md`$${lin(a, b)} = -(${lin(c, d)}) \Rightarrow x = ${x2.toLatex()}$`, ...(invalid.length ? [md`Checking: at $x = ${invalid[0].toLatex()}$ the right-hand side is $${Q.from(c).mul(invalid[0]).add(d).toLatex()} < 0$, so reject it.`] : []), md`$${answerTex(L)}$`],
        }),
      ],
      params: { a, b, c, d, both },
    };
  },
  verify(inst) {
    const { a, b, c, d, both } = inst.params as { a: number; b: number; c: number; d: number; both: boolean };
    const xs = (inst.parts[0].answer as ListSpec).items.map(valOf);
    for (const x of xs) expectClose(Math.abs(a * x + b) + 1, (both ? Math.abs(c * x + d) : c * x + d) + 1, 'solves the equation');
  },
});

// ---------------------------------------------------------------- functions in modelling
const profitModel = defineTemplate({
  id: 'p2.2.quadratic-model-in-context',
  family: 'p2.2.modelling',
  title: 'A quadratic function as a model: maximum, valid range and limitations',
  spec: ['P2.11', 'P2.3'],
  chapter: 'P2.2',
  sections: ['2.2'],
  level: 'A2',
  paper: [1, 2],
  difficulty: 3,
  marks: 8,
  time: 9,
  commands: ['Find', 'State', 'Give a reason'],
  tags: ['functions', 'modelling', 'quadratic', 'limitations'],
  generate(r) {
    const k = r.pick([1, 2, 3, 4, 5]),
      m = r.int(5, 20),
      s = r.int(2, Math.min(m - 1, 8));
    const P = Poly.coeffs([-k * (m * m - s * s), 2 * k * m, -k]);
    const Mx = ans.exact(exq(k * s * s), undefined, { unit: '\\text{thousand pounds}' }),
      At = ans.exact(exq(m)),
      Rg = ans.interval([iv(exq(m - s), exq(m + s), false, false)], 'x', { endsEither: true });
    const opts = ['The model may not hold for prices far from those already tried — e.g. customers may switch to competitors', 'The model shows the profit can be negative', 'The model has a maximum value'];
    const C: ChoiceSpec = ans.choice(opts, 0);
    return {
      stem: md`A company sells a product at a price of £$x$. It models its annual profit, $£P$ thousand, by $P = ${P.toLatex()}$.`,
      parts: [
        part({ label: 'a', marks: 3, prompt: md`Find the maximum annual profit predicted by the model.`, answer: Mx, scheme: [M1('Completes the square (or differentiates)'), A1(md`$P = ${k * s * s} - ${k === 1 ? '' : k}(x - ${m})^{2}$`), A1(md`£$${k * s * s}$ thousand`)], hints: [md`Write $P$ in the form $A - ${k === 1 ? '' : k}(x - B)^{2}$.`, md`Take out $-${k === 1 ? '' : k}$ from the $x$ terms first.`, 'The maximum happens when the squared bracket is zero.'], solution: [md`$P = ${k * s * s} - ${k === 1 ? '' : k}(x - ${m})^{2}$, so the maximum is $${answerTex(Mx)}$`] }),
        part({ label: 'b', marks: 1, prompt: md`State the price at which this maximum occurs.`, answer: At, scheme: [B1(md`£$${m}$`)], hints: ['Use the completed square form.', md`The squared term is zero when $x = ${m}$.`, 'Give the price.'], solution: [md`$x = ${answerTex(At)}$`] }),
        part({ label: 'c', marks: 3, prompt: md`Find the range of prices for which the model predicts the company makes a profit.`, answer: Rg, scheme: [M1('Sets P = 0 (or P > 0)'), M1('Solves to find the critical values'), A1(md`$${answerTex(Rg)}$`)], hints: ['A profit means P > 0.', md`$${k * s * s} - ${k === 1 ? '' : k}(x - ${m})^{2} > 0 \Rightarrow (x - ${m})^{2} < ${s * s}$`, 'Take square roots carefully: the answer is between two values.'], solution: [md`$(x - ${m})^{2} < ${s * s} \Rightarrow -${s} < x - ${m} < ${s}$`, md`$${answerTex(Rg)}$`] }),
        part({ label: 'd', marks: 1, prompt: md`Give one limitation of this model.`, answer: C, scheme: [B1('A sensible limitation in context')], hints: ['Models are based on limited data.', 'Would customers behave the same way at every price?', 'Think about what else affects sales.'], solution: [opts[0]] }),
      ],
      params: { k, m, s },
    };
  },
  verify(inst) {
    const { k, m, s } = inst.params as Record<string, number>;
    const P = (x: number) => -k * x * x + 2 * k * m * x - k * (m * m - s * s);
    expectClose(P(valOf(inst.parts[1].answer as ExactSpec)), valOf(inst.parts[0].answer as ExactSpec), 'maximum value');
    expectClose(P(m - s) + 1, 1, 'root 1');
    expectClose(P(m + s) + 1, 1, 'root 2');
  },
});

const templates: Template[] = [composite, inverse, rangeOneToOne, modulus, profitModel];
export default templates;
