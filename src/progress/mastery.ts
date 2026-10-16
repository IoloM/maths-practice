/** Mastery: difficulty- and hint-weighted credit over recent attempts. */
import type { Attempt } from '../storage/types';
import { effectiveScore } from '../lib/attempt';

export const HINT_FACTOR = [1, 0.85, 0.7, 0.5];
const RECENT = 10;
const DECAY = 0.85;

/** Credit in [0, 1] for one attempt: marks fraction, reduced for hints; auto-marked marks only count fully, self marks at 0.8. */
export function attemptCredit(a: Attempt): number {
  if (!a.marks) return 0;
  let s = 0;
  for (const p of a.parts) {
    const max = p.auto?.max ?? 0;
    if (!max) continue;
    const auto = p.auto?.score ?? 0;
    const self = p.self?.score ?? 0;
    const sc = Math.max(auto, auto + Math.max(0, self - auto) * 0.8);
    s += Math.min(max, sc) * HINT_FACTOR[Math.min(3, p.hints)];
  }
  return a.gaveUp ? Math.min(0.2, s / a.marks) : s / a.marks;
}

export function difficultyWeight(d: number): number {
  return 0.6 + 0.2 * d;
}

/** Weighted mastery of a set of attempts (most recent RECENT), or null if none. */
export function mastery(attempts: Attempt[]): number | null {
  if (!attempts.length) return null;
  const recent = [...attempts].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, RECENT);
  let num = 0,
    den = 0;
  recent.forEach((a, i) => {
    const w = DECAY ** i * difficultyWeight(a.difficulty);
    num += w * attemptCredit(a);
    den += w;
  });
  return den ? num / den : null;
}

export function groupBy<K>(attempts: Attempt[], key: (a: Attempt) => K | K[]): Map<K, Attempt[]> {
  const m = new Map<K, Attempt[]>();
  for (const a of attempts) {
    const ks = key(a);
    for (const k of Array.isArray(ks) ? ks : [ks]) {
      const l = m.get(k) ?? [];
      l.push(a);
      m.set(k, l);
    }
  }
  return m;
}

export function scoreOf(a: Attempt): number {
  return a.parts.reduce((s, p) => s + effectiveScore(p), 0);
}
