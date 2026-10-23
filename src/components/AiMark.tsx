/**
 * "AI: mark my working" for one part: the working (handwriting as an image, typed text) goes to the
 * server with the part, its mark scheme and model solution; the AI examiner's verdict on each scheme
 * line comes back with short feedback. Its ticks can be taken as self-marks.
 */
import { useState } from 'react';
import type { Part } from '../engine/templates/types';
import type { MarkResult, Response } from '../engine/marking/types';
import type { Working } from '../storage/types';
import { aiMark, type AiMarkResult } from '../lib/api';
import { MathText } from './MathText';
import { Icon } from './Icon';

interface Props {
  stem: string;
  part: Part;
  working: Working;
  response?: Response;
  result?: MarkResult;
  /** which scheme lines can be self-awarded; null when ticking isn't open */
  awardable: boolean[] | null;
  onTicks: (ticks: boolean[]) => void;
}

const asText = (r: Response | undefined) => (r === undefined ? '' : typeof r === 'string' ? r : Array.isArray(r) ? r.filter(Boolean).join(', ') : Object.entries(r).map(([k, v]) => `${k}: ${v}`).join('; '));

export function AiMark({ stem, part, working, response, result, awardable, onTicks }: Props) {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<AiMarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(false);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const { strokesToPng } = await import('../working/Canvas');
      const image = strokesToPng(working.strokes, 1600) ?? undefined;
      const typed = working.text.trim() || undefined;
      if (!image && !typed) throw new Error('Write or type your working in the working area first, then ask the AI to mark it.');
      const where = part.label ? `part (${part.label})` : 'the question';
      setOut(
        await aiMark({
          question: `${stem}\n\n${part.label ? `(${part.label}) ` : ''}${part.prompt}\n\n(The working may cover every part of the question: mark only ${where}.)`,
          marks: part.marks,
          scheme: part.scheme.map((l) => ({ code: l.code, text: l.text })),
          solution: part.solution.join('\n'),
          image,
          typed,
          answer: asText(response) || undefined,
          autoResult: result ? `${result.verdict}, ${result.score}/${result.max}` : undefined,
        }),
      );
      setUsed(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const ticks = out ? part.scheme.map((_, k) => !!awardable?.[k] && !!out.lines.find((l) => l.index === k)?.awarded) : [];
  const awarded = out ? out.lines.filter((l) => l.awarded).length : 0;

  return (
    <>
      <button type="button" className="btn btn-small" onClick={run} disabled={busy}>
        <Icon name="bulb" /> {busy ? 'The AI is marking…' : out ? 'Mark my working again' : 'AI: mark my working'}
      </button>
      {error && (
        <p className="small error-text" role="alert">
          {error}
        </p>
      )}
      {out && (
        <div className="panel ai-feedback" role="status">
          <div className="panel-title">
            AI examiner · {awarded} of {part.scheme.length} mark scheme lines shown
          </div>
          <div className="panel-body">
            {part.scheme.map((l, k) => {
              const line = out.lines.find((x) => x.index === k);
              return (
                <div className="ai-line" key={k}>
                  <span className={line?.awarded ? 'ai-yes' : 'ai-no'}>
                    <Icon name={line?.awarded ? 'check' : 'x'} />
                    <span className="sr-only">{line?.awarded ? 'awarded' : 'not awarded'}</span>
                  </span>
                  <span className="scheme-code">{l.code}</span>
                  <span>{line?.comment ? <MathText src={line.comment} inline /> : <span className="muted">No comment</span>}</span>
                </div>
              );
            })}
            {!out.legible && <p className="small">Some of the working was hard to read — the AI could only mark what it could read.</p>}
            {out.summary && <MathText className="small ai-summary" src={out.summary} />}
            {out.nextStep && (
              <p className="small">
                <strong>Next time: </strong>
                <MathText src={out.nextStep} inline />
              </p>
            )}
            <div className="btn-row">
              {awardable && ticks.some(Boolean) && (
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => {
                    onTicks(ticks);
                    setUsed(true);
                  }}
                  disabled={used}
                >
                  {used ? 'Ticks added to your self-marking' : 'Use these ticks for self-marking'}
                </button>
              )}
            </div>
            <p className="small muted">AI marking can be wrong. Check it against the mark scheme.</p>
          </div>
        </div>
      )}
    </>
  );
}
