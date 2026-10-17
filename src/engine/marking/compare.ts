/** Compare one response against one AnswerSpec. */
import { type Expr, evaluate, freeSyms, hasDecimal, num, some, symTex, tidy } from '../core/expr';
import { fmtNum, accuracyPhrase } from '../core/format';
import { Q, toFraction } from '../core/rational';
import { awrt, nearMiss, plainLiteral } from './accuracy';
import { checkIntegral, close, equationsEquivalent, equivalent } from './equivalence';
import { equationFormErrors, formErrors } from './forms';
import { integerSetsEqual, setsEqual, statementToSet, toNumSet, endpoints, normalise, type NumSet } from './intervals';
import { ParseError, parseExpr, parseStatement, expandPm, type Statement } from './parse';
import type {
  AnswerSpec,
  CoordSpec,
  ExactSpec,
  FtValue,
  HypothesisSpec,
  IntervalSpec,
  ListSpec,
  NumericSpec,
  Response,
  VectorSpec,
} from './types';

export type CmpStatus = 'correct' | 'accuracy' | 'wrong' | 'invalid' | 'unanswered' | 'scored';

export interface Cmp {
  status: CmpStatus;
  messages: string[];
  value?: FtValue;
  /** marks lost for 'accuracy' (default 1) */
  lose?: number;
  /** explicit score for 'scored' (hypothesis tests) */
  score?: number;
  errorId?: string;
}

const ok = (value?: FtValue, messages: string[] = []): Cmp => ({ status: 'correct', messages, value });
const wrong = (messages: string[] = [], value?: FtValue): Cmp => ({ status: 'wrong', messages, value });
const acc = (messages: string[], value?: FtValue, lose = 1, errorId?: string): Cmp => ({ status: 'accuracy', messages, value, lose, errorId });

function asString(r: Response | undefined): string {
  if (r === undefined || r === null) return '';
  if (typeof r === 'string') return r;
  if (Array.isArray(r)) return r.join(', ');
  return '';
}

function blank(r: Response | undefined): boolean {
  if (r === undefined || r === null) return true;
  if (typeof r === 'string') return r.trim() === '';
  if (Array.isArray(r)) return r.every((x) => !x || !x.trim());
  return Object.values(r).every((x) => !x || !String(x).trim());
}

function parseOrInvalid<T>(f: () => T): T | Cmp {
  try {
    return f();
  } catch (e) {
    if (e instanceof ParseError) return { status: 'invalid', messages: [e.message] };
    throw e;
  }
}
const isCmp = (x: unknown): x is Cmp => !!x && typeof x === 'object' && 'status' in (x as object) && 'messages' in (x as object);

// ---------- numbers ----------
export function compareNumericExpr(spec: NumericSpec, e: Expr): Cmp {
  const syms = [...freeSyms(e)];
  if (syms.length) return { status: 'invalid', messages: [`Enter a number — your answer contains ${syms.join(', ')}.`] };
  const s = evaluate(e);
  if (!Number.isFinite(s)) return { status: 'invalid', messages: ['That value is undefined.'] };
  const value: FtValue = { value: s, correct: false };
  const lit = plainLiteral(e);
  const t = spec.value;
  if (lit === null) {
    // exact form such as √5, 3/7 or π/6
    const matches = close(s, t, 1e-9) || awrt(fmtNum(s, 12), s, t, spec.acc) === 'ok' || (spec.alts ?? []).some((a) => awrt(fmtNum(s, 12), s, a, spec.acc) === 'ok');
    if (matches) {
      if (spec.exactAllowed) return ok({ value: s, correct: true });
      return acc([`Correct value — but give it as a decimal to ${accuracyPhrase(spec.acc) || 'the accuracy asked for'}.`], { value: s, correct: true }, 1, 'exact-not-decimal');
    }
    return wrong(nearMiss(s, t) ? ['Very close — check for premature rounding.'] : [], value);
  }
  const r = awrt(lit, s, t, spec.acc);
  if (r === 'ok') return ok({ value: s, correct: true });
  for (const alt of spec.alts ?? []) if (awrt(lit, s, alt, spec.acc) === 'ok') return ok({ value: s, correct: true }, ['Accepted (table-based value).']);
  if (r === 'low') return acc([`Correct, but give your answer to ${accuracyPhrase(spec.acc) || 'more figures'}.`], { value: s, correct: true }, 1, 'accuracy');
  if (nearMiss(s, t)) return { status: 'wrong', messages: ['Very close but outside the accepted range — have you rounded too early? Keep full calculator accuracy until the final answer.'], value, errorId: 'premature-rounding' };
  return wrong([], value);
}

