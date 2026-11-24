import { lazy, Suspense, useRef, useState } from 'react';
import type { CanvasHandle } from './Canvas';
import type { Paper, Working } from '../storage/types';
import { MathText } from '../components/MathText';
import { Icon } from '../components/Icon';
import { InkToolbar, useInk } from './InkToolbar';

const DrawingCanvas = lazy(() => import('./Canvas'));

export function emptyWorking(paper: Paper, mode: 'write' | 'type'): Working {
  return { mode, strokes: [], annotate: [], text: '', paper, height: 900 };
}

interface Props {
  working: Working;
  onChange: (w: Working) => void;
  exportName: string;
}

export function WorkingArea({ working, onChange, exportName }: Props) {
  const ink = useInk();
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
      </div>
      {working.mode === 'write' ? (
        <>
          <InkToolbar
            ink={ink}
            canUndo={hist[0]}
            canRedo={hist[1]}
            onUndo={() => handle.current?.undo()}
            onRedo={() => handle.current?.redo()}
            onClear={() => handle.current?.clear()}
            clearLabel="Clear page"
            clearDisabled={!working.strokes.length}
            extra={
              <>
                <select aria-label="Paper" value={working.paper} onChange={(e) => set({ paper: e.target.value as Paper })}>
                  <option value="plain">Plain</option>
                  <option value="lined">Lined</option>
                  <option value="squared">Squared</option>
                </select>
                <button className="tool" aria-label="Save working as PNG" title="Save as a picture (PNG)" onClick={() => handle.current?.exportPng(`${exportName}.png`)}>
                  <Icon name="download" />
                </button>
              </>
            }
          />
          <div className="canvas-wrap" tabIndex={0} role="region" aria-label="Handwriting area (grows as you write)">
            <Suspense fallback={<div style={{ height: 300 }} className="muted small" />}>
              <DrawingCanvas
                handle={handle}
                strokes={working.strokes}
                onChange={(strokes) => set({ strokes })}
                tool={ink.tool}
                color={ink.colour}
                size={ink.size}
                options={ink.options}
                onPen={ink.onPen}
                paper={working.paper}
                pencilOnly={ink.pencilOnly}
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
