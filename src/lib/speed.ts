/**
 * Speed rounds: 10 quick one-step questions in 5 minutes, from Pure, Statistics, Mechanics or a mix.
 * Each question is made fresh from a seed (like the rest of the bank) and marked by the same engine.
 * Personal bests are in speed-records.ts.
 */
import { Rng, withRetries } from '../engine/core/rng';
import { Q, gcd, nCr } from '../engine/core/rational';
import { PI, div, mul, num, sqrt } from '../engine/core/expr';
import { ans, F, N } from '../engine/templates/helpers';
import { compare } from '../engine/marking/compare';
import type { AnswerSpec, Response } from '../engine/marking/types';
import { binomPmf, normalCdf } from '../engine/stats/distributions';

import type { SpeedArea } from './speed-records';

export type { SpeedArea };
export const SPEED_AREAS: { id: SpeedArea; label: string; blurb: string }[] = [
  { id: 'pure', label: 'Pure', blurb: 'Indices, surds, exact trig, calculus, logs, sequences' },
  { id: 'stats', label: 'Statistics', blurb: 'Probability, binomial, normal, averages, coding' },
  { id: 'mech', label: 'Mechanics', blurb: 'suvat, F = ma, weight, friction, vectors, moments' },
  { id: 'mixed', label: 'Mixed', blurb: 'A bit of everything' },
];
export const SPEED_COUNT = 10;
export const SPEED_SECONDS = 300;

export interface SpeedQ {
  kind: string;
  /** may contain $…$ maths */
  prompt: string;
  answer: AnswerSpec;
  /** one line of working */
  how: string;
}
interface Gen {
  kind: string;
  area: Exclude<SpeedArea, 'mixed'>;
  make: (r: Rng) => Omit<SpeedQ, 'kind'>;
}

