/** Daily goal, streak and this week's numbers, from the attempts (local calendar days). */
import type { Attempt } from '../storage/types';
import { todayKey } from './dates';
import { scoreOf } from '../progress/mastery';

const dayKey = (t: number) => todayKey(new Date(t));
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Questions finished today. */
export const doneToday = (attempts: Attempt[], now = new Date()) => attempts.filter((a) => dayKey(a.finishedAt) === todayKey(now)).length;

/**
 * Days in a row with at least one question, up to today — or up to yesterday while today is still
 * to play for, so the streak doesn't drop to 0 first thing in the morning.
 */
export function streak(attempts: Attempt[], now = new Date()): number {
  const days = new Set(attempts.map((a) => dayKey(a.finishedAt)));
  let d = days.has(todayKey(now)) ? now : addDays(now, -1);
  let n = 0;
  while (days.has(todayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Monday of this week (local). */
export const weekStart = (now = new Date()) => addDays(now, -((now.getDay() + 6) % 7));

export function thisWeek(attempts: Attempt[], now = new Date()) {
  const start = weekStart(now);
  const from = start.getTime();
  const mine = attempts.filter((a) => a.finishedAt >= from);
  return { start: todayKey(start), questions: mine.length, marks: mine.reduce((t, a) => t + a.marks, 0), scored: mine.reduce((t, a) => t + scoreOf(a), 0) };
}

/** The last `n` days, oldest first, with how many questions each had (for the streak strip). */
export function lastDays(attempts: Attempt[], n = 14, now = new Date()): { day: string; count: number }[] {
  const count = new Map<string, number>();
  for (const a of attempts) count.set(dayKey(a.finishedAt), (count.get(dayKey(a.finishedAt)) ?? 0) + 1);
  return Array.from({ length: n }, (_, i) => {
    const day = todayKey(addDays(now, i - n + 1));
    return { day, count: count.get(day) ?? 0 };
  });
}
