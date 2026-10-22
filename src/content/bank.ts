/** App-side access to the question bank: metadata (re-exported from bank-meta) and templates (lazy, per chapter). */
import { loaders } from './templates/loaders.gen';
import { generateInstance, validateInstance } from '../engine/templates/validate';
import type { Instance, Template } from '../engine/templates/types';
import { ENTRY_BY_ID } from './bank-meta';

export { BANK, ENTRY_BY_ID, entriesForChapter, type BankEntry } from './bank-meta';

const chapterCache = new Map<string, Promise<Map<string, Template>>>();

export function loadChapter(ch: string): Promise<Map<string, Template>> {
  let p = chapterCache.get(ch);
  if (!p) {
    const loader = loaders[ch];
    if (!loader) return Promise.reject(new Error(`No templates for chapter ${ch}`));
    p = loader().then((m) => new Map(m.default.map((t) => [t.id, t])));
    chapterCache.set(ch, p);
  }
  return p;
}

let fixedPromise: Promise<Map<string, Template>> | null = null;

export async function loadTemplate(id: string): Promise<Template> {
  const e = ENTRY_BY_ID.get(id);
  if (!e) throw new Error(`Unknown question type: ${id}`);
  if (e.fixed) {
    fixedPromise ??= import('./fixed/templates').then((m) => m.FIXED_TEMPLATES);
    const t = (await fixedPromise).get(id);
    if (!t) throw new Error(`Fixed question ${id} missing`);
    return t;
  }
  const t = (await loadChapter(e.chapter)).get(id);
  if (!t) throw new Error(`Template ${id} missing from its chapter bundle`);
  return t;
}

/** Instance for template + seed. Seeds outside the verified bank are validated before use. */
export async function getInstance(id: string, seed: number): Promise<Instance> {
  const t = await loadTemplate(id);
  const verified = ENTRY_BY_ID.get(id)?.seeds.includes(seed);
  const inst = generateInstance(t, seed);
  if (!verified) {
    const problems = validateInstance(t, inst);
    if (problems.length) throw new InvalidSeedError(id, seed, problems);
  }
  return inst;
}

export class InvalidSeedError extends Error {
  constructor(
    readonly id: string,
    readonly seed: number,
    readonly problems: string[],
  ) {
    super(`Question ${id} #${seed} failed its checks`);
  }
}

/** A fresh random seed that passes validation (falls back to a bank seed). */
export async function freshSeed(id: string, avoid: Set<number> = new Set()): Promise<number> {
  if (ENTRY_BY_ID.get(id)?.fixed) return 0;
  const t = await loadTemplate(id);
  for (let i = 0; i < 40; i++) {
    const seed = 1000 + Math.floor(Math.random() * 2_000_000_000);
    if (avoid.has(seed)) continue;
    try {
      const inst = generateInstance(t, seed);
      if (validateInstance(t, inst).length === 0) return seed;
    } catch {
      /* try another */
    }
  }
  const seeds = ENTRY_BY_ID.get(id)?.seeds ?? [1];
  return seeds[Math.floor(Math.random() * seeds.length)];
}