function isTerminating(x: number): boolean {
  const f = toFraction(x, 100000);
  if (!f) return false;
  let d = f[1];
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

export function compareExactExpr(spec: ExactSpec, e: Expr): Cmp {
  const syms = [...freeSyms(e)];
  if (syms.length) return { status: 'invalid', messages: [`Your answer should be a number but contains ${syms.map(symTexPlain).join(', ')}.`] };
  const s = evaluate(e);
  const t = evaluate(spec.value);
  if (!Number.isFinite(s)) return { status: 'invalid', messages: ['That value is undefined.'] };
  const value: FtValue = { value: s, expr: e, correct: false };
  if (close(s, t, 1e-9)) {
    value.correct = true;
    if (hasDecimal(e) && !spec.allowDecimal) {
      // short decimals such as 0.25π or 1.5 + √2 are exact; long ones are approximations
      const shortDecimals = !some(e, (n) => n.k === 'dec' && n.s.replace(/^-/, '').replace('.', '').replace(/^0+/, '').length > 6);
      const exactDecimal = (isTerminating(t) && close(s, t, 1e-12)) || (shortDecimals && close(s, t, 1e-12));
      const needsFraction = spec.forms?.includes('simplest-fraction');
      if (!exactDecimal || needsFraction) return acc(['Correct value — but give it exactly (as a fraction, surd or in terms of π, e or ln), not as a decimal.'], value, 1, 'decimal-not-exact');
    }
    const fe = formErrors(spec.forms?.filter((f) => f !== 'exact'), e);
    if (fe.length) return acc(fe, value, 1, 'form');
    return ok(value);
  }
  if (hasDecimal(e) && Math.abs(s - t) <= 1e-3 * Math.max(1, Math.abs(t))) {
    return acc(['That is a decimal approximation — the question asks for an exact value.'], { ...value, correct: true }, 1, 'decimal-not-exact');
  }
  return wrong([], value);
}

function symTexPlain(s: string): string {
  return s === 'theta' ? 'θ' : s;
}

function compareValue(spec: NumericSpec | ExactSpec, e: Expr): Cmp {
  return spec.type === 'numeric' ? compareNumericExpr(spec, e) : compareExactExpr(spec, e);
}

/** Pull values out of "x = 3", "3", "x = 2 ± √3" clauses. */
function valuesFrom(st: Statement, v?: string): Expr[] | Cmp {
  const out: Expr[] = [];
  for (const c of st.clauses) {
    if (c.kind === 'expr') out.push(...expandPm(c.e));
    else if (c.kind === 'rel' && c.ops.length === 1 && c.ops[0] === '=') {
      const [l, r] = c.terms;
      const lv = l.k === 'sym' ? l.n : null;
      const rv = r.k === 'sym' ? r.n : null;
      if (lv && (!v || lv === v || freeSyms(r).size === 0)) out.push(...expandPm(r));
      else if (rv) out.push(...expandPm(l));
      else return { status: 'invalid', messages: ['Write each solution as a value, e.g. x = 3'] };
    } else return { status: 'invalid', messages: ['Enter the values separated by commas.'] };
  }
  return out;
}

// ---------- lists ----------
export function compareList(spec: ListSpec, r: Response): Cmp {
  const entries = Array.isArray(r) ? r.filter((x) => x && x.trim()) : [asString(r)];
  const vals: Expr[] = [];
  let degrees = false;
  for (const en of entries) {
    const st = parseOrInvalid(() => parseStatement(en));
    if (isCmp(st)) return st;
    degrees ||= st.degrees;
    const vs = valuesFrom(st, spec.v);
    if (isCmp(vs)) return vs;
    vals.push(...vs);
  }
  if (spec.angle === 'rad' && degrees) return wrong(['The question asks for radians, but you used degrees.']);
  const used = new Array(spec.items.length).fill(false);
  let extras = 0;
  let accIssue: Cmp | null = null;
  const numVals: number[] = [];
  for (const e of vals) {
    let matched = false;
    for (let i = 0; i < spec.items.length; i++) {
      if (used[i]) continue;
      const c = compareValue(spec.items[i], e);
      if (c.status === 'correct' || c.status === 'accuracy') {
        used[i] = true;
        matched = true;
        if (c.status === 'accuracy') accIssue = c;
        break;
      }
    }
    const ev = freeSyms(e).size ? NaN : evaluate(e);
    numVals.push(ev);
    if (!matched) extras++;
  }
  const missing = used.filter((u) => !u).length;
  const value: FtValue = { values: numVals, correct: missing === 0 && extras === 0 };
  if (missing === 0 && extras === 0) {
    if (accIssue) return { ...accIssue, value };
    return ok(value);
  }
  // radians given when degrees asked?
  if (spec.angle === 'deg' && vals.length) {
    const asDeg = vals.map((e) => (freeSyms(e).size ? NaN : (evaluate(e) * 180) / Math.PI));
    const allMatch = spec.items.every((it) => asDeg.some((d) => close(d, it.type === 'numeric' ? it.value : evaluate(it.value), 1e-3)));
    if (allMatch) return wrong(['These look like radians — the question asks for degrees.'], value);
  }
  const msgs: string[] = [];
  const nCorrect = spec.items.length - missing;
  if (missing) msgs.push(`${nCorrect} of ${spec.items.length} solutions correct — ${missing === 1 ? 'one is' : `${missing} are`} missing.`);
  if (extras) msgs.push(`${extras === 1 ? 'One value is' : `${extras} values are`} not a correct solution (check the interval and reject invalid roots).`);
  if (nCorrect > 0 && missing + extras === 1) return { status: 'accuracy', messages: msgs, value, lose: 1, errorId: missing ? 'missing-solution' : 'extra-solution' };
  if (nCorrect > 0 && missing + extras === 2 && spec.items.length >= 2) return { status: 'accuracy', messages: msgs, value, lose: 2, errorId: 'some-solutions' };
  return wrong(msgs, value);
}

// ---------- coordinates & vectors ----------
export function compareCoord(spec: CoordSpec, r: Response): Cmp {
  let xs: string, ys: string;
  if (Array.isArray(r)) [xs, ys] = [r[0] ?? '', r[1] ?? ''];
  else {
    const st = parseOrInvalid(() => parseStatement(asString(r)));
    if (isCmp(st)) return st;
    const c = st.clauses[0];
    if (st.clauses.length !== 1 || c.kind !== 'tuple' || c.items.length !== 2) return { status: 'invalid', messages: ['Enter coordinates as (x, y).'] };
    return coordFromExprs(spec, c.items[0], c.items[1]);
  }
  if (!xs.trim() || !ys.trim()) return { status: 'invalid', messages: ['Enter both coordinates.'] };
  const ex = parseOrInvalid(() => parseExpr(xs));
  if (isCmp(ex)) return ex;
  const ey = parseOrInvalid(() => parseExpr(ys));
  if (isCmp(ey)) return ey;
  return coordFromExprs(spec, ex, ey);
}

function coordFromExprs(spec: CoordSpec, ex: Expr, ey: Expr): Cmp {
  const cx = compareValue(spec.x, ex);
  const cy = compareValue(spec.y, ey);
  if (cx.status === 'invalid') return cx;
  if (cy.status === 'invalid') return cy;
  const value: FtValue = { values: [cx.value?.value ?? NaN, cy.value?.value ?? NaN], correct: false };
  const good = (c: Cmp) => c.status === 'correct';
  const near = (c: Cmp) => c.status === 'correct' || c.status === 'accuracy';
  if (good(cx) && good(cy)) return ok({ ...value, correct: true });
  if (near(cx) && near(cy)) return { status: 'accuracy', messages: [...cx.messages, ...cy.messages], value: { ...value, correct: true }, lose: 1 };
  const sx = compareValue(spec.x, ey),
    sy = compareValue(spec.y, ex);
  if (near(sx) && near(sy)) return wrong(['Your coordinates are the wrong way round — write (x, y).'], value);
  if (near(cx) || near(cy)) return { status: 'accuracy', messages: [near(cx) ? 'x-coordinate correct, y-coordinate wrong.' : 'y-coordinate correct, x-coordinate wrong.'], value, lose: 1 };
  return wrong([], value);
}

export function compareVector(spec: VectorSpec, r: Response): Cmp {
  let comps: Expr[];
  if (Array.isArray(r)) {
    if (r.some((x) => !x || !x.trim())) return { status: 'invalid', messages: ['Fill in every component.'] };
    const ps: Expr[] = [];
    for (const x of r) {
      const e = parseOrInvalid(() => parseExpr(x));
      if (isCmp(e)) return e;
      ps.push(e);
    }
    comps = ps;
  } else {
    const st = parseOrInvalid(() => parseStatement(asString(r)));
    if (isCmp(st)) return st;
    const c = st.clauses[0];
    if (c.kind === 'vector') comps = c.comps;
    else if (c.kind === 'expr') {
      const basis = ['i', 'j', 'k'].slice(0, Math.max(2, spec.comps.length));
      const extra = [...freeSyms(c.e)].filter((s) => !basis.includes(s));
      if (extra.length) return { status: 'invalid', messages: [`Use i, j${basis.length > 2 ? ', k' : ''} only.`] };
      const env0 = Object.fromEntries(basis.map((b) => [b, 0]));
      const f0 = evaluate(c.e, env0);
      if (Math.abs(f0) > 1e-9) return { status: 'invalid', messages: ['Write the vector as a combination of i, j (and k), e.g. 3i − 2j.'] };
      comps = basis.map((b) => evalCoef(c.e, basis, b));
    } else return { status: 'invalid', messages: ['Enter a vector, e.g. 3i − 2j or a column vector.'] };
  }
  if (comps.length !== spec.comps.length) return wrong([`The vector should have ${spec.comps.length} components.`]);
  const cs = comps.map((e, i) => compareValue(spec.comps[i], e));
  const inv = cs.find((c) => c.status === 'invalid');
  if (inv) return inv;
  const value: FtValue = { values: cs.map((c) => c.value?.value ?? NaN), correct: false };
  if (cs.every((c) => c.status === 'correct')) return ok({ ...value, correct: true });
  if (cs.every((c) => c.status === 'correct' || c.status === 'accuracy')) return { status: 'accuracy', messages: cs.flatMap((c) => c.messages), value, lose: 1 };
  const nOk = cs.filter((c) => c.status === 'correct').length;
  return wrong(nOk ? [`${nOk} of ${cs.length} components correct.`] : [], value);
}

function evalCoef(e: Expr, basis: string[], b: string): Expr {
  const env = Object.fromEntries(basis.map((x) => [x, x === b ? 1 : 0]));
  const v = evaluate(e, env);
  const f = toFraction(v, 10000);
  if (f && Math.abs(f[0] / f[1] - v) < 1e-12) return num(Q.of(f[0], f[1]));
  return { k: 'dec', v, s: fmtNum(v, 12) };
}

// ---------- intervals ----------
/** Replace alternative names for the variable (e.g. "f(x)", "\\mathrm{g}^{-1}(x)") by the variable itself. */
export function applyAliases(s: string, aliases: string[], v: string): string {
  let t = s
    .replace(/\\(?:mathrm|operatorname|text)\{([^{}]*)\}/g, '$1')
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*\)/g, ')')
    .replace(/\^\{\s*-\s*1\s*\}/g, '^{-1}')
    .replace(/\^-1(?![0-9])/g, '^{-1}');
  for (const a of [...aliases].sort((x, y) => y.length - x.length)) {
    const esc = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`(?<![\\\\A-Za-z])${esc}(?![A-Za-z])`, 'g'), ` ${v} `);
  }
  return t;
}

