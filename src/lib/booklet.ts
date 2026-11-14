/**
 * Your work on Mr Astbury's booklet: for each question, your answers, any extra working (handwritten
 * and/or typed), when you marked it done, and how it went against the worked solution. Kept in the
 * settings store, so backups include it; it syncs to your other devices except the handwriting,
 * which (as everywhere in the app) stays on the device it was written on. The writing on the
 * booklet's own pages is kept page by page in lib/booklet-ink.ts.
 */
import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import type { Attempt, Working } from '../storage/types';
import { notifyProgress, onProgressChange, recordAttempt, updateAttempt } from '../progress/record';
import type { BookletQuestion, BookletSection } from '../content/astbury';
import { BANK } from '../content/bank-meta';

export type Check = 'right' | 'part' | 'wrong';

export interface BookletWork {
  /** the answer box (one box per question, or the answer to a question without parts) */
  answer: string;
  /** answers by part label, for questions with parts */
  answers?: Record<string, string>;
  /** your marks by part label, against the worked solution */
  marks?: Record<string, number>;
  /** when the marks were recorded as an attempt (its finish time), so a change updates it */
  attemptAt?: number;
  working?: Working;
  /** there's handwriting on the question's pages in the booklet (the ink itself is in lib/booklet-ink.ts) */
  inked?: boolean;
  /** when you marked the question done (ms) */
  done?: number;
  /** after checking against the worked solution */
  check?: Check;
  /** your mark out of the question's total, when you gave one */
  score?: number;
  updatedAt: number;
}
export type BookletWorks = Record<string, BookletWork>;

export const BOOKLET_KEY = 'astburyWork';

export async function loadBookletWork(): Promise<BookletWorks> {
  return (await getStore()).getSetting<BookletWorks>(BOOKLET_KEY, {});
}

/** Change one question's record (created if new). */
export async function updateBookletWork(id: string, f: (w: BookletWork) => BookletWork, quiet = false): Promise<void> {
  const store = await getStore();
  const all = { ...(await store.getSetting<BookletWorks>(BOOKLET_KEY, {})) };
  all[id] = { ...f(all[id] ?? { answer: '', updatedAt: 0 }), updatedAt: Date.now() };
  await store.putSetting(BOOKLET_KEY, all);
  if (!quiet) notifyProgress();
}

/** All your booklet work, kept up to date. */
export function useBookletWork(): BookletWorks | null {
  const [w, setW] = useState<BookletWorks | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void loadBookletWork().then((x) => alive && setW(x));
    load();
    const off = onProgressChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return w;
}

export const hasWorking = (w: BookletWork | undefined) => !!w && (!!w.inked || !!w.working?.strokes.length || !!w.working?.text.trim());

export interface SectionProgress {
  done: number;
  total: number;
  complete: boolean;
  /** when the last question was marked done */
  finishedAt?: number;
  /** marks given against the worked solutions, where a mark was given */
  got: number;
  of: number;
}

export function sectionProgress(works: BookletWorks, s: BookletSection): SectionProgress {
  let done = 0,
    got = 0,
    of = 0,
    finishedAt = 0;
  for (const q of s.questions) {
    const w = works[q.id];
    if (w?.done) {
      done++;
      finishedAt = Math.max(finishedAt, w.done);
    }
    if (q.marks && fullyMarked(q, w)) {
      got += totalMarks(q, w);
      of += q.marks;
    } else if (w?.score !== undefined && q.marks) {
      got += w.score;
      of += q.marks;
    }
  }
  return { done, total: s.questions.length, complete: done === s.questions.length, finishedAt: finishedAt || undefined, got, of };
}

/** What goes online: everything but the handwriting. */
export function outgoingBooklet(w: BookletWorks): BookletWorks {
  const out: BookletWorks = {};
  for (const [id, x] of Object.entries(w)) out[id] = x.working ? { ...x, working: { ...x.working, strokes: [], annotate: [] } } : x;
  return out;
}

/** Newest record per question wins, but handwriting on this device is never replaced by a copy without it. */
export function mergeBooklet(local: BookletWorks, remote: BookletWorks): BookletWorks {
  const out: BookletWorks = { ...local };
  for (const [id, r] of Object.entries(remote)) {
    const l = local[id];
    if (l && r.updatedAt <= l.updatedAt) continue;
    const strokes = r.working?.strokes.length ? r.working.strokes : (l?.working?.strokes ?? []);
    out[id] = r.working || l?.working ? { ...r, working: { ...(r.working ?? l!.working!), strokes } } : r;
  }
  return out;
}

// ------------------------------------------------------------------ marking, and counting it like any other question

/** Attempts from the booklet have ids like 'astbury:1.12-modelling:2' (no question bank entry). */
export const BOOKLET_PREFIX = 'astbury:';
export const isBookletAttempt = (templateId: string) => templateId.startsWith(BOOKLET_PREFIX);
export const bookletQuestionId = (templateId: string) => templateId.slice(BOOKLET_PREFIX.length);

/** Every part has a mark. */
export const fullyMarked = (q: BookletQuestion, w: BookletWork | undefined) => !!q.marks && q.parts.length > 0 && q.parts.every((p) => w?.marks?.[p.label] !== undefined);

export const totalMarks = (q: BookletQuestion, w: BookletWork | undefined) => q.parts.reduce((t, p) => t + (w?.marks?.[p.label] ?? 0), 0);

/** The attempt this marking makes: it counts in progress, topics, review, goals and streaks like any question. */
export function bookletAttempt(s: BookletSection, q: BookletQuestion, w: BookletWork, at: { startedAt: number; finishedAt: number; durationMs: number }): Attempt {
  const entry = BANK.templates.find((e) => e.family === s.family);
  return {
    templateId: `${BOOKLET_PREFIX}${q.id}`,
    seed: 0,
    family: s.family,
    spec: entry?.spec ?? [],
    chapter: s.chapter,
    difficulty: 3,
    mode: 'booklet',
    startedAt: at.startedAt,
    finishedAt: at.finishedAt,
    durationMs: at.durationMs,
    marks: q.marks ?? 0,
    // marked by you, like the app's self-marked questions: nothing auto-marked, your marks as self-marks
    parts: q.parts.map((p) => ({ label: p.label, response: w.answers?.[p.label] ?? (p.label === '' ? w.answer : null), auto: { score: 0, max: p.marks, verdict: 'self' }, self: { score: w.marks?.[p.label] ?? 0, ticks: [] }, hints: 0 })),
    gaveUp: false,
    working: w.working,
  };
}

/**
 * Record the marks as an attempt (or update the one recorded before, so changing a mark doesn't
 * count the question twice). Returns when it was recorded, to keep on the work record.
 */
export async function recordBookletMarks(s: BookletSection, q: BookletQuestion, w: BookletWork, durationMs: number): Promise<number> {
  const store = await getStore();
  const templateId = `${BOOKLET_PREFIX}${q.id}`;
  const before = w.attemptAt ? (await store.attemptsFor(templateId)).find((a) => a.finishedAt === w.attemptAt) : undefined;
  if (before) {
    await updateAttempt({ ...bookletAttempt(s, q, w, { startedAt: before.startedAt, finishedAt: before.finishedAt, durationMs: before.durationMs }), id: before.id });
    return before.finishedAt;
  }
  const now = Date.now();
  await recordAttempt(bookletAttempt(s, q, w, { startedAt: now - durationMs, finishedAt: now, durationMs }), Math.max(1, Math.round((q.marks ?? 1) * 1.2)));
  return now;
}
