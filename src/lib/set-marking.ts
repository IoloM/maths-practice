/** Marking for exam-style sets (kept apart from sets.ts so building sets does not load the marking engine). */
import type { BankEntry } from '../content/bank-meta';
import type { Instance } from '../engine/templates/types';
import type { FtValue, MarkResult, Response } from '../engine/marking/types';
import { markPart } from '../engine/marking/mark';
import type { Attempt, SetRecord } from '../storage/types';
import { partAttemptFrom } from './attempt';

/** Mark every part of an instance from stored responses, following through in order. */
export function markInstance(inst: Instance, responses: Record<string, Response | undefined>): MarkResult[] {
  const prev: Record<string, FtValue | undefined> = {};
  return inst.parts.map((p) => {
    const rr = markPart(p, responses[p.label], prev);
    prev[p.label] = rr.value ? { ...rr.value, correct: rr.verdict === 'correct' && !rr.ft } : { correct: rr.verdict === 'correct' };
    return rr;
  });
}

/** Attempt records for a finished exam-style set (no hints; time shared out by marks). */
export function attemptsForSet(set: SetRecord, insts: Instance[], metas: BankEntry[], totalMs: number): Attempt[] {
  const marksAll = metas.reduce((s, m) => s + m.marks, 0) || 1;
  return insts.map((inst, i) => {
    const meta = metas[i];
    const responses: Record<string, Response | undefined> = {};
    for (const p of inst.parts) responses[p.label] = set.responses?.[`${i}:${p.label}`];
    const results = markInstance(inst, responses);
    return {
      templateId: inst.templateId,
      seed: inst.seed,
      family: meta.family,
      spec: meta.spec,
      chapter: meta.chapter,
      difficulty: meta.difficulty,
      mode: set.kind === 'mock' ? 'mock' : 'timed',
      setId: set.id,
      startedAt: set.startedAt ?? Date.now(),
      finishedAt: set.finishedAt ?? Date.now(),
      durationMs: Math.round((totalMs * meta.marks) / marksAll),
      marks: meta.marks,
      parts: inst.parts.map((p, k) => partAttemptFrom(p.label, results[k], responses[p.label] ?? null, undefined, p.scheme, 0)),
      gaveUp: false,
    } satisfies Attempt;
  });
}
