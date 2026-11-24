/**
 * Handwriting canvas (lazy chunk). Pointer Events with coalesced events (smooth with an Apple
 * Pencil), vector storage, grows as you write, pencil-only palm rejection.
 *
 * Ink is an even line whatever the pressure (a brush pen is optional). Draw a line or shape and
 * hold still at the end: it snaps straight (a line's end then follows the pen until you lift).
 * Long nearly-straight lines straighten by themselves, and handwriting can be neatened as you go.
 * Shape tools (line, arrow, rectangle, ellipse, triangle, axes), a lasso to move, resize, recolour,
 * neaten or level what you wrote, and a rubber for whole strokes or just what it touches. With
 * "Pencil only", a two-finger tap undoes and a three-finger tap redoes.
 *
 * With `units`, it covers a page (Mr Astbury's booklet) and strokes are kept in the page's own
 * units, so the ink stays on the paper whatever size the page is shown at.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { drawStroke } from './ink';
import { dist, lassoSelect, level, makeShape, moveStroke, neaten, partialErase, pathLength, recognise, scaleStroke, snapAngle, straightenIfLine, strokeHits, strokesBox, toP, type Box, type P } from './shapes';
import { DEFAULT_OPTIONS, isShape, type InkOptions, type Tool } from './tools';
import type { Paper, Stroke } from '../storage/types';

export type { InkOptions, Tool } from './tools';

export interface CanvasHandle {
  undo(): void;
  redo(): void;
  clear(): void;
  exportPng(name: string): void;
  canUndo: boolean;
  canRedo: boolean;
}

interface Props {
  strokes: Stroke[];
  onChange: (s: Stroke[]) => void;
  tool: Tool;
  color: string;
  size: number;
  paper: Paper;
  pencilOnly: boolean;
  /** CSS px; grows automatically unless fixedHeight */
  height: number;
  onHeight?: (h: number) => void;
  fixedHeight?: boolean;
  transparent?: boolean;
  label: string;
  handle?: Ref<CanvasHandle>;
  onHistory?: (canUndo: boolean, canRedo: boolean) => void;
  /** a page this size (in its own units, e.g. PDF points): strokes are kept in those units and the height follows the width */
  units?: { w: number; h: number };
  /** after each change you can undo (a stroke drawn or rubbed out, a shape, a move, a clear) */
  onCommit?: () => void;
  options?: Partial<InkOptions>;
  /** an Apple Pencil (or other stylus) touched the canvas */
  onPen?: () => void;
  /** what a two-finger tap (undo) and three-finger tap (redo) do, when the host keeps the history across several canvases */
  onUndoGesture?: () => void;
  onRedoGesture?: () => void;
}

const GROW_MARGIN = 140;
const GROW_STEP = 420;
/** how long to hold still at the end of a stroke for it to snap into a line or shape */
const HOLD_MS = 450;

