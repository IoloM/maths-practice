/** Edexcel accuracy rules for decimal answers. */
import { type Expr } from '../core/expr';
import { roundDP, roundSF, countDP } from '../core/format';
import type { Accuracy } from './types';

export type AwrtResult = 'ok' | 'low' | 'wrong';

const eqR = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** Significant figures in a typed literal; an integer's trailing zeros count (1200 to 3 s.f. is "1200"). */
export function litSF(lit: string): number {
  const s = lit.replace(/^[+-]/, '').split(/e/i)[0];
  if (s.includes('.')) return s.replace('.', '').replace(/^0+/, '').length;
  return Math.max(1, s.replace(/^0+/, '').length);
}

/**
 * Is a typed decimal `lit` (value s) acceptable for true value t?
 * 'ok' = awrt the required accuracy, 'low' = correct but to too few figures.
 */
export function awrt(lit: string, s: number, t: number, acc: Accuracy): AwrtResult {
  if (eqR(s, t)) return 'ok';
  if (acc.tol !== undefined) return Math.abs(s - t) <= acc.tol + 1e-12 ? 'ok' : 'wrong';
  if (acc.dp !== undefined) {
    const k = countDP(lit);
    if (k < acc.dp) return k >= acc.dp - 2 && eqR(roundDP(t, k), s) ? 'low' : 'wrong';
    return eqR(roundDP(s, acc.dp), roundDP(t, acc.dp)) ? 'ok' : 'wrong';
  }
  const [minSF, maxSF] = acc.sfRange ?? [acc.sf ?? 3, acc.sf ?? 3];
  const k = litSF(lit);
  if (k < minSF) return k >= Math.max(2, minSF - 1) && eqR(roundSF(t, k), s) ? 'low' : 'wrong';
  const n = Math.min(k, maxSF);
  return eqR(roundSF(s, n), roundSF(t, n)) ? 'ok' : 'wrong';
}

/** If e is a plain number literal (optionally negated), its literal text. */
export function plainLiteral(e: Expr): string | null {
  if (e.k === 'dec') return e.s;
  if (e.k === 'num' && e.v.isInt) return String(Math.abs(e.v.n)) === String(e.v.n) ? String(e.v.n) : String(e.v.n);
  if (e.k === 'neg') {
    const l = plainLiteral(e.a);
    return l === null ? null : l.startsWith('-') ? l.slice(1) : `-${l}`;
  }
  return null;
}

/** Close enough that premature rounding is the likely cause. */
export function nearMiss(s: number, t: number): boolean {
  if (!Number.isFinite(s) || !Number.isFinite(t) || t === 0) return false;
  return Math.abs(s - t) / Math.abs(t) < 0.01;
}
