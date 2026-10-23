/** Question bank metadata only (no engine code), so light pages can list topics without loading the maths engine. */
import bankJson from './bank-index.json';
import type { ChapterRef, TemplateMeta } from '../engine/templates/types';

export interface BankEntry extends TemplateMeta {
  /** number of verified questions (the seeds themselves are in bank-seeds, loaded lazily) */
  n: number;
  /** a fixed (non-generated) question: single seed 0 */
  fixed?: boolean;
}

export const BANK = bankJson as unknown as { version: number; templates: BankEntry[]; totals: { templates: number; questions: number; fixed: number } };
export const ENTRY_BY_ID = new Map(BANK.templates.map((t) => [t.id, t]));

export function entriesForChapter(ch: ChapterRef | string): BankEntry[] {
  return BANK.templates.filter((t) => t.chapter === ch);
}
