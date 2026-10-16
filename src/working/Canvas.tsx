/**
 * Handwriting canvas (lazy chunk). Pointer Events with pressure + coalesced events,
 * perfect-freehand strokes, vector storage, grows as you write, pencil-only palm rejection.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { getStroke } from 'perfect-freehand';
import type { Paper, Stroke } from '../storage/types';

export type Tool = 'pen' | 'highlighter' | 'eraser';

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
}

const GROW_MARGIN = 140;
const GROW_STEP = 420;

function outline(s: Stroke, live = false): Path2D {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < s.points.length; i += 3) pts.push([s.points[i], s.points[i + 1], s.points[i + 2]]);
  const hl = s.tool === 'highlighter';
  const poly = getStroke(pts, {
    size: s.size,
    thinning: hl ? 0 : 0.55,
    smoothing: 0.5,
    streamline: 0.45,
    simulatePressure: pts.every((p) => p[2] === 0.5),
    last: !live,
    start: { cap: true },
    end: { cap: true },
  });
  const path = new Path2D();
  if (!poly.length) return path;
  path.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) {
    const [x0, y0] = poly[i - 1];
    const [x1, y1] = poly[i];
    path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  path.closePath();
  return path;
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke, live = false) {
  ctx.save();
  if (s.tool === 'highlighter') {
    ctx.globalAlpha = 0.32;
  }
  ctx.fillStyle = s.color;
  ctx.fill(outline(s, live));
  ctx.restore();
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

function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax,
    dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function hits(s: Stroke, x: number, y: number, r: number): boolean {
  const p = s.points;
  if (p.length === 3) return Math.hypot(p[0] - x, p[1] - y) < r + s.size / 2;
  for (let i = 3; i < p.length; i += 3) if (distToSeg(x, y, p[i - 3], p[i - 2], p[i], p[i + 1]) < r + s.size / 2) return true;
  return false;
}

export default function DrawingCanvas(props: Props) {
  const { strokes, onChange, tool, color, size, paper, pencilOnly, height, onHeight, fixedHeight, transparent, label, handle, onHistory } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(600);
  const live = useRef<Stroke | null>(null);
  const erasing = useRef<{ removed: boolean } | null>(null);
  const activePointer = useRef<number | null>(null);
  const undoStack = useRef<Stroke[][]>([]);
  const redoStack = useRef<Stroke[][]>([]);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const raf = useRef(0);

  const commit = useCallback(
    (next: Stroke[]) => {
      undoStack.current.push(strokesRef.current);
      if (undoStack.current.length > 200) undoStack.current.shift();
      redoStack.current = [];
      onChange(next);
      onHistory?.(true, false);
    },
    [onChange, onHistory],
  );

  useImperativeHandle(
    handle,
    () => ({
      undo() {
        const prev = undoStack.current.pop();
        if (!prev) return;
        redoStack.current.push(strokesRef.current);
        onChange(prev);
        onHistory?.(undoStack.current.length > 0, true);
      },
      redo() {
        const n = redoStack.current.pop();
        if (!n) return;
        undoStack.current.push(strokesRef.current);
        onChange(n);
        onHistory?.(true, redoStack.current.length > 0);
      },
      clear() {
        if (strokesRef.current.length) commit([]);
      },
      exportPng(name: string) {
        const c = document.createElement('canvas');
        const scale = 2;
        c.width = width * scale;
        c.height = height * scale;
        const ctx = c.getContext('2d')!;
        ctx.scale(scale, scale);
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
        for (const s of strokesRef.current) drawStroke(ctx, { ...s, color: s.color === 'currentColor' ? '#111' : s.color });
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
    [commit, onChange, onHistory, width, height, paper],
  );

  // size to container
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(200, Math.floor(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const resolveColor = useCallback((c: string) => {
    if (c !== 'currentColor') return c;
    return getComputedStyle(wrapRef.current ?? document.body).color || '#111';
  }, []);

  const render = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (c.width !== Math.round(width * dpr) || c.height !== Math.round(height * dpr)) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
    }
    const ctx = c.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    for (const s of strokesRef.current) drawStroke(ctx, { ...s, color: resolveColor(s.color) });
    if (live.current) drawStroke(ctx, { ...live.current, color: resolveColor(live.current.color) }, true);
  }, [width, height, resolveColor]);

  useEffect(() => {
    render();
  }, [render, strokes]);

  const schedule = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(render);
  };

  const point = (e: PointerEvent | React.PointerEvent): [number, number, number] => {
    const r = canvasRef.current!.getBoundingClientRect();
    const pressure = e.pointerType === 'pen' ? Math.max(0.05, e.pressure || 0.5) : 0.5;
    return [e.clientX - r.left, e.clientY - r.top, pressure];
  };

  const maybeGrow = (y: number) => {
    if (fixedHeight || !onHeight) return;
    if (y > height - GROW_MARGIN) onHeight(height + GROW_STEP);
  };

  const accepts = (e: React.PointerEvent) => !(pencilOnly && e.pointerType === 'touch');

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!accepts(e) || activePointer.current !== null) return;
    if (e.button !== undefined && e.button > 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    activePointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y, p] = point(e);
    if (tool === 'eraser') {
      erasing.current = { removed: false };
      eraseAt(x, y);
      return;
    }
    live.current = { tool, color, size: tool === 'highlighter' ? Math.max(14, size * 4) : size, points: [x, y, p] };
    schedule();
  };

  const eraseAt = (x: number, y: number) => {
    const cur = strokesRef.current;
    const keep = cur.filter((s) => !hits(s, x, y, 10));
    if (keep.length !== cur.length) {
      if (!erasing.current?.removed) {
        commit(keep);
        if (erasing.current) erasing.current.removed = true;
      } else onChange(keep);
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== e.pointerId) return;
    e.preventDefault();
    const native = e.nativeEvent;
    const events = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [native];
    if (tool === 'eraser') {
      for (const ev of events.length ? events : [native]) {
        const [x, y] = point(ev);
        eraseAt(x, y);
      }
      return;
    }
    const s = live.current;
    if (!s) return;
    for (const ev of events.length ? events : [native]) {
      const [x, y, p] = point(ev);
      s.points.push(x, y, p);
      maybeGrow(y);
    }
    schedule();
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointer.current !== e.pointerId) return;
    activePointer.current = null;
    if (tool === 'eraser') {
      erasing.current = null;
      return;
    }
    const s = live.current;
    live.current = null;
    if (s && s.points.length >= 3) commit([...strokesRef.current, { ...s, points: s.points.map((v) => Math.round(v * 10) / 10) }]);
    else schedule();
  };

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

  return (
    <div ref={wrapRef} className={pencilOnly ? 'pencil-only' : undefined} style={{ ...paperCss(paper, transparent), height: fixedHeight ? '100%' : height, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        style={{ width, height, cursor: tool === 'eraser' ? 'cell' : 'crosshair', touchAction: pencilOnly ? 'pan-y' : 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
