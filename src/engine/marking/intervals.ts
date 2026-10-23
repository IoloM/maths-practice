/** Solution sets: inequalities, interval notation and set notation → union of intervals. */
import { type Expr, evaluate, freeSyms, toLatex, tidy, symTex } from '../core/expr';
import type { Statement, Clause, RelOp, Sep } from './parse';
import type { Interval } from './types';

export interface NumInterval {
  lo: number;
  hi: number;
  loC: boolean;
  hiC: boolean;
}
export type NumSet = NumInterval[];

const ALL: NumSet = [{ lo: -Infinity, hi: Infinity, loC: false, hiC: false }];

function constVal(e: Expr): number {
  if (freeSyms(e).size) return NaN;
  return evaluate(e);
}

export function normalise(s: NumSet): NumSet {
  const xs = s
    .filter((i) => i.lo < i.hi || (i.lo === i.hi && i.loC && i.hiC))
    .map((i) => ({ ...i, loC: Number.isFinite(i.lo) && i.loC, hiC: Number.isFinite(i.hi) && i.hiC }))
    .sort((a, b) => a.lo - b.lo || Number(b.loC) - Number(a.loC));
  const out: NumSet = [];
  for (const i of xs) {
    const last = out[out.length - 1];
    if (last && (i.lo < last.hi || (i.lo === last.hi && (i.loC || last.hiC)))) {
      if (i.hi > last.hi || (i.hi === last.hi && i.hiC)) {
        last.hi = i.hi;
        last.hiC = i.hiC || (i.hi === last.hi && last.hiC);
      }
    } else out.push({ ...i });
  }
  return out;
}

export function union(a: NumSet, b: NumSet): NumSet {
  return normalise([...a, ...b]);
}

export function intersect(a: NumSet, b: NumSet): NumSet {
  const out: NumSet = [];
  for (const x of a)
    for (const y of b) {
      let lo: number, loC: boolean, hi: number, hiC: boolean;
      if (x.lo > y.lo) [lo, loC] = [x.lo, x.loC];
      else if (y.lo > x.lo) [lo, loC] = [y.lo, y.loC];
      else [lo, loC] = [x.lo, x.loC && y.loC];
      if (x.hi < y.hi) [hi, hiC] = [x.hi, x.hiC];
      else if (y.hi < x.hi) [hi, hiC] = [y.hi, y.hiC];
      else [hi, hiC] = [x.hi, x.hiC && y.hiC];
      if (lo < hi || (lo === hi && loC && hiC)) out.push({ lo, hi, loC, hiC });
    }
  return normalise(out);
}

function complementPoint(a: number): NumSet {
  return [
    { lo: -Infinity, hi: a, loC: false, hiC: false },
    { lo: a, hi: Infinity, loC: false, hiC: false },
  ];
}

const FLIP: Record<RelOp, RelOp> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '=': '=', '!=': '!=' };

