/**
 * "Write it": a pad for writing a final answer by hand; the AI reads it and fills in the answer box
 * (the student checks it before marking). Only shown when an AI access code is set.
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { Stroke } from '../storage/types';
import type { AnswerSpec } from '../engine/marking/types';
import { aiRead, type ReadResult } from '../lib/api';
import { useSettings } from '../lib/settings';
import { Tex } from './MathText';
import { Icon } from './Icon';

const DrawingCanvas = lazy(() => import('../working/Canvas'));

/** Answer types whose box takes one line of maths. */
export const PAD_TYPES = new Set<AnswerSpec['type']>(['numeric', 'exact', 'expr', 'integral', 'equation', 'interval']);

const EXPECTS: Partial<Record<AnswerSpec['type'], string>> = {
  numeric: 'a number (decimal or integer)',
  exact: 'an exact value',
  expr: 'an algebraic expression',
  integral: 'an integral, including + c if written',
  equation: 'an equation',
  interval: 'a set of values (inequalities)',
};

/** "x = 2.5" → "2.5" when the box already shows the "x =". */
export function tidyReading(answer: string, spec: AnswerSpec): string {
  let a = answer.trim();
  if (spec.label && (spec.type === 'numeric' || spec.type === 'exact')) a = a.replace(/^[A-Za-z](_\{?\w+\}?)?\s*=\s*/, '');
  if (spec.type === 'numeric') a = a.replace(/\\(,|\s)/g, '').replace(/\s+/g, '');
  return a;
}

interface Props {
  spec: AnswerSpec;
  /** question text, to help read unclear symbols */
  question: string;
  where: string;
  onAnswer: (latex: string) => void;
}

export function AnswerPad({ spec, question, where, onAnswer }: Props) {
  const { settings } = useSettings();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [busy, setBusy] = useState(false);
  const [read, setRead] = useState<ReadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const close = () => setOpen(false);
  const readIt = async () => {
    setBusy(true);
    setError(null);
    setRead(null);
    try {
      const { strokesToPng } = await import('../working/Canvas');
      const image = strokesToPng(strokes);
      if (!image) throw new Error('Write your answer first.');
      setRead(await aiRead({ image, question: question.slice(0, 2000), expects: EXPECTS[spec.type] }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const answer = read ? tidyReading(read.answer, spec) : '';

  return (
    <>
      <button type="button" className="btn btn-small" onClick={() => setOpen(true)} aria-label={`Write it by hand: ${where}`} title="Write your answer by hand">
        <Icon name="pen" /> Write it
      </button>
      <dialog ref={dialog} className="pad-dialog" aria-label={`Handwriting pad: ${where}`} onClose={close} onCancel={close}>
        {open && (
          <div className="stack">
            <h2 className="h3">Write your final answer</h2>
            <p className="small muted">Write just the answer, as you would on the paper. The AI reads it into the answer box; check it before you press Check.</p>
            <div className={`canvas-wrap pad-canvas ${settings.pencilOnly ? 'pencil-only' : ''}`}>
              <Suspense fallback={<div className="pad-loading">Loading…</div>}>
                <DrawingCanvas strokes={strokes} onChange={setStrokes} tool="pen" color="currentColor" size={3} paper="plain" pencilOnly={settings.pencilOnly} height={220} fixedHeight label="Answer writing pad" />
              </Suspense>
            </div>
            {read && (
              <div className="panel" role="status">
                <div className="panel-title">The AI read</div>
                <div className="panel-body">
                  {answer ? <Tex tex={answer} display /> : <em>nothing</em>}
                  {read.unclear && <p className="small">{read.note || 'Some of it was hard to read.'}</p>}
                </div>
              </div>
            )}
            {error && (
              <p className="small error-text" role="alert">
                {error}
              </p>
            )}
            <div className="btn-row">
              {read && answer ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onAnswer(answer);
                    setStrokes([]);
                    setRead(null);
                    close();
                  }}
                >
                  Use this answer
                </button>
              ) : null}
              <button type="button" className={`btn ${read && answer ? '' : 'btn-primary'}`} onClick={readIt} disabled={busy || !strokes.length}>
                {busy ? 'Reading…' : read ? 'Read again' : 'Read my writing'}
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setStrokes([]);
                  setRead(null);
                  setError(null);
                }}
                disabled={!strokes.length}
              >
                Clear
              </button>
              <span className="spacer" />
              <button type="button" className="btn btn-ghost" onClick={close}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
