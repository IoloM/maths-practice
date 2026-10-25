/**
 * The mistake notebook: every question where you dropped marks, until you've put it right (full
 * marks on that kind of question afterwards, or you mark it sorted). Built from your attempts, so
 * the only things saved are your own notes, reasons and "sorted" ticks (synced with your account).
 */
import { useEffect, useState } from 'react';
import type { Attempt } from '../storage/types';
import { getStore } from '../storage';
import { notifyProgress, onProgressChange } from '../progress/record';
import { scoreOf } from '../progress/mastery';
import { humanise } from '../progress/stats';
import { todayKey } from './dates';
import type { LossReason } from './paper-results';

export interface Mistake {
  /** templateId:seed */
  key: string;
  templateId: string;
  seed: number;
  chapter: string;
  family: string;
  /** when you last got it wrong */
  at: number;
  got: number;
  of: number;
  gaveUp: boolean;
  /** recognised slips, e.g. "Sign error" */
  errors: string[];
  /** when you put it right (full marks on this kind of question later), or null */
  fixedAt: number | null;
}

export interface MistakeNote {
  note?: string;
  reasons?: LossReason[];
  /** you've marked it sorted yourself */
  sorted?: boolean;
  updatedAt: number;
}
export type MistakeNotes = Record<string, MistakeNote>;
export const NOTES_KEY = 'mistakeNotes';

const full = (a: Attempt) => !a.gaveUp && a.marks > 0 && scoreOf(a) >= a.marks;

/** Your mistakes, newest first: the latest wrong attempt of each question. */
export function mistakesFrom(attempts: Attempt[]): Mistake[] {
  const latest = new Map<string, Attempt>();
  for (const a of attempts) {
    if (!a.marks || full(a)) continue;
    const k = `${a.templateId}:${a.seed}`;
    if ((latest.get(k)?.finishedAt ?? -1) < a.finishedAt) latest.set(k, a);
  }
  const fullByTemplate = new Map<string, number[]>();
  for (const a of attempts) if (full(a)) fullByTemplate.set(a.templateId, [...(fullByTemplate.get(a.templateId) ?? []), a.finishedAt]);
  return [...latest.entries()]
    .map(([key, a]): Mistake => {
      const later = (fullByTemplate.get(a.templateId) ?? []).filter((t) => t > a.finishedAt);
      return {
        key,
        templateId: a.templateId,
        seed: a.seed,
        chapter: a.chapter,
        family: a.family,
        at: a.finishedAt,
        got: scoreOf(a),
        of: a.marks,
        gaveUp: a.gaveUp,
        errors: [...new Set(a.parts.map((p) => p.auto?.errorId).filter((x): x is string => !!x))].map(humanise),
        fixedAt: later.length ? Math.min(...later) : null,
      };
    })
    .sort((a, b) => b.at - a.at);
}

export const isOpen = (m: Mistake, notes: MistakeNotes) => m.fixedAt === null && !notes[m.key]?.sorted;

/** How many mistakes were put right today (for the daily plan). */
export function fixedToday(ms: Mistake[], now = new Date()): number {
  const today = todayKey(now);
  return ms.filter((m) => m.fixedAt !== null && todayKey(new Date(m.fixedAt)) === today).length;
}

export async function loadNotes(): Promise<MistakeNotes> {
  return (await getStore()).getSetting<MistakeNotes>(NOTES_KEY, {});
}

export async function updateNote(key: string, f: (n: MistakeNote) => Omit<MistakeNote, 'updatedAt'>): Promise<void> {
  const store = await getStore();
  const all = { ...(await store.getSetting<MistakeNotes>(NOTES_KEY, {})) };
  const n = f(all[key] ?? { updatedAt: 0 });
  all[key] = { ...n, note: n.note?.slice(0, 500) || undefined, updatedAt: Date.now() };
  await store.putSetting(NOTES_KEY, all);
  notifyProgress();
}

/** Your notes, kept up to date. */
export function useMistakeNotes(): MistakeNotes | null {
  const [notes, setNotes] = useState<MistakeNotes | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => void loadNotes().then((n) => alive && setNotes(n));
    load();
    const off = onProgressChange(load);
    return () => {
      alive = false;
      off();
    };
  }, []);
  return notes;
}
