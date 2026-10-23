/** Instance validation: run at build time for every bank seed and at runtime for fresh seeds. */
import katex from 'katex';
import { withRetries } from '../core/rng';
import { answerTex, canonicalResponse, markPart, schemeTotal } from '../marking/mark';
import type { FtValue } from '../marking/types';
import type { Instance, Template } from './types';

/** All $…$ and $$…$$ segments in a Markdown-lite string. */
export function mathSegments(src: string): string[] {
  const out: string[] = [];
  const s = src.replace(/\\\$/g, '');
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out.push(m[1] ?? m[2]);
  return out;
}

const katexCache = new Map<string, string | null>();
export function katexError(tex: string, display = false): string | null {
  const key = `${display ? 'D' : 'I'}${tex}`;
  const hit = katexCache.get(key);
  if (hit !== undefined) return hit;
  let res: string | null = null;
  try {
    katex.renderToString(tex, { throwOnError: true, displayMode: display, strict: 'ignore' });
  } catch (e) {
    res = (e as Error).message;
  }
  if (katexCache.size > 20000) katexCache.clear();
  katexCache.set(key, res);
  return res;
}

const norm = (s: string) => s.replace(/\s+/g, '').replace(/\\left|\\right/g, '');

export function generateInstance(t: Template, seed: number): Instance {
  const g = withRetries(`${t.id}:${seed}`, (r) => t.generate(r));
  return { templateId: t.id, seed, ...g };
}

export function validateInstance(t: Template, inst: Instance, opts: { katex?: boolean } = {}): string[] {
  const problems: string[] = [];
  const p = (m: string) => problems.push(m);
  const checkKatex = opts.katex !== false;
  const texts: string[] = [];
  if (inst.stem) texts.push(inst.stem);
  if (!inst.parts.length) p('no parts');
  const total = inst.parts.reduce((s, x) => s + x.marks, 0);
  if (total !== t.marks) p(`part marks ${total} ≠ template marks ${t.marks}`);
  const labels = new Set<string>();
  const prev: Record<string, FtValue | undefined> = {};
  for (const part of inst.parts) {
    const where = `part (${part.label || '-'})`;
    if (labels.has(part.label)) p(`${where}: duplicate label`);
    labels.add(part.label);
    if (schemeTotal(part.scheme) !== part.marks) p(`${where}: scheme total ${schemeTotal(part.scheme)} ≠ marks ${part.marks}`);
    if (part.answer.type === 'hypothesis') {
      const m = part.answer.marks;
      const t = m.hyp + m.stat + m.decision + m.conclusion;
      if (t !== part.marks) p(`${where}: hypothesis test marks add to ${t} ≠ marks ${part.marks}`);
    }
    if (part.hints.length !== 3 || part.hints.some((h) => !h.trim())) p(`${where}: needs three hints`);
    if (!part.solution.length) p(`${where}: no worked solution`);
    texts.push(part.prompt, ...part.hints, ...part.solution, ...part.scheme.map((l) => l.text), ...part.errors.map((e) => e.feedback));
    const a = part.answer;
    if (a.type !== 'self') {
      const at = answerTex(a);
      if (checkKatex && a.type !== 'choice') {
        const ke = katexError(at);
        if (ke) p(`${where}: answer LaTeX fails: ${ke} in ${at}`);
      }
      if (a.type === 'choice') texts.push(...a.options);
      if (a.type === 'hypothesis') texts.push(...a.conclusions);
      if (!['choice', 'hypothesis'].includes(a.type)) {
        const sol = norm(part.solution.join(' '));
        if (!sol.includes(norm(at))) p(`${where}: worked solution does not contain the final answer ${at}`);
      }
      const res = markPart(part, canonicalResponse(a), prev);
      if (res.score !== part.marks) p(`${where}: canonical answer scores ${res.score}/${part.marks} (${res.messages.join(' ')})`);
      for (const e of part.errors) {
        const er = markPart(part, canonicalResponse(e.spec), prev);
        if (er.verdict === 'correct') p(`${where}: common error "${e.id}" is marked correct`);
        if ((e.marks ?? 0) >= part.marks) p(`${where}: common error "${e.id}" awards full marks`);
      }
      prev[part.label] = res.value ? { ...res.value, correct: true } : { correct: true };
    } else {
      texts.push(a.model);
    }
  }
  // finite numbers everywhere
  const bad = findNonFinite(inst.parts.map((x) => x.answer));
  if (bad) p(`non-finite number in answer: ${bad}`);
  for (const s of texts) {
    if (/\bNaN\b|\bInfinity\b|undefined|\[object Object\]/.test(s)) p(`text contains NaN/Infinity/undefined: ${s.slice(0, 80)}`);
    if (s.includes('${')) p(`text contains an uninterpolated \${…}: ${s.slice(0, 80)}`);
    if (/\\\\(?:sin|cos|tan|sec|cosec|cot|ln|log|frac|sqrt|theta|mathbf)\b/.test(s)) p(`text contains a double backslash before a command: ${s.slice(0, 80)}`);
    if (checkKatex)
      for (const seg of mathSegments(s)) {
        const ke = katexError(seg);
        if (ke) p(`KaTeX: ${ke} in "${seg.slice(0, 80)}"`);
      }
    const dollars = (s.replace(/\\\$/g, '').match(/\$/g) ?? []).length;
    if (dollars % 2) p(`unbalanced $ in "${s.slice(0, 60)}"`);
  }
  if (inst.diagram && /NaN|Infinity/.test(inst.diagram.svg)) p('diagram contains NaN');
  if (inst.diagram && !inst.diagram.alt.trim()) p('diagram has no alt text');
  try {
    t.verify(inst);
  } catch (e) {
    p(`verify: ${(e as Error).message}`);
  }
  return problems;
}

function findNonFinite(x: unknown, path = ''): string | null {
  if (typeof x === 'number') return Number.isFinite(x) || path.endsWith('.lo') || path.endsWith('.hi') ? null : path;
  if (Array.isArray(x)) {
    for (let i = 0; i < x.length; i++) {
      const r = findNonFinite(x[i], `${path}[${i}]`);
      if (r) return r;
    }
    return null;
  }
  if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (typeof v === 'function') continue;
      const r = findNonFinite(v, `${path}.${k}`);
      if (r) return r;
    }
  }
  return null;
}

/** Generate + validate; returns null if the seed is invalid. */
export function validSeedInstance(t: Template, seed: number, opts?: { katex?: boolean }): Instance | null {
  let inst: Instance;
  try {
    inst = generateInstance(t, seed);
  } catch {
    return null;
  }
  return validateInstance(t, inst, opts).length ? null : inst;
}
