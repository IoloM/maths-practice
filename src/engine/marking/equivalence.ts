/** Numeric equivalence of expressions by evaluation at deterministic random points. */
import { type Expr, evaluate, freeSyms, toText } from '../core/expr';
import { Rng } from '../core/rng';
import type { Domain } from './types';

export const DEFAULT_RANGE: [number, number] = [0.35, 3.65];
const REL = 1e-8;

export function close(a: number, b: number, rel = REL): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Deterministic sample points for the given variables. */
export function samplePoints(vars: string[], domain: Domain | undefined, n: number, key: string): Record<string, number>[] {
  const r = new Rng(`pts:${key}`);
  const pts: Record<string, number>[] = [];
  for (let i = 0; i < n; i++) {
    const p: Record<string, number> = {};
    for (const v of vars) {
      const [lo, hi] = domain?.[v] ?? DEFAULT_RANGE;
      p[v] = lo + (hi - lo) * (0.03 + 0.94 * r.next());
    }
    pts.push(p);
  }
  return pts;
}

export interface EquivResult {
  ok: boolean;
  /** student uses symbols not allowed */
  extraSyms: string[];
  /** student's expression undefined where the answer is defined */
  domainMismatch: boolean;
  /** too few valid sample points to decide */
  inconclusive: boolean;
}

/** a ≡ b over the domain. `allowed` = variables the student may use. */
export function equivalent(student: Expr, correct: Expr, vars: string[], domain?: Domain): EquivResult {
  const extra = [...freeSyms(student)].filter((s) => !vars.includes(s));
  if (extra.length) return { ok: false, extraSyms: extra, domainMismatch: false, inconclusive: false };
  const pts = samplePoints(vars, domain, 16, toText(correct));
  let valid = 0;
  let mismatch = false;
  for (const p of pts) {
    const c = evaluate(correct, p);
    if (!Number.isFinite(c)) continue;
    const s = evaluate(student, p);
    if (!Number.isFinite(s)) {
      mismatch = true;
      continue;
    }
    valid++;
    if (!close(s, c)) return { ok: false, extraSyms: [], domainMismatch: false, inconclusive: false };
  }
  if (mismatch) return { ok: false, extraSyms: [], domainMismatch: true, inconclusive: false };
  if (valid < 5) return { ok: false, extraSyms: [], domainMismatch: false, inconclusive: true };
  return { ok: true, extraSyms: [], domainMismatch: false, inconclusive: false };
}

export const CONSTANT_SYMS = ['c', 'C', 'k', 'K', 'A', 'B', 'D'];

export interface IntegralCheck {
  /** derivative matches (differs from the answer by a constant) */
  matches: boolean;
  /** constant of integration present */
  hasConstant: boolean;
  extraSyms: string[];
}

/** Student antiderivative check: s − correct is constant in v; detects + c. */
export function checkIntegral(student: Expr, correct: Expr, v: string, domain?: Domain): IntegralCheck {
  const syms = [...freeSyms(student)].filter((s) => s !== v);
  const consts = syms.filter((s) => CONSTANT_SYMS.includes(s));
  const extra = syms.filter((s) => !CONSTANT_SYMS.includes(s));
  if (extra.length || consts.length > 1) return { matches: false, hasConstant: consts.length > 0, extraSyms: extra.length ? extra : consts.slice(1) };
  const cname = consts[0];
  const pts = samplePoints([v], domain, 14, `int:${toText(correct)}`);
  let diff0: number | null = null;
  let valid = 0;
  for (const p of pts) {
    const c = evaluate(correct, p);
    if (!Number.isFinite(c)) continue;
    const env0 = cname ? { ...p, [cname]: 0 } : p;
    const s0 = evaluate(student, env0);
    if (!Number.isFinite(s0)) return { matches: false, hasConstant: !!cname, extraSyms: [] };
    const d = s0 - c;
    if (diff0 === null) diff0 = d;
    else if (!close(d, diff0, 1e-7)) return { matches: false, hasConstant: !!cname, extraSyms: [] };
    if (cname) {
      // the constant must be additive: s(c=1) − s(c=0) = 1·k for some constant k ≠ 0, same at every point
      const s1 = evaluate(student, { ...p, [cname]: 1 });
      const s2 = evaluate(student, { ...p, [cname]: 2 });
      if (!close(s2 - s1, s1 - s0, 1e-7) || Math.abs(s1 - s0) < 1e-12) return { matches: false, hasConstant: true, extraSyms: [] };
    }
    valid++;
  }
  return { matches: valid >= 5, hasConstant: !!cname, extraSyms: [] };
}

/** Equations F_s = 0 and F_c = 0 equivalent: F_s / F_c constant (non-zero) at sample points. */
export function equationsEquivalent(sl: Expr, sr: Expr, cl: Expr, cr: Expr, vars: string[], domain?: Domain): EquivResult {
  const all = new Set([...freeSyms(sl), ...freeSyms(sr)]);
  const extra = [...all].filter((s) => !vars.includes(s));
  if (extra.length) return { ok: false, extraSyms: extra, domainMismatch: false, inconclusive: false };
  const pts = samplePoints(vars, domain ?? Object.fromEntries(vars.map((v) => [v, [-4.3, 4.7]])), 20, `eq:${toText(cl)}=${toText(cr)}`);
  let ratio: number | null = null;
  let valid = 0;
  for (const p of pts) {
    const fc = evaluate(cl, p) - evaluate(cr, p);
    const fs = evaluate(sl, p) - evaluate(sr, p);
    if (!Number.isFinite(fc)) continue;
    if (!Number.isFinite(fs)) continue;
    if (Math.abs(fc) < 1e-9) {
      if (Math.abs(fs) > 1e-6) return { ok: false, extraSyms: [], domainMismatch: false, inconclusive: false };
      continue;
    }
    const r = fs / fc;
    if (ratio === null) ratio = r;
    else if (!close(r, ratio, 1e-7)) return { ok: false, extraSyms: [], domainMismatch: false, inconclusive: false };
    valid++;
  }
  if (ratio === null || Math.abs(ratio) < 1e-12) return { ok: false, extraSyms: [], domainMismatch: false, inconclusive: valid < 5 };
  return { ok: valid >= 5, extraSyms: [], domainMismatch: false, inconclusive: valid < 5 };
}

/** Value of a constant expression, NaN if it has free symbols. */
export function constValue(e: Expr): number {
  if (freeSyms(e).size) return NaN;
  return evaluate(e);
}
