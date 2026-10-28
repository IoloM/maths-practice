/** Pure Year 2, Chapter 4 — A* stretch: a binomial expansion used to estimate an integral, then the percentage error (binomial, integration, accuracy). */
import { Q } from '../../../engine/core/rational';
import { evaluate } from '../../../engine/core/expr';
import { fmtDP, fmtNum, fmtSF } from '../../../engine/core/format';
import { expectClose, integrate } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExprSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { ex, sumTex } from '../shared/calculus';

const binomialIntegral = defineTemplate({
  id: 'p2.4.stretch-binomial-estimate-of-an-integral',
  family: 'stretch.binomial-estimate-of-an-integral',
  title: 'A* stretch: estimate an integral with a binomial expansion, then find the percentage error',
  spec: ['P4.1', 'P8.2', 'P8.3'],
  chapter: 'P2.4',
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 10,
  time: 13,
  commands: ['Find', 'Use', 'Calculate'],
  tags: ['stretch', 'synoptic', 'binomial expansion', 'rational powers', 'definite integrals', 'percentage error'],
  generate(r) {
    const n = r.pick([Q.of(1, 2), Q.of(-1, 2), Q.of(3, 2), Q.of(-3, 2), Q.of(1, 3), Q.of(-2)]);
    const k = r.pick([2, 3, 4, 5, -2, -3]);
    const c = r.pick([0.1, 0.2]);
    const kc = Math.abs(k * c);
    r.require(kc <= 0.6);
    const nv = n.value;
    const c1 = n.mul(k);
    const c2 = n.mul(n.sub(1)).div(2).mul(k * k);
    const expTex = sumTex([
      [1, ''],
      [c1, 'x'],
      [c2, 'x^{2}'],
    ]);
    const EXP: ExprSpec = ans.expr(ex(expTex), ['x']);
    const est = c + (c1.value * c * c) / 2 + (c2.value * c ** 3) / 3;
    const exact = ((1 + k * c) ** (nv + 1) - 1) / (k * (nv + 1));
    const pct = (Math.abs(est - exact) / exact) * 100;
    r.require(pct > 0.002 && pct < 20);
    const est4 = Number(fmtDP(est, 4));
    const EST: NumericSpec = ans.num(est, { dp: 4 }, { exactAllowed: true });
    const PCT: NumericSpec = ans.num(pct, { sf: 2 }, { alts: [(Math.abs(est4 - exact) / exact) * 100] });
    const nTex = n.toLatex();
    const kxTex = sumTex([
      [1, ''],
      [k, 'x'],
    ]);
    const np1 = n.add(1);
    const antiTex = `\\dfrac{(${kxTex})^{${np1.toLatex()}}}{${np1.mul(k).toLatex()}}`;
    const cT = fmtNum(c);
    return {
      stem: md`$\mathrm{f}(x) = (${kxTex})^{${nTex}}$`,
      parts: [
        part({
          label: 'a',
          marks: 3,
          prompt: md`Find the binomial expansion of $\mathrm{f}(x)$, in ascending powers of $x$, up to and including the term in $x^{2}$.`,
          answer: EXP,
          scheme: [M1(md`Uses $1 + n(kx) + \dfrac{n(n - 1)}{2!}(kx)^{2}$ with $n = ${nTex}$, $k = ${k}$`), B1(md`$${sumTex([[1, ''], [c1, 'x']])}$`), A1(md`$${answerTex(EXP)}$`)],
          hints: [md`$(1 + y)^{n} = 1 + ny + \dfrac{n(n - 1)}{2!}y^{2} + \ldots$ with $y = ${k}x$.`, md`$n = ${nTex}$, so $n(n - 1) = ${n.mul(n.sub(1)).toLatex()}$.`, md`Square all of $${k}x$: $(${k}x)^{2} = ${k * k}x^{2}$.`],
          errors: [err('k-not-squared', ans.expr(ex(sumTex([[1, ''], [c1, 'x'], [n.mul(n.sub(1)).div(2).mul(k), 'x^{2}']])), ['x']), md`Square the whole of $${k}x$ in the third term: $(${k}x)^{2} = ${k * k}x^{2}$.`, 2)],
          solution: [md`$(${kxTex})^{${nTex}} = 1 + (${nTex})(${k}x) + \dfrac{(${nTex})(${n.sub(1).toLatex()})}{2}(${k}x)^{2} + \ldots$`, md`$= ${answerTex(EXP)}$`],
        }),
        part({
          label: 'b',
          marks: 3,
          prompt: md`Use your expansion to estimate $\displaystyle\int_{0}^{${cT}} \mathrm{f}(x)\,\mathrm{d}x$, giving your answer to 4 decimal places.`,
          answer: EST,
          scheme: [M1(md`Integrates the expansion: $${sumTex([[1, 'x'], [c1.div(2), 'x^{2}'], [c2.div(3), 'x^{3}']])}$`), M1(md`Substitutes $x = ${cT}$ (the lower limit gives 0)`), A1(md`$${answerTex(EST)}$`)],
          hints: [md`The expansion is good for small $x$ — here $|${k}x| \le ${fmtNum(kc)} < 1$, so it is valid.`, md`$\displaystyle\int \left(${expTex}\right)\mathrm{d}x = ${sumTex([[1, 'x'], [c1.div(2), 'x^{2}'], [c2.div(3), 'x^{3}']])}$`, md`Put in $x = ${cT}$; at $x = 0$ everything is $0$.`],
          solution: [md`$\displaystyle\int_{0}^{${cT}} \left(${expTex}\right)\mathrm{d}x = \left[${sumTex([[1, 'x'], [c1.div(2), 'x^{2}'], [c2.div(3), 'x^{3}']])}\right]_{0}^{${cT}}$`, md`$= ${fmtDP(est, 6)}\ldots = ${answerTex(EST)}$`],
        }),
        part({
          label: 'c',
          marks: 4,
          prompt: md`By integrating $\mathrm{f}(x)$ directly, find the percentage error in your estimate, to 2 significant figures.`,
          answer: PCT,
          scheme: [M1(md`$\displaystyle\int (${kxTex})^{${nTex}}\,\mathrm{d}x = ${antiTex}$`), A1(md`Exact value $= ${fmtDP(exact, 6)}\ldots$`), M1('Percentage error = |estimate − exact| ÷ exact × 100'), A1(md`$${answerTex(PCT)}\%$`)],
          hints: [md`Reverse chain rule: add one to the power, then divide by the new power and by $${k}$.`, md`$\displaystyle\int (${kxTex})^{${nTex}}\,\mathrm{d}x = ${antiTex} + c$`, 'Percentage error = (difference ÷ true value) × 100. Use the true value, not the estimate, on the bottom.'],
          solution: [md`$\displaystyle\int_{0}^{${cT}} (${kxTex})^{${nTex}}\,\mathrm{d}x = \left[${antiTex}\right]_{0}^{${cT}} = ${fmtDP(exact, 6)}\ldots$`, md`Error $= \dfrac{|${fmtDP(est, 6)} - ${fmtDP(exact, 6)}|}{${fmtDP(exact, 6)}} \times 100 = ${fmtSF(pct, 4)}\ldots$`, md`$${answerTex(PCT)}\%$`],
        }),
      ],
      params: { n: nv, k, c },
    };
  },
  verify(inst) {
    const { n, k, c } = inst.params as Record<string, number>;
    const f = (x: number) => (1 + k * x) ** n;
    const E = (inst.parts[0].answer as ExprSpec).value;
    // the expansion agrees with f to second order near 0 (the x² term is ~1e-7 here, the x³ term ~1e-9)
    for (const x of [0.0001, -0.0001, 0.0002]) expectClose(evaluate(E, { x }), f(x), 'expansion', 1e-8);
    const est = integrate((x) => evaluate(E, { x }), 0, c);
    expectClose((inst.parts[1].answer as NumericSpec).value, est, 'estimate');
    const exact = integrate(f, 0, c);
    expectClose((inst.parts[2].answer as NumericSpec).value, (Math.abs(est - exact) / exact) * 100, 'percentage error', 1e-6);
  },
});

const templates: Template[] = [binomialIntegral];
export default templates;