export function compareInterval(spec: IntervalSpec, r: Response): Cmp {
  const raw = asString(r);
  const st = parseOrInvalid(() => parseStatement(spec.aliases?.length ? applyAliases(raw, spec.aliases, spec.v) : raw));
  if (isCmp(st)) return st;
  const S = statementToSet(st, spec.v);
  if (!S) {
    const name = spec.aliases?.[0] ?? (spec.v === 'theta' ? 'θ' : spec.v);
    if (spec.aliases?.length && spec.v !== 'x' && statementToSet(st, 'x')) return wrong([`This asks for a set of values of ${name}, not of x.`]);
    return { status: 'invalid', messages: [`Write your answer as inequalities in ${name}, e.g. ${name} < 2 or ${name} > 5, or in set notation.`] };
  }
  const T = toNumSet(spec.set);
  let equal: boolean;
  if (spec.integer) {
    const eps = endpoints(T);
    const lo = Math.floor(Math.min(...eps, 0)) - 3,
      hi = Math.ceil(Math.max(...eps, 0)) + 3;
    equal = integerSetsEqual(S, T, lo, hi);
  } else if (spec.endsEither) {
    const closed = (A: NumSet) => normalise(A.map((i) => ({ ...i, loC: isFinite(i.lo) || i.loC, hiC: isFinite(i.hi) || i.hiC })));
    equal = setsEqual(closed(S), closed(T));
  } else equal = setsEqual(S, T);
  if (equal) {
    if (spec.setNotation && !st.clauses.some((c) => c.kind === 'set' || c.kind === 'in')) {
      return acc(['Correct region — but the question asks for set notation, e.g. {x : x < 2} ∪ {x : x > 5}.'], undefined, 1, 'set-notation');
    }
    return ok();
  }
  if (S.length === 0) return wrong(['Your inequalities have no solutions — check whether you need "or" rather than "and".']);
  const se = endpoints(S),
    te = endpoints(T);
  if (!spec.integer && se.length === te.length && se.every((x, i) => close(x, te[i], 1e-9))) {
    return { status: 'accuracy', messages: ['Critical values correct, but the region (or the strict/non-strict inequalities) is wrong.'], lose: 1, errorId: 'region' };
  }
  return wrong();
}

