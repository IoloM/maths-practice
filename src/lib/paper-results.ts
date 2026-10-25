/**
 * Your marks on real Pearson past papers, entered question by question from the official mark
 * scheme. They give a score and grade for each paper, show which topics lose you marks in real
 * exams, and count towards the predicted grade. Kept in the settings store, so backups include them.
 */
import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import { notifyProgress, onProgressChange } from '../progress/record';
import { PAST_PAPER_BY_ID, PAST_QUESTIONS, type PastQuestion } from '../content/past-papers';
import { BOUNDARIES, LATEST, gradeFor, type Boundaries, type Grade, type MockResult } from './grades';
import { todayKey } from './dates';

/** Why marks were dropped on a question (several can apply). */
export const LOSS_REASONS = [
  { id: 'careless', label: 'Careless slip' },
  { id: 'method', label: 'Didn’t know the method' },
  { id: 'misread', label: 'Misread the question' },
  { id: 'accuracy', label: 'Accuracy or form' },
  { id: 'time', label: 'Ran out of time' },
  { id: 'skipped', label: 'Didn’t attempt' },
] as const;
export type LossReason = (typeof LOSS_REASONS)[number]['id'];

export interface PaperResult {
  /** question number → marks scored */
  marks: Record<number, number>;
  updatedAt: number;
  /** when the paper was done (YYYY-MM-DD) */
  done?: string;
  /** minutes taken */
  minutes?: number;
  /** question number → why marks were lost */
  reasons?: Record<number, LossReason[]>;
  /** question number → a note to self */
  notes?: Record<number, string>;
  /** question number → seconds spent, when the paper was sat in the app's exam mode */
  times?: Record<number, number>;
}
export type PaperResults = Record<string, PaperResult>;

const KEY = 'pastPaperResults';

const QUESTIONS = new Map<string, PastQuestion[]>();
for (const q of PAST_QUESTIONS) QUESTIONS.set(q.paper, [...(QUESTIONS.get(q.paper) ?? []), q]);
export const questionsFor = (paperId: string) => QUESTIONS.get(paperId) ?? [];

export async function loadPaperResults(): Promise<PaperResults> {
  return (await getStore()).getSetting<PaperResults>(KEY, {});
}

/** Set (or, with null, clear) the marks for one question. */
export async function savePaperMark(paperId: string, q: number, marks: number | null): Promise<PaperResults> {
  const store = await getStore();
  const all = { ...(await store.getSetting<PaperResults>(KEY, {})) };
  const max = questionsFor(paperId).find((x) => x.q === q)?.marks ?? 0;
  const next = { ...(all[paperId]?.marks ?? {}) };
  if (marks === null || !Number.isFinite(marks)) delete next[q];
  else next[q] = Math.max(0, Math.min(max, Math.round(marks)));
  const old = all[paperId];
  // the date it was done starts as today; it can be changed
  if (Object.keys(next).length) all[paperId] = { ...old, marks: next, updatedAt: Date.now(), done: old?.done ?? todayKey() };
  else delete all[paperId];
  await store.putSetting(KEY, all);
  notifyProgress();
  return all;
}

/** Change the rest of a paper's record: when it was done, time taken, why marks went, notes. */
export async function updatePaper(paperId: string, f: (r: PaperResult) => PaperResult): Promise<void> {
  const store = await getStore();
  const all = { ...(await store.getSetting<PaperResults>(KEY, {})) };
  all[paperId] = { ...f(all[paperId] ?? { marks: {}, updatedAt: 0 }), updatedAt: Date.now() };
  await store.putSetting(KEY, all);
  notifyProgress();
}

export const setPaperDone = (paperId: string, done: string | undefined, minutes: number | undefined) =>
  updatePaper(paperId, (r) => ({ ...r, done: done || undefined, minutes: minutes && minutes > 0 ? Math.round(minutes) : undefined }));

export const setLossReasons = (paperId: string, q: number, reasons: LossReason[]) =>
  updatePaper(paperId, (r) => {
    const all = { ...(r.reasons ?? {}) };
    if (reasons.length) all[q] = reasons;
    else delete all[q];
    return { ...r, reasons: all };
  });

