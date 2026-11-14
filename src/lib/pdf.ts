/**
 * Showing pages of a PDF the student loaded (Mr Astbury's booklets) with pdf.js, loaded only when
 * needed. Pages are drawn to a canvas; the blank writing space under a question can be trimmed off.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';

type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
let lib: Promise<PdfJs> | null = null;

function pdfjs(): Promise<PdfJs> {
  lib ??= (async () => {
    const [m, worker] = await Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url')]);
    m.GlobalWorkerOptions.workerSrc = worker.default;
    return m;
  })();
  return lib;
}

/** Open a PDF from its bytes (copied: pdf.js takes ownership of what it is given). */
export async function openPdf(data: ArrayBuffer): Promise<PDFDocumentProxy> {
  const m = await pdfjs();
  return m.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
}

/** Draw a page at `cssWidth` CSS pixels wide. With `trim`, blank space at the bottom is cut off. */
export async function renderPage(doc: PDFDocumentProxy, n: number, cssWidth: number, trim = false): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return trim ? trimBottom(canvas) : canvas;
}

/**
 * Cut off the writing space below the question (keeping a small margin): from the bottom up, skip
 * rows that are blank or a ruled line right across, and stop at the first row with writing on it.
 * The margin columns (where the booklet prints the source) are left out of the test.
 */
function trimBottom(c: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = c.getContext('2d')!;
  const { width, height } = c;
  const data = ctx.getImageData(0, 0, width, height).data;
  const x0 = Math.round(width * 0.16),
    x1 = Math.round(width * 0.95);
  let last = 0;
  for (let y = height - 1; y >= 0 && !last; y -= 2) {
    let ink = 0,
      n = 0;
    for (let x = x0; x < x1; x += 3, n++) {
      const i = (y * width + x) * 4;
      if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) ink++;
    }
    if (ink > 0 && ink < n * 0.5) last = y;
  }
  const keep = Math.min(height, last + Math.round(width * 0.04));
  if (keep >= height * 0.95 || keep < height * 0.08) return c;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = keep;
  out.getContext('2d')!.drawImage(c, 0, 0);
  return out;
}
