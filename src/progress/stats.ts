/** Dashboard statistics: trends, spec-point mastery, time per mark, frequent errors. Pure functions. */
import type { Attempt } from '../storage/types';
import { groupBy, mastery, scoreOf } from './mastery';

const WEEK = 7 * 24 * 3600 * 1000;

/** Monday 00:00 (local) of the week containing t. */
export function weekStart(t: number): number {
  const d = new Date(t);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export interface WeekPoint {
  start: number;
  attempts: number;
  marks: number;
  scored: number;
  /** fraction of marks scored that week, or null when nothing was attempted */
  pct: number | null;
}

/** The last `weeks` weeks (oldest first), including empty weeks. */
export function weeklyTrend(attempts: Attempt[], weeks = 12, now = Date.now()): WeekPoint[] {
  const first = weekStart(now) - (weeks - 1) * WEEK;
  const pts: WeekPoint[] = Array.from({ length: weeks }, (_, i) => ({ start: first + i * WEEK, attempts: 0, marks: 0, scored: 0, pct: null }));
  for (const a of attempts) {
    // weeks are not all exactly 7 × 24 h around clock changes, so locate by week start
    const ws = weekStart(a.finishedAt);
    const p = pts.find((x) => Math.abs(x.start - ws) < 2 * 3600 * 1000);
    if (!p) continue;
    p.attempts++;
    p.marks += a.marks;
    p.scored += scoreOf(a);
  }
  for (const p of pts) p.pct = p.marks ? p.scored / p.marks : null;
  return pts;
}

/** Mastery per spec point, counting every spec point a question covers. */
export function specMastery(attempts: Attempt[]): Map<string, { mastery: number | null; attempts: number }> {
  const out = new Map<string, { mastery: number | null; attempts: number }>();
  for (const [s, as] of groupBy(attempts, (a) => a.spec)) out.set(s, { mastery: mastery(as), attempts: as.length });
  return out;
}

/** Minutes per mark by group, excluding attempts that took implausibly long (left open). */
export function minutesPerMark(attempts: Attempt[], key: (a: Attempt) => string): Map<string, { mpm: number; marks: number }> {
  const out = new Map<string, { mpm: number; marks: number }>();
  for (const [k, as] of groupBy(attempts, key)) {
    const ok = as.filter((a) => a.marks > 0 && a.durationMs > 0 && a.durationMs < a.marks * 10 * 60_000);
    const marks = ok.reduce((s, a) => s + a.marks, 0);
    if (!marks) continue;
    out.set(k, { mpm: ok.reduce((s, a) => s + a.durationMs, 0) / 60_000 / marks, marks });
  }
  return out;
}

export interface ErrorCount {
  templateId: string;
  errorId: string;
  count: number;
  last: number;
}

/** Most frequent recognised common errors (auto-marking), most frequent first. */
export function frequentErrors(attempts: Attempt[], limit = 8): ErrorCount[] {
  const m = new Map<string, ErrorCount>();
  for (const a of attempts)
    for (const p of a.parts) {
      const id = p.auto?.errorId;
      if (!id) continue;
      const k = `${a.templateId}|${id}`;
      const e = m.get(k) ?? { templateId: a.templateId, errorId: id, count: 0, last: 0 };
      e.count++;
      e.last = Math.max(e.last, a.finishedAt);
      m.set(k, e);
    }
  return [...m.values()].sort((a, b) => b.count - a.count || b.last - a.last).slice(0, limit);
}

/** “sign-error” → “Sign error”. */
export const humanise = (id: string) => {
  const s = id.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
