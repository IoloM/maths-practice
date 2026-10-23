/**
 * Verified seeds for each generated question type (built by scripts/build-bank.ts). Kept out of
 * bank-meta so light pages don't download them; practice, sets and question pages import this.
 * Skipped seeds failed a check or repeat an earlier question.
 */
import data from './bank-seeds.json';
import { decodeSeeds } from './seed-runs';

const RUNS = data as Record<string, string>;
const cache = new Map<string, number[]>();

/** Verified seeds for a question type ([0] for fixed questions, which have one version). */
export function seedsFor(id: string): number[] {
  let s = cache.get(id);
  if (!s) {
    const code = RUNS[id];
    s = code === undefined ? [0] : decodeSeeds(code);
    cache.set(id, s);
  }
  return s;
}

export function isVerifiedSeed(id: string, seed: number): boolean {
  return seedsFor(id).includes(seed);
}
