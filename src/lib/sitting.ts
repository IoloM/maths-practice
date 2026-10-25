/**
 * Sitting a real past paper as an exam: the paper's own time (1.2 minutes a mark), a clock, and
 * how long each question took — you tap the question you're on as you go. Kept in the settings
 * store while it runs (so a reload carries on), then saved with your marks for that paper.
 */
import { getStore } from '../storage';
import { MINUTES_PER_MARK } from './sets';
import { questionsFor, updatePaper } from './paper-results';
import { todayKey } from './dates';

export interface Sitting {
  paperId: string;
  startedAt: number;
  /** question number being worked on */
  current: number;
  /** question number → ms spent so far */
  spent: Record<number, number>;
  /** when work on the current question (re)started */
  since: number;
  /** set while paused */
  pausedAt?: number;
}

const KEY = 'sitting';

export const paperMinutes = (paperId: string) => Math.round(questionsFor(paperId).reduce((t, q) => t + q.marks, 0) * MINUTES_PER_MARK);

/** Time spent on each question, including the one under way. */
export function spentNow(s: Sitting, now = Date.now()): Record<number, number> {
  const out = { ...s.spent };
  if (!s.pausedAt) out[s.current] = (out[s.current] ?? 0) + Math.max(0, now - s.since);
  return out;
}

export const elapsed = (s: Sitting, now = Date.now()) => Object.values(spentNow(s, now)).reduce((t, ms) => t + ms, 0);

/** Minutes ahead (+) or behind (−) the exam's pace of 1.2 minutes a mark, given the question you're on. */
export function pace(s: Sitting, now = Date.now()): number {
  const qs = questionsFor(s.paperId);
  const i = qs.findIndex((q) => q.q === s.current);
  // by the end of this question you should have used the time for it and every one before it
  const budget = qs.slice(0, i + 1).reduce((t, q) => t + q.marks * MINUTES_PER_MARK, 0);
  return budget - elapsed(s, now) / 60_000;
}

export function start(paperId: string, now = Date.now()): Sitting {
  const first = questionsFor(paperId)[0]?.q ?? 1;
  return { paperId, startedAt: now, current: first, spent: {}, since: now };
}

export function moveTo(s: Sitting, q: number, now = Date.now()): Sitting {
  if (q === s.current) return s;
  return { ...s, spent: spentNow(s, now), current: q, since: now };
}

export function pause(s: Sitting, now = Date.now()): Sitting {
  return s.pausedAt ? s : { ...s, spent: spentNow(s, now), pausedAt: now };
}

export function resume(s: Sitting, now = Date.now()): Sitting {
  return s.pausedAt ? { ...s, pausedAt: undefined, since: now } : s;
}

export async function loadSitting(): Promise<Sitting | null> {
  return (await getStore()).getSetting<Sitting | null>(KEY, null);
}
export async function saveSitting(s: Sitting | null): Promise<void> {
  await (await getStore()).putSetting(KEY, s);
}

/** Finish: the time taken and each question's time go with your marks for the paper. */
export async function finish(s: Sitting, now = Date.now()): Promise<void> {
  const spent = spentNow(s, now);
  const times = Object.fromEntries(Object.entries(spent).map(([q, ms]) => [q, Math.round(ms / 1000)]));
  await updatePaper(s.paperId, (r) => ({ ...r, done: todayKey(new Date(now)), minutes: Math.max(1, Math.round(elapsed(s, now) / 60_000)), times }));
  await saveSitting(null);
}

export const mmss = (ms: number) => {
  const neg = ms < 0;
  const s = Math.round(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const body = h ? `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`;
  return neg ? `−${body}` : body;
};
