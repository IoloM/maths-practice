import { lazy, Suspense, useRef, useState } from 'react';
import type { CanvasHandle, Tool } from './Canvas';
import type { Paper, Working } from '../storage/types';
import { useSettings } from '../lib/settings';
import { MathText } from '../components/MathText';
import { Icon } from '../components/Icon';

const DrawingCanvas = lazy(() => import('./Canvas'));

export const PEN_COLOURS = [
  { c: 'currentColor', name: 'Ink' },
  { c: '#1a5fd0', name: 'Blue' },
  { c: '#c62828', name: 'Red' },
  { c: '#2e7d32', name: 'Green' },
];

export function emptyWorking(paper: Paper, mode: 'write' | 'type'): Working {
  return { mode, strokes: [], annotate: [], text: '', paper, height: 900 };
}

interface Props {
  working: Working;
  onChange: (w: Working) => void;
  exportName: string;
}

export function WorkingArea({ working, onChange, exportName }: Props) {
  const { settings, update } = useSettings();
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('currentColor');
  const [size, setSize] = useState(3);
  const [hist, setHist] = useState<[boolean, boolean]>([false, false]);
  const handle = useRef<CanvasHandle>(null);
  const set = (p: Partial<Working>) => onChange({ ...working, ...p });

  return (
    <section className="working" aria-label="Working area">
      <div className="working-tabs">
        <div className="tab-group" role="tablist" aria-label="Working mode">
          <button role="tab" aria-selected={working.mode === 'write'} onClick={() => set({ mode: 'write' })}>
            <Icon name="pen" /> Write
          </button>
          <button role="tab" aria-selected={working.mode === 'type'} onClick={() => set({ mode: 'type' })}>
            <Icon name="keyboard" /> Type
          </button>
        </div>
        <span className="spacer" />
        {working.mode === 'write' && (
          <label className="small muted" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '0 6px' }}>
            <input type="checkbox" checked={settings.pencilOnly} onChange={(e) => update({ pencilOnly: e.target.checked })} />
            Pencil only
          </label>
        )}
      </div>
      {working.mode === 'write' ? (
        <>
          <div className="toolbar" role="toolbar" aria-label="Drawing tools">
            <button className="tool" aria-pressed={tool === 'pen'} aria-label="Pen" title="Pen" onClick={() => setTool('pen')}>
              <Icon name="pen" />
            </button>
            <button className="tool" aria-pressed={tool === 'highlighter'} aria-label="Highlighter" title="Highlighter" onClick={() => setTool('highlighter')}>
              <Icon name="highlighter" />
            </button>
            <button className="tool" aria-pressed={tool === 'eraser'} aria-label="Eraser" title="Eraser" onClick={() => setTool('eraser')}>
              <Icon name="eraser" />
            </button>
            {PEN_COLOURS.map((p) => (
              <button key={p.c} className="tool" aria-pressed={color === p.c} aria-label={`${p.name} ink`} title={p.name} onClick={() => setColor(p.c)}>
                <span className="swatch" style={{ background: p.c === 'currentColor' ? 'var(--text)' : p.c }} />
              </button>
            ))}
            <select aria-label="Pen size" value={size} onChange={(e) => setSize(Number(e.target.value))} style={{ minHeight: 40 }}>
              <option value={2}>Fine</option>
              <option value={3}>Medium</option>
              <option value={5}>Thick</option>
            </select>
            <span className="spacer" />
            <button className="tool" aria-label="Undo" title="Undo" disabled={!hist[0]} onClick={() => handle.current?.undo()}>
              <Icon name="undo" />
            </button>
            <button className="tool" aria-label="Redo" title="Redo" disabled={!hist[1]} onClick={() => handle.current?.redo()}>
              <Icon name="redo" />
            </button>
            <button className="tool" aria-label="Clear page" title="Clear" onClick={() => handle.current?.clear()}>
              <Icon name="trash" />
            </button>
            <select aria-label="Paper" value={working.paper} onChange={(e) => set({ paper: e.target.value as Paper })} style={{ minHeight: 40 }}>
              <option value="plain">Plain</option>
              <option value="lined">Lined</option>
              <option value="squared">Squared</option>
            </select>
            <button className="tool" aria-label="Save working as PNG" title="Export PNG" onClick={() => handle.current?.exportPng(`${exportName}.png`)}>
              <Icon name="download" />
            </button>
          </div>
          <div className="canvas-wrap" tabIndex={0} role="region" aria-label="Handwriting area (grows as you write)">
            <Suspense fallback={<div style={{ height: 300 }} className="muted small" />}>
              <DrawingCanvas
                handle={handle}
                strokes={working.strokes}
                onChange={(strokes) => set({ strokes })}
                tool={tool}
                color={color}
                size={size}
                paper={working.paper}
                pencilOnly={settings.pencilOnly}
                height={working.height}
                onHeight={(height) => set({ height })}
                label="Handwritten working. Draw with a finger, stylus or mouse."
                onHistory={(u, r) => setHist([u, r])}
              />
            </Suspense>
          </div>
        </>
      ) : (
        <div className="type-working">
          <label htmlFor="typed-working" className="small muted">
            {'Type your working. Use $…$ for maths, e.g. $\\frac{x^3}{3} + c$.'}
          </label>
          <textarea id="typed-working" value={working.text} onChange={(e) => set({ text: e.target.value })} placeholder="Working…" />
          {working.text.trim() && (
            <div className="type-preview" aria-live="polite">
              <MathText src={working.text} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
