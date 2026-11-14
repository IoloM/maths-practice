/**
 * The PDF for Mr Astbury: the chapter's own pages from his booklet (the real pages, so the
 * questions stay sharp), with your handwriting drawn onto them, your final answers and marks along
 * the bottom of each question, and a front page with the record of the chapter. Made on the device
 * with pdf-lib (loaded only when you make one); nothing is sent anywhere.
 */
import type { BookletQuestion, BookletSection } from '../content/astbury';
import type { Stroke } from '../storage/types';
import { fullyMarked, sectionProgress, totalMarks, type BookletWork, type BookletWorks, type Check } from './booklet';
import { loadInkPages, PAGE_UNITS } from './booklet-ink';
import { paperColour, strokeSvgPath } from '../working/ink';

/** A4 in points, for the front pages. */
const A4 = { w: 595.28, h: 841.89 };
/** Where the line with your answers goes: the bottom margin of the booklet's pages (under the ruled box). */
const STAMP = { x: 21, y: 5, w: 553, h: 21 };

export interface PdfPagePlan {
  /** page of the booklet (from 1) */
  page: number;
  strokes: Stroke[];
  /** a PNG for the bottom margin: your answers and marks for the question that ends on this page */
  stamp?: Uint8Array;
}

export interface PdfPlan {
  title: string;
  author?: string;
  /** the front pages, as A4 PNGs */
  cover: Uint8Array[];
  pages: PdfPagePlan[];
}

const hex = (c: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  const n = m ? parseInt(m[1], 16) : 0x111111;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

/** Put the PDF together from the booklet's bytes and the plan. */
export async function buildBookletPdf(booklet: ArrayBuffer | Uint8Array, plan: PdfPlan): Promise<Uint8Array> {
  const { PDFDocument, rgb, BlendMode } = await import('pdf-lib');
  const src = await PDFDocument.load(booklet, { updateMetadata: false, ignoreEncryption: true });
  const out = await PDFDocument.create();
  out.setTitle(plan.title);
  if (plan.author) out.setAuthor(plan.author);
  out.setCreator('iolomaths.co.uk');
  out.setProducer('iolomaths.co.uk');
  out.setCreationDate(new Date());
  for (const png of plan.cover) {
    const img = await out.embedPng(png);
    out.addPage([A4.w, A4.h]).drawImage(img, { x: 0, y: 0, width: A4.w, height: A4.h });
  }
  const copied = await out.copyPages(
    src,
    plan.pages.map((p) => p.page - 1),
  );
  for (let i = 0; i < plan.pages.length; i++) {
    const p = plan.pages[i];
    const pg = out.addPage(copied[i]);
    const box = pg.getCropBox();
    const scale = box.width / PAGE_UNITS.w;
    for (const s of p.strokes) {
      const d = strokeSvgPath(s);
      if (!d) continue;
      const hl = s.tool === 'highlighter';
      pg.drawSvgPath(d, { x: box.x, y: box.y + box.height, scale, color: rgb(...hex(paperColour(s.color))), opacity: hl ? 0.32 : 1, blendMode: hl ? BlendMode.Multiply : undefined });
    }
    if (p.stamp) {
      const img = await out.embedPng(p.stamp);
      pg.drawImage(img, { x: box.x + STAMP.x * scale, y: box.y + STAMP.y * scale, width: STAMP.w * scale, height: STAMP.h * scale });
    }
  }
  return out.save();
}

// ------------------------------------------------------------------ the words on it

const CHECK_TEXT: Record<Check, string> = { right: 'Right', part: 'Partly right', wrong: 'Not right yet' };
const day = (t: number) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Your final answers, part by part ("(a) 16 − 4√5"). */
export function answerLines(q: BookletQuestion, w: BookletWork | undefined): string[] {
  if (!w) return [];
  const labelled = q.parts.some((p) => p.label);
  if (!labelled) return w.answer.trim() ? [w.answer.trim().replace(/\s+/g, ' ')] : [];
  return q.parts.filter((p) => w.answers?.[p.label]?.trim()).map((p) => `(${p.label}) ${w.answers![p.label].trim().replace(/\s+/g, ' ')}`);
}

/** "5/6" when every part has a mark, or how it went for a question without marks. */
export function marksText(q: BookletQuestion, w: BookletWork | undefined): string {
  if (q.marks && fullyMarked(q, w)) return `${totalMarks(q, w)}/${q.marks}`;
  if (w?.check) return CHECK_TEXT[w.check];
  return '';
}

/** The line along the bottom of a question's last page. */
export function stampText(q: BookletQuestion, w: BookletWork | undefined): string {
  const ans = answerLines(q, w);
  const marks = marksText(q, w);
  const bits = [`Question ${q.n}`];
  if (ans.length) bits.push(`Final answer${ans.length > 1 ? 's' : ''}: ${ans.join('   ')}`);
  if (marks) bits.push(q.marks && fullyMarked(q, w) ? `Marks ${marks} (self-marked against the worked solutions)` : marks);
  if (w?.done) bits.push(`done ${day(w.done)}`);
  return bits.length > 1 ? bits.join('  ·  ') : '';
}

/** The booklet pages for these chapters, in order. */
export function sectionPages(sections: BookletSection[]): { page: number; q: BookletQuestion; last: boolean }[] {
  const out: { page: number; q: BookletQuestion; last: boolean }[] = [];
  for (const s of sections) for (const q of s.questions) for (let i = 0; i < q.pages; i++) out.push({ page: q.page + i, q, last: i === q.pages - 1 });
  return out;
}

export function pdfFileName(sections: BookletSection[], name?: string): string {
  const who = name ? ` – ${name}` : '';
  const what = sections.length === 1 ? `${sections[0].ref} ${sections[0].title}` : `${sections.length} chapters`;
  return `Mr Astbury ${what}${who}.pdf`.replace(/[\\/:*?"<>|]/g, '-');
}

// ------------------------------------------------------------------ drawing the words (in the browser)

const FONT = '"Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const INK = '#111111';
const MUTED = '#555555';
const ACCENT = '#1d5c63';
const RULE = '#c9c9c9';

const toPng = (c: HTMLCanvasElement) =>
  new Promise<Uint8Array>((ok, fail) =>
    c.toBlob((b) => {
      if (!b) return fail(new Error('The page could not be drawn.'));
      void b.arrayBuffer().then((a) => ok(new Uint8Array(a)));
    }, 'image/png'),
  );

/** Split text into lines that fit `width` (long words are broken). */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const tryLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(tryLine).width <= width) {
        line = tryLine;
        continue;
      }
      if (line) out.push(line);
      line = word;
      while (ctx.measureText(line).width > width && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > width) cut--;
        out.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    out.push(line);
  }
  return out;
}

