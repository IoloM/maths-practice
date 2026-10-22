import type { PartAttempt } from '../storage/types';

/** Effective part score used in stats: the better of auto and self marks. */
export function effectiveScore(p: PartAttempt): number {
  return Math.max(p.auto?.score ?? 0, p.self?.score ?? 0);
}
