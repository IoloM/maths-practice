import { Q, factorial, nCr } from './rational';

/** Expression AST shared by templates (answers) and the marking parser (responses). */
export type Fn =
  | 'sin'
  | 'cos'
  | 'tan'
  | 'sec'
  | 'cosec'
  | 'cot'
  | 'arcsin'
  | 'arccos'
  | 'arctan'
  | 'ln'
  | 'exp'
  | 'abs';

export type Expr =
  | { k: 'num'; v: Q }
  | { k: 'dec'; v: number; s: string }
  | { k: 'sym'; n: string }
  | { k: 'add'; a: Expr[] }
  | { k: 'mul'; a: Expr[] }
  | { k: 'neg'; a: Expr }
  | { k: 'div'; a: Expr; b: Expr }
  | { k: 'pow'; a: Expr; b: Expr }
  | { k: 'sqrt'; a: Expr; n: number }
  | { k: 'fn'; f: Fn; a: Expr }
  | { k: 'log'; b: Expr; a: Expr }
  | { k: 'fact'; a: Expr }
  | { k: 'binom'; n: Expr; r: Expr };

// ---------- builders ----------
export const num = (n: number | Q, d = 1): Expr => ({ k: 'num', v: n instanceof Q ? n : Q.of(n, d) });
export const dec = (v: number, s?: string): Expr => ({ k: 'dec', v, s: s ?? String(v) });
export const sym = (n: string): Expr => ({ k: 'sym', n });
export const add = (...a: Expr[]): Expr => (a.length === 1 ? a[0] : { k: 'add', a });
export const mul = (...a: Expr[]): Expr => (a.length === 1 ? a[0] : { k: 'mul', a });
export const neg = (a: Expr): Expr => ({ k: 'neg', a });
export const sub = (a: Expr, b: Expr): Expr => add(a, neg(b));
export const div = (a: Expr, b: Expr): Expr => ({ k: 'div', a, b });
export const pow = (a: Expr, b: Expr | number): Expr => ({ k: 'pow', a, b: typeof b === 'number' ? num(b) : b });
export const sqrt = (a: Expr | number, n = 2): Expr => ({ k: 'sqrt', a: typeof a === 'number' ? num(a) : a, n });
export const fn = (f: Fn, a: Expr): Expr => ({ k: 'fn', f, a });
export const ln = (a: Expr | number): Expr => fn('ln', typeof a === 'number' ? num(a) : a);
export const sin = (a: Expr): Expr => fn('sin', a);
export const cos = (a: Expr): Expr => fn('cos', a);
export const tan = (a: Expr): Expr => fn('tan', a);
export const abs = (a: Expr): Expr => fn('abs', a);
export const E = sym('e');
export const PI = sym('pi');
export const X = sym('x');
export const exp = (a: Expr): Expr => pow(E, a);
export const log = (b: Expr | number, a: Expr | number): Expr => ({
  k: 'log',
  b: typeof b === 'number' ? num(b) : b,
  a: typeof a === 'number' ? num(a) : a,
});
/** k·x for rational k (k = 1 → x). */
export const term = (c: Q | number, x: Expr): Expr => mul(num(c instanceof Q ? c : Q.from(c)), x);

export const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E, infty: Infinity };

// ---------- evaluation ----------
export interface EvalOpts {
  deg?: boolean;
}