// ---------- expressions ----------
function compareExprSpec(spec: Extract<AnswerSpec, { type: 'expr' }>, r: Response): Cmp {
  const e = parseOrInvalid(() => parseExprOrEquationRhs(asString(r), spec.label));
  if (isCmp(e)) return e;
  const eq = equivalent(e, spec.value, spec.vars, spec.domain);
  const value: FtValue = { expr: e, correct: eq.ok };
  if (eq.extraSyms.length) return wrong([`Your answer uses ${eq.extraSyms.map(symTexPlain).join(', ')}, which shouldn't appear.`], value);
  if (eq.domainMismatch) return wrong(['Your expression is not equal to the answer for every valid value (check moduli, roots and signs).'], value);
  if (!eq.ok) return wrong([], value);
  const fe = formErrors(spec.forms, e, spec.vars[0] ?? 'x');
  if (fe.length) return acc(fe, value, 1, 'form');
  return ok(value);
}

/** Allow "y = 3x + 1" or "f'(x) = …" style when an expression is expected. */
function parseExprOrEquationRhs(src: string, label?: string): Expr {
  void label;
  const st = parseStatement(src);
  if (st.clauses.length === 1) {
    const c = st.clauses[0];
    if (c.kind === 'expr') {
      const xs = expandPm(c.e);
      if (xs.length > 1) throw new ParseError('Enter a single expression');
      return c.e;
    }
    if (c.kind === 'rel' && c.ops.length === 1 && c.ops[0] === '=' && c.terms[0].k === 'sym') return c.terms[1];
  }
  throw new ParseError('Enter a single expression');
}