/** "|a·x + b| op c" or "c op |a·x + b|" (e.g. validity |x| < 1/2) → set, or null if not that shape. */
function absRelToSet(terms: Expr[], ops: RelOp[], v: string): NumSet | null {
  if (terms.length !== 2) return null;
  const i = terms.findIndex((t) => t.k === 'fn' && t.f === 'abs');
  const t = terms[i];
  if (i < 0 || t.k !== 'fn') return null;
  const inner = t.a,
    other = terms[1 - i];
  const syms = freeSyms(inner);
  if (freeSyms(other).size || syms.size !== 1 || !syms.has(v)) return null;
  const f = (x: number) => evaluate(inner, { [v]: x });
  const b = f(0),
    a = f(1) - b;
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0 || Math.abs(f(2) - (2 * a + b)) > 1e-9 * Math.max(1, Math.abs(a), Math.abs(b))) return null;
  const c = constVal(other);
  if (Number.isNaN(c)) return null;
  // set of u = a·x + b with |u| op c
  const op = i === 0 ? ops[0] : FLIP[ops[0]];
  const both = (lo: number, hi: number, closed: boolean): NumSet => [{ lo, hi, loC: closed, hiC: closed }];
  const tails = (closed: boolean): NumSet => [
    { lo: -Infinity, hi: -c, loC: false, hiC: closed },
    { lo: c, hi: Infinity, loC: closed, hiC: false },
  ];
  let U: NumSet;
  switch (op) {
    case '<':
      U = c > 0 ? both(-c, c, false) : [];
      break;
    case '<=':
      U = c >= 0 ? both(-c, c, true) : [];
      break;
    case '>':
      U = c < 0 ? ALL : tails(false);
      break;
    case '>=':
      U = c <= 0 ? ALL : tails(true);
      break;
    case '=':
      U = c < 0 ? [] : normalise([...both(-c, -c, true), ...both(c, c, true)]);
      break;
    case '!=':
      U = c < 0 ? ALL : normalise([{ lo: -Infinity, hi: -c, loC: false, hiC: false }, { lo: -c, hi: c, loC: false, hiC: false }, { lo: c, hi: Infinity, loC: false, hiC: false }]);
      break;
  }
  // back to x = (u − b)/a; a negative a reverses the ends
  return normalise(U.map((I) => (a > 0 ? { lo: (I.lo - b) / a, hi: (I.hi - b) / a, loC: I.loC, hiC: I.hiC } : { lo: (I.hi - b) / a, hi: (I.lo - b) / a, loC: I.hiC, hiC: I.loC })));
}

/** One relation "x < 3", "−2 ⩽ x < 5", "4 > x", "|x| < 1/2" → set, or null if not about v. */
function relToSet(terms: Expr[], ops: RelOp[], v: string): NumSet | null {
  const idx = terms.findIndex((t) => t.k === 'sym' && t.n === v);
  if (idx < 0) return absRelToSet(terms, ops, v);
  if (terms.some((t, i) => i !== idx && freeSyms(t).size)) return null;
  let set: NumSet = ALL;
  // left of x: terms[idx-1] op x
  if (idx > 0) {
    const a = constVal(terms[idx - 1]);
    set = intersect(set, bound(a, ops[idx - 1], 'left'));
  }
  if (idx < terms.length - 1) {
    const b = constVal(terms[idx + 1]);
    set = intersect(set, bound(b, ops[idx], 'right'));
  }
  // chains like 1 < 3 < x are rejected by the check above (only neighbours used)
  if (terms.length > 3) return null;
  return set;
}

/** Bound from "a op x" (side 'left') or "x op b" (side 'right'). */
function bound(a: number, op: RelOp, side: 'left' | 'right'): NumSet {
  const o = side === 'left' ? FLIP[op] : op; // now "x o a""
  switch (o) {
    case '<':
      return [{ lo: -Infinity, hi: a, loC: false, hiC: false }];
    case '<=':
      return [{ lo: -Infinity, hi: a, loC: false, hiC: true }];
    case '>':
      return [{ lo: a, hi: Infinity, loC: false, hiC: false }];
    case '>=':
      return [{ lo: a, hi: Infinity, loC: true, hiC: false }];
    case '=':
      return [{ lo: a, hi: a, loC: true, hiC: true }];
    case '!=':
      return complementPoint(a);
  }
}

function clauseToSet(c: Clause, v: string): NumSet | null {
  switch (c.kind) {
    case 'rel':
      return relToSet(c.terms, c.ops, v);
    case 'tuple': {
      if (c.items.length !== 2) return null;
      const lo = constVal(c.items[0]),
        hi = constVal(c.items[1]);
      if (Number.isNaN(lo) || Number.isNaN(hi)) return null;
      return normalise([{ lo, hi, loC: c.open === '[', hiC: c.close === ']' }]);
    }
    case 'in':
      if (!(c.e.k === 'sym' && c.e.n === v)) return null;
      return statementToSet(c.set, v);
    case 'set':
      if (c.v !== v) return null;
      return statementToSet(c.cond, v);
    case 'reals':
      return ALL;
    case 'empty':
      return [];
    case 'expr':
      return null;
    default:
      return null;
  }
}

