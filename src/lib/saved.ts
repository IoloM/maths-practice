/**
 * Questions saved for later (the star on a question). Kept in the settings store and synced with
 * your account a question at a time; taking one off leaves a note (removed) so other devices drop it too.
 */
import { useEffect, useState } from 'react';
import { getStore } from '../storage';
import { notifyProgress, onProgressChange } from '../progress/record';

export interface SavedQuestion {
  templateId: string;
  seed: number;
  savedAt: number;
  removed?: boolean;
  updatedAt: number;
}
/** `templateId:seed` → saved question */
export type SavedQuestions = Record<string, SavedQuestion>;
export const SAVED_KEY = 'savedQuestions';
export const savedKey = (templateId: string, seed: number) => `${templateId}:${seed}`;

export async function loadSaved(): Promise<SavedQuestions> {
  return (await getStore()).getSetting<SavedQuestions>(SAVED_KEY, {});
}

export async function setSaved(templateId: string, seed: number, on: boolean): Promise<void> {
  const store = await getStore();
  const all = { ...(await store.getSetting<SavedQuestions>(SAVED_KEY, {})) };
  const k = savedKey(templateId, seed);
  const now = Date.now();
  all[k] = on ? { templateId, seed, savedAt: now, updatedAt: now } : { ...(all[k] ?? { templateId, seed, savedAt: now }), removed: true, updatedAt: now };
  await store.putSetting(SAVED_KEY, all);
  notifyProgress();
}

/** Saved questions, newest first. */
export const savedList = (all: SavedQuestions) => Object.values(all).filter((q) => !q.removed).sort((a, b) => b.savedAt - a.savedAt);

export function useSaved(): SavedQuestions | null {
  const [saved, setSavedState] = useState<SavedQuestions | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void loadSaved().then((s) => alive && setSavedState(s));
    load();
    const off = onProgressChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return saved;
}
