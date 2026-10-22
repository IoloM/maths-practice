import { useId } from 'react';
import type { AnswerSpec, NumericSpec, ExactSpec, Response } from '../../engine/marking/types';
import { MathText, Tex } from '../MathText';
import { MathField } from './MathField';
import { choiceOrder } from '../../lib/choiceOrder';
import { speakText } from '../../lib/tex-speech';

interface Props {
  spec: AnswerSpec;
  value: Response | undefined;
  onChange: (r: Response) => void;
  onSubmit: () => void;
  disabled?: boolean;
  partLabel: string;
  /** in a set with many questions, include the question number in labels */
  questionNumber?: number;
}

const asStr = (r: Response | undefined) => (typeof r === 'string' ? r : '');
const asArr = (r: Response | undefined, n: number) => {
  const a = Array.isArray(r) ? [...r] : [];
  while (a.length < n) a.push('');
  return a;
};
const asRec = (r: Response | undefined) => (r && typeof r === 'object' && !Array.isArray(r) ? (r as Record<string, string>) : {});

function NumberBox({ value, onChange, onSubmit, aria, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; aria: string; disabled?: boolean }) {
  return (
    <input
      className="text-answer"
      type="text"
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      value={value}
      disabled={disabled}
      aria-label={aria}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
    />
  );
}

function ValueBox({ spec, value, onChange, onSubmit, aria, disabled }: { spec: NumericSpec | ExactSpec; value: string; onChange: (v: string) => void; onSubmit: () => void; aria: string; disabled?: boolean }) {
  if (spec.type === 'numeric') return <NumberBox value={value} onChange={onChange} onSubmit={onSubmit} aria={aria} disabled={disabled} />;
  return <MathField value={value} onChange={onChange} onEnter={onSubmit} ariaLabel={aria} disabled={disabled} />;
}

