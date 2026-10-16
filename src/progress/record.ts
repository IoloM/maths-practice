import { getStore, requestPersistence } from '../storage';
import type { Attempt } from '../storage/types';
import { ratingFor, review } from '../srs/fsrs';

const listeners = new Set<() => void>();
export function onProgressChange(f: () => void): () => void {
  listeners.add(f);
  return () => listeners.delete(f);
}
export function notifyProgress(): void {
  listeners.forEach((f) => f());
}

/** Save a finished attempt, update its spaced-repetition card, and ask for persistent storage. */
export async function recordAttempt(a: Attempt, estimatedMin: number): Promise<number> {
  const store = await getStore();
  const id = await store.addAttempt(a);
  if (a.mode !== 'mock' && a.mode !== 'timed') {
    const card = await store.getCard(a.family);
    await store.putCard(review(card, a.family, ratingFor(a, estimatedMin)));
  }
  if (!(await store.getSetting('persistRequested', false))) {
    await store.putSetting('persistRequested', true);
    void requestPersistence();
  }
  notifyProgress();
  return id;
}

export async function updateAttempt(a: Attempt): Promise<void> {
  const store = await getStore();
  await store.updateAttempt(a);
  notifyProgress();
}