export function evaluate(e: Expr, env: Record<string, number> = {}, opts: EvalOpts = {}): number {
  const ev = (x: Expr): number => evaluate(x, env, opts);
  switch (e.k) {
    case 'num':
      return e.v.value;
    case 'dec':
      return e.v;
    case 'sym':
      if (e.n in env) return env[e.n];
      if (e.n in CONSTANTS) return CONSTANTS[e.n];
      return NaN;
    case 'add':
      return e.a.reduce((s, t) => s + ev(t), 0);
    case 'mul':
      return e.a.reduce((s, t) => s * ev(t), 1);
    case 'neg':
      return -ev(e.a);
    case 'div': {
      const d = ev(e.b);
      if (d === 0) return NaN;
      return ev(e.a) / d;
    }
    case 'pow': {
      const b = ev(e.a);
      if (e.b.k === 'num' && !e.b.v.isInt && b < 0) {
        // real odd roots of negatives, e.g. (-8)^(1/3)
        if (e.b.v.d % 2 === 1) return -((-b) ** e.b.v.value) * (e.b.v.n % 2 === 0 ? -1 : 1);
        return NaN;
      }
      const ex = ev(e.b);
      if (b === 0 && ex < 0) return NaN;
      return b ** ex;
    }
    case 'sqrt': {
      const v = ev(e.a);
      if (e.n === 2) return v < 0 ? NaN : Math.sqrt(v);
      if (v < 0) return e.n % 2 === 1 ? -((-v) ** (1 / e.n)) : NaN;
      return v ** (1 / e.n);
    }
    case 'fn': {
      const v = ev(e.a);
      const r = opts.deg ? Math.PI / 180 : 1;
      switch (e.f) {
        case 'sin':
          return Math.sin(v * r);
        case 'cos':
          return Math.cos(v * r);
        case 'tan': {
          const c = Math.cos(v * r);
          return Math.abs(c) < 1e-12 ? NaN : Math.sin(v * r) / c;
        }
        case 'sec': {
          const c = Math.cos(v * r);
          return Math.abs(c) < 1e-12 ? NaN : 1 / c;
        }
        case 'cosec': {
          const s = Math.sin(v * r);
          return Math.abs(s) < 1e-12 ? NaN : 1 / s;
        }
        case 'cot': {
          const s = Math.sin(v * r);
          return Math.abs(s) < 1e-12 ? NaN : Math.cos(v * r) / s;
        }
        case 'arcsin':
          return Math.abs(v) > 1 ? NaN : Math.asin(v) / r;
        case 'arccos':
          return Math.abs(v) > 1 ? NaN : Math.acos(v) / r;
        case 'arctan':
          return Math.atan(v) / r;
        case 'ln':
          return v <= 0 ? NaN : Math.log(v);
        case 'exp':
          return Math.exp(v);
        case 'abs':
          return Math.abs(v);
      }
      return NaN;
    }
    case 'log': {
      const b = ev(e.b),
        a = ev(e.a);
      if (b <= 0 || b === 1 || a <= 0) return NaN;
      return Math.log(a) / Math.log(b);
    }
    case 'fact': {
      const v = ev(e.a);
      if (!Number.isInteger(v) || v < 0 || v > 170) return NaN;
      return factorial(v);
    }
    case 'binom': {
      const n = ev(e.n),
        r = ev(e.r);
      if (!Number.isInteger(n) || !Number.isInteger(r)) return NaN;
      return nCr(n, r);
    }
  }
}

/** Compile to a fast numeric function of one variable. */
export function toFn(e: Expr, v = 'x', opts: EvalOpts = {}): (x: number) => number {
  return (x: number) => evaluate(e, { [v]: x }, opts);
}

// ---------- queries ----------
export function freeSyms(e: Expr, out = new Set<string>()): Set<string> {
  walk(e, (n) => {
    if (n.k === 'sym' && !(n.n in CONSTANTS)) out.add(n.n);
  });
  return out;
}

export function walk(e: Expr, f: (n: Expr) => void): void {
  f(e);
  switch (e.k) {
    case 'add':
    case 'mul':
      e.a.forEach((c) => walk(c, f));
      break;
    case 'neg':
    case 'sqrt':
    case 'fn':
    case 'fact':
      walk(e.a, f);
      break;
    case 'div':
    case 'pow':
      walk(e.a, f);
      walk(e.b, f);
      break;
    case 'log':
      walk(e.b, f);
      walk(e.a, f);
      break;
    case 'binom':
      walk(e.n, f);
      walk(e.r, f);
      break;
  }
}

export function some(e: Expr, pred: (n: Expr) => boolean): boolean {
  let found = false;
  walk(e, (n) => {
    if (!found && pred(n)) found = true;
  });
  return found;
}

export const hasDecimal = (e: Expr): boolean => some(e, (n) => n.k === 'dec');

export function subst(e: Expr, name: string, val: Expr): Expr {
  const s = (x: Expr) => subst(x, name, val);
  switch (e.k) {
    case 'sym':
      return e.n === name ? val : e;
    case 'add':
      return { k: 'add', a: e.a.map(s) };
    case 'mul':
      return { k: 'mul', a: e.a.map(s) };
    case 'neg':
      return { k: 'neg', a: s(e.a) };
    case 'div':
      return { k: 'div', a: s(e.a), b: s(e.b) };
    case 'pow':
      return { k: 'pow', a: s(e.a), b: s(e.b) };
    case 'sqrt':
      return { k: 'sqrt', a: s(e.a), n: e.n };
    case 'fn':
      return { k: 'fn', f: e.f, a: s(e.a) };
    case 'log':
      return { k: 'log', b: s(e.b), a: s(e.a) };
    case 'fact':
      return { k: 'fact', a: s(e.a) };
    case 'binom':
      return { k: 'binom', n: s(e.n), r: s(e.r) };
    default:
      return e;
  }
}