export function AnswerInput({ spec, value, onChange, onSubmit, disabled, partLabel, questionNumber }: Props) {
  const id = useId();
  const where = questionNumber ? `question ${questionNumber}${partLabel ? ` part (${partLabel})` : ''}` : partLabel ? `part (${partLabel})` : 'the question';
  const label = spec.label ? (
    <span className="answer-label">
      <Tex tex={spec.label} />
    </span>
  ) : null;
  const unit = spec.unit ? (
    <span className="answer-unit">
      <Tex tex={spec.unit} />
    </span>
  ) : null;

  switch (spec.type) {
    case 'numeric':
      return (
        <div className="answer-field">
          {label}
          <NumberBox value={asStr(value)} onChange={onChange} onSubmit={onSubmit} aria={`Answer for ${where} (number)`} disabled={disabled} />
          {unit}
        </div>
      );
    case 'exact':
    case 'expr':
    case 'integral':
    case 'equation':
    case 'interval':
      return (
        <div className="answer-field">
          {label}
          <MathField
            id={id}
            value={asStr(value)}
            onChange={onChange}
            onEnter={onSubmit}
            ariaLabel={`Answer for ${where}`}
            disabled={disabled}
            placeholder={spec.type === 'interval' ? 'e.g. x < 2 or x > 5' : spec.type === 'equation' ? 'e.g. y = 3x - 2' : undefined}
          />
          {unit}
        </div>
      );
    case 'list': {
      const n = Math.max(1, Array.isArray(value) ? value.length : 1);
      const arr = asArr(value, n);
      const set = (i: number, v: string) => {
        const a = [...arr];
        a[i] = v;
        onChange(a);
      };
      const v = spec.v ? <Tex tex={`${spec.v} =`} /> : null;
      return (
        <div className="list-items" role="group" aria-label={`Solutions for ${where}`}>
          {arr.map((x, i) => (
            <div className="list-item" key={i}>
              {v && <span className="answer-label">{v}</span>}
              <ValueBox spec={spec.items[0]} value={x} onChange={(s) => set(i, s)} onSubmit={onSubmit} aria={`Solution ${i + 1} for ${where}`} disabled={disabled} />
              {spec.angle === 'deg' && <span className="answer-unit">°</span>}
              {arr.length > 1 && !disabled && (
                <button type="button" className="btn btn-ghost btn-small" aria-label={`Remove solution ${i + 1}`} onClick={() => onChange(arr.filter((_, j) => j !== i))}>
                  ✕
                </button>
              )}
            </div>
          ))}
          {!disabled && (
            <div>
              <button type="button" className="btn btn-small" onClick={() => onChange([...arr, ''])}>
                + Add another
              </button>
            </div>
          )}
        </div>
      );
    }
    case 'coord': {
      const [x, y] = asArr(value, 2);
      return (
        <div className="answer-field">
          {label}
          <div className="coord" role="group" aria-label={`Coordinates for ${where}`}>
            <span className="paren">(</span>
            <ValueBox spec={spec.x} value={x} onChange={(s) => onChange([s, y])} onSubmit={onSubmit} aria="x-coordinate" disabled={disabled} />
            <span className="paren">,</span>
            <ValueBox spec={spec.y} value={y} onChange={(s) => onChange([x, s])} onSubmit={onSubmit} aria="y-coordinate" disabled={disabled} />
            <span className="paren">)</span>
          </div>
        </div>
      );
    }
    case 'vector': {
      const arr = asArr(value, spec.comps.length);
      const names = ['i', 'j', 'k'];
      return (
        <div className="answer-field">
          {label}
          <div className="coord" role="group" aria-label={`Vector components for ${where}`}>
            {arr.map((c, i) => (
              <span key={i} style={{ display: 'contents' }}>
                {i > 0 && <span className="paren">+</span>}
                <ValueBox
                  spec={spec.comps[i]}
                  value={c}
                  onChange={(s) => {
                    const a = [...arr];
                    a[i] = s;
                    onChange(a);
                  }}
                  onSubmit={onSubmit}
                  aria={`${names[i]} component`}
                  disabled={disabled}
                />
                <span className="paren">
                  <Tex tex={`\\mathbf{${names[i]}}`} />
                </span>
              </span>
            ))}
          </div>
          {unit}
        </div>
      );
    }
    case 'choice': {
      const picked = new Set((Array.isArray(value) ? value : value ? [asStr(value)] : []).map(String));
      return (
        <fieldset className="choice-list" style={{ border: 'none', margin: 0, padding: 0 }}>
          <legend className="sr-only">Choose an answer for {where}</legend>
          {choiceOrder(spec.options).map((i) => ({ o: spec.options[i], i })).map(({ o, i }) => (
            <label className="check" key={i}>
              <input
                type={spec.multi ? 'checkbox' : 'radio'}
                name={id}
                checked={picked.has(String(i))}
                disabled={disabled}
                onChange={(e) => {
                  if (!spec.multi) onChange(String(i));
                  else {
                    const s = new Set(picked);
                    if (e.target.checked) s.add(String(i));
                    else s.delete(String(i));
                    onChange([...s]);
                  }
                }}
              />
              <OptionText src={o} />
            </label>
          ))}
        </fieldset>
      );
    }
    case 'hypothesis': {
      const R = asRec(value);
      const set = (k: string, v: string) => onChange({ ...R, [k]: v });
      const params: [string, string][] = [
        ['p', 'p'],
        ['mu', 'μ'],
        ['rho', 'ρ'],
      ];
      const ParamSel = ({ k }: { k: string }) => (
        <select aria-label={`${k === 'h0p' ? 'H₀' : 'H₁'} parameter`} value={R[k] ?? ''} onChange={(e) => set(k, e.target.value)} disabled={disabled}>
          <option value="">?</option>
          {params.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      );
      return (
        <div className="hyp-grid" role="group" aria-label={`Hypothesis test for ${where}`}>
          <Tex tex="\mathrm{H_0}:" />
          <div className="hyp-line">
            <ParamSel k="h0p" />
            <span>=</span>
            <NumberBox value={R.h0v ?? ''} onChange={(v) => set('h0v', v)} onSubmit={onSubmit} aria="H₀ value" disabled={disabled} />
          </div>
          <Tex tex="\mathrm{H_1}:" />
          <div className="hyp-line">
            <ParamSel k="h1p" />
            <select aria-label="H₁ inequality" value={R.h1op ?? ''} onChange={(e) => set('h1op', e.target.value)} disabled={disabled}>
              <option value="">?</option>
              <option value="<">&lt;</option>
              <option value=">">&gt;</option>
              <option value="!=">≠</option>
            </select>
            <NumberBox value={R.h1v ?? ''} onChange={(v) => set('h1v', v)} onSubmit={onSubmit} aria="H₁ value" disabled={disabled} />
          </div>
          {spec.stat && (
            <>
              <MathText src={spec.stat.label} inline />
              <div className="hyp-line">
                <NumberBox value={R.stat ?? ''} onChange={(v) => set('stat', v)} onSubmit={onSubmit} aria={spec.stat.label.replace(/\$/g, '')} disabled={disabled} />
              </div>
            </>
          )}
          <span>Decision</span>
          <div className="hyp-line">
            <select aria-label="Decision" value={R.decision ?? ''} onChange={(e) => set('decision', e.target.value)} disabled={disabled}>
              <option value="">Choose…</option>
              <option value="reject">Reject H₀ (significant)</option>
              <option value="accept">Do not reject H₀ (not significant)</option>
            </select>
          </div>
          <span>Conclusion</span>
          <fieldset className="choice-list" style={{ border: 'none', margin: 0, padding: 0 }}>
            <legend className="sr-only">Conclusion in context</legend>
            {choiceOrder(spec.conclusions).map((i) => ({ c: spec.conclusions[i], i })).map(({ c, i }) => (
              <label className="check" key={i}>
                <input type="radio" name={`${id}-concl`} checked={R.conclusion === String(i)} disabled={disabled} onChange={() => set('conclusion', String(i))} />
                <OptionText src={c} />
              </label>
            ))}
          </fieldset>
        </div>
      );
    }
    case 'self':
      return null;
  }
}

/** An option's maths for the eye, and a spoken version for screen readers (also its accessible name). */
function OptionText({ src }: { src: string }) {
  return (
    <>
      <span aria-hidden="true">
        <MathText src={src} inline />
      </span>
      <span className="sr-only">{speakText(src)}</span>
    </>
  );
}

/** Is there anything to mark? */
export function hasResponse(r: Response | undefined): boolean {
  if (r === undefined || r === null) return false;
  if (typeof r === 'string') return r.trim() !== '';
  if (Array.isArray(r)) return r.some((x) => x && x.trim());
  return Object.values(r).some((x) => x && String(x).trim());
}
