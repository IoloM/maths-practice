/** Pure Year 2, Chapter 7 — A* stretch: R cos(θ − α), the greatest value of a reciprocal of it, and solving an equation (compound angles, functions, trig equations). */
import { Q } from '../../../engine/core/rational';
import { evaluate, num, sqrt } from '../../../engine/core/expr';
import { fmtDP } from '../../../engine/core/format';
import { expect, expectClose } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec, ListSpec, NumericSpec } from '../../../engine/marking/types';
import { A1, B1, M1, ans, defineTemplate, err, md, part } from '../../../engine/templates/helpers';
import type { Template } from '../../../engine/templates/types';
import { sumTex } from '../shared/calculus';

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [1, 2, 0],
  [2, 3, 0],
];
const deg = (x: number) => (x * 180) / Math.PI;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

const rFormReciprocal = defineTemplate({
  id: 'p2.7.stretch-r-form-reciprocal-and-equation',
  family: 'stretch.r-form-reciprocal-and-equation',
  title: 'A* stretch: R cos(θ − α), the greatest value of a reciprocal, and an equation to solve',
  spec: ['P5.6', 'P5.7', 'P2.7'],
  chapter: 'P2.7',
  level: 'A2',
  paper: [1, 2],
  difficulty: 5,
  marks: 12,
  time: 15,
  commands: ['Express', 'Find', 'Solve'],
  tags: ['stretch', 'synoptic', 'R cos(θ − α)', 'harmonic form', 'maximum value', 'trigonometric equations'],
  generate(r) {
    const [p, q, rr] = r.pick(TRIPLES);
    const [a, b] = r.bool() ? [p, q] : [q, p];
    const R2 = a * a + b * b;
    const R = Math.sqrt(R2);
    const alpha = deg(Math.atan(b / a));
    const shift = r.int(1, 4);
    // c > R so the reciprocal is never undefined
    const c = Math.ceil(R + 1e-9) + shift - 1;
    const kNum = r.int(2, 12);
    const max = kNum / (c - R);
    const exactMax = rr > 0;
    const d = r.intNZ(-Math.floor(R - 0.5), Math.floor(R - 0.5));
    const beta = deg(Math.acos(d / R));
    const sols = [norm360(alpha + beta), norm360(alpha - beta)].sort((x, y) => x - y);
    r.require(sols.every((s) => s > 0.6 && s < 359.4) && sols[1] - sols[0] > 1);
    const fTex = sumTex([
      [a, '\\cos\\theta'],
      [b, '\\sin\\theta'],
    ]);
    const Rspec: ExactSpec = ans.exact(rr > 0 ? num(rr) : sqrt(R2), ['exact'], { label: 'R =' });
    const RTex = answerTex({ ...Rspec, label: undefined });
    const ALPHA: NumericSpec = ans.num(alpha, { dp: 2 }, { label: '\\alpha =', unit: '^\\circ' });
    const at = fmtDP(alpha, 2);
    const MAX: NumericSpec | ExactSpec = exactMax ? ans.exact(num(Q.of(kNum, c - rr)), undefined, { allowDecimal: true }) : ans.num(max, { sf: 3 }, { exactAllowed: true });
    const theta = norm360(alpha + 180);
    const THETA: NumericSpec = ans.num(theta, { dp: 1 }, { alts: [Number(at) + 180], label: '\\theta =', unit: '^\\circ' });
    const SOLS: ListSpec = ans.list(
      sols.map((s) => ans.num(s, { dp: 1 })),
      { v: '\\theta', angle: 'deg' },
    );
    const gTex = `\\dfrac{${kNum}}{${c} + ${fTex}}`;
    return {
      stem: md`$\mathrm{f}(\theta) = ${fTex}$`,
      parts: [
        part({
          label: 'a',
          marks: 1,
          prompt: md`$\mathrm{f}(\theta)$ can be written as $R\cos(\theta - \alpha)$, where $R > 0$ and $0 < \alpha < 90^\circ$. Find the exact value of $R$.`,
          answer: Rspec,
          scheme: [B1(md`$R = \sqrt{${a}^{2} + ${b}^{2}} = ${RTex}$`)],
          hints: [md`Expand: $R\cos(\theta - \alpha) = R\cos\theta\cos\alpha + R\sin\theta\sin\alpha$.`, md`So $R\cos\alpha = ${a}$ and $R\sin\alpha = ${b}$.`, md`Square and add: $R^{2} = ${a}^{2} + ${b}^{2}$.`],
          solution: [md`$R^{2} = ${a}^{2} + ${b}^{2} = ${R2}$, so $R = ${RTex}$`],
        }),
        part({
          label: 'b',
          marks: 2,
          prompt: md`Find the value of $\alpha$, in degrees to 2 decimal places.`,
          answer: ALPHA,
          scheme: [M1(md`$\tan\alpha = \dfrac{${b}}{${a}}$`), A1(md`$\alpha = ${at}^\circ$`)],
          hints: [md`$R\sin\alpha = ${b}$ and $R\cos\alpha = ${a}$: divide them.`, md`$\tan\alpha = \dfrac{${b}}{${a}}$`, 'Your calculator must be in degrees.'],
          errors: [err('tan-upside-down', ans.num(90 - alpha, { dp: 2 }), md`Upside down: $\tan\alpha = \dfrac{R\sin\alpha}{R\cos\alpha} = \dfrac{${b}}{${a}}$.`)],
          solution: [md`$\tan\alpha = \dfrac{${b}}{${a}}$, so $\alpha = ${at}^\circ$`, md`$${answerTex(ALPHA)}$`],
        }),
        part({
          label: 'c',
          marks: 3,
          prompt: md`$\mathrm{g}(\theta) = ${gTex}$. Find the greatest value of $\mathrm{g}(\theta)$${exactMax ? '' : ', exactly or to 3 significant figures'}.`,
          answer: MAX,
          scheme: [M1(md`$\mathrm{g}$ is greatest when the denominator is least: $${c} + ${RTex}\cos(\theta - \alpha)$ with $\cos(\theta - \alpha) = -1$`), M1(md`Least denominator $${c} - ${RTex}$`), A1(md`$${answerTex(MAX)}$`)],
          hints: ['A fraction with a fixed top is biggest when its bottom is smallest (and still positive).', md`$${c} + \mathrm{f}(\theta) = ${c} + ${RTex}\cos(\theta - ${at}^\circ)$. How small can that be?`, md`The smallest value of $\cos$ is $-1$, giving $${c} - ${RTex}$.`],
          errors: [err('used-max-of-cos', exactMax ? ans.exact(num(Q.of(kNum, c + rr))) : ans.num(kNum / (c + R), { sf: 3 }), 'That is the least value of g. The greatest comes from the smallest denominator, when cos(θ − α) = −1.')],
          solution: [md`Smallest denominator: $${c} - ${RTex}$ when $\cos(\theta - \alpha) = -1$`, md`Greatest value $= \dfrac{${kNum}}{${c} - ${RTex}} = ${answerTex(MAX)}$`],
        }),
        part({
          label: 'd',
          marks: 2,
          prompt: md`Find the value of $\theta$, in the interval $0 \le \theta < 360^\circ$, at which this greatest value occurs.`,
          answer: THETA,
          scheme: [M1(md`$\theta - \alpha = 180^\circ$`), A1(md`$\theta = ${fmtDP(theta, 2)}^\circ$`)],
          hints: [md`You need $\cos(\theta - \alpha) = -1$.`, md`$\cos 180^\circ = -1$, so $\theta - ${at}^\circ = 180^\circ$.`, md`$\theta = 180^\circ + ${at}^\circ$`],
          solution: [md`$\theta - ${at}^\circ = 180^\circ$, so $${answerTex(THETA)}$`],
        }),
        part({
          label: 'e',
          marks: 4,
          prompt: md`Solve $\mathrm{f}(\theta) = ${d}$ for $0 \le \theta < 360^\circ$, giving your answers to 1 decimal place.`,
          answer: SOLS,
          scheme: [M1(md`$\cos(\theta - \alpha) = \dfrac{${d}}{${RTex}}$`), A1(md`$\theta - \alpha = ${fmtDP(beta, 2)}^\circ$`), M1(md`Second solution from $\theta - \alpha = -${fmtDP(beta, 2)}^\circ$ (or $360^\circ - ${fmtDP(beta, 2)}^\circ$)`), A1(md`$${answerTex(SOLS)}$`)],
          hints: [md`Use part (a): $${RTex}\cos(\theta - ${at}^\circ) = ${d}$.`, md`$\theta - ${at}^\circ = \pm\cos^{-1}\left(\dfrac{${d}}{${RTex}}\right) = \pm ${fmtDP(beta, 2)}^\circ$`, md`Add $${at}^\circ$ to each; add $360^\circ$ to anything negative.`],
          errors: [err('one-solution', ans.list([ans.num(norm360(alpha + beta), { dp: 1 })], { v: '\\theta', angle: 'deg' }), 'There is a second solution: cos is also positive or negative in another quadrant — use −β as well.', 2)],
          solution: [md`$\cos(\theta - ${at}^\circ) = \dfrac{${d}}{${RTex}}$, so $\theta - ${at}^\circ = \pm ${fmtDP(beta, 2)}^\circ$`, md`$${answerTex(SOLS)}$`],
        }),
      ],
      params: { a, b, c, k: kNum, d },
    };
  },
  verify(inst) {
    const { a, b, c, k, d } = inst.params as Record<string, number>;
    const f = (t: number) => a * Math.cos((t * Math.PI) / 180) + b * Math.sin((t * Math.PI) / 180);
    const R = evaluate((inst.parts[0].answer as ExactSpec).value);
    const al = (inst.parts[1].answer as NumericSpec).value;
    for (const t of [10, 100, 250]) expectClose(R * Math.cos(((t - al) * Math.PI) / 180), f(t), 'R form');
    let best = -Infinity;
    for (let t = 0; t < 360; t += 0.01) best = Math.max(best, k / (c + f(t)));
    const M = inst.parts[2].answer;
    const top = M.type === 'exact' ? evaluate(M.value) : (M as NumericSpec).value;
    expect(best <= top + 1e-9, 'nothing beats the greatest value');
    expectClose(best, top, 'greatest value (search)', 1e-6);
    expectClose(k / (c + f((inst.parts[3].answer as NumericSpec).value)), top, 'where it occurs', 1e-9);
    for (const s of (inst.parts[4].answer as ListSpec).items) expect(Math.abs(f((s as NumericSpec).value) - d) < 1e-9, 'solves the equation');
  },
});

const templates: Template[] = [rFormReciprocal];
export default templates;
