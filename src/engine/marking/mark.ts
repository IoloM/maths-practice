/** Mark a question part: compare, then common errors, follow-through, partial credit. */
import { evaluate, symTex, tidy, toLatex } from '../core/expr';
import { fmtDP, fmtNum, fmtSF, texNum } from '../core/format';
import type { Part } from '../templates/types';
import { compare, type Cmp } from './compare';
import { setToLatex } from './intervals';
import type { AnswerSpec, FtValue, MarkResult, NumericSpec, Response, SchemeLine, ExactSpec } from './types';

/** Marks carried by a scheme code: M1 → 1, B2 → 2, dM1 → 1, A1ft → 1. */
export function codeMarks(code: string): number {
  const m = /(\d+)/.exec(code);
  return m ? Number(m[1]) : 1;
}

export function schemeTotal(lines: SchemeLine[]): number {
  return lines.reduce((s, l) => s + codeMarks(l.code), 0);
}

/** Lines that a student may self-award when the final answer is wrong. */
export function selfAwardable(lines: SchemeLine[]): boolean[] {
  const lastA = lastFinalIndex(lines);
  return lines.map((l, i) => !(l.final ?? i === lastA));
}

function lastFinalIndex(lines: SchemeLine[]): number {
  for (let i = lines.length - 1; i >= 0; i--) if (/^A/.test(lines[i].code) || lines[i].final) return i;
  return -1;
}

export function markPart(part: Part, response: Response | undefined, prev: Record<string, FtValue | undefined> = {}): MarkResult {
  const max = part.marks;
  if (part.answer.type === 'self') {
    return { verdict: 'self', score: 0, max, messages: ['Compare your working with the model answer and tick the marks you earned.'], selfMarkable: true };
  }
  const c = compare(part.answer, response);
  const base = (verdict: MarkResult['verdict'], score: number, cmp: Cmp, extra: Partial<MarkResult> = {}): MarkResult => ({
    verdict,
    score,
    max,
    messages: cmp.messages,
    value: cmp.value,
    errorId: cmp.errorId,
    selfMarkable: score < max && verdict !== 'unanswered' && verdict !== 'invalid',
    ...extra,
  });
  switch (c.status) {
    case 'correct':
      return base('correct', max, { ...c, messages: c.messages.length ? c.messages : ['Correct.'] });
    case 'accuracy': {
      const s = Math.max(0, max - (c.lose ?? 1));
      return base(s > 0 ? 'partial' : 'incorrect', s, c);
    }
    case 'scored': {
      const s = Math.min(max, c.score ?? 0);
      const extra = commonErrorFor(part, response);
      return base(s === max ? 'correct' : s > 0 ? 'partial' : 'incorrect', s, c, {
        selfMarkable: false,
        errorId: extra?.id,
        messages: extra ? [extra.feedback, ...c.messages] : c.messages,
      });
    }
    case 'invalid':
      return base('invalid', 0, c);
    case 'unanswered':
      return base('unanswered', 0, c);
    case 'wrong':
      break;
  }
  // follow-through from earlier parts
  if (part.ft) {
    const anyWrong = Object.values(prev).some((v) => v && !v.correct);
    if (anyWrong) {
      let spec: AnswerSpec | null = null;
      try {
        spec = part.ft(prev);
      } catch {
        spec = null;
      }
      if (spec) {
        const f = compare(spec, response);
        if (f.status === 'correct' || f.status === 'accuracy') {
          const s = f.status === 'correct' ? max : Math.max(0, max - (f.lose ?? 1));
          return base(s === max ? 'correct' : 'partial', s, f, {
            ft: true,
            messages: ['Correct follow-through from your earlier answer (marks awarded as ft).', ...f.messages],
            value: { ...(f.value ?? {}), correct: false },
          });
        }
      }
    }
  }
  // common errors
  const e = commonErrorFor(part, response);
  if (e) {
    const s = Math.min(max, e.marks ?? 0);
    return base(s > 0 ? 'partial' : 'incorrect', s, c, { errorId: e.id, messages: [e.feedback] });
  }
  return base('incorrect', 0, { ...c, messages: c.messages.length ? c.messages : ['Not correct.'] });
}

/** First common error the response matches. For hypothesis tests a numeric error is checked against the statistic box. */
function commonErrorFor(part: Part, response: Response | undefined) {
  for (const err of part.errors) {
    let target = response;
    if (part.answer.type === 'hypothesis' && err.spec.type === 'numeric') {
      target = response && typeof response === 'object' && !Array.isArray(response) ? (response as Record<string, string>).stat : undefined;
    }
    let m: Cmp;
    try {
      m = compare(err.spec, target);
    } catch {
      continue;
    }
    if (m.status === 'correct' || m.status === 'accuracy') return err;
  }
  return undefined;
}

