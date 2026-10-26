/**
 * How confident you feel about each topic against how you're actually scoring, to catch the topics
 * you think you know but don't (and the ones you're better at than you think).
 */
import type { Attempt } from '../storage/types';
import { groupBy, mastery } from '../progress/mastery';

export type Level = 1 | 2 | 3;
export const LEVELS: { v: Level; label: string }[] = [
  { v: 1, label: 'Not yet' },
  { v: 2, label: 'Getting there' },
  { v: 3, label: 'Confident' },
];

/** Your marks as a level: 75%+ is 3, 50%+ is 2, under that 1. Null until you've done 2 questions. */
export function actualLevel(attempts: Attempt[]): { level: Level | null; pct: number | null; questions: number } {
  const m = attempts.length >= 2 ? mastery(attempts) : null;
  return { level: m === null ? null : m >= 0.75 ? 3 : m >= 0.5 ? 2 : 1, pct: m === null ? null : Math.round(100 * m), questions: attempts.length };
}

export type Verdict = 'over' | 'under' | 'right' | 'untested' | 'unrated';
export const VERDICTS: Record<Verdict, string> = {
  over: 'More confident than your marks',
  under: 'Better than you think',
  right: 'About right',
  untested: 'Try some questions to check',
  unrated: 'Not rated yet',
};

export function verdict(confidence: Level | undefined, actual: Level | null): Verdict {
  if (!confidence) return 'unrated';
  if (actual === null) return 'untested';
  return confidence > actual ? 'over' : confidence < actual ? 'under' : 'right';
}

export const byChapter = (attempts: Attempt[]) => groupBy(attempts, (a) => a.chapter);
