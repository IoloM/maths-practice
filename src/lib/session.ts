/** Choosing the next question for a practice session. */
import { BANK, freshSeed, seedsFor, type BankEntry } from '../content/bank';
import type { Attempt } from '../storage/types';
import { effectiveScore } from './attempt';
import { CHAPTER_BY_REF } from '../content/chapters';
import { attemptCredit } from '../progress/mastery';

export interface SessionConfig {
  chapters?: string[];
  templates?: string[];
  specs?: string[];
  /** Pure / Statistics / Mechanics */
  streams?: string[];
  /** only these question families (e.g. topics that have come up on past papers) */
  families?: string[];
  /** only question types worth at least this many marks (long exam-style questions) */
  minMarks?: number;
  dmin: number;
  dmax: number;
  /** aim questions at the level you're working at (adaptiveLevel) */
  adaptive?: boolean;
}

export function candidates(cfg: SessionConfig): BankEntry[] {
  return BANK.templates.filter(
    (t) =>
      (!cfg.chapters?.length || cfg.chapters.includes(t.chapter)) &&
      (!cfg.templates?.length || cfg.templates.includes(t.id)) &&
      (!cfg.specs?.length || t.spec.some((s) => cfg.specs!.includes(s))) &&
      (!cfg.streams?.length || cfg.streams.includes(CHAPTER_BY_REF.get(t.chapter)?.stream ?? '')) &&
      (!cfg.families?.length || cfg.families.includes(t.family)) &&
      t.marks >= (cfg.minMarks ?? 0) &&
      t.difficulty >= cfg.dmin &&
      t.difficulty <= cfg.dmax,
  );
}

const LEVEL_RECENT = 6;

/**
 * The difficulty (1–5) you're working at for this selection: each of your last few answers here
 * says "about this hard" — the question's difficulty, up to one more for full marks without help,
 * down to two less for nothing — weighted towards the latest. Starts at 2 with no answers.
 */
export function adaptiveLevel(pool: BankEntry[], history: Attempt[]): number {
  const lo = Math.min(...pool.map((t) => t.difficulty));
  const hi = Math.max(...pool.map((t) => t.difficulty));
  const ids = new Set(pool.map((t) => t.id));
  const recent = history
    .filter((a) => ids.has(a.templateId))
    .sort((a, b) => b.finishedAt - a.finishedAt)
    .slice(0, LEVEL_RECENT);
  let num = 0,
    den = 0;
  recent.forEach((a, i) => {
    const w = 0.8 ** i;
    num += w * (a.difficulty + (attemptCredit(a) - 0.65) * 3);
    den += w;
  });
  const level = den ? num / den : 2;
  return Math.max(lo, Math.min(hi, Math.max(1, Math.min(5, level))));
}

/** Weighted pick: unseen and weak templates first, near your level when adapting, avoid immediate repeats; unseen bank seed or a fresh validated seed. */
export async function pickNext(cfg: SessionConfig, history: Attempt[], recent: string[]): Promise<{ templateId: string; seed: number } | null> {
  const pool = candidates(cfg);
  if (!pool.length) return null;
  const level = cfg.adaptive ? adaptiveLevel(pool, history) : null;
  const byT = new Map<string, Attempt[]>();
  for (const a of history) {
    const l = byT.get(a.templateId) ?? [];
    l.push(a);
    byT.set(a.templateId, l);
  }
  const weights = pool.map((t) => {
    const as = byT.get(t.id) ?? [];
    const last = as.slice(-3);
    const frac = last.length ? last.reduce((s, a) => s + a.parts.reduce((x, p) => x + effectiveScore(p), 0) / Math.max(1, a.marks), 0) / last.length : 0.4;
    let w = (1 + (1 - frac) * 2) / (1 + as.length * 0.25);
    if (level !== null) w *= Math.exp(-((t.difficulty - level) ** 2) / 1.5);
    const ri = recent.indexOf(t.id);
    if (ri >= 0) w *= ri === recent.length - 1 ? 0.02 : 0.25;
    return Math.max(w, 0.001);
  });
  const total = weights.reduce((s, w) => s + w, 0);
  let x = Math.random() * total;
  let chosen = pool[pool.length - 1];
  for (let i = 0; i < pool.length; i++) {
    x -= weights[i];
    if (x <= 0) {
      chosen = pool[i];
      break;
    }
  }
  const done = new Set((byT.get(chosen.id) ?? []).map((a) => a.seed));
  const unseen = seedsFor(chosen.id).filter((s) => !done.has(s));
  const seed = unseen.length ? unseen[Math.floor(Math.random() * unseen.length)] : await freshSeed(chosen.id, done);
  return { templateId: chosen.id, seed };
}