/** Combine clauses: 'and'/'cap' bind tighter than 'or'/','/'cup'. */
export function statementToSet(st: Statement, v: string): NumSet | null {
  const groups: NumSet[] = [];
  let cur = clauseToSet(st.clauses[0], v);
  if (!cur) return null;
  for (let i = 0; i < st.seps.length; i++) {
    const sep: Sep = st.seps[i];
    const next = clauseToSet(st.clauses[i + 1], v);
    if (!next) return null;
    if (sep === 'and' || sep === 'cap') cur = intersect(cur, next);
    else {
      groups.push(cur);
      cur = next;
    }
  }
  groups.push(cur);
  return groups.reduce((a, b) => union(a, b), [] as NumSet);
}

// infinite ends must match exactly (a relative tolerance would become infinite)
const close = (a: number, b: number) => a === b || (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)));

export function setsEqual(a: NumSet, b: NumSet): boolean {
  const A = normalise(a),
    B = normalise(b);
  if (A.length !== B.length) return false;
  return A.every(
    (x, i) =>
      close(x.lo, B[i].lo) && close(x.hi, B[i].hi) && (!Number.isFinite(x.lo) || x.loC === B[i].loC) && (!Number.isFinite(x.hi) || x.hiC === B[i].hiC),
  );
}

export function contains(s: NumSet, x: number): boolean {
  return s.some((i) => (x > i.lo || (i.loC && close(x, i.lo))) && (x < i.hi || (i.hiC && close(x, i.hi))));
}

/** Same integers in [lo, hi]. */
export function integerSetsEqual(a: NumSet, b: NumSet, lo: number, hi: number): boolean {
  for (let k = lo; k <= hi; k++) if (contains(a, k) !== contains(b, k)) return false;
  return true;
}

export function endpoints(s: NumSet): number[] {
  return normalise(s)
    .flatMap((i) => [i.lo, i.hi])
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);
}

export function toNumSet(set: Interval[]): NumSet {
  return normalise(
    set.map((i) => ({ lo: evaluate(i.lo), hi: evaluate(i.hi), loC: i.loClosed, hiC: i.hiClosed })),
  );
}

const LE = '\\leqslant',
  GE = '\\geqslant';

/** LaTeX for a solution set as inequalities: "x < 2 \text{ or } x > 5". */
export function setToLatex(set: Interval[], v: string, opts: { setNotation?: boolean; vTex?: string } = {}): string {
  const V = opts.vTex ?? symTex(v);
  const parts = set.map((i) => {
    const loInf = i.lo.k === 'sym' && i.lo.n === 'infty' ? true : !Number.isFinite(evaluate(i.lo));
    const hiInf = !Number.isFinite(evaluate(i.hi));
    const lo = loInf ? '' : toLatex(tidy(i.lo));
    const hi = hiInf ? '' : toLatex(tidy(i.hi));
    if (!loInf && !hiInf && evaluate(i.lo) === evaluate(i.hi)) return `${V} = ${lo}`;
    if (loInf && hiInf) return `${V} \\in \\mathbb{R}`;
    if (loInf) return `${V} ${i.hiClosed ? LE : '<'} ${hi}`;
    if (hiInf) return `${V} ${i.loClosed ? GE : '>'} ${lo}`;
    return `${lo} ${i.loClosed ? LE : '<'} ${V} ${i.hiClosed ? LE : '<'} ${hi}`;
  });
  if (opts.setNotation) return parts.map((p) => `\\{${V} : ${p}\\}`).join(' \\cup ');
  return parts.join(' \\text{ or } ');
}
