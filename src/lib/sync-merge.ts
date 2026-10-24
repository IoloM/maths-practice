/**
 * Merging another device's progress into this one (pure, so it can be tested without a browser).
 * There is no deletion log, so the rules only ever add or take the more advanced copy:
 *   attempts — union (same question, seed and finish time = the same attempt; more self-marking wins)
 *   drafts   — newest wins, and a draft is dropped once that question has been finished anywhere
 *   cards    — newest review wins
 *   sets     — new < running < finished; a tie keeps this device's copy
 * Device-only settings are not synced.
 */
import type { Attempt, CardRecord, Draft, SetRecord, Working } from '../storage/types';

export interface Snapshot {
  attempts: Attempt[];
  drafts: Draft[];
  cards: CardRecord[];
  sets: SetRecord[];
}

export interface Changes {
  addAttempts: Attempt[];
  /** carry this device's id */
  updateAttempts: Attempt[];
  putDrafts: Draft[];
  deleteDrafts: string[];
  putCards: CardRecord[];
  putSets: SetRecord[];
}

export const attemptKey = (a: Attempt) => `${a.templateId}:${a.seed}:${a.finishedAt}`;
const selfMarked = (a: Attempt) => a.parts.filter((p) => p.self).length;
const SET_RANK: Record<SetRecord['status'], number> = { new: 0, running: 1, finished: 2 };
/** drafts untouched for this long are not synced */
export const DRAFT_MAX_AGE = 30 * 86_400_000;

/** Latest finish time per question (`templateId:seed`). */
function finishedAt(attempts: Attempt[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) {
    const k = `${a.templateId}:${a.seed}`;
    m.set(k, Math.max(m.get(k) ?? 0, a.finishedAt));
  }
  return m;
}
/** A draft is stale once its question was finished after the draft was started. */
const stale = (d: Draft, done: Map<string, number>) => (done.get(d.key) ?? -1) >= d.startedAt;

/** What this device must change to take in `remote`. */
export function incoming(local: Snapshot, remote: Snapshot, now = Date.now()): Changes {
  const byKey = new Map(local.attempts.map((a) => [attemptKey(a), a]));
  const addAttempts: Attempt[] = [];
  const updateAttempts: Attempt[] = [];
  for (const r of remote.attempts) {
    const l = byKey.get(attemptKey(r));
    const { id: _id, ...rest } = r;
    if (!l) {
      addAttempts.push(rest as Attempt);
      byKey.set(attemptKey(r), r);
    } else if (selfMarked(r) > selfMarked(l)) updateAttempts.push({ ...rest, id: l.id, working: l.working ?? r.working });
  }
  const done = finishedAt([...local.attempts, ...remote.attempts]);
  const localDrafts = new Map(local.drafts.map((d) => [d.key, d]));
  const putDrafts = remote.drafts.filter((r) => !stale(r, done) && now - r.updatedAt < DRAFT_MAX_AGE && r.updatedAt > (localDrafts.get(r.key)?.updatedAt ?? -1));
  const deleteDrafts = local.drafts.filter((d) => stale(d, done)).map((d) => d.key);
  const localCards = new Map(local.cards.map((c) => [c.family, c]));
  const putCards = remote.cards.filter((r) => r.updatedAt > (localCards.get(r.family)?.updatedAt ?? -1));
  const localSets = new Map(local.sets.map((s) => [s.id, s]));
  const putSets = remote.sets.flatMap((r) => {
    const l = localSets.get(r.id);
    if (l && SET_RANK[r.status] <= SET_RANK[l.status]) return [];
    return [l?.working ? { ...r, working: l.working } : r];
  });
  return { addAttempts, updateAttempts, putDrafts, deleteDrafts, putCards, putSets };
}

export const isEmpty = (c: Changes) => Object.values(c).every((x) => !x.length);

/** Handwriting strokes stay on the device that drew them; typed working is kept. */
export function slimWorking(w: Working | undefined): Working | undefined {
  if (!w || !w.text.trim()) return undefined;
  return { ...w, strokes: [], annotate: [] };
}

function slimSetWorking(w: Record<number, Working>): Record<number, Working> {
  const out: Record<number, Working> = {};
  for (const [i, x] of Object.entries(w)) {
    const slim = slimWorking(x);
    if (slim) out[Number(i)] = slim;
  }
  return out;
}

/** The snapshot this device uploads: no device ids, no strokes, no old drafts, a stable order. */
export function outgoing(s: Snapshot, now = Date.now()): Snapshot {
  const by = <T>(k: (x: T) => string) => (a: T, b: T) => (k(a) < k(b) ? -1 : k(a) > k(b) ? 1 : 0);
  const done = finishedAt(s.attempts);
  return {
    attempts: s.attempts
      .map(({ id: _id, ...a }) => ({ ...a, working: slimWorking(a.working) }))
      .sort(by(attemptKey)),
    drafts: s.drafts
      .filter((d) => !stale(d, done) && now - d.updatedAt < DRAFT_MAX_AGE)
      .map((d) => ({ ...d, working: slimWorking(d.working) }))
      .sort(by((d) => d.key)),
    cards: [...s.cards].sort(by((c) => c.family)),
    sets: s.sets.map((x) => (x.working ? { ...x, working: slimSetWorking(x.working) } : x)).sort(by((x) => x.id)),
  };
}
