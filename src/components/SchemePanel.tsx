import { useId } from 'react';
import type { Part } from '../engine/templates/types';
import { codeMarks, answerTex } from '../engine/marking/mark';
import { GUIDE, KIND, awardable, dependencies, kindOf, selfAvailable, selfScore, toggleTick } from '../lib/self-mark';
import { MathText } from './MathText';

interface Props {
  part: Part;
  ticks: boolean[];
  /** null: show the scheme without ticks */
  onTicks: ((t: boolean[]) => void) | null;
  /** marks the answer checker gave */
  auto: number;
  /** e.g. "part a" or "in question 3 part b", for labels */
  where?: string;
  /** the final answer was given up on or left blank */
  noAnswer?: boolean;
}

/**
 * The full mark scheme for one part, line by line, with what each mark is for. When the answer was
 * wrong (or can't be checked), tick the marks your working earned: method marks and any accuracy
 * marks along the way, with the final answer mark left to the checker.
 */
export function SchemePanel({ part, ticks, onTicks, auto, where = '', noAnswer = false }: Props) {
  const id = useId();
  const wholePart = part.answer.type === 'self';
  const canSelf = onTicks !== null;
  const ok = awardable(part.scheme, wholePart);
  const deps = dependencies(part.scheme);
  const self = selfScore(part.scheme, ticks, wholePart);
  const available = selfAvailable(part.scheme, wholePart);
  const mark = Math.max(auto, self);
  const answer = wholePart ? '' : answerTex(part.answer);
  const suffix = where ? ` ${where}` : '';

  return (
    <div className="panel scheme-panel" role="region" aria-labelledby={`${id}-t`}>
      <div className="panel-title" id={`${id}-t`}>
        Mark scheme{canSelf ? ' — tick the marks your working shows' : ''}
      </div>
      <div className="panel-body">
        {answer && (
          <p className="scheme-answer">
            Answer: <MathText src={part.answer.type === 'choice' ? answer : `$${answer}$`} inline />
          </p>
        )}
        <ol className="scheme-lines">
          {part.scheme.map((l, k) => {
            const kind = kindOf(l.code);
            const dep = deps[k];
            const locked = canSelf && !ok[k];
            const ticked = canSelf && ok[k] && !!ticks[k];
            const note = locked
              ? noAnswer
                ? 'Final answer mark: needs an answer.'
                : 'Final answer mark: needs the correct answer, so only the checker can give it.'
              : dep !== null
                ? `${KIND[kind].short}. Needs ${part.scheme[dep].code} (line ${dep + 1}).`
                : `${KIND[kind].short}.`;
            return (
              <li className={`scheme-line ${ticked ? 'ticked' : ''} ${locked ? 'locked' : ''}`} key={k}>
                {canSelf ? (
                  <input
                    type="checkbox"
                    id={`${id}-${k}`}
                    aria-label={`Award ${l.code}${suffix}`}
                    aria-describedby={`${id}-${k}-n`}
                    disabled={locked}
                    checked={ticked}
                    onChange={(e) => onTicks(toggleTick(part.scheme, ticks, k, e.target.checked, wholePart))}
                  />
                ) : (
                  <span />
                )}
                <span className="scheme-code" title={KIND[kind].name}>
                  {l.code}
                </span>
                <div>
                  <label htmlFor={canSelf ? `${id}-${k}` : undefined}>
                    <MathText src={l.text} inline />
                  </label>
                  <div className="scheme-note" id={`${id}-${k}-n`}>
                    {note} <span className="sr-only">{codeMarks(l.code) === 1 ? '1 mark' : `${codeMarks(l.code)} marks`}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {canSelf && (
          <div className="scheme-total" aria-live="polite">
            <span>
              Your mark:{' '}
              <strong>
                {mark}/{part.marks}
              </strong>
            </span>
            <span className="small muted">
              {wholePart
                ? `Self-awarded ${self} of ${available}.`
                : `Self-awarded: ${self} of ${available} available for working. The checker gave ${auto}; you get whichever is higher.`}
            </span>
          </div>
        )}
        <details className="scheme-guide">
          <summary>How these marks work</summary>
          <dl>
            {GUIDE.codes.map(([c, t]) => (
              <div key={c}>
                <dt>{c}</dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
          <p className="small">
            {GUIDE.terms.map(([c, t], i) => (
              <span key={c}>
                {i > 0 && ' · '}
                <strong>{c}</strong> {t}
              </span>
            ))}
          </p>
        </details>
      </div>
    </div>
  );
}
