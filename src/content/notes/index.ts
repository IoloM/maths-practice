/** Revision notes for each chapter, loaded a book at a time when a Learn page opens. */
import type { TopicNotes } from './types';

const BOOKS: Record<string, () => Promise<Record<string, TopicNotes>>> = {
  P1: () => import('./p1').then((m) => m.P1),
  P2: () => import('./p2').then((m) => m.P2),
  SM1: () => import('./sm1').then((m) => m.SM1),
  SM2: () => import('./sm2').then((m) => m.SM2),
};

export async function loadNotes(chapter: string): Promise<TopicNotes | undefined> {
  const book = chapter.split('.')[0];
  return (await BOOKS[book]?.())?.[chapter];
}

export type { TopicNotes };