function compareIntegralSpec(spec: Extract<AnswerSpec, { type: 'integral' }>, r: Response): Cmp {
  const e = parseOrInvalid(() => parseExprOrEquationRhs(asString(r)));
  if (isCmp(e)) return e;
  const c = checkIntegral(e, spec.value, spec.v, spec.domain);
  const value: FtValue = { expr: e, correct: c.matches };
  if (c.extraSyms.length) return wrong([`Your answer uses ${c.extraSyms.join(', ')}, which shouldn't appear.`], value);
  if (!c.matches) return wrong([], value);
  if (!c.hasConstant) return acc(['Correct integration, but an indefinite integral needs a constant of integration: + c.'], value, 1, 'missing-c');
  return ok(value);
}

function compareEquationSpec(spec: Extract<AnswerSpec, { type: 'equation' }>, r: Response): Cmp {
  const st = parseOrInvalid(() => parseStatement(asString(r)));
  if (isCmp(st)) return st;
  const c = st.clauses[0];
  if (st.clauses.length !== 1 || c.kind !== 'rel' || c.ops.length !== 1 || c.ops[0] !== '=') return { status: 'invalid', messages: ['Enter an equation, e.g. y = 3x − 2.'] };
  const [l, rr] = c.terms;
  const eq = equationsEquivalent(l, rr, spec.lhs, spec.rhs, spec.vars, spec.domain);
  if (eq.extraSyms.length) return wrong([`Your equation uses ${eq.extraSyms.join(', ')}, which shouldn't appear.`]);
  if (!eq.ok) return wrong();
  const fe = [...equationFormErrors(spec.forms, l, rr), ...formErrors(spec.forms?.filter((f) => f === 'exact'), { k: 'add', a: [l, rr] })];
  if (fe.length) return acc(fe, { correct: true }, 1, 'form');
  return ok({ correct: true });
}