export default function DrawingCanvas(props: Props) {
  const { strokes, onChange, tool, color, size, paper, pencilOnly, onHeight, fixedHeight, transparent, label, handle, onHistory, units, onCommit, onPen } = props;
  const opts: InkOptions = { ...DEFAULT_OPTIONS, ...props.options };
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(600);
  // on a page: CSS px per page unit, and the page's height at this width
  const scale = units ? width / units.w : 1;
  const height = units ? Math.round((width * units.h) / units.w) : props.height;

  // what's being drawn right now
  const live = useRef<Stroke | null>(null);
  const liveShapes = useRef<Stroke[] | null>(null);
  const shapeStart = useRef<P | null>(null);
  const snapped = useRef<{ line: boolean; a: P } | null>(null);
  const hold = useRef<{ at: P; timer: ReturnType<typeof setTimeout> } | null>(null);
  const lasso = useRef<P[] | null>(null);
  const selDrag = useRef<{ mode: 'move' | 'scale'; from: P; before: Stroke[]; box: Box } | null>(null);
  const hover = useRef<P | null>(null);
  const erasing = useRef<{ removed: boolean } | null>(null);
  const activePointer = useRef<number | null>(null);
  const [sel, setSel] = useState<number[] | null>(null);
  const selRef = useRef(sel);
  selRef.current = sel;

  const undoStack = useRef<Stroke[][]>([]);
  const redoStack = useRef<Stroke[][]>([]);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const raf = useRef(0);
  const base = useRef<{ c: HTMLCanvasElement; strokes: Stroke[]; w: number; h: number; dpr: number; ink: string } | null>(null);

  const commitFrom = useCallback(
    (before: Stroke[], next: Stroke[]) => {
      undoStack.current.push(before);
      if (undoStack.current.length > 200) undoStack.current.shift();
      redoStack.current = [];
      onChange(next);
      onHistory?.(true, false);
      onCommit?.();
    },
    [onChange, onHistory, onCommit],
  );
  const commit = useCallback((next: Stroke[]) => commitFrom(strokesRef.current, next), [commitFrom]);

  const historyRef = useRef({ undo: () => {}, redo: () => {} });
  historyRef.current = {
    undo: () => {
      const prev = undoStack.current.pop();
      if (!prev) return;
      setSel(null);
      redoStack.current.push(strokesRef.current);
      onChange(prev);
      onHistory?.(undoStack.current.length > 0, true);
    },
    redo: () => {
      const n = redoStack.current.pop();
      if (!n) return;
      setSel(null);
      undoStack.current.push(strokesRef.current);
      onChange(n);
      onHistory?.(true, redoStack.current.length > 0);
    },
  };
  const resolveColor = useCallback((c: string) => {
    if (c !== 'currentColor') return c;
    return getComputedStyle(wrapRef.current ?? document.body).color || '#111';
  }, []);

  useImperativeHandle(
    handle,
    () => ({
      undo() {
        historyRef.current.undo();
      },
      redo() {
        historyRef.current.redo();
      },
      clear() {
        setSel(null);
        if (strokesRef.current.length) commit([]);
      },
      exportPng(name: string) {
        const c = document.createElement('canvas');
        const k = 2;
        c.width = width * k;
        c.height = height * k;
        const ctx = c.getContext('2d')!;
        ctx.scale(k, k);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        if (paper !== 'plain') {
          ctx.strokeStyle = 'rgba(29,92,99,0.18)';
          ctx.lineWidth = 1;
          const step = paper === 'lined' ? 32 : 24;
          for (let y = step; y < height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
          if (paper === 'squared')
            for (let x = step; x < width; x += step) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, height);
              ctx.stroke();
            }
        }
        ctx.scale(scale, scale);
        for (const s of strokesRef.current) drawStroke(ctx, s, s.color === 'currentColor' ? '#111' : s.color);
        c.toBlob((b) => {
          if (!b) return;
          const url = URL.createObjectURL(b);
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }, 'image/png');
      },
      get canUndo() {
        return undoStack.current.length > 0;
      },
      get canRedo() {
        return redoStack.current.length > 0;
      },
    }),
    [commit, onChange, onHistory, width, height, paper, scale],
  );

  // size to container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(200, Math.floor(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selected = () => (selRef.current ?? []).filter((i) => i < strokesRef.current.length).map((i) => strokesRef.current[i]);
  const selBox = () => (selRef.current?.length ? strokesBox(selected()) : null);

  const render = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    // sharp, but within what phones and iPads allow for a canvas (about 16 million pixels)
    const dpr = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(12e6 / Math.max(1, width * height)));
    const W = Math.round(width * dpr),
      H = Math.round(height * dpr);
    if (c.width !== W || c.height !== H) {
      c.width = W;
      c.height = H;
    }
    const ink = resolveColor('currentColor');
    // the finished strokes are drawn once into a layer of their own, so writing stays quick on a full page
    let b = base.current;
    if (!b || b.strokes !== strokesRef.current || b.w !== W || b.h !== H || b.dpr !== dpr || b.ink !== ink) {
      const bc = b?.c ?? document.createElement('canvas');
      bc.width = W;
      bc.height = H;
      const bx = bc.getContext('2d')!;
      bx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      bx.clearRect(0, 0, width / scale, height / scale);
      for (const s of strokesRef.current) drawStroke(bx, s, s.color === 'currentColor' ? ink : s.color);
      b = base.current = { c: bc, strokes: strokesRef.current, w: W, h: H, dpr, ink };
    }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(b.c, 0, 0);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    const px = 1 / scale;
    const accent = getComputedStyle(wrapRef.current ?? document.body).getPropertyValue('--accent').trim() || '#1d5c63';
    // the selection: a dashed box with a handle to resize it
    const box = selBox();
    if (box) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5 * px;
      ctx.setLineDash([5 * px, 4 * px]);
      ctx.strokeRect(box.x0 - 4 * px, box.y0 - 4 * px, box.x1 - box.x0 + 8 * px, box.y1 - box.y0 + 8 * px);
      ctx.setLineDash([]);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(box.x1 + 4 * px, box.y1 + 4 * px, 7 * px, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (lasso.current && lasso.current.length > 1) {
      ctx.save();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5 * px;
      ctx.setLineDash([4 * px, 4 * px]);
      ctx.beginPath();
      lasso.current.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.restore();
    }
    if (live.current) drawStroke(ctx, live.current, resolveColor(live.current.color), true);
    for (const s of liveShapes.current ?? []) drawStroke(ctx, s, resolveColor(s.color));
    // where the Pencil is hovering (or the rubber is)
    const h = hover.current;
    if (h) {
      ctx.save();
      if (tool === 'eraser') {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2 * px;
        ctx.beginPath();
        ctx.arc(h[0], h[1], (optsRef.current.eraser === 'part' ? 8 : 10) * px, 0, Math.PI * 2);
        ctx.stroke();
      } else if (tool === 'pen' || tool === 'highlighter' || isShape(tool)) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = resolveColor(color);
        ctx.beginPath();
        ctx.arc(h[0], h[1], Math.max(size / 2, 1.5 * px), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, scale, resolveColor, tool, color, size, sel]);

  useEffect(() => {
    render();
  }, [render, strokes]);

  const schedule = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(render);
  };

  // a new tool puts down the selection
  useEffect(() => {
    if (tool !== 'lasso') {
      setSel(null);
      lasso.current = null;
    }
    hover.current = null;
  }, [tool]);

  const point = (e: PointerEvent | React.PointerEvent): [number, number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    const pressure = e.pointerType === 'pen' ? Math.max(0.05, e.pressure || 0.5) : 0.5;
    return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale, pressure];
  };

  const maybeGrow = (y: number) => {
    if (fixedHeight || units || !onHeight) return;
    if (y > height - GROW_MARGIN) onHeight(height + GROW_STEP);
  };

  const accepts = (e: React.PointerEvent) => !(pencilOnly && e.pointerType === 'touch');
  const look = () => ({ tool: 'pen' as const, color, size, dash: optsRef.current.dash });

  // ---- hold still to snap
  const stopHold = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  const onHold = () => {
    const s = live.current;
    hold.current = null;
    if (!s || activePointer.current === null || snapped.current) return;
    if (pathLength(toP(s)) * scale < 18) return;
    const shape = recognise({ ...s, brush: undefined });
    if (!shape) return;
    liveShapes.current = [shape];
    snapped.current = { line: shape.points.length === 6 && !shape.closed, a: [shape.points[0], shape.points[1]] };
    live.current = null;
    navigator.vibrate?.(8);
    schedule();
  };
  const watchHold = (x: number, y: number) => {
    if (hold.current && dist(hold.current.at, [x, y]) <= 4 / scale) return;
    stopHold();
    hold.current = { at: [x, y], timer: setTimeout(onHold, HOLD_MS) };
  };

  const eraseAt = (x: number, y: number) => {
    const cur = strokesRef.current;
    const part = optsRef.current.eraser === 'part';
    const keep = part ? partialErase(cur, x, y, 8 / scale) : cur.filter((s) => !strokeHits(s, x, y, 10 / scale));
    if (part ? keep !== cur : keep.length !== cur.length) {
      if (!erasing.current?.removed) {
        commit(keep);
        if (erasing.current) erasing.current.removed = true;
      } else onChange(keep);
    }
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'hand' || !accepts(e) || activePointer.current !== null) return;
    if (e.button !== undefined && e.button > 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    activePointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.pointerType === 'pen') onPen?.();
    const [x, y, p] = point(e);
    hover.current = e.pointerType === 'mouse' && tool === 'eraser' ? [x, y] : null;
    if (tool === 'eraser') {
      hover.current = [x, y];
      erasing.current = { removed: false };
      eraseAt(x, y);
    } else if (tool === 'lasso') {
      const box = selBox();
      const px = 1 / scale;
      if (box && dist([x, y], [box.x1 + 4 * px, box.y1 + 4 * px]) < 18 * px) selDrag.current = { mode: 'scale', from: [x, y], before: strokesRef.current, box };
      else if (box && x >= box.x0 - 6 * px && x <= box.x1 + 6 * px && y >= box.y0 - 6 * px && y <= box.y1 + 6 * px) selDrag.current = { mode: 'move', from: [x, y], before: strokesRef.current, box };
      else {
        setSel(null);
        lasso.current = [[x, y]];
      }
    } else if (isShape(tool)) {
      shapeStart.current = [x, y];
      liveShapes.current = makeShape(tool, [x, y], [x, y], look());
    } else {
      live.current = { tool: tool === 'highlighter' ? 'highlighter' : 'pen', color, size, points: [x, y, p], ...(tool === 'pen' && optsRef.current.pressure ? { brush: true } : {}) };
      watchHold(x, y);
    }
    schedule();
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== e.pointerId) {
      // the Pencil hovering over the page (iPad Pro), or the mouse with the rubber: show where it'll touch
      if (e.pointerType === 'pen' || (e.pointerType === 'mouse' && tool === 'eraser')) {
        const [x, y] = point(e);
        hover.current = [x, y];
        schedule();
      }
      return;
    }
    e.preventDefault();
    const native = e.nativeEvent;
    const got = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [];
    const events = got.length ? got : [native];
    const [lx, ly] = point(events[events.length - 1]);
    if (tool === 'eraser') {
      for (const ev of events) {
        const [x, y] = point(ev);
        eraseAt(x, y);
      }
      hover.current = [lx, ly];
      schedule();
      return;
    }
    if (tool === 'lasso') {
      const d = selDrag.current;
      if (d) {
        const ids = new Set(selRef.current ?? []);
        if (d.mode === 'move') {
          const dx = lx - d.from[0],
            dy = ly - d.from[1];
          onChange(d.before.map((s, i) => (ids.has(i) ? moveStroke(s, dx, dy) : s)));
        } else {
          const k = Math.max(0.15, dist([lx, ly], [d.box.x0, d.box.y0]) / Math.max(1e-6, dist(d.from, [d.box.x0, d.box.y0])));
          onChange(d.before.map((s, i) => (ids.has(i) ? scaleStroke(s, d.box.x0, d.box.y0, k) : s)));
        }
      } else if (lasso.current) {
        for (const ev of events) {
          const [x, y] = point(ev);
          lasso.current.push([x, y]);
        }
        schedule();
      }
      return;
    }
    if (isShape(tool)) {
      if (shapeStart.current) liveShapes.current = makeShape(tool, shapeStart.current, [lx, ly], look());
      schedule();
      return;
    }
    if (snapped.current) {
      // a line that snapped: its end follows the pen until you lift it
      if (snapped.current.line && liveShapes.current?.[0]) {
        const a = snapped.current.a;
        const b = snapAngle(a, [lx, ly]);
        liveShapes.current = [{ ...liveShapes.current[0], points: [a[0], a[1], 0.5, b[0], b[1], 0.5] }];
      }
      schedule();
      return;
    }
    const s = live.current;
    if (!s) return;
    for (const ev of events) {
      const [x, y, p] = point(ev);
      const n = s.points.length;
      // steady the line a little (not the brush pen: perfect-freehand does its own)
      const k = s.brush ? 1 : 0.6;
      const px = s.points[n - 3] + (x - s.points[n - 3]) * k,
        py = s.points[n - 2] + (y - s.points[n - 2]) * k;
      if (Math.hypot(px - s.points[n - 3], py - s.points[n - 2]) * scale < 0.4) continue;
      s.points.push(px, py, p);
      maybeGrow(y);
    }
    watchHold(lx, ly);
    schedule();
  };

  const finishStroke = (s: Stroke, end: [number, number, number] | null): Stroke => {
    if (end) {
      const n = s.points.length;
      if (Math.hypot(end[0] - s.points[n - 3], end[1] - s.points[n - 2]) * scale > 0.4) s.points.push(end[0], end[1], end[2]);
    }
    let out: Stroke = { ...s, points: s.points.map((v, i) => (i % 3 === 2 ? Math.round(v * 100) / 100 : Math.round(v * 10) / 10)) };
    const o = optsRef.current;
    const straight = o.straighten ? straightenIfLine(out, 60 / scale) : null;
    if (straight) out = straight;
    else if (o.neaten) out = neaten(out);
    return out;
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    stopHold();
    const cancelled = e.type === 'pointercancel';
    if (tool === 'eraser') {
      erasing.current = null;
      if (e.pointerType !== 'mouse') hover.current = null;
      schedule();
      return;
    }
    if (tool === 'lasso') {
      const d = selDrag.current;
      selDrag.current = null;
      if (d) {
        if (strokesRef.current !== d.before) commitFrom(d.before, strokesRef.current);
      } else if (lasso.current) {
        const picked = lassoSelect(strokesRef.current, lasso.current);
        lasso.current = null;
        setSel(picked.length ? picked : null);
      }
      schedule();
      return;
    }
    if (isShape(tool)) {
      const shapes = liveShapes.current;
      const a = shapeStart.current;
      liveShapes.current = null;
      shapeStart.current = null;
      const [x, y] = point(e);
      if (shapes && a && !cancelled && dist(a, [x, y]) * scale > 4) commit([...strokesRef.current, ...shapes]);
      schedule();
      return;
    }
    if (snapped.current && liveShapes.current) {
      if (!cancelled) commit([...strokesRef.current, ...liveShapes.current]);
    } else {
      const s = live.current;
      if (s && s.points.length >= 3 && !cancelled) commit([...strokesRef.current, finishStroke(s, point(e))]);
    }
    live.current = null;
    liveShapes.current = null;
    snapped.current = null;
    schedule();
  };

  // ---- the selection's menu
  const changeSelected = (f: (s: Stroke[]) => Stroke[]) => {
    const ids = selRef.current ?? [];
    const mine = selected();
    const next = f(mine);
    const out = strokesRef.current.slice();
    ids.forEach((i, j) => {
      if (i < out.length) out[i] = next[j];
    });
    commit(out);
  };
  const deleteSel = () => {
    const ids = new Set(selRef.current ?? []);
    setSel(null);
    commit(strokesRef.current.filter((_, i) => !ids.has(i)));
  };
  const copySel = () => {
    const copies = selected().map((s) => moveStroke(s, 14 / scale, 14 / scale));
    const n = strokesRef.current.length;
    commit([...strokesRef.current, ...copies]);
    setSel(copies.map((_, i) => n + i));
  };

  // Delete removes the selection, Esc puts it down
  useEffect(() => {
    if (!sel?.length) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === 'Escape') setSel(null);
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  // keep the selection to strokes that are still there (after an undo, say)
  useEffect(() => {
    if (sel && sel.some((i) => i >= strokes.length)) setSel(null);
  }, [strokes, sel]);

  // Apple Pencil: stop the pencil from scrolling the page in pencil-only mode (fingers still scroll)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const block = (ev: TouchEvent) => {
      const t = ev.touches[0] ?? ev.changedTouches[0];
      if (!pencilOnly || (t && (t as Touch & { touchType?: string }).touchType === 'stylus')) ev.preventDefault();
    };
    c.addEventListener('touchstart', block, { passive: false });
    c.addEventListener('touchmove', block, { passive: false });
    return () => {
      c.removeEventListener('touchstart', block);
      c.removeEventListener('touchmove', block);
    };
  }, [pencilOnly]);

  // with "Pencil only": tap with two fingers to undo, three to redo (like Notes)
  const gestures = useRef({ undo: props.onUndoGesture, redo: props.onRedoGesture });
  gestures.current = { undo: props.onUndoGesture, redo: props.onRedoGesture };
  const tapRef = useRef<{ t: number; n: number; at: [number, number][]; moved: boolean } | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !pencilOnly) return;
    const fingers = (l: TouchList) => [...l].filter((t) => (t as Touch & { touchType?: string }).touchType !== 'stylus');
    const start = (ev: TouchEvent) => {
      const f = fingers(ev.touches);
      if (f.length < 2) return;
      const now = performance.now();
      if (!tapRef.current || now - tapRef.current.t > 400) tapRef.current = { t: now, n: f.length, at: f.map((t) => [t.clientX, t.clientY]), moved: false };
      else tapRef.current.n = Math.max(tapRef.current.n, f.length);
    };
    const move = (ev: TouchEvent) => {
      const tap = tapRef.current;
      if (!tap) return;
      const f = fingers(ev.touches);
      if (f.some((t, i) => tap.at[i] && Math.hypot(t.clientX - tap.at[i][0], t.clientY - tap.at[i][1]) > 14)) tap.moved = true;
    };
    const end = (ev: TouchEvent) => {
      const tap = tapRef.current;
      if (!tap || ev.touches.length) return;
      tapRef.current = null;
      if (tap.moved || performance.now() - tap.t > 350) return;
      if (tap.n === 2) (gestures.current.undo ?? historyRef.current.undo)();
      else if (tap.n === 3) (gestures.current.redo ?? historyRef.current.redo)();
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('touchend', end, { passive: true });
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
    };
  }, [pencilOnly]);

  const box = sel?.length ? selBox() : null;
  const menuTop = box ? (box.y0 * scale - 56 > 0 ? box.y0 * scale - 56 : box.y1 * scale + 14) : 0;
  const menuLeft = box ? Math.max(0, Math.min(box.x0 * scale, width - 330)) : 0;
  return (
    <div ref={wrapRef} className={pencilOnly ? 'pencil-only' : undefined} style={{ ...paperCss(paper, transparent), height: fixedHeight ? '100%' : height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        style={{ width, height, cursor: tool === 'eraser' ? 'none' : tool === 'lasso' ? 'default' : 'crosshair', touchAction: pencilOnly ? 'pan-x pan-y' : 'none', pointerEvents: tool === 'hand' ? 'none' : undefined }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => {
          if (hover.current && activePointer.current === null) {
            hover.current = null;
            schedule();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
      {box && !selDrag.current && (
        <div className="ink-sel-menu" role="toolbar" aria-label="The writing you selected" style={{ top: menuTop, left: menuLeft }}>
          <button className="btn btn-small" onClick={() => changeSelected((s) => s.map(neaten))} title="Smooth out the wobbles">
            Neaten
          </button>
          <button className="btn btn-small" onClick={() => changeSelected(level)} title="Turn slanted writing level">
            Level
          </button>
          <button className="btn btn-small" onClick={() => changeSelected((s) => s.map((x) => (x.tool === 'highlighter' ? x : { ...x, color })))} title="Make it the pen colour">
            <span className="swatch swatch-small" style={{ background: color === 'currentColor' ? '#111' : color }} /> Colour
          </button>
          <button className="btn btn-small" onClick={copySel}>
            Copy
          </button>
          <button className="btn btn-small" onClick={deleteSel}>
            Delete
          </button>
          <button className="btn btn-small btn-ghost" onClick={() => setSel(null)}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export function paperCss(paper: Paper, transparent?: boolean): React.CSSProperties {
  if (transparent) return { background: 'transparent' };
  const line = 'color-mix(in srgb, var(--accent) 16%, transparent)';
  if (paper === 'lined') return { backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, ${line} 31px 32px)` };
  if (paper === 'squared')
    return {
      backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    };
  return {};
}
