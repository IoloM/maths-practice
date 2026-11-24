/**
 * Your handwriting on the pages of Mr Astbury's booklet: the strokes on each page, in the page's
 * own units (PDF points from the top left, 595 × 842), so they sit on the same lines at any size.
 * Kept in the settings store one page at a time ('astburyInk:<page>'), so backups include it; like
 * all handwriting in the app it stays on the device it was written on (it's too big to sync).
 */
import { getStore } from '../storage';
import type { Stroke } from '../storage/types';

/** Every page of the booklet is A4, in PDF points. */
export const PAGE_UNITS = { w: 595.32, h: 841.92 };

const key = (page: number) => `astburyInk:${page}`;

export async function loadInk(page: number): Promise<Stroke[]> {
  return (await getStore()).getSetting<Stroke[]>(key(page), []);
}

export async function saveInk(page: number, strokes: Stroke[]): Promise<void> {
  await (await getStore()).putSetting(key(page), strokes);
}

/** The ink on several pages (pages without any are left out). */
export async function loadInkPages(pages: number[]): Promise<Map<number, Stroke[]>> {
  const out = new Map<number, Stroke[]>();
  for (const p of pages) {
    const s = await loadInk(p);
    if (s.length) out.set(p, s);
  }
  return out;
}
