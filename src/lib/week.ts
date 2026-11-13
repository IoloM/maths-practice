/** This week against last week, for the card on the home page. */
import type { Attempt } from '../storage/types';
import { scoreOf } from '../progress/mastery';

const DAY = 86_400_000;

export interface WeekStats {
  questions: number;
  got: number;
  of: number;
  minutes: number;
}

export interface WeekSummary {
  now: WeekStats;
  before: WeekStats;
  /** change in the share of marks since last week, in percentage points (null if either week is empty) */
  change: number | null;
  /** this week's best and weakest chapters (at least two questions each) */
  best?: { chapter: string; pct: number };
  weakest?: { chapter: string; pct: number };
}

const stats = (as: Attempt[]): WeekStats => ({
  questions: as.length,
  got: as.reduce((t, a) => t + scoreOf(a), 0),
  of: as.reduce((t, a) => t + a.marks, 0),
  minutes: Math.round(as.reduce((t, a) => t + a.durationMs, 0) / 60_000),
});

export const pctOf = (s: WeekStats) => (s.of ? Math.round((100 * s.got) / s.of) : 0);

/** The last 7 days (to now) and the 7 days before. */
export function weekSummary(attempts: Attempt[], now = Date.now()): WeekSummary {
  const thisWeek = attempts.filter((a) => a.finishedAt > now - 7 * DAY && a.finishedAt <= now);
  const lastWeek = attempts.filter((a) => a.finishedAt > now - 14 * DAY && a.finishedAt <= now - 7 * DAY);
  const n = stats(thisWeek),
    b = stats(lastWeek);
  const byCh = new Map<string, Attempt[]>();
  for (const a of thisWeek) byCh.set(a.chapter, [...(byCh.get(a.chapter) ?? []), a]);
  const chapters = [...byCh.entries()]
    .filter(([, as]) => as.length >= 2)
    .map(([chapter, as]) => ({ chapter, pct: pctOf(stats(as)) }))
    .sort((x, y) => y.pct - x.pct || x.chapter.localeCompare(y.chapter));
  const best = chapters[0];
  const weakest = chapters.length > 1 ? chapters[chapters.length - 1] : undefined;
  return {
    now: n,
    before: b,
    change: n.of && b.of ? pctOf(n) - pctOf(b) : null,
    best,
    weakest: weakest && weakest.pct < (best?.pct ?? 0) ? weakest : undefined,
  };
}