// ---------- presentation of answers ----------
function valueTex(s: NumericSpec | ExactSpec): string {
  if (s.type === 'exact') return toLatex(tidy(s.value));
  return texNum(numericText(s));
}

export function numericText(s: NumericSpec): string {
  const a = s.acc;
  if (a.dp !== undefined) return fmtDP(s.value, a.dp);
  if (a.sf) return fmtSF(s.value, a.sf);
  if (a.sfRange) return fmtSF(s.value, a.sfRange[1]);
  return fmtNum(s.value, 6);
}

/** LaTeX of the correct answer as it should appear at the end of the worked solution. */
export function answerTex(spec: AnswerSpec): string {
  const lab = spec.label ? `${spec.label} ` : '';
  const unit = spec.unit ? `\\text{ }${spec.unit}` : '';
  switch (spec.type) {
    case 'numeric':
    case 'exact':
      return `${lab}${valueTex(spec)}${unit}`;
    case 'expr':
      return `${lab}${toLatex(tidy(spec.value))}`;
    case 'integral':
      return `${lab}${toLatex(tidy(spec.value))} + c`;
    case 'equation':
      return `${toLatex(tidy(spec.lhs))} = ${toLatex(tidy(spec.rhs))}`;
    case 'list': {
      const v = spec.v ? `${spec.v} = ` : '';
      const deg = spec.angle === 'deg' ? '^\\circ' : '';
      return spec.items.map((it) => `${v}${valueTex(it)}${deg}`).join(',\\; ');
    }
    case 'coord':
      return `\\left(${valueTex(spec.x)}, ${valueTex(spec.y)}\\right)`;
    case 'vector': {
      const names = ['\\mathbf{i}', '\\mathbf{j}', '\\mathbf{k}'];
      let s = '';
      spec.comps.forEach((c, i) => {
        const v = c.type === 'exact' ? evaluate(c.value) : c.value;
        if (v === 0) return;
        const t = valueTex(c);
        const coef = t === '1' ? '' : t === '-1' ? '-' : t;
        if (s === '') s = `${coef}${names[i]}`;
        else s += coef.startsWith('-') ? ` - ${coef.slice(1)}${names[i]}` : ` + ${coef}${names[i]}`;
      });
      return `${lab}${s || '\\mathbf{0}'}${unit}`;
    }
    case 'interval':
      return setToLatex(spec.set, spec.v, { setNotation: spec.setNotation, vTex: spec.display });
    case 'choice':
      return spec.correct.map((i) => spec.options[i]).join('; ');
    case 'hypothesis': {
      const p = spec.param === 'mu' ? '\\mu' : spec.param === 'rho' ? '\\rho' : 'p';
      const op = spec.h1 === '!=' ? '\\neq' : spec.h1;
      return `\\mathrm{H_0} : ${p} = ${texNum(spec.h0)},\\; \\mathrm{H_1} : ${p} ${op} ${texNum(spec.h0)}`;
    }
    case 'self':
      return '';
  }
}

/** A response that a perfect student would type (used by the self-check). */
export function canonicalResponse(spec: AnswerSpec): Response {
  const value = (s: NumericSpec | ExactSpec) => (s.type === 'exact' ? toLatex(tidy(s.value)) : numericText(s));
  switch (spec.type) {
    case 'numeric':
    case 'exact':
      return value(spec);
    case 'expr':
      return toLatex(tidy(spec.value));
    case 'integral':
      return `${toLatex(tidy(spec.value))}+c`;
    case 'equation':
      return `${toLatex(tidy(spec.lhs))}=${toLatex(tidy(spec.rhs))}`;
    case 'list':
      return spec.items.map((it) => value(it) + (spec.angle === 'deg' ? '^\\circ' : ''));
    case 'coord':
      return [value(spec.x), value(spec.y)];
    case 'vector':
      return spec.comps.map(value);
    case 'interval':
      return setToLatex(spec.set, spec.v, { setNotation: spec.setNotation });
    case 'choice':
      return spec.multi ? spec.correct.map(String) : String(spec.correct[0]);
    case 'hypothesis':
      return {
        h0p: spec.param,
        h0v: fmtNum(spec.h0),
        h1p: spec.param,
        h1op: spec.h1,
        h1v: fmtNum(spec.h0),
        stat: spec.stat ? numericText(spec.stat.spec) : '',
        decision: spec.reject ? 'reject' : 'accept',
        conclusion: String(spec.correctConclusion),
      };
    case 'self':
      return '';
  }
}

export { symTex };