export const setQuestionNote = (paperId: string, q: number, note: string) =>
  updatePaper(paperId, (r) => {
    const all = { ...(r.notes ?? {}) };
    if (note.trim()) all[q] = note.slice(0, 500);
    else delete all[q];
    return { ...r, notes: all };
  });

/** Where the dropped marks went, across papers: each question's lost marks shared between its reasons. */
export function lossesByReason(results: PaperResults): { reason: LossReason; label: string; lost: number }[] {
  const lost = new Map<LossReason, number>();
  for (const [paperId, r] of Object.entries(results))
    for (const q of questionsFor(paperId)) {
      const m = r.marks[q.q];
      const why = r.reasons?.[q.q] ?? [];
      if (m === undefined || m >= q.marks || !why.length) continue;
      for (const w of why) lost.set(w, (lost.get(w) ?? 0) + (q.marks - m) / why.length);
    }
  return LOSS_REASONS.filter((x) => lost.has(x.id))
    .map((x) => ({ reason: x.id, label: x.label, lost: lost.get(x.id)! }))
    .sort((a, b) => b.lost - a.lost);
}

export async function clearPaper(paperId: string): Promise<void> {
  const store = await getStore();
  const all = { ...(await store.getSetting<PaperResults>(KEY, {})) };
  delete all[paperId];
  await store.putSetting(KEY, all);
  notifyProgress();
}

/** The boundaries for the paper's own year when known, otherwise the latest. */
export const boundariesFor = (paperId: string): Boundaries => BOUNDARIES.find((b) => b.series === PAST_PAPER_BY_ID.get(paperId)?.series) ?? LATEST;

export interface PaperScore {
  got: number;
  /** marks on the questions marked so far */
  of: number;
  /** the whole paper */
  max: number;
  marked: number;
  questions: number;
  complete: boolean;
  /** a single paper on the overall A level boundaries — a rough guide */
  grade: Grade | null;
}

export function paperScore(paperId: string, r: PaperResult | undefined): PaperScore {
  const qs = questionsFor(paperId);
  let got = 0,
    of = 0,
    marked = 0;
  for (const q of qs) {
    const m = r?.marks[q.q];
    if (m === undefined) continue;
    got += m;
    of += q.marks;
    marked++;
  }
  const max = qs.reduce((t, q) => t + q.marks, 0);
  const complete = marked === qs.length && qs.length > 0;
  return { got, of, max, marked, questions: qs.length, complete, grade: complete ? gradeFor(got / max, boundariesFor(paperId)) : null };
}

/** Finished papers, newest first, in the form the grade prediction uses. */
export function finishedPapers(results: PaperResults): (MockResult & { id: string })[] {
  return Object.entries(results)
    .map(([id, r]) => ({ id, s: paperScore(id, r), at: r.updatedAt }))
    .filter((x) => x.s.complete)
    .map((x) => ({ id: x.id, got: x.s.got, of: x.s.max, finishedAt: x.at }))
    .sort((a, b) => b.finishedAt - a.finishedAt);
}

export interface FamilyLoss {
  family: string;
  /** marks dropped (a question's dropped marks are shared between the families it tests) */
  lost: number;
  of: number;
  questions: number;
}

/** Where real papers lose you marks, worst first. */
export function lossesByFamily(results: PaperResults): FamilyLoss[] {
  const by = new Map<string, FamilyLoss>();
  for (const [paperId, r] of Object.entries(results))
    for (const q of questionsFor(paperId)) {
      const m = r.marks[q.q];
      if (m === undefined || !q.families.length) continue;
      const share = 1 / q.families.length;
      for (const f of q.families) {
        const e = by.get(f) ?? { family: f, lost: 0, of: 0, questions: 0 };
        e.lost += (q.marks - m) * share;
        e.of += q.marks * share;
        e.questions++;
        by.set(f, e);
      }
    }
  return [...by.values()].filter((e) => e.lost > 0).sort((a, b) => b.lost - a.lost || b.lost / b.of - a.lost / a.of);
}

/** All your past-paper marks, kept up to date. */
export function usePaperResults(): PaperResults | null {
  const [results, setResults] = useState<PaperResults | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void loadPaperResults().then((r) => alive && setResults(r));
    load();
    const off = onProgressChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return results;
}
