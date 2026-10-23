/** Choosing the next question for a practice session. */
import { BANK, freshSeed, seedsFor, type BankEntry } from '../content/bank';
import type { Attempt } from '../storage/types';
import { effectiveScore } from './attempt';
import { CHAPTER_BY_REF } from '../content/chapters';

export interface SessionConfig {
  chapters?: string[];
  templates?: string[];
  specs?: string[];
  /** Pure / Statistics / Mechanics */
  streams?: string[];
  dmin: number;
  dmax: number;
}

export function candidates(cfg: SessionConfig): BankEntry[] {
  return BANK.templates.filter(
    (t) =>
      (!cfg.chapters?.length || cfg.chapters.includes(t.chapter)) &&
      (!cfg.templates?.length || cfg.templates.includes(t.id)) &&
      (!cfg.specs?.length || t.spec.some((s) => cfg.specs!.includes(s))) &&
      (!cfg.streams?.length || cfg.streams.includes(CHAPTER_BY_REF.get(t.chapter)?.stream ?? '')) &&
      t.difficulty >= cfg.dmin &&
      t.difficulty <= cfg.dmax,
  );
}

/** Weighted pick: unseen and weak templates first, avoid immediate repeats; unseen bank seed or a fresh validated seed. */
export async function pickNext(cfg: SessionConfig, history: Attempt[], recent: string[]): Promise<{ templateId: string; seed: number } | null> {
  const pool = candidates(cfg);
  if (!pool.length) return null;
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