// ---------- hypothesis tests ----------
export function compareHypothesis(spec: HypothesisSpec, r: Response): Cmp {
  const R = (typeof r === 'object' && !Array.isArray(r) ? r : {}) as Record<string, string>;
  const msgs: string[] = [];
  let score = 0;
  const pName = spec.param === 'mu' ? 'μ' : spec.param === 'rho' ? 'ρ' : 'p';
  const num = (s: string | undefined) => {
    if (!s || !s.trim()) return NaN;
    try {
      const e = parseExpr(s);
      return freeSyms(e).size ? NaN : evaluate(e);
    } catch {
      return NaN;
    }
  };
  const h0ok = R.h0p === spec.param && close(num(R.h0v), spec.h0, 1e-9);
  const h1ok = R.h1p === spec.param && R.h1op === spec.h1 && close(num(R.h1v), spec.h0, 1e-9);
  if (spec.marks.hyp >= 2) {
    score += (h0ok ? 1 : 0) + (h1ok ? 1 : 0);
  } else if (h0ok && h1ok) score += spec.marks.hyp;
  if (!h0ok || !h1ok) {
    if (R.h0p && R.h0p !== spec.param) msgs.push(`Hypotheses should be about the population parameter ${pName}.`);
    else if (R.h1op && R.h1op !== spec.h1) msgs.push(spec.h1 === '!=' ? 'This is a two-tailed test: H₁ should use ≠.' : `This is a one-tailed test: H₁ should be ${pName} ${spec.h1 === '<' ? '<' : '>'} ${fmtNum(spec.h0)}.`);
    else msgs.push(`Check your hypotheses: H₀ : ${pName} = ${fmtNum(spec.h0)}.`);
  }
  if (spec.stat && spec.marks.stat) {
    const sv = R.stat ?? '';
    let c: Cmp;
    try {
      c = sv.trim() ? compareNumericExpr(spec.stat.spec, parseExpr(sv)) : { status: 'unanswered', messages: [] };
    } catch {
      c = { status: 'invalid', messages: [] };
    }
    if (c.status === 'correct') score += spec.marks.stat;
    else if (c.status === 'accuracy') score += Math.max(0, spec.marks.stat - 1);
    else msgs.push(`${spec.stat.label}: not correct.`);
    msgs.push(...c.messages);
  }
  const decisionOk = (R.decision === 'reject') === spec.reject && !!R.decision;
  if (decisionOk) score += spec.marks.decision;
  else if (R.decision) msgs.push(spec.reject ? 'The result is significant — you should reject H₀.' : 'The result is not significant — there is insufficient evidence to reject H₀.');
  const conclOk = Number(R.conclusion) === spec.correctConclusion && R.conclusion !== undefined && R.conclusion !== '';
  if (conclOk && decisionOk) score += spec.marks.conclusion;
  else if (R.conclusion !== undefined && R.conclusion !== '') msgs.push('Your conclusion in context doesn’t match the test result.');
  const max = spec.marks.hyp + spec.marks.stat + spec.marks.decision + spec.marks.conclusion;
  if (score === max) return ok({ correct: true });
  return { status: 'scored', score, messages: msgs };
}

// ---------- dispatcher ----------
export function compare(spec: AnswerSpec, r: Response | undefined): Cmp {
  if (spec.type === 'self') return { status: 'scored', score: 0, messages: [] };
  if (blank(r)) return { status: 'unanswered', messages: ['No answer entered.'] };
  switch (spec.type) {
    case 'numeric':
    case 'exact': {
      const st = parseOrInvalid(() => parseStatement(asString(r)));
      if (isCmp(st)) return st;
      const vs = valuesFrom(st, undefined);
      if (isCmp(vs)) return vs;
      if (vs.length !== 1) return { status: 'invalid', messages: ['Enter a single value.'] };
      return compareValue(spec, vs[0]);
    }
    case 'expr':
      return compareExprSpec(spec, r!);
    case 'integral':
      return compareIntegralSpec(spec, r!);
    case 'equation':
      return compareEquationSpec(spec, r!);
    case 'list':
      return compareList(spec, r!);
    case 'coord':
      return compareCoord(spec, r!);
    case 'vector':
      return compareVector(spec, r!);
    case 'interval':
      return compareInterval(spec, r!);
    case 'choice': {
      const picked = (Array.isArray(r) ? r : [asString(r)]).map(Number).sort();
      const want = [...spec.correct].sort();
      if (picked.length === want.length && picked.every((x, i) => x === want[i])) return ok({ correct: true });
      return wrong();
    }
    case 'hypothesis':
      return compareHypothesis(spec, r!);
  }
}

export { symTex, tidy };
