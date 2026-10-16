/** Authoring helpers so templates stay short and consistent. */
import { type Expr, tidy, toLatex } from '../core/expr';
import { Q } from '../core/rational';
import { texNum } from '../core/format';
import type {
  Accuracy,
  AnswerSpec,
  ChoiceSpec,
  CommonError,
  CoordSpec,
  Domain,
  EquationSpec,
  ExactSpec,
  ExprSpec,
  Form,
  HypothesisSpec,
  IntegralSpec,
  Interval,
  IntervalSpec,
  ListSpec,
  NumericSpec,
  SchemeLine,
  SelfSpec,
  VectorSpec,
} from '../marking/types';
import type { FollowThrough, Part, Template } from './types';

/** Tagged template for LaTeX-heavy strings: backslashes are kept literally. */
export const md = String.raw;

export function defineTemplate(t: Template): Template {
  return t;
}

// ---------- mark scheme lines ----------
const line =
  (code: string) =>
  (text: string, final?: boolean): SchemeLine => ({ code, text, ...(final !== undefined ? { final } : {}) });
export const M1 = line('M1');
export const M2 = line('M2');
export const dM1 = line('dM1');
export const A1 = line('A1');
export const A2 = line('A2');
export const A1ft = line('A1ft');
export const A1cso = line('A1*');
export const B1 = line('B1');
export const B2 = line('B2');
export const B1ft = line('B1ft');

// ---------- answer specs ----------
export const ans = {
  num(value: number, acc: Accuracy = { sf: 3 }, extra: Partial<NumericSpec> = {}): NumericSpec {
    return { type: 'numeric', value, acc, ...extra };
  },
  exact(value: Expr, forms?: Form[], extra: Partial<ExactSpec> = {}): ExactSpec {
    return { type: 'exact', value: tidy(value), forms, ...extra };
  },
  expr(value: Expr, vars: string[] = ['x'], extra: Partial<ExprSpec> = {}): ExprSpec {
    return { type: 'expr', value: tidy(value), vars, ...extra };
  },
  integral(value: Expr, v = 'x', domain?: Domain, extra: Partial<IntegralSpec> = {}): IntegralSpec {
    return { type: 'integral', value: tidy(value), v, domain, ...extra };
  },
  eq(lhs: Expr, rhs: Expr, vars: string[] = ['x', 'y'], forms?: Form[], extra: Partial<EquationSpec> = {}): EquationSpec {
    return { type: 'equation', lhs: tidy(lhs), rhs: tidy(rhs), vars, forms, ...extra };
  },
  list(items: (NumericSpec | ExactSpec)[], extra: Partial<ListSpec> = {}): ListSpec {
    return { type: 'list', items, ...extra };
  },
  coord(x: NumericSpec | ExactSpec, y: NumericSpec | ExactSpec, extra: Partial<CoordSpec> = {}): CoordSpec {
    return { type: 'coord', x, y, ...extra };
  },
  vec(comps: (NumericSpec | ExactSpec)[], extra: Partial<VectorSpec> = {}): VectorSpec {
    return { type: 'vector', comps, ...extra };
  },
  interval(set: Interval[], v = 'x', extra: Partial<IntervalSpec> = {}): IntervalSpec {
    return { type: 'interval', v, set, ...extra };
  },
  choice(options: string[], correct: number | number[], extra: Partial<ChoiceSpec> = {}): ChoiceSpec {
    return { type: 'choice', options, correct: Array.isArray(correct) ? correct : [correct], ...extra };
  },
  hyp(h: Omit<HypothesisSpec, 'type'>): HypothesisSpec {
    return { type: 'hypothesis', ...h };
  },
  self(model: string): SelfSpec {
    return { type: 'self', model };
  },
};

export function err(id: string, spec: AnswerSpec, feedback: string, marks = 0): CommonError {
  return { id, spec, feedback, marks };
}

export interface PartInput {
  label?: string;
  marks: number;
  prompt: string;
  answer: AnswerSpec;
  scheme: SchemeLine[];
  hints: [string, string, string];
  errors?: CommonError[];
  solution: string[];
  ft?: FollowThrough;
}

export function part(p: PartInput): Part {
  return { label: p.label ?? '', errors: p.errors ?? [], ...p } as Part;
}

// ---------- LaTeX snippets ----------
/** Expr → LaTeX (tidied). */
export const L = (e: Expr): string => toLatex(tidy(e));
/** Number → LaTeX. */
export const N = (x: number): string => texNum(x);
/** Rational → LaTeX. */
export const F = (q: Q | number): string => Q.from(q).toLatex();
/** " + 3" / " - 3" for building expressions inline (k ≠ 0). */
export function sgn(k: number | Q, body = ''): string {
  const q = Q.from(k);
  const a = q.abs();
  const coef = body && a.eq(1) ? '' : a.toLatex();
  return `${q.sign < 0 ? ' - ' : ' + '}${coef}${body}`;
}
/** Leading coefficient on a term: 1 → "", −1 → "-". */
export function lead(k: number | Q, body: string): string {
  const q = Q.from(k);
  if (body && q.eq(1)) return body;
  if (body && q.eq(-1)) return `-${body}`;
  return `${q.toLatex()}${body}`;
}
/** Interval helper. */
export function iv(lo: Expr, hi: Expr, loClosed: boolean, hiClosed: boolean): Interval {
  return { lo, hi, loClosed, hiClosed };
}

export const ACC3: Accuracy = { sf: 3 };
export const ACC4DP: Accuracy = { dp: 4 };
export const ACC_G: Accuracy = { sfRange: [2, 3] };
