/**
 * The PDF for Mr Astbury: the chapter's own booklet pages, with the handwriting drawn on them where
 * it was written, the answers and marks along the bottom, and the front page first.
 */
import { describe, expect, it } from 'vitest';
import { PDFDocument, PDFRawStream, PDFArray, PDFStream, decodePDFRawStream } from 'pdf-lib';
import { BOOKLET, BOOKLET_PAGES, BOOKLET_SECTION } from '../src/content/astbury';
import { answerLines, buildBookletPdf, marksText, pdfFileName, sectionPages, stampText } from '../src/lib/booklet-pdf';
import type { BookletWork } from '../src/lib/booklet';
import { strokeSvgPath } from '../src/working/ink';
import type { Stroke } from '../src/storage/types';

// a 1×1 white PNG
const PNG = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64'));

async function booklet(): Promise<Uint8Array> {
  const d = await PDFDocument.create();
  for (let i = 0; i < BOOKLET_PAGES; i++) d.addPage([595.32, 841.92]).drawText(`booklet page ${i + 1}`, { x: 40, y: 800, size: 12 });
  return d.save();
}

/** Text as pdf-lib writes it with a standard font (hex). */
const hexText = (t: string) => `<${Buffer.from(t, 'latin1').toString('hex').toUpperCase()}>`;

/** What a page draws (its content streams, decoded). */
function contents(doc: PDFDocument, i: number): string {
  const node = doc.getPage(i).node;
  const c = node.Contents();
  const streams = c instanceof PDFArray ? c.asArray().map((r) => doc.context.lookup(r)) : [c];
  return streams
    .map((s) => {
      if (s instanceof PDFRawStream) return Buffer.from(decodePDFRawStream(s).decode()).toString('latin1');
      if (s instanceof PDFStream) return Buffer.from(s.getContents()).toString('latin1');
      return '';
    })
    .join('\n');
}

const pen = (points: number[], color = 'currentColor'): Stroke => ({ tool: 'pen', color, size: 1.6, points });

describe('the PDF for Mr Astbury', () => {
  const s = BOOKLET_SECTION.get('1.1')!;
  const work: Record<string, BookletWork> = {
    '1.1:1': { answer: '', answers: { a: '16 − 4√5', b: '4 − √5' }, marks: { a: 3, b: 2 }, done: Date.UTC(2026, 10, 14), updatedAt: 1 },
    '1.1:6': { answer: 'x = 4', updatedAt: 1 },
  };

  it('lists the chapter’s pages in order, marking the last page of each question', () => {
    const pages = sectionPages([s]);
    expect(pages.map((p) => p.page)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(pages.every((p) => p.last)).toBe(true);
    const two = sectionPages([BOOKLET.find((x) => x.questions.some((q) => q.pages === 2))!]);
    const q = two.filter((p) => p.q.pages === 2);
    expect(q.length).toBeGreaterThan(0);
    expect(q[0].last).toBe(false);
    expect(q[1].last).toBe(true);
    expect(q[1].page).toBe(q[0].page + 1);
  });

  it('writes the answers and marks for the bottom of the page', () => {
    const q1 = s.questions[0];
    expect(answerLines(q1, work['1.1:1'])).toEqual(['(a) 16 − 4√5', '(b) 4 − √5']);
    expect(marksText(q1, work['1.1:1'])).toBe('5/6');
    const t = stampText(q1, work['1.1:1']);
    expect(t).toContain('Question 1');
    expect(t).toContain('Final answers: (a) 16 − 4√5   (b) 4 − √5');
    expect(t).toContain('Marks 5/6 (self-marked against the worked solutions)');
    expect(t).toContain('done 14 Nov 2026');
    expect(stampText(s.questions[5], work['1.1:6'])).toBe('Question 6  ·  Final answer: x = 4');
    // nothing written, nothing to stamp
    expect(stampText(s.questions[2], undefined)).toBe('');
  });

  it('names the file after the chapter and the student', () => {
    expect(pdfFileName([s], 'Iolo')).toBe('Mr Astbury 1.1 Algebraic Expressions – Iolo.pdf');
    expect(pdfFileName([s, BOOKLET_SECTION.get('1.2-equations')!])).toBe('Mr Astbury 2 chapters.pdf');
    expect(pdfFileName([{ ...s, title: 'a/b: c?' }])).toBe('Mr Astbury 1.1 a-b- c-.pdf');
  });

  it('copies the booklet’s pages and draws the handwriting where it was written', async () => {
    const src = await booklet();
    const ink = [pen([100, 400, 0.5, 150, 380, 0.5, 200, 420, 0.5]), pen([60, 500, 0.5, 90, 520, 0.5], '#c62828'), { ...pen([50, 300, 0.5, 300, 300, 0.5]), tool: 'highlighter' as const, size: 10 }];
    const bytes = await buildBookletPdf(src, {
      title: 'Mr Astbury 1.1 Algebraic Expressions – Iolo',
      author: 'Iolo',
      cover: [PNG],
      pages: sectionPages([s]).map((p) => ({ page: p.page, strokes: p.page === 5 ? ink : [], stamp: p.page === 5 ? PNG : undefined })),
    });
    const out = await PDFDocument.load(bytes);
    expect(out.getPageCount()).toBe(1 + 8);
    expect(out.getTitle()).toBe('Mr Astbury 1.1 Algebraic Expressions – Iolo');
    expect(out.getAuthor()).toBe('Iolo');
    // the front page is A4, the booklet pages keep their size
    expect(out.getPage(0).getSize()).toEqual({ width: 595.28, height: 841.89 });
    expect(out.getPage(1).getSize()).toEqual({ width: 595.32, height: 841.92 });
    // the right booklet pages, in order
    const page5 = contents(out, 1);
    expect(page5).toContain(hexText('booklet page 5'));
    expect(contents(out, 8)).toContain(hexText('booklet page 12'));
    // the ink: filled paths, black, red and the highlighter, flipped onto the page (origin top left)
    expect(page5).toMatch(/0\.0[67]\d* 0\.0[67]\d* 0\.0[67]\d* rg/); // #111 ink
    expect(page5).toMatch(/0\.77\d* 0\.15\d* 0\.15\d* rg/); // red
    expect(page5).toContain('1 0 0 1 0 841.92 cm\n1 0 0 1 0 0 cm\n1 0 0 -1 0 0 cm');
    expect(page5.match(/\bf\b/g)?.length).toBeGreaterThanOrEqual(3);
    // the answers line is an image along the bottom
    expect(page5).toMatch(/1 0 0 1 21 5 cm\n1 0 0 1 0 0 cm\n553 0 0 21 0 0 cm\n1 0 0 1 0 0 cm\n\/Image-\d+ Do/);
    // pages without writing are left as they were
    expect(contents(out, 2)).not.toContain(' gs');
  });

  it('draws a stroke as one closed outline in the page’s units', () => {
    const d = strokeSvgPath(pen([100, 400, 0.5, 150, 380, 0.5, 200, 420, 0.5]));
    expect(d).toMatch(/^M[\d.]+ [\d.]+(Q[\d.]+ [\d.]+ [\d.]+ [\d.]+)+Z$/);
    const xs = [...d.matchAll(/([\d.]+) ([\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.min(...xs)).toBeGreaterThan(95);
    expect(Math.max(...xs)).toBeLessThan(205);
    expect(strokeSvgPath(pen([]))).toBe('');
  });
});
