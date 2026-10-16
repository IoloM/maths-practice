/** Spaced repetition by template family (FSRS via ts-fsrs). */
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs';
import type { Attempt, CardRecord } from '../storage/types';
import { effectiveScore } from '../lib/attempt';

const scheduler = fsrs({ enable_fuzz: false, maximum_interval: 120 });

export function toCard(rec: CardRecord | undefined, now = new Date()): Card {
  if (!rec) return createEmptyCard(now);
  const c = rec.card as Record<string, unknown>;
  return { ...(c as unknown as Card), due: new Date(c.due as string), last_review: c.last_review ? new Date(c.last_review as string) : undefined };
}

export function fromCard(family: string, card: Card): CardRecord {
  return { family, card: JSON.parse(JSON.stringify(card)), updatedAt: Date.now() };
}

/** Rating from an attempt: Again < 50 % or gave up; Hard 50–80 % or hint tier ≥ 2; Good ≥ 80 %; Easy 100 %, no hints, on time. */
export function ratingFor(a: Attempt, estimatedMin: number): Grade {
  const score = a.parts.reduce((s, p) => s + effectiveScore(p), 0);
  const frac = a.marks ? score / a.marks : 0;
  const hints = Math.max(0, ...a.parts.map((p) => p.hints));
  if (a.gaveUp || frac < 0.5) return Rating.Again;
  if (frac < 0.8 || hints >= 2) return Rating.Hard;
  if (frac === 1 && hints === 0 && a.durationMs <= estimatedMin * 60_000) return Rating.Easy;
  return Rating.Good;
}

export function review(rec: CardRecord | undefined, family: string, grade: Grade, now = new Date()): CardRecord {
  const card = toCard(rec, now);
  const next = scheduler.next(card, now, grade).card;
  return fromCard(family, next);
}

export function isDue(rec: CardRecord, now = new Date()): boolean {
  return toCard(rec).due.getTime() <= now.getTime();
}
