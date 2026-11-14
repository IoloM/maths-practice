/**
 * Writing on Mr Astbury's booklet itself: each page of the question, full size with its ruled
 * lines, with your pen on top. One toolbar for the pages (pen, highlighter, rubber, a hand to
 * scroll with a finger, colours, sizes, zoom, undo across the pages). The ink is saved as you go,
 * page by page (lib/booklet-ink.ts), and goes into the PDF you export for Mr Astbury.
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { CanvasHandle, Tool } from './Canvas';
import type { Stroke } from '../storage/types';
import { loadInkPages, PAGE_PEN_SIZES, PAGE_UNITS, saveInk } from '../lib/booklet-ink';
import { renderPage } from '../lib/pdf';
import { useSettings } from '../lib/settings';
import { PEN_COLOURS } from './WorkingArea';
import { strokeSvgPath, paperColour } from './ink';
import { Icon } from '../components/Icon';

const DrawingCanvas = lazy(() => import('./Canvas'));

const ZOOMS = [1, 1.5, 2];

/** A booklet page drawn to fill its box, redrawn (sharp) when the box changes size. */
function PageImage({ doc, page }: { doc: PDFDocumentProxy; page: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(() => setWidth(Math.floor(el.clientWidth)), 120);
    });
    ro.observe(el);
    setWidth(Math.floor(el.clientWidth));
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);
  useEffect(() => {
    const el = box.current;
    if (!el || width < 50) return;
    let alive = true;
    renderPage(doc, page, width)
      .then((c) => {
        if (!alive) return;
        c.className = 'ink-page-img';
        el.replaceChildren(c);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [doc, page, width]);
  return (
    <div ref={box} className="ink-page-bg" aria-hidden="true">
      {failed && <p className="small warn-text">That page could not be drawn.</p>}
    </div>
  );
}

/** Your ink on a page, to look at (the record): drawn as SVG over the page. */
export function InkOverlay({ strokes }: { strokes: Stroke[] }) {
  return (
    <svg className="ink-layer" viewBox={`0 0 ${PAGE_UNITS.w} ${PAGE_UNITS.h}`} aria-hidden="true">
      {strokes.map((s, k) => (
        <path key={k} d={strokeSvgPath(s)} fill={paperColour(s.color)} fillOpacity={s.tool === 'highlighter' ? 0.32 : 1} />
      ))}
    </svg>
  );
}

/** A booklet page with your writing on it, to look at. */
export function InkedPage({ doc, page, strokes, label }: { doc: PDFDocumentProxy; page: number; strokes: Stroke[]; label: string }) {
  return (
    <div className="ink-page" role="img" aria-label={label}>
      <PageImage doc={doc} page={page} />
      <InkOverlay strokes={strokes} />
    </div>
  );
}

interface Props {
  doc: PDFDocumentProxy;
  from: number;
  count: number;
  /** e.g. "Question 3" */
  name: string;
  /** whether there is any writing on the question's pages now (so the question shows as started) */
  onInk: (any: boolean) => void;
}

export function BookletInk({ doc, from, count, name, onInk }: Props) {
  const { settings, update } = useSettings();
  const [tool, setTool] = useState<Tool | 'hand'>('pen');
  const [color, setColor] = useState('currentColor');
  const [size, setSize] = useState(PAGE_PEN_SIZES[1].size);
  const [zoom, setZoom] = useState(1);
  const [ink, setInk] = useState<Record<number, Stroke[]> | null>(null);
  const [hist, setHist] = useState<[boolean, boolean]>([false, false]);
  const handles = useRef<Record<number, CanvasHandle | null>>({});
  // which page each change was on, so undo and redo work across the pages
  const order = useRef<number[]>([]);
  const redoOrder = useRef<number[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<number, Stroke[]>>({});
  const pages = Array.from({ length: count }, (_, i) => from + i);

  useEffect(() => {
    let alive = true;
    void loadInkPages(Array.from({ length: count }, (_, i) => from + i)).then((m) => {
      if (!alive) return;
      const all: Record<number, Stroke[]> = {};
      for (let p = from; p < from + count; p++) all[p] = m.get(p) ?? [];
      setInk(all);
    });
    return () => {
      alive = false;
    };
  }, [from, count]);

  const flush = useCallback((page: number) => {
    clearTimeout(timers.current[page]);
    const s = pending.current[page];
    if (!s) return;
    delete pending.current[page];
    void saveInk(page, s);
  }, []);
  // leaving the question saves what isn't saved yet
  useEffect(
    () => () => {
      for (const p of Object.keys(pending.current)) flush(Number(p));
    },
    [flush],
  );

  const inkRef = useRef(ink);
  inkRef.current = ink;
  const onInkRef = useRef(onInk);
  onInkRef.current = onInk;
  const change = useCallback(
    (page: number, strokes: Stroke[]) => {
      const next = { ...inkRef.current, [page]: strokes };
      inkRef.current = next;
      setInk(next);
      pending.current[page] = strokes;
      clearTimeout(timers.current[page]);
      timers.current[page] = setTimeout(() => flush(page), 400);
      onInkRef.current(Object.values(next).some((s) => s.length > 0));
    },
    [flush],
  );

  const undo = useCallback(() => {
    const p = order.current.pop();
    if (p === undefined) return;
    handles.current[p]?.undo();
    redoOrder.current.push(p);
    setHist([order.current.length > 0, true]);
  }, []);
  const redo = useCallback(() => {
    const p = redoOrder.current.pop();
    if (p === undefined) return;
    handles.current[p]?.redo();
    order.current.push(p);
    setHist([true, redoOrder.current.length > 0]);
  }, []);
  const committed = (p: number) => {
    order.current.push(p);
    redoOrder.current = [];
    setHist([true, false]);
  };

  // ⌘Z / Ctrl+Z (and with Shift, redo), unless you're typing
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('math-field'))) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const anyInk = !!ink && Object.values(ink).some((s) => s.length > 0);
  const drawTool: Tool = tool === 'hand' ? 'pen' : tool;
  return (
    <section className="ink" aria-label={`${name}: write on the booklet`}>
      <div className="toolbar ink-toolbar" role="toolbar" aria-label="Pen and paper">
        <button className="tool" aria-pressed={tool === 'pen'} aria-label="Pen" title="Pen" onClick={() => setTool('pen')}>
          <Icon name="pen" />
        </button>
        <button className="tool" aria-pressed={tool === 'highlighter'} aria-label="Highlighter" title="Highlighter" onClick={() => setTool('highlighter')}>
          <Icon name="highlighter" />
        </button>
        <button className="tool" aria-pressed={tool === 'eraser'} aria-label="Rubber" title="Rubber: touch a stroke to rub it out" onClick={() => setTool('eraser')}>
          <Icon name="eraser" />
        </button>
        <button className="tool" aria-pressed={tool === 'hand'} aria-label="Scroll with a finger" title="Hand: scroll and move about without writing" onClick={() => setTool('hand')}>
          <Icon name="hand" />
        </button>
        <span className="ink-sep" aria-hidden="true" />
        {PEN_COLOURS.map((p) => (
          <button key={p.c} className="tool" aria-pressed={color === p.c} aria-label={`${p.name} ink`} title={p.name} onClick={() => setColor(p.c)}>
            <span className="swatch" style={{ background: p.c === 'currentColor' ? '#111' : p.c }} />
          </button>
        ))}
        <select aria-label="Pen size" value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {PAGE_PEN_SIZES.map((p) => (
            <option key={p.size} value={p.size}>
              {p.name}
            </option>
          ))}
        </select>
        <select aria-label="Zoom" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
          {ZOOMS.map((z) => (
            <option key={z} value={z}>
              {z === 1 ? 'Fit' : `${z * 100}%`}
            </option>
          ))}
        </select>
        <span className="spacer" />
        <button className="tool" aria-label="Undo" title="Undo (⌘Z)" disabled={!hist[0]} onClick={undo}>
          <Icon name="undo" />
        </button>
        <button className="tool" aria-label="Redo" title="Redo (⇧⌘Z)" disabled={!hist[1]} onClick={redo}>
          <Icon name="redo" />
        </button>
        <button
          className="tool"
          aria-label="Rub out all my writing on this question"
          title="Rub it all out"
          disabled={!anyInk}
          onClick={() => {
            if (!window.confirm(`Rub out all your writing on ${name.toLowerCase()}? (Undo brings it back.)`)) return;
            for (const p of pages) if (inkRef.current?.[p]?.length) handles.current[p]?.clear();
          }}
        >
          <Icon name="trash" />
        </button>
        <label className="small muted ink-pencil">
          <input type="checkbox" checked={settings.pencilOnly} onChange={(e) => update({ pencilOnly: e.target.checked })} />
          Pencil only
        </label>
      </div>
      <div className="ink-scroller" tabIndex={zoom > 1 ? 0 : undefined} role={zoom > 1 ? 'region' : undefined} aria-label={zoom > 1 ? 'The pages, zoomed in (scroll sideways)' : undefined}>
        <div className="ink-pages" style={{ width: `${zoom * 100}%` }}>
          {pages.map((p, i) => (
            <div key={p} className="ink-page">
              <PageImage doc={doc} page={p} />
              <div className="ink-layer" style={{ pointerEvents: tool === 'hand' ? 'none' : undefined }}>
                {ink ? (
                  <Suspense fallback={null}>
                    <DrawingCanvas
                      handle={(h) => {
                        handles.current[p] = h;
                      }}
                      strokes={ink[p] ?? []}
                      onChange={(s) => change(p, s)}
                      onCommit={() => committed(p)}
                      tool={drawTool}
                      color={color}
                      size={size}
                      paper="plain"
                      transparent
                      fixedHeight
                      height={0}
                      units={PAGE_UNITS}
                      pencilOnly={settings.pencilOnly}
                      label={`${name}, ${count > 1 ? `page ${i + 1} of ${count}` : 'its page'} in the booklet (booklet page ${p}). Write your working on the lines with a pencil, finger or mouse.`}
                    />
                  </Suspense>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