export function structEq(a: Expr, b: Expr): boolean {
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
function strip(e: Expr): unknown {
  return JSON.parse(JSON.stringify(e, (k, v) => (k === 's' ? undefined : v instanceof Q ? v.toString() : v)));
}

// ---------- tidy (light normalisation, keeps the author's term order) ----------
export function tidy(e: Expr): Expr {
  switch (e.k) {
    case 'add': {
      const terms: Expr[] = [];
      for (const t0 of e.a) {
        const t = tidy(t0);
        if (t.k === 'add') terms.push(...t.a);
        else if (!isZero(t)) terms.push(t);
      }
      if (terms.length === 0) return num(0);
      return terms.length === 1 ? terms[0] : { k: 'add', a: terms };
    }
    case 'mul': {
      let coef = Q.ONE;
      const fs: Expr[] = [];
      for (const f0 of e.a) {
        const f = tidy(f0);
        if (f.k === 'num') coef = coef.mul(f.v);
        else if (f.k === 'neg') {
          coef = coef.neg();
          if (f.a.k === 'num') coef = coef.mul(f.a.v);
          else if (f.a.k === 'mul') pushMul(f.a.a, fs, (c) => (coef = coef.mul(c)));
          else fs.push(f.a);
        } else if (f.k === 'mul') pushMul(f.a, fs, (c) => (coef = coef.mul(c)));
        else fs.push(f);
      }
      if (coef.isZero) return num(0);
      if (fs.length === 0) return num(coef);
      if (coef.eq(1)) return fs.length === 1 ? fs[0] : { k: 'mul', a: fs };
      return { k: 'mul', a: [num(coef), ...fs] };
    }
    case 'neg': {
      const a = tidy(e.a);
      if (a.k === 'num') return num(a.v.neg());
      if (a.k === 'neg') return a.a;
      if (a.k === 'mul' && a.a[0].k === 'num') return tidy({ k: 'mul', a: [num(a.a[0].v.neg()), ...a.a.slice(1)] });
      if (a.k === 'add') return { k: 'add', a: a.a.map((t) => tidy(neg(t))) };
      return { k: 'neg', a };
    }
    case 'div': {
      const a = tidy(e.a),
        b = tidy(e.b);
      if (b.k === 'num' && b.v.eq(1)) return a;
      if (a.k === 'num' && b.k === 'num') return num(a.v.div(b.v));
      if (isZero(a)) return num(0);
      return { k: 'div', a, b };
    }
    case 'pow': {
      const a = tidy(e.a),
        b = tidy(e.b);
      if (b.k === 'num' && b.v.eq(1)) return a;
      if (b.k === 'num' && b.v.isZero) return num(1);
      if (a.k === 'num' && b.k === 'num' && b.v.isInt && Math.abs(b.v.n) <= 12) return num(a.v.pow(b.v.n));
      return { k: 'pow', a, b };
    }
    case 'sqrt':
      return { k: 'sqrt', a: tidy(e.a), n: e.n };
    case 'fn':
      return { k: 'fn', f: e.f, a: tidy(e.a) };
    case 'log':
      return { k: 'log', b: tidy(e.b), a: tidy(e.a) };
    case 'fact':
      return { k: 'fact', a: tidy(e.a) };
    case 'binom':
      return { k: 'binom', n: tidy(e.n), r: tidy(e.r) };
    default:
      return e;
  }
}
function pushMul(fs0: Expr[], fs: Expr[], c: (q: Q) => void) {
  for (const f of fs0) {
    if (f.k === 'num') c(f.v);
    else fs.push(f);
  }
}
function isZero(e: Expr): boolean {
  return e.k === 'num' && e.v.isZero;
}

// ---------- LaTeX printing ----------
const FN_TEX: Record<Fn, string> = {
  sin: '\\sin',
  cos: '\\cos',
  tan: '\\tan',
  sec: '\\sec',
  cosec: '\\operatorname{cosec}',
  cot: '\\cot',
  arcsin: '\\arcsin',
  arccos: '\\arccos',
  arctan: '\\arctan',
  ln: '\\ln',
  exp: '\\exp',
  abs: '',
};
const SYM_TEX: Record<string, string> = {
  pi: '\\pi',
  theta: '\\theta',
  alpha: '\\alpha',
  beta: '\\beta',
  mu: '\\mu',
  sigma: '\\sigma',
  lambda: '\\lambda',
  phi: '\\phi',
  rho: '\\rho',
  omega: '\\omega',
};

export function symTex(n: string): string {
  if (SYM_TEX[n]) return SYM_TEX[n];
  const m = /^([A-Za-z]+)_(\w+)$/.exec(n);
  if (m) return `${symTex(m[1])}_{${m[2]}}`;
  return n;
}

/** Is the expression "negative-looking" (printed with a leading minus)? */
function isNegative(e: Expr): boolean {
  if (e.k === 'neg') return true;
  if (e.k === 'num') return e.v.sign < 0;
  if (e.k === 'dec') return e.v < 0;
  if (e.k === 'mul') return isNegative(e.a[0]);
  if (e.k === 'div') return isNegative(e.a);
  return false;
}
function negate(e: Expr): Expr {
  if (e.k === 'neg') return e.a;
  if (e.k === 'num') return num(e.v.neg());
  if (e.k === 'dec') return dec(-e.v, e.s.startsWith('-') ? e.s.slice(1) : `-${e.s}`);
  if (e.k === 'mul') return { k: 'mul', a: [negate(e.a[0]), ...e.a.slice(1)] };
  if (e.k === 'div') return { k: 'div', a: negate(e.a), b: e.b };
  return neg(e);
}

/** Simple argument for "\sin 3x", "\ln x" style (no brackets). */
function simpleArg(e: Expr): boolean {
  if (e.k === 'sym') return true;
  if (e.k === 'fn' && e.f === 'abs') return true;
  if (e.k === 'num') return e.v.isInt && e.v.sign >= 0;
  if (e.k === 'dec') return e.v >= 0;
  if (e.k === 'pow') return e.a.k === 'sym' && (e.b.k === 'num' || e.b.k === 'sym');
  if (e.k === 'mul')
    return (
      e.a.length === 2 &&
      e.a[0].k === 'num' &&
      e.a[0].v.isInt &&
      e.a[0].v.sign > 0 &&
      (e.a[1].k === 'sym' || (e.a[1].k === 'pow' && e.a[1].a.k === 'sym'))
    );
  return false;
}

function startsWithDigit(s: string): boolean {
  return /^[0-9.]/.test(s) || s.startsWith('\\frac') || s.startsWith('-');
}

export interface TexOpts {
  /** print x^{-n} as \frac{1}{x^{n}} (handled by authors via div; kept for future) */
  timesDot?: boolean;
}

export function toLatex(e: Expr): string {
  return tex(e, 0);
}

/** prec: 0 top, 1 add-term, 3 mul-factor, 6 pow-base */
function tex(e: Expr, prec: number): string {
  switch (e.k) {
    case 'num': {
      const s = e.v.toLatex();
      if (e.v.sign < 0 && prec >= 3) return `\\left(${s}\\right)`;
      if (!e.v.isInt && prec >= 6) return `\\left(${s}\\right)`;
      return s;
    }
    case 'dec': {
      const s = e.s;
      return e.v < 0 && prec >= 3 ? `\\left(${s}\\right)` : s;
    }
    case 'sym':
      return e.n === 'infty' ? '\\infty' : symTex(e.n);
    case 'add': {
      let s = '';
      e.a.forEach((t, i) => {
        if (i === 0) s += tex(t, 1);
        else if (isNegative(t)) s += ` - ${tex(negate(t), 1)}`;
        else s += ` + ${tex(t, 1)}`;
      });
      return prec >= 2 ? `\\left(${s}\\right)` : s;
    }
    case 'neg': {
      const s = `-${tex(e.a, 3)}`;
      return prec >= 2 ? `\\left(${s}\\right)` : s;
    }
    case 'mul': {
      const fs = e.a;
      let s = '';
      let lead = 0;
      if (fs[0].k === 'num' && fs.length > 1) {
        const c = fs[0].v;
        if (c.eq(1)) s = '';
        else if (c.eq(-1)) s = '-';
        else s = c.toLatex();
        lead = 1;
      }
      for (let i = lead; i < fs.length; i++) {
        const f = fs[i];
        const isLast = i === fs.length - 1;
        let p: string;
        if (f.k === 'fn' && f.f !== 'abs' && !isLast) p = `${FN_TEX[f.f]}\\left(${tex(f.a, 0)}\\right)`;
        else p = tex(f, 3);
        if (s === '' || s === '-') s += p;
        else if (startsWithDigit(p)) s += ` \\times ${p}`;
        else if (/\\[A-Za-z]+$/.test(s) && /^[A-Za-z]/.test(p)) s += ` ${p}`; // "\pi r", not "\pir"
        else s += p;
      }
      const neg0 = s.startsWith('-');
      return neg0 && prec >= 3 ? `\\left(${s}\\right)` : s;
    }
    case 'div': {
      if (isNegative(e.a)) {
        const s = `-\\frac{${tex(negate(e.a), 0)}}{${tex(e.b, 0)}}`;
        return prec >= 3 ? `\\left(${s}\\right)` : s;
      }
      const s = `\\frac{${tex(e.a, 0)}}{${tex(e.b, 0)}}`;
      return prec >= 6 ? `\\left(${s}\\right)` : s;
    }
    case 'pow': {
      const ex = tex(e.b, 0);
      if (e.a.k === 'fn' && e.a.f !== 'abs' && e.b.k === 'num' && e.b.v.isInt && e.b.v.n > 0) {
        const arg = simpleArg(e.a.a) ? ` ${tex(e.a.a, 3)}` : `\\left(${tex(e.a.a, 0)}\\right)`;
        return `${FN_TEX[e.a.f]}^{${ex}}${arg}`;
      }
      const base = e.a.k === 'sym' || (e.a.k === 'num' && e.a.v.isInt && e.a.v.sign >= 0) || e.a.k === 'fn' && e.a.f === 'abs'
        ? tex(e.a, 6)
        : e.a.k === 'dec' && e.a.v >= 0
          ? e.a.s
          : `\\left(${tex(e.a, 0)}\\right)`;
      return `${base}^{${ex}}`;
    }
    case 'sqrt':
      return e.n === 2 ? `\\sqrt{${tex(e.a, 0)}}` : `\\sqrt[${e.n}]{${tex(e.a, 0)}}`;
    case 'fn': {
      if (e.f === 'abs') return `\\left|${tex(e.a, 0)}\\right|`;
      if (e.f === 'exp') return `e^{${tex(e.a, 0)}}`;
      const s = simpleArg(e.a) ? `${FN_TEX[e.f]} ${tex(e.a, 3)}` : `${FN_TEX[e.f]}\\left(${tex(e.a, 0)}\\right)`;
      return prec >= 6 ? `\\left(${s}\\right)` : s;
    }
    case 'log': {
      const arg = simpleArg(e.a) ? ` ${tex(e.a, 3)}` : `\\left(${tex(e.a, 0)}\\right)`;
      return `\\log_{${tex(e.b, 0)}}${arg}`;
    }
    case 'fact':
      return `${tex(e.a, 6)}!`;
    case 'binom':
      return `\\binom{${tex(e.n, 0)}}{${tex(e.r, 0)}}`;
  }
}

/** Plain-text rendering for debugging and aria labels. */
export function toText(e: Expr): string {
  switch (e.k) {
    case 'num':
      return e.v.toString();
    case 'dec':
      return e.s;
    case 'sym':
      return e.n;
    case 'add':
      return `(${e.a.map(toText).join(' + ')})`;
    case 'mul':
      return `(${e.a.map(toText).join('*')})`;
    case 'neg':
      return `-(${toText(e.a)})`;
    case 'div':
      return `(${toText(e.a)})/(${toText(e.b)})`;
    case 'pow':
      return `(${toText(e.a)})^(${toText(e.b)})`;
    case 'sqrt':
      return e.n === 2 ? `sqrt(${toText(e.a)})` : `root${e.n}(${toText(e.a)})`;
    case 'fn':
      return `${e.f}(${toText(e.a)})`;
    case 'log':
      return `log_${toText(e.b)}(${toText(e.a)})`;
    case 'fact':
      return `(${toText(e.a)})!`;
    case 'binom':
      return `C(${toText(e.n)},${toText(e.r)})`;
  }
}