/** Your answers and marks for the bottom margin of a question's page (shrunk to fit on one line). */
export async function renderStamp(text: string): Promise<Uint8Array> {
  const k = 3;
  const c = document.createElement('canvas');
  c.width = STAMP.w * k;
  c.height = STAMP.h * k;
  const ctx = c.getContext('2d')!;
  ctx.scale(k, k);
  let size = 9;
  const fit = () => {
    ctx.font = `${size}px ${FONT}`;
    return ctx.measureText(text).width <= STAMP.w - 4;
  };
  while (!fit() && size > 6) size -= 0.5;
  let t = text;
  while (ctx.measureText(t).width > STAMP.w - 4 && t.length > 4) t = `${t.slice(0, -2)}…`;
  ctx.fillStyle = ACCENT;
  ctx.textBaseline = 'middle';
  ctx.fillText(t, 2, STAMP.h / 2);
  return toPng(c);
}

interface Row {
  q: string;
  from: string;
  answers: string;
  marks: string;
  done: string;
}

/** The front page(s): who, when, and for each chapter how it went, question by question. */
export async function renderCover(sections: BookletSection[], works: BookletWorks, name: string | undefined, made = Date.now()): Promise<Uint8Array[]> {
  await document.fonts?.ready;
  const k = 2.5;
  const M = 40;
  const pages: HTMLCanvasElement[] = [];
  let ctx!: CanvasRenderingContext2D;
  let y = 0;
  const newPage = () => {
    const c = document.createElement('canvas');
    c.width = Math.round(A4.w * k);
    c.height = Math.round(A4.h * k);
    ctx = c.getContext('2d')!;
    ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, A4.w, A4.h);
    ctx.textBaseline = 'top';
    pages.push(c);
    y = M;
  };
  const text = (t: string, x: number, size: number, opts: { bold?: boolean; color?: string; width?: number } = {}) => {
    ctx.font = `${opts.bold ? '700 ' : ''}${size}px ${FONT}`;
    ctx.fillStyle = opts.color ?? INK;
    const lines = wrap(ctx, t, opts.width ?? A4.w - M - x);
    lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * 1.3));
    return lines.length * size * 1.3;
  };
  const room = (h: number) => {
    if (y + h > A4.h - M) {
      newPage();
      return false;
    }
    return true;
  };

  newPage();
  y += text('Mr Astbury’s A Level Exam Qs Series – Pure', M, 18, { bold: true, color: ACCENT }) + 4;
  y += text(`${name ? `${name} · ` : ''}made ${day(made)} · iolomaths.co.uk`, M, 11, { color: MUTED }) + 4;
  y += text('My working is written on the booklet pages that follow, with my final answers and marks along the bottom of each question. I marked my answers myself against the worked solutions.', M, 10, { color: MUTED }) + 14;

  const cols = [
    { key: 'q', title: 'Q', x: M, w: 22 },
    { key: 'from', title: 'From', x: M + 24, w: 128 },
    { key: 'answers', title: 'Final answers', x: M + 156, w: 220 },
    { key: 'marks', title: 'Marks', x: M + 380, w: 72 },
    { key: 'done', title: 'Done', x: M + 456, w: A4.w - M - (M + 456) },
  ] as const;
  const SIZE = 9.5;
  const LINE = SIZE * 1.3;
  const header = () => {
    ctx.font = `700 ${SIZE}px ${FONT}`;
    ctx.fillStyle = MUTED;
    for (const c of cols) ctx.fillText(c.title, c.x, y);
    y += LINE + 3;
    ctx.fillStyle = RULE;
    ctx.fillRect(M, y, A4.w - 2 * M, 0.8);
    y += 4;
  };

  for (const s of sections) {
    const p = sectionProgress(works, s);
    room(90);
    y += 6;
    y += text(`${s.ref} ${s.title}`, M, 14, { bold: true }) + 2;
    const summary = [`${p.done} of ${s.questions.length} questions done`];
    if (p.complete && p.finishedAt) summary.push(`finished ${day(p.finishedAt)}`);
    if (p.of) summary.push(`${p.got}/${p.of} marks against the worked solutions`);
    y += text(summary.join(' · '), M, 10.5, { color: MUTED }) + 8;
    header();
    for (const q of s.questions) {
      const w = works[q.id];
      const row: Row = {
        q: String(q.n),
        from: q.source,
        answers: answerLines(q, w).join('\n') || '–',
        marks: marksText(q, w) || (q.marks ? `–/${q.marks}` : '–'),
        done: w?.done ? day(w.done) : '–',
      };
      ctx.font = `${SIZE}px ${FONT}`;
      const cells = cols.map((c) => wrap(ctx, row[c.key], c.w));
      const h = Math.max(...cells.map((l) => l.length)) * LINE + 6;
      if (!room(h + 2)) header();
      ctx.font = `${SIZE}px ${FONT}`;
      cols.forEach((c, i) => {
        ctx.fillStyle = c.key === 'from' ? MUTED : INK;
        cells[i].forEach((l, j) => ctx.fillText(l, c.x, y + j * LINE));
      });
      y += h;
      ctx.fillStyle = RULE;
      ctx.fillRect(M, y - 3, A4.w - 2 * M, 0.5);
    }
    y += 10;
  }
  return Promise.all(pages.map(toPng));
}

/** Everything for the PDF of these chapters, made on this device. */
export async function makeBookletPdf(booklet: ArrayBuffer, sections: BookletSection[], works: BookletWorks, name?: string): Promise<{ bytes: Uint8Array; fileName: string }> {
  const list = sectionPages(sections);
  const ink = await loadInkPages(list.map((p) => p.page));
  const pages: PdfPagePlan[] = [];
  for (const { page, q, last } of list) {
    const t = last ? stampText(q, works[q.id]) : '';
    pages.push({ page, strokes: ink.get(page) ?? [], stamp: t ? await renderStamp(t) : undefined });
  }
  const cover = await renderCover(sections, works, name);
  const title = sections.length === 1 ? `Mr Astbury ${sections[0].ref} ${sections[0].title}` : 'Mr Astbury’s booklet';
  const bytes = await buildBookletPdf(booklet, { title: name ? `${title} – ${name}` : title, author: name, cover, pages });
  return { bytes, fileName: pdfFileName(sections, name) };
}
