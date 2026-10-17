import type { Expr } from '../core/expr';

/** Accuracy demanded of a decimal answer (Edexcel "awrt" semantics). */
export interface Accuracy {
  /** significant figures, e.g. 3 */
  sf?: number;
  /** decimal places, e.g. 4 (probabilities) */
  dp?: number;
  /** accept any precision in [min, max] s.f., e.g. [2, 3] for answers using g = 9.8 */
  sfRange?: [number, number];
  /** absolute tolerance (e.g. readings, iterations) */
  tol?: number;
}

/** Sampling domain for numeric equivalence: variable → [lo, hi]. */
export type Domain = Record<string, [number, number]>;

export type FormName =
  | 'exact' // no decimal approximations
  | 'simplest-fraction'
  | 'surd' // a√b with b square-free, rationalised
  | 'rationalised'
  | 'factorised' // product of factors
  | 'fully-factorised'
  | 'completed-square' // a(x + p)² + q
  | 'expanded'
  | 'single-fraction'
  | 'single-log'
  | 'y=mx+c'
  | 'ax+by+c=0'
  | 'integer-coefficients';

export interface CustomForm {
  /** returns an error message if the form is wrong, otherwise null */
  check: (e: Expr) => string | null;
  label: string;
}
export type Form = FormName | CustomForm;

/** A single closed/open interval; endpoints are Exprs (infinity = sym 'infty'). */
export interface Interval {
  lo: Expr;
  hi: Expr;
  loClosed: boolean;
  hiClosed: boolean;
}

export type AnswerSpec =
  | NumericSpec
  | ExactSpec
  | ExprSpec
  | IntegralSpec
  | EquationSpec
  | ListSpec
  | CoordSpec
  | VectorSpec
  | IntervalSpec
  | ChoiceSpec
  | HypothesisSpec
  | SelfSpec;

interface Base {
  /** text shown before the input, e.g. "x =" (LaTeX) */
  label?: string;
  /** unit shown after the input, e.g. "m s^{-1}" (LaTeX) */
  unit?: string;
}

export interface NumericSpec extends Base {
  type: 'numeric';
  value: number;
  acc: Accuracy;
  /** accept a correct exact form (e.g. √5) with full marks */
  exactAllowed?: boolean;
  /** exact expression for the value, shown in solutions */
  exact?: Expr;
  /** other acceptable values, e.g. the table-based value when the calculator value differs */
  alts?: number[];
}

export interface ExactSpec extends Base {
  type: 'exact';
  value: Expr;
  forms?: Form[];
  /** a correct terminating decimal (e.g. 0.25) is fine */
  allowDecimal?: boolean;
}

export interface ExprSpec extends Base {
  type: 'expr';
  value: Expr;
  vars: string[];
  domain?: Domain;
  forms?: Form[];
}

export interface IntegralSpec extends Base {
  type: 'integral';
  /** an antiderivative (without constant) */
  value: Expr;
  v: string;
  domain?: Domain;
}

export interface EquationSpec extends Base {
  type: 'equation';
  lhs: Expr;
  rhs: Expr;
  vars: string[];
  domain?: Domain;
  forms?: Form[];
}

export interface ListSpec extends Base {
  type: 'list';
  /** each item numeric or exact */
  items: (NumericSpec | ExactSpec)[];
  /** name of the unknown, e.g. "x" or "θ" (LaTeX) */
  v?: string;
  /** angle answers: which unit is required */
  angle?: 'deg' | 'rad';
}

export interface CoordSpec extends Base {
  type: 'coord';
  x: NumericSpec | ExactSpec;
  y: NumericSpec | ExactSpec;
}

export interface VectorSpec extends Base {
  type: 'vector';
  comps: (NumericSpec | ExactSpec)[];
}

export interface IntervalSpec extends Base {
  type: 'interval';
  v: string;
  set: Interval[];
  /** compare over the integers only (critical regions) */
  integer?: boolean;
  /** demand set notation */
  setNotation?: boolean;
  /** finite endpoints may be strict or non-strict (e.g. increasing/decreasing intervals) */
  endsEither?: boolean;
}

export interface ChoiceSpec extends Base {
  type: 'choice';
  options: string[];
  correct: number[];
  multi?: boolean;
}

export interface HypothesisSpec extends Base {
  type: 'hypothesis';
  param: 'p' | 'mu' | 'rho';
  h0: number;
  h1: '<' | '>' | '!=';
  /** test statistic / p-value / probability box; omitted when not asked */
  stat?: { label: string; spec: NumericSpec };
  /** true if H0 should be rejected */
  reject: boolean;
  /** conclusion sentences in context; index of the correct one */
  conclusions: string[];
  correctConclusion: number;
  /** marks: hypotheses, statistic, comparison/decision, conclusion */
  marks: { hyp: number; stat: number; decision: number; conclusion: number };
}

export interface SelfSpec extends Base {
  type: 'self';
  model: string;
}

/** What the student entered. Shape depends on the answer type. */
export type Response = string | string[] | Record<string, string>;

export type Verdict = 'correct' | 'partial' | 'incorrect' | 'invalid' | 'unanswered' | 'self';

export interface MarkResult {
  verdict: Verdict;
  score: number;
  max: number;
  messages: string[];
  errorId?: string;
  ft?: boolean;
  /** method lines can be self-awarded */
  selfMarkable: boolean;
  /** evaluated value(s) for follow-through */
  value?: FtValue;
}

export interface FtValue {
  value?: number;
  values?: number[];
  expr?: Expr;
  correct: boolean;
}

export interface SchemeLine {
  /** Edexcel code: M1, dM1, A1, A1ft, B1, B2, A1* … */
  code: string;
  text: string;
  /** final accuracy mark tied to the answer; cannot be self-awarded */
  final?: boolean;
}

export interface CommonError {
  id: string;
  /** the wrong answer, in the same shape as the part's spec */
  spec: AnswerSpec;
  feedback: string;
  /** marks auto-awarded when this error is matched (default 0) */
  marks?: number;
}
