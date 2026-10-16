/**
 * Fallback parser: when our parser rejects some unusual LaTeX, CortexJS Compute Engine (lazy chunk)
 * parses it to MathJSON, which we convert back to our AST and re-print as LaTeX we understand.
 */
import { type Expr, type Fn, add, div, dec, fn, mul, neg, num, pow, sqrt, sym, toLatex, tidy } from '../core/expr';
import { Q } from '../core/rational';

type MJ = number | string | MJ[] | { num?: string; sym?: string; fn?: MJ[] };

const FN: Record<string, Fn> = {
  Sin: 'sin',
  Cos: 'cos',
  Tan: 'tan',
  Sec: 'sec',
  Csc: 'cosec',
  Cot: 'cot',
  Arcsin: 'arcsin',
  Arccos: 'arccos',
  Arctan: 'arctan',
  Ln: 'ln',
  Exp: 'exp',
  Abs: 'abs',
};
const SYMS: Record<string, string> = { Pi: 'pi', ExponentialE: 'e', theta: 'theta', alpha: 'alpha', mu: 'mu', sigma: 'sigma', lambda: 'lambda' };

export function mathJsonToExpr(j: MJ): Expr | null {
  if (typeof j === 'number') return Number.isInteger(j) ? num(j) : dec(j);
  if (typeof j === 'string') {
    if (/^-?\d+(\.\d+)?$/.test(j)) return mathJsonToExpr(Number(j));
    if (SYMS[j]) return sym(SYMS[j]);
    if (/^[A-Za-z]$/.test(j)) return sym(j);
    return null;
  }
  if (!Array.isArray(j)) {
    if (j.num !== undefined) return mathJsonToExpr(Number(j.num));
    if (j.sym !== undefined) return mathJsonToExpr(j.sym);
    if (j.fn) return mathJsonToExpr(j.fn);
    return null;
  }
  const [head, ...args] = j;
  const a = args.map(mathJsonToExpr);
  if (a.some((x) => x === null)) return null;
  const A = a as Expr[];
  switch (head) {
    case 'Add':
      return add(...A);
    case 'Subtract':
      return A.length === 2 ? add(A[0], neg(A[1])) : null;
    case 'Negate':
      return neg(A[0]);
    case 'Multiply':
    case 'InvisibleOperator':
      return mul(...A);
    case 'Divide':
      return div(A[0], A[1]);
    case 'Rational':
      return A.length === 2 && A[0].k === 'num' && A[1].k === 'num' ? num(A[0].v.div(A[1].v)) : div(A[0], A[1]);
    case 'Power':
      return pow(A[0], A[1]);
    case 'Square':
      return pow(A[0], 2);
    case 'Sqrt':
      return sqrt(A[0]);
    case 'Root':
      return A[1].k === 'num' && A[1].v.isInt ? sqrt(A[0], A[1].v.n) : pow(A[0], div(num(1), A[1]));
    case 'Delimiter':
      return A[0] ?? null;
    case 'Half':
      return mul(num(Q.of(1, 2)), A[0]);
    case 'Log':
      return A.length === 2 ? { k: 'log', b: A[1], a: A[0] } : { k: 'log', b: num(10), a: A[0] };
    case 'Lb':
      return { k: 'log', b: num(2), a: A[0] };
    default:
      if (typeof head === 'string' && FN[head]) return fn(FN[head], A[0]);
      return null;
  }
}

/** Re-express unusual LaTeX in the subset our parser reads, or null. */
export async function ceNormalise(latex: string): Promise<string | null> {
  try {
    const { ComputeEngine } = await import('@cortex-js/compute-engine');
    const ce = new ComputeEngine();
    const boxed = ce.parse(latex, { canonical: false });
    const e = mathJsonToExpr(boxed.json as MJ);
    return e ? toLatex(tidy(e)) : null;
  } catch {
    return null;
  }
}
