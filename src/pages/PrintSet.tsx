/**
 * `#/print/<set id>`: a mock paper or timed set laid out to print — questions with answer space,
 * then (optionally, from a new page) the mark scheme and worked solutions.
 */
import { useEffect, useState } from 'react';
import { getInstance, ENTRY_BY_ID } from '../content/bank';
import type { Instance, Part } from '../engine/templates/types';
import { getStore } from '../storage';
import type { SetRecord } from '../storage/types';
import { choiceOrder } from '../lib/choiceOrder';
import { diagramHtml } from '../components/diagram';
import { MathText } from '../components/MathText';
import { ErrorBox, Loading } from '../components/bits';
import { Icon } from '../components/Icon';
import { href } from '../router';

const LETTERS = 'ABCDEFGH';
type Space = 'none' | 'normal' | 'large';
const LINES_PER_MARK: Record<Space, number> = { none: 0, normal: 2, large: 3.5 };

function Options({ part }: { part: Part }) {
  if (part.answer.type !== 'choice') return null;
  const opts = part.answer.options;
  return (
    <ol className="print-options">
      {choiceOrder(opts).map((i, k) => (
        <li key={i}>
          <b>{LETTERS[k]}</b> <MathText src={opts[i]} inline />
        </li>
      ))}
    </ol>
  );
}

/** The letters of the correct options, in the printed order. */
function choiceAnswer(part: Part): string | null {
  if (part.answer.type !== 'choice') return null;
  const order = choiceOrder(part.answer.options);
  return part.answer.correct.map((c) => LETTERS[order.indexOf(c)]).join(', ');
}

export function PrintSet({ id }: { id: string }) {
  const [set, setSet] = useState<SetRecord | null | undefined>(undefined);
  const [insts, setInsts] = useState<Instance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scheme, setScheme] = useState(true);
  const [solutions, setSolutions] = useState(false);
  const [space, setSpace] = useState<Space>('normal');

  useEffect(() => {
    let alive = true;
    void (async () => {
      const s = (await (await getStore()).getSet(id)) ?? null;
      if (!alive) return;
      setSet(s);
      if (!s) return;
      try {
        const is = await Promise.all(s.items.map((it) => getInstance(it.templateId, it.seed)));
        if (alive) setInsts(is);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (set === undefined) return <Loading />;
  if (set === null) return <ErrorBox>This set was not found on this device.</ErrorBox>;
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!insts) return <Loading label="Preparing the paper…" />;
  const total = set.items.reduce((t, it) => t + (ENTRY_BY_ID.get(it.templateId)?.marks ?? 0), 0);

  return (
    <div className="stack">
      <div className="print-toolbar card stack no-print">
        <p className="small muted" style={{ margin: 0 }}>
          <a href={href(`/set/${id}`)}>← Back to the set</a>
        </p>
        <h1 style={{ margin: 0 }}>Print: {set.title}</h1>
        <div className="row-wrap">
          <label className="check">
            <input type="checkbox" checked={scheme} onChange={(e) => setScheme(e.target.checked)} />
            Mark scheme (from a new page)
          </label>
          <label className="check">
            <input type="checkbox" checked={solutions} onChange={(e) => setSolutions(e.target.checked)} disabled={!scheme} />
            Worked solutions too
          </label>
          <label className="row">
            Answer space{' '}
            <select value={space} onChange={(e) => setSpace(e.target.value as Space)}>
              <option value="none">None (use your own paper)</option>
              <option value="normal">Lines</option>
              <option value="large">More lines</option>
            </select>
          </label>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Icon name="download" /> Print or save as PDF
          </button>
        </div>
      </div>

      <article className="paper print-paper" aria-label="Printable paper">
        <header className="print-cover">
          <h2>{set.title}</h2>
          <p>
            Time allowed: <b>{set.durationMin} minutes</b> · Total: <b>{total} marks</b> · {insts.length} questions
          </p>
          <ul className="small">
            <li>Answer all questions. Show your working: marks are given for correct methods.</li>
            <li>You may use a calculator. Give answers to 3 significant figures unless the question says otherwise.</li>
            <li>The marks for each part are shown in brackets.</li>
          </ul>
        </header>
        {insts.map((inst, i) => (
          <section className="print-question" key={i}>
            <div className="stem">
              <span className="q-num">{i + 1}.</span>
              {inst.stem ? <MathText src={inst.stem} inline /> : null}
            </div>
            {inst.diagram && (
              <figure className="diagram">
                <div role="img" aria-label={inst.diagram.alt} dangerouslySetInnerHTML={{ __html: diagramHtml(inst.diagram.svg) }} />
                <figcaption>Figure {i + 1}</figcaption>
              </figure>
            )}
            {inst.parts.map((p, k) => (
              <div className="print-part" key={p.label || k}>
                <div className="q-part-head">
                  {p.label && <span className="q-part-label">({p.label})</span>}
                  <MathText className="q-part-prompt" src={p.prompt} />
                  <span className="q-marks">({p.marks})</span>
                </div>
                <Options part={p} />
                {space !== 'none' && (
                  <div className="answer-lines" aria-hidden="true">
                    {Array.from({ length: Math.max(3, Math.round(p.marks * LINES_PER_MARK[space])) }, (_, j) => (
                      <div key={j} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
        <p className="print-end small">End of questions · Total {total} marks</p>

        {scheme && (
          <section className="print-ms" aria-label="Mark scheme">
            <h2>Mark scheme: {set.title}</h2>
            {insts.map((inst, i) =>
              inst.parts.map((p, k) => (
                <div className="print-ms-part" key={`${i}-${k}`}>
                  <h3 className="h3">
                    {i + 1}
                    {p.label ? `(${p.label})` : ''} <span className="muted small">[{p.marks}]</span>
                  </h3>
                  {choiceAnswer(p) && (
                    <p>
                      Answer: <b>{choiceAnswer(p)}</b>
                    </p>
                  )}
                  {p.answer.type === 'self' && (
                    <div className="print-model">
                      <MathText src={p.answer.model} />
                    </div>
                  )}
                  {p.scheme.map((l, j) => (
                    <div className="scheme-line" key={j}>
                      <span />
                      <span className="scheme-code">{l.code}</span>
                      <MathText src={l.text} inline />
                    </div>
                  ))}
                  {solutions && (
                    <div className="print-solution">
                      {p.solution.map((s, j) => (
                        <MathText className="solution-step" key={j} src={s} />
                      ))}
                    </div>
                  )}
                </div>
              )),
            )}
          </section>
        )}
      </article>
    </div>
  );
}