/** 3x^{2} - x + 5 from [coefficient, power] pairs. */
function polyTex(terms: [number, number][], v = 'x'): string {
  let s = '';
  for (const [c, p] of terms) {
    if (c === 0) continue;
    const body = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`;
    const coef = body && Math.abs(c) === 1 ? '' : String(Math.abs(c));
    s += s === '' ? `${c < 0 ? '-' : ''}${coef}${body}` : `${c < 0 ? ' - ' : ' + '}${coef}${body}`;
  }
  return s || '0';
}
const dec = (x: number) => Math.round(x * 1e6) / 1e6;
const G = 9.8;

const TRIG: [string, number, string, string][] = [
  // function, degrees, radians (LaTeX), value key
  ['sin', 30, '\\frac{\\pi}{6}', 'half'],
  ['sin', 45, '\\frac{\\pi}{4}', 'r2'],
  ['sin', 60, '\\frac{\\pi}{3}', 'r3'],
  ['cos', 30, '\\frac{\\pi}{6}', 'r3'],
  ['cos', 45, '\\frac{\\pi}{4}', 'r2'],
  ['cos', 60, '\\frac{\\pi}{3}', 'half'],
  ['tan', 30, '\\frac{\\pi}{6}', 'inv3'],
  ['tan', 45, '\\frac{\\pi}{4}', 'one'],
  ['tan', 60, '\\frac{\\pi}{3}', 'rt3'],
];
const TRIG_VALUE = {
  half: [num(Q.of(1, 2)), '\\frac{1}{2}'],
  r2: [div(sqrt(2), num(2)), '\\frac{\\sqrt{2}}{2}'],
  r3: [div(sqrt(3), num(2)), '\\frac{\\sqrt{3}}{2}'],
  inv3: [div(sqrt(3), num(3)), '\\frac{\\sqrt{3}}{3}'],
  one: [num(1), '1'],
  rt3: [sqrt(3), '\\sqrt{3}'],
} as const;

export const GENS: Gen[] = [
  // ------------------------------------------------------------------ pure
  {
    kind: 'Indices',
    area: 'pure',
    make: (r) => {
      const k = r.pick([2, 3, 4, 5]);
      const d = r.pick([2, 3]);
      const p = r.pick([1, 2, 3, -1, -2]);
      r.require(gcd(Math.abs(p), d) === 1 && k ** d <= 125);
      const base = k ** d;
      const v = p > 0 ? Q.of(k ** p) : Q.of(1, k ** -p);
      return {
        prompt: `Find the exact value of $${base}^{${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${d}}}$.`,
        answer: ans.exact(num(v)),
        how: `$${d === 2 ? '\\sqrt' : '\\sqrt[3]'}{${base}} = ${k}$, then $${k}^{${p}} = ${F(v)}$.`,
      };
    },
  },
  {
    kind: 'Surds',
    area: 'pure',
    make: (r) => {
      const a = r.int(2, 6);
      const b = r.pick([2, 3, 5, 6, 7]);
      return {
        prompt: `Write $\\sqrt{${a * a * b}}$ in the form $a\\sqrt{b}$, where $b$ is as small as possible.`,
        answer: ans.exact(mul(num(a), sqrt(b)), ['surd']),
        how: `$\\sqrt{${a * a * b}} = \\sqrt{${a * a}}\\sqrt{${b}} = ${a}\\sqrt{${b}}$.`,
      };
    },
  },
  {
    kind: 'Exact trig',
    area: 'pure',
    make: (r) => {
      const [f, deg, rad, key] = r.pick(TRIG);
      const [value, tex] = TRIG_VALUE[key as keyof typeof TRIG_VALUE];
      const angle = r.bool() ? `${deg}^\\circ` : rad;
      return {
        prompt: `Write down the exact value of $\\${f} ${angle}$.`,
        answer: ans.exact(value),
        how: `$\\${f} ${angle} = ${tex}$ — one to know by heart.`,
      };
    },
  },
  {
    kind: 'Differentiation',
    area: 'pure',
    make: (r) => {
      const n = r.pick([2, 3]);
      const a = r.intNZ(-4, 5);
      const b = r.int(-6, 6);
      const c = r.int(-9, 9);
      const k = r.intNZ(-3, 3);
      const v = a * n * k ** (n - 1) + b;
      return {
        prompt: `$f(x) = ${polyTex([[a, n], [b, 1], [c, 0]])}$. Find $f'(${k})$.`,
        answer: ans.exact(num(v)),
        how: `$f'(x) = ${polyTex([[a * n, n - 1], [b, 0]])}$, so $f'(${k}) = ${v}$.`,
      };
    },
  },
  {
    kind: 'Definite integral',
    area: 'pure',
    make: (r) => {
      const a = r.int(1, 3);
      const b = r.int(-3, 3);
      const k = r.int(1, 3);
      const v = a * k ** 3 + b * k * k;
      return {
        prompt: `Find $\\displaystyle\\int_0^{${k}} \\left(${polyTex([[3 * a, 2], [2 * b, 1]])}\\right)\\,\\mathrm{d}x$.`,
        answer: ans.exact(num(v)),
        how: `$\\left[${polyTex([[a, 3], [b, 2]])}\\right]_0^{${k}} = ${v}$.`,
      };
    },
  },
  {
    kind: 'Logarithms',
    area: 'pure',
    make: (r) => {
      const b = r.pick([2, 3, 4, 5, 10]);
      const n = r.int(-2, 4);
      r.require(n !== 0 && Math.abs(b ** n) <= 1000);
      const arg = n > 0 ? String(b ** n) : `\\frac{1}{${b ** -n}}`;
      return r.bool()
        ? { prompt: `Find $\\log_{${b}} ${arg}$.`, answer: ans.exact(num(n)), how: `$${arg} = ${b}^{${n}}$, so the log is $${n}$.` }
        : { prompt: `Solve $${b}^x = ${arg}$.`, answer: { ...ans.exact(num(n)), label: 'x =' }, how: `$${arg} = ${b}^{${n}}$, so $x = ${n}$.` };
    },
  },
  {
    kind: 'Discriminant',
    area: 'pure',
    make: (r) => {
      const a = r.intNZ(-3, 4);
      const b = r.int(-7, 7);
      const c = r.intNZ(-6, 6);
      const v = b * b - 4 * a * c;
      return {
        prompt: `Find the discriminant of $${polyTex([[a, 2], [b, 1], [c, 0]])}$.`,
        answer: ans.exact(num(v)),
        how: `$b^2 - 4ac = ${b < 0 ? `(${b})` : b}^2 - 4(${a})(${c}) = ${v}$.`,
      };
    },
  },
  {
    kind: 'Arithmetic sequence',
    area: 'pure',
    make: (r) => {
      const a = r.int(-10, 20);
      const d = r.intNZ(-5, 7);
      const n = r.int(10, 30);
      const v = a + (n - 1) * d;
      return {
        prompt: `An arithmetic sequence has first term $${a}$ and common difference $${d}$. Find the ${n}th term.`,
        answer: ans.exact(num(v)),
        how: `$u_{${n}} = a + ${n - 1}d = ${a} + ${n - 1} \\times ${d < 0 ? `(${d})` : d} = ${v}$.`,
      };
    },
  },
  {
    kind: 'Sum to infinity',
    area: 'pure',
    make: (r) => {
      const a = r.int(2, 24);
      const rr = r.pick([Q.of(1, 2), Q.of(1, 3), Q.of(2, 3), Q.of(1, 4), Q.of(3, 4), Q.of(-1, 2), Q.of(1, 5), Q.of(2, 5)]);
      const v = Q.of(a).div(Q.ONE.sub(rr));
      return {
        prompt: `A geometric series has first term $${a}$ and common ratio $${F(rr)}$. Find its sum to infinity.`,
        answer: ans.exact(num(v)),
        how: `$S_\\infty = \\dfrac{a}{1 - r} = \\dfrac{${a}}{${F(Q.ONE.sub(rr))}} = ${F(v)}$.`,
      };
    },
  },
  {
    kind: 'Radians',
    area: 'pure',
    make: (r) => {
      const deg = r.pick([30, 45, 60, 90, 120, 135, 150, 210, 225, 240, 270, 300, 315, 330]);
      const k = Q.of(deg, 180);
      return {
        prompt: `Write $${deg}^\\circ$ in radians, as an exact multiple of $\\pi$.`,
        answer: ans.exact(mul(num(k), PI)),
        how: `$${deg} \\times \\dfrac{\\pi}{180} = ${k.eq(1) ? '' : F(k)}\\pi$.`,
      };
    },
  },
  {
    kind: 'Binomial expansion',
    area: 'pure',
    make: (r) => {
      const n = r.int(4, 7);
      const a = r.pick([-3, -2, -1, 2, 3]);
      const v = nCr(n, 2) * a * a;
      return {
        prompt: `Find the coefficient of $x^2$ in the expansion of $(1 ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}x)^{${n}}$.`,
        answer: ans.exact(num(v)),
        how: `$\\binom{${n}}{2}(${a})^2 = ${nCr(n, 2)} \\times ${a * a} = ${v}$.`,
      };
    },
  },
  {
    kind: 'Gradient',
    area: 'pure',
    make: (r) => {
      const [x1, x2] = r.distinct(2, -6, 8);
      const y1 = r.int(-8, 9);
      const y2 = r.int(-8, 9);
      const m = Q.of(y2 - y1, x2 - x1);
      return {
        prompt: `Find the gradient of the line through $(${x1}, ${y1})$ and $(${x2}, ${y2})$.`,
        answer: ans.exact(num(m)),
        how: `$\\dfrac{${y2} - ${y1 < 0 ? `(${y1})` : y1}}{${x2} - ${x1 < 0 ? `(${x1})` : x1}} = ${F(m)}$.`,
      };
    },
  },
  // ------------------------------------------------------------------ statistics
  {
    kind: 'Combinations',
    area: 'stats',
    make: (r) => {
      const n = r.int(5, 12);
      const k = r.int(2, 4);
      return { prompt: `Find $\\binom{${n}}{${k}}$.`, answer: ans.exact(num(nCr(n, k))), how: `$\\dfrac{${n}!}{${k}!\\,${n - k}!} = ${nCr(n, k)}$ (the $^n\\mathrm{C}_r$ button).` };
    },
  },
  {
    kind: 'Binomial probability',
    area: 'stats',
    make: (r) => {
      const n = r.int(5, 12);
      const p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
      const k = r.int(1, n - 1);
      const v = binomPmf(n, p, k);
      r.require(v > 0.001);
      return {
        prompt: `$X \\sim \\mathrm{B}(${n}, ${N(p)})$. Find $\\mathrm{P}(X = ${k})$, to 3 significant figures.`,
        answer: ans.num(v, { sf: 3 }),
        how: `$\\binom{${n}}{${k}}(${N(p)})^{${k}}(${N(dec(1 - p))})^{${n - k}} = ${N(Number(v.toPrecision(4)))}\\ldots$ (Binomial PD on the calculator).`,
      };
    },
  },
  {
    kind: 'Binomial mean and variance',
    area: 'stats',
    make: (r) => {
      const n = r.pick([10, 12, 15, 20, 25, 30, 40, 50]);
      const p = Q.of(r.pick([1, 2, 3, 4, 5, 6]), 10);
      const variance = r.bool();
      const v = variance ? p.mul(n).mul(Q.ONE.sub(p)) : p.mul(n);
      return {
        prompt: `$X \\sim \\mathrm{B}(${n}, ${N(p.value)})$. Find ${variance ? '$\\mathrm{Var}(X)$' : '$\\mathrm{E}(X)$'}.`,
        answer: ans.exact(num(v), undefined, { allowDecimal: true }),
        how: variance ? `$np(1 - p) = ${n} \\times ${N(p.value)} \\times ${N(dec(1 - p.value))} = ${N(v.value)}$.` : `$np = ${n} \\times ${N(p.value)} = ${N(v.value)}$.`,
      };
    },
  },
  {
    kind: 'Addition rule',
    area: 'stats',
    make: (r) => {
      const a = r.int(3, 12) * 5;
      const b = r.int(3, 12) * 5;
      const both = r.int(1, Math.min(a, b) / 5) * 5;
      r.require(a + b - both <= 100 && both < Math.min(a, b));
      const v = Q.of(a + b - both, 100);
      return {
        prompt: `$\\mathrm{P}(A) = ${N(a / 100)}$, $\\mathrm{P}(B) = ${N(b / 100)}$ and $\\mathrm{P}(A \\cap B) = ${N(both / 100)}$. Find $\\mathrm{P}(A \\cup B)$.`,
        answer: ans.exact(num(v), undefined, { allowDecimal: true }),
        how: `$${N(a / 100)} + ${N(b / 100)} - ${N(both / 100)} = ${N(v.value)}$.`,
      };
    },
  },
  {
    kind: 'Independent events',
    area: 'stats',
    make: (r) => {
      const a = r.int(1, 9);
      const b = r.int(1, 9);
      const v = Q.of(a * b, 100);
      return {
        prompt: `$A$ and $B$ are independent, with $\\mathrm{P}(A) = ${N(a / 10)}$ and $\\mathrm{P}(B) = ${N(b / 10)}$. Find $\\mathrm{P}(A \\cap B)$.`,
        answer: ans.exact(num(v), undefined, { allowDecimal: true }),
        how: `Independent, so multiply: $${N(a / 10)} \\times ${N(b / 10)} = ${N(v.value)}$.`,
      };
    },
  },
  {
    kind: 'Conditional probability',
    area: 'stats',
    make: (r) => {
      const pb = r.pick([4, 5, 6, 8]);
      const both = r.int(1, pb - 1);
      const v = Q.of(both, pb);
      return {
        prompt: `$\\mathrm{P}(B) = ${N(pb / 10)}$ and $\\mathrm{P}(A \\cap B) = ${N(both / 10)}$. Find $\\mathrm{P}(A \\mid B)$, exactly or to 3 significant figures.`,
        answer: ans.num(v.value, { sf: 3 }, { exactAllowed: true }),
        how: `$\\dfrac{\\mathrm{P}(A \\cap B)}{\\mathrm{P}(B)} = \\dfrac{${N(both / 10)}}{${N(pb / 10)}} = ${F(v)}$.`,
      };
    },
  },
  {
    kind: 'Standardising',
    area: 'stats',
    make: (r) => {
      const mu = r.pick([20, 30, 40, 50, 60, 75, 100]);
      const s = r.pick([2, 3, 4, 5, 10]);
      const z = r.pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]);
      const x = dec(mu + z * s);
      return {
        prompt: `$X \\sim \\mathrm{N}(${mu}, ${s * s})$. Find the value of $z$ for $x = ${N(x)}$.`,
        answer: { ...ans.exact(num(Q.of(Math.round(z * 2), 2)), undefined, { allowDecimal: true }), label: 'z =' },
        how: `$z = \\dfrac{${N(x)} - ${mu}}{${s}} = ${N(z)}$ (remember $\\sigma = \\sqrt{${s * s}} = ${s}$).`,
      };
    },
  },
  {
    kind: 'Normal probability',
    area: 'stats',
    make: (r) => {
      const mu = r.pick([20, 40, 50, 60, 100]);
      const s = r.pick([2, 4, 5, 10]);
      const x = dec(mu + r.pick([-1.5, -1, -0.5, 0.5, 1, 1.2, 1.5, 2]) * s);
      const less = r.bool();
      const v = less ? normalCdf(x, mu, s) : 1 - normalCdf(x, mu, s);
      return {
        prompt: `$X \\sim \\mathrm{N}(${mu}, ${s}^2)$. Find $\\mathrm{P}(X ${less ? '<' : '>'} ${N(x)})$, to 3 significant figures.`,
        answer: ans.num(v, { sf: 3 }),
        how: `Normal CD on the calculator (or $z = ${N(dec((x - mu) / s))}$): $${N(Number(v.toPrecision(4)))}\\ldots$`,
      };
    },
  },
  {
    kind: 'Mean from totals',
    area: 'stats',
    make: (r) => {
      const n = r.pick([4, 5, 8, 10, 20, 25]);
      const m = Q.of(r.int(20, 400), 10);
      const total = m.mul(n);
      return {
        prompt: `For a sample of $${n}$ values, $\\sum x = ${N(total.value)}$. Find the mean.`,
        answer: ans.exact(num(m), undefined, { allowDecimal: true }),
        how: `$\\bar{x} = \\dfrac{${N(total.value)}}{${n}} = ${N(m.value)}$.`,
      };
    },
  },
  {
    kind: 'Coding',
    area: 'stats',
    make: (r) => {
      const a = r.pick([10, 20, 50, 100, 150, 200]);
      const b = r.pick([2, 5, 10]);
      const m = r.int(-9, 12);
      return {
        prompt: `Data are coded using $y = \\dfrac{x - ${a}}{${b}}$. The mean of $y$ is $${m}$. Find the mean of $x$.`,
        answer: ans.exact(num(b * m + a)),
        how: `$\\bar{x} = ${b}\\bar{y} + ${a} = ${b * m + a}$.`,
      };
    },
  },
  // ------------------------------------------------------------------ mechanics
  {
    kind: 'v = u + at',
    area: 'mech',
    make: (r) => {
      const u = r.int(0, 20);
      const a = r.pick([-4, -3, -2, -1.5, -0.5, 0.5, 1.5, 2, 2.5, 3, 4]);
      const t = r.int(2, 10);
      const v = dec(u + a * t);
      return {
        prompt: `A particle moves in a straight line with constant acceleration $${N(a)}\\text{ m s}^{-2}$. Its initial speed is $${u}\\text{ m s}^{-1}$. Find its velocity after $${t}$ seconds.`,
        answer: ans.exact(num(Q.of(Math.round(v * 2), 2)), undefined, { allowDecimal: true, unit: '\\text{m s}^{-1}' }),
        how: `$v = u + at = ${u} + ${N(a)} \\times ${t} = ${N(v)}$.`,
      };
    },
  },
  {
    kind: 's = ut + ½at²',
    area: 'mech',
    make: (r) => {
      const u = r.int(0, 12);
      const a = r.pick([1, 2, 3, 4, 5, 6]);
      const t = r.int(2, 8);
      const s = Q.of(u * t).add(Q.of(a * t * t, 2));
      return {
        prompt: `A car starts with speed $${u}\\text{ m s}^{-1}$ and accelerates at $${a}\\text{ m s}^{-2}$. How far does it travel in $${t}$ seconds?`,
        answer: ans.exact(num(s), undefined, { allowDecimal: true, unit: '\\text{m}' }),
        how: `$s = ut + \\tfrac{1}{2}at^2 = ${u * t} + ${N((a * t * t) / 2)} = ${N(s.value)}$.`,
      };
    },
  },
  {
    kind: 'v² = u² + 2as',
    area: 'mech',
    make: (r) => {
      const u = r.int(0, 10);
      const v = r.int(u + 2, u + 16);
      const a = r.pick([1, 2, 3, 4, 5]);
      const s = Q.of(v * v - u * u, 2 * a);
      r.require(s.isInt || s.mul(2).isInt);
      return {
        prompt: `A particle accelerates uniformly at $${a}\\text{ m s}^{-2}$ from $${u}\\text{ m s}^{-1}$ over a distance of $${N(s.value)}\\text{ m}$. Find its final speed.`,
        answer: ans.exact(num(v), undefined, { unit: '\\text{m s}^{-1}' }),
        how: `$v^2 = ${u}^2 + 2 \\times ${a} \\times ${N(s.value)} = ${v * v}$, so $v = ${v}$.`,
      };
    },
  },
  {
    kind: 'F = ma',
    area: 'mech',
    make: (r) => {
      const m = r.pick([2, 4, 5, 8, 10, 20, 25]);
      const f = r.int(3, 60);
      const a = Q.of(f, m);
      r.require(a.mul(100).isInt);
      return {
        prompt: `A resultant force of $${f}\\text{ N}$ acts on a particle of mass $${m}\\text{ kg}$. Find its acceleration.`,
        answer: ans.exact(num(a), undefined, { allowDecimal: true, unit: '\\text{m s}^{-2}' }),
        how: `$a = \\dfrac{F}{m} = \\dfrac{${f}}{${m}} = ${N(a.value)}$.`,
      };
    },
  },
  {
    kind: 'Weight',
    area: 'mech',
    make: (r) => {
      const m = r.int(2, 60);
      const w = dec(m * G);
      return {
        prompt: `Find the weight of a particle of mass $${m}\\text{ kg}$. (Take $g = 9.8\\text{ m s}^{-2}$.)`,
        answer: ans.num(w, { sfRange: [2, 3] }, { unit: '\\text{N}' }),
        how: `$W = mg = ${m} \\times 9.8 = ${N(w)}$.`,
      };
    },
  },
  {
    kind: 'Friction',
    area: 'mech',
    make: (r) => {
      const m = r.int(2, 20);
      const mu = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]);
      const f = dec(mu * m * G);
      return {
        prompt: `A box of mass $${m}\\text{ kg}$ rests on rough horizontal ground. The coefficient of friction is $${N(mu)}$. Find the maximum friction. (Take $g = 9.8$.)`,
        answer: ans.num(f, { sfRange: [2, 3] }, { unit: '\\text{N}' }),
        how: `$R = ${m}g = ${N(dec(m * G))}$, so $F_{\\max} = \\mu R = ${N(mu)} \\times ${N(dec(m * G))} = ${N(f)}$.`,
      };
    },
  },
  {
    kind: 'Vector magnitude',
    area: 'mech',
    make: (r) => {
      const a = r.intNZ(-12, 12);
      const b = r.intNZ(-12, 12);
      const m2 = a * a + b * b;
      return {
        prompt: `A particle has velocity $(${polyTex([[a, 0]])}\\mathbf{i} ${b < 0 ? '-' : '+'} ${Math.abs(b)}\\mathbf{j})\\text{ m s}^{-1}$. Find its speed, exactly or to 3 significant figures.`,
        answer: ans.num(Math.sqrt(m2), { sf: 3 }, { exactAllowed: true, exact: sqrt(m2), unit: '\\text{m s}^{-1}' }),
        how: `$\\sqrt{${a * a} + ${b * b}} = \\sqrt{${m2}}${Number.isInteger(Math.sqrt(m2)) ? ` = ${Math.sqrt(m2)}` : ` = ${N(Number(Math.sqrt(m2).toPrecision(4)))}\\ldots`}$.`,
      };
    },
  },
  {
    kind: 'Moments',
    area: 'mech',
    make: (r) => {
      const f1 = r.int(2, 12) * 5;
      const d1 = r.int(1, 6) * 0.5;
      const f2 = r.int(2, 12) * 5;
      const d2 = (f1 * d1) / f2;
      r.require(f1 !== f2 && Number.isInteger(d2 * 20) && d2 <= 6);
      return {
        prompt: `A light rod is balanced on a pivot. A force of $${f1}\\text{ N}$ acts $${N(d1)}\\text{ m}$ to the left of the pivot. How far to the right must a force of $${f2}\\text{ N}$ act?`,
        answer: ans.exact(num(Q.of(Math.round(d2 * 20), 20)), undefined, { allowDecimal: true, unit: '\\text{m}' }),
        how: `Moments balance: $${f1} \\times ${N(d1)} = ${f2}d$, so $d = ${N(d2)}$.`,
      };
    },
  },
  {
    kind: 'Variable acceleration',
    area: 'mech',
    make: (r) => {
      const a = r.intNZ(-3, 4);
      const b = r.int(-6, 8);
      const t = r.int(1, 5);
      return {
        prompt: `A particle moves in a straight line with velocity $v = ${polyTex([[a, 2], [b, 1]], 't')}\\text{ m s}^{-1}$ at time $t$ seconds. Find its acceleration when $t = ${t}$.`,
        answer: ans.exact(num(2 * a * t + b), undefined, { unit: '\\text{m s}^{-2}' }),
        how: `$a = \\dfrac{\\mathrm{d}v}{\\mathrm{d}t} = ${polyTex([[2 * a, 1], [b, 0]], 't')} = ${2 * a * t + b}$ when $t = ${t}$.`,
      };
    },
  },
  {
    kind: 'Resolving',
    area: 'mech',
    make: (r) => {
      const f = r.int(2, 20) * 5;
      const th = r.pick([30, 45, 60]);
      const horiz = r.bool();
      const v = f * (horiz ? Math.cos((th * Math.PI) / 180) : Math.sin((th * Math.PI) / 180));
      return {
        prompt: `A force of $${f}\\text{ N}$ acts at $${th}^\\circ$ above the horizontal. Find its ${horiz ? 'horizontal' : 'vertical'} component, to 3 significant figures.`,
        answer: ans.num(v, { sf: 3 }, { exactAllowed: true, unit: '\\text{N}' }),
        how: `$${f}\\${horiz ? 'cos' : 'sin'} ${th}^\\circ = ${N(Number(v.toPrecision(4)))}\\ldots$`,
      };
    },
  },
];

const BY_AREA = (area: SpeedArea) => GENS.filter((g) => area === 'mixed' || g.area === area);

/** The 10 questions of a round: different kinds of question where there are enough. */
export function speedRound(area: SpeedArea, seed: number): SpeedQ[] {
  const r = new Rng(`speed:${area}:${seed}`);
  const gens = BY_AREA(area);
  const order: Gen[] = [];
  while (order.length < SPEED_COUNT) order.push(...r.shuffle(gens));
  return order.slice(0, SPEED_COUNT).map((g, i) => ({ kind: g.kind, ...withRetries(`speed:${seed}:${i}:${g.kind}`, g.make) }));
}

/** Right or not: only a fully correct answer counts in a speed round. */
export const speedCorrect = (q: SpeedQ, response: Response | undefined) => compare(q.answer, response).status === 'correct';
