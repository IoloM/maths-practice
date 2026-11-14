/**
 * Your work on Mr Astbury's booklet: for each question, your answer, your working (handwritten
 * and/or typed), when you marked it done, and how it went against the worked solution. Kept in the
 * settings store, so backups include it; it syncs to your other devices except the handwriting,
 * which (as everywhere in the app) stays on the device it was written on.
 */
import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import type { Working } from '../storage/types';
import { notifyProgress, onProgressChange } from '../progress/record';
import type { BookletSection } from '../content/astbury';

export type Check = 'right' | 'part' | 'wrong';

export interface BookletWork {
  answer: string;
  working?: Working;
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

export const hasWorking = (w: BookletWork | undefined) => !!w && (!!w.working?.strokes.length || !!w.working?.text.trim());

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
    if (w?.score !== undefined && q.marks) {
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
