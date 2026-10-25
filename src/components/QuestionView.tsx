import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { diagramHtml } from './diagram';
import type { Instance } from '../engine/templates/types';
import type { TemplateMeta } from '../engine/templates/types';
import type { FtValue, MarkResult, Response } from '../engine/marking/types';
import { markPart } from '../engine/marking/mark';
import { getStore } from '../storage';
import type { Attempt, Mode, Working } from '../storage/types';
import { useSettings } from '../lib/settings';
import { partAttemptFrom, selfScore, useActiveTime } from '../lib/attempt';
import { recordAttempt, updateAttempt } from '../progress/record';
import { shareUrl } from '../router';
import { CHAPTER_BY_REF } from '../content/chapters';
import { MathText } from './MathText';
import { AnswerInput, hasResponse } from './answers/AnswerInput';
import { WorkingArea, emptyWorking } from '../working/WorkingArea';
import { Icon } from './Icon';
import { Difficulty } from './bits';
import { SchemePanel } from './SchemePanel';
import { BookletButton } from './BookletButton';
import { ReadAloud } from './ReadAloud';
import { questionSpeech } from '../lib/speech';

const DrawingCanvas = lazy(() => import('../working/Canvas'));

interface PartState {
  response?: Response;
  result?: MarkResult;
  hints: number;
  /** worked-solution steps shown in step-by-step mode */
  steps: number;
  ticks: boolean[];
  showScheme: boolean;
  showSolution: boolean;
  revealed: boolean; // self parts: model answer shown
}

interface Props {
  inst: Instance;
  meta: TemplateMeta;
  number?: number;
  mode: Mode;
  setId?: string;
  onFinished?: (a: Attempt) => void;
  onNext?: () => void;
  nextLabel?: string;
}

/** Help counted like hints: one step of the worked solution is a lot of help, two or more the most. */
const helpUsed = (p: PartState) => Math.max(p.hints, p.steps ? Math.min(3, p.steps + 1) : 0);

const verdictText: Record<string, string> = {
  correct: 'Correct',
  partial: 'Partly correct',
  incorrect: 'Incorrect',
  invalid: 'Check your input',
  unanswered: 'Not answered',
  self: 'Self-marked',
};

/**
 * Keyed on the instance itself so every new question gets fresh per-part state, whatever key the
 * caller uses (a route change and a data load can arrive in the same render).
 */
export function QuestionView(props: Props) {
  return <QuestionViewInner key={`${props.inst.templateId}:${props.inst.seed}`} {...props} />;
}

function QuestionViewInner({ inst, meta, number = 1, mode, setId, onFinished, onNext, nextLabel = 'Next question' }: Props) {
  const { settings } = useSettings();
  const key = `${inst.templateId}:${inst.seed}`;
  const total = inst.parts.reduce((s, p) => s + p.marks, 0);
  const [parts, setParts] = useState<PartState[]>(() => inst.parts.map((p) => ({ hints: 0, steps: 0, ticks: p.scheme.map(() => false), showScheme: false, showSolution: false, revealed: false })));
  const [working, setWorking] = useState<Working>(() => emptyWorking(settings.paper, settings.workingMode));
  const [gaveUp, setGaveUp] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const activeTime = useActiveTime();
  const loaded = useRef(false);
  const paperRef = useRef<HTMLElement>(null);
  const [paperH, setPaperH] = useState(400);
  const year = CHAPTER_BY_REF.get(meta.chapter)?.year ?? 1;
  const chapter = CHAPTER_BY_REF.get(meta.chapter);

  // restore draft
  useEffect(() => {
    let alive = true;
    (async () => {
      const store = await getStore();
      const d = await store.getDraft(key);
      if (!alive) return;
      if (d) {
        startedAt.current = d.startedAt;
        setParts((ps) => ps.map((p, i) => ({ ...p, response: d.responses[inst.parts[i].label] ?? p.response, hints: d.hints[inst.parts[i].label] ?? p.hints })));
        if (d.working) setWorking(d.working);
      }
      loaded.current = true;
    })();
    return () => {
      alive = false;
    };
  }, [key, inst.parts]);

  // autosave draft
  const done = attemptId !== null;
  useEffect(() => {
    if (!loaded.current || done) return;
    const t = setTimeout(async () => {
      const store = await getStore();
      await store.putDraft({
        key,
        responses: Object.fromEntries(parts.map((p, i) => [inst.parts[i].label, p.response]).filter(([, r]) => r !== undefined)),
        hints: Object.fromEntries(parts.map((p, i) => [inst.parts[i].label, p.hints])),
        working,
        startedAt: startedAt.current,
        updatedAt: Date.now(),
      });
    }, 600);
    return () => clearTimeout(t);
  }, [parts, working, key, inst.parts, done]);

  // paper height for annotation layer
  useEffect(() => {
    const el = paperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPaperH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setPart = (i: number, p: Partial<PartState>) => setParts((ps) => ps.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const prevValues = useCallback(
    (i: number, ps: PartState[]): Record<string, FtValue | undefined> => {
      const out: Record<string, FtValue | undefined> = {};
      for (let j = 0; j < i; j++) {
        const r = ps[j].result ?? (ps[j].response !== undefined ? markPart(inst.parts[j], ps[j].response, out) : undefined);
        out[inst.parts[j].label] = r?.value ? { ...r.value, correct: r.verdict === 'correct' && !r.ft } : r ? { correct: r.verdict === 'correct' } : undefined;
      }
      return out;
    },
    [inst.parts],
  );

  const check = (i: number) => {
    const part = inst.parts[i];
    if (part.answer.type === 'self') {
      setPart(i, { revealed: true, showScheme: true, result: markPart(part, undefined) });
      return;
    }
    const response = parts[i].response;
    const r = markPart(part, response, prevValues(i, parts));
    if (r.verdict === 'invalid' && typeof response === 'string' && response.includes('\\')) {
      // unusual LaTeX: let Compute Engine (lazy) re-express it, then mark again
      void import('../engine/marking/ce-fallback').then(async ({ ceNormalise }) => {
        const alt = await ceNormalise(response);
        const r2 = alt ? markPart(part, alt, prevValues(i, parts)) : r;
        setPart(i, { result: r2, showScheme: r2.verdict !== 'invalid' && r2.score < r2.max });
      });
      return;
    }
    if (r.verdict === 'invalid' || r.verdict === 'unanswered') {
      setPart(i, { result: r });
      return;
    }
    setPart(i, { result: r, showScheme: r.score < r.max });
  };

  const allDone = parts.every((p, i) => {
    const r = p.result;
    if (!r) return false;
    if (inst.parts[i].answer.type === 'self') return p.revealed;
    return r.verdict !== 'invalid';
  });

  const buildAttempt = useCallback(
    (ps: PartState[], gu: boolean): Attempt => ({
      templateId: inst.templateId,
      seed: inst.seed,
      family: meta.family,
      spec: meta.spec,
      chapter: meta.chapter,
      difficulty: meta.difficulty,
      mode,
      setId,
      startedAt: startedAt.current,
      finishedAt: Date.now(),
      durationMs: Math.round(activeTime()),
      marks: total,
      parts: ps.map((p, i) => partAttemptFrom(inst.parts[i].label, p.result, p.response ?? null, p.ticks, inst.parts[i].scheme, helpUsed(p), inst.parts[i].answer.type === 'self')),
      gaveUp: gu,
      working,
    }),
    [inst, meta, mode, setId, total, working, activeTime],
  );

  // save once all parts are marked
  const saving = useRef(false);
  useEffect(() => {
    if (!allDone || attemptId !== null || saving.current) return;
    saving.current = true;
    const a = buildAttempt(parts, gaveUp);
    recordAttempt(a, meta.time).then(async (id) => {
      setAttemptId(id);
      const store = await getStore();
      await store.deleteDraft(key);
      onFinished?.({ ...a, id });
    });
  }, [allDone, attemptId, buildAttempt, parts, gaveUp, key, meta.time, onFinished]);

  // keep self-marks and working in sync after saving
  useEffect(() => {
    if (attemptId === null) return;
    const t = setTimeout(() => {
      void updateAttempt({ ...buildAttempt(parts, gaveUp), id: attemptId });
    }, 500);
    return () => clearTimeout(t);
  }, [parts, working, attemptId, buildAttempt, gaveUp]);

  const giveUp = () => {
    setGaveUp(true);
    setParts((ps) =>
      ps.map((p, i) => {
        if (p.result && p.result.verdict !== 'invalid') return { ...p, showSolution: true, revealed: true };
        const r: MarkResult = { verdict: 'unanswered', score: 0, max: inst.parts[i].marks, messages: ['You gave up on this part.'], selfMarkable: true };
        return { ...p, result: r, showSolution: true, showScheme: true, revealed: true };
      }),
    );
  };

  const share = async () => {
    const url = shareUrl(`/q/${inst.templateId}/${inst.seed}`);
    try {
      if (navigator.share) await navigator.share({ title: meta.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast('Link copied');
        setTimeout(() => setToast(null), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  const autoScore = parts.reduce((s, p) => s + (p.result?.score ?? 0), 0);
  const selfTotal = parts.reduce((s, p, i) => s + Math.max(p.result?.score ?? 0, selfScore(inst.parts[i].scheme, p.ticks, inst.parts[i].answer.type === 'self')), 0);

  const singleLabel = inst.parts.length === 1 && inst.parts[0].label === '';

  const workingCol = settings.showWorking ? (
    <div className="working-col">
      <WorkingArea working={working} onChange={setWorking} exportName={`working-${inst.templateId}-${inst.seed}`} />
    </div>
  ) : null;

  return (
    <div className={`q-wrap year-${year}`}>
      <div className="q-meta">
        {chapter && <span className="chip chip-accent">{`${chapter.book === 'P1' || chapter.book === 'P2' ? 'Pure' : chapter.stream} Y${chapter.year} · Ch ${chapter.n} ${chapter.title}`}</span>}
        <span className="chip">{meta.spec.join(', ')}</span>
        <span className="chip" title={`Difficulty ${meta.difficulty} of 5`}>
          <Difficulty d={meta.difficulty} /> <span className="sr-only">Difficulty {meta.difficulty} of 5</span>
        </span>
        <span className="chip">{total} marks</span>
        <span className="chip">~{meta.time} min</span>
        <span className="spacer" />
        <button className="btn btn-small btn-ghost" onClick={() => setAnnotating((a) => !a)} aria-pressed={annotating} title="Write on the question">
          <Icon name="annotate" /> {annotating ? 'Stop annotating' : 'Annotate'}
        </button>
        <ReadAloud text={() => questionSpeech(inst, number)} />
        <BookletButton />
        <button className="btn btn-small btn-ghost" onClick={share} title="Share this question">
          <Icon name="share" /> Share
        </button>
      </div>
      <div className={`q-layout ${workingCol ? 'with-working' : ''}`}>
        <div className="q-col">
          <article className="paper" ref={paperRef} aria-label={`Question ${number}`}>
            {annotating && (
              <div className={`annotate-layer ${settings.pencilOnly ? 'pencil-only' : ''}`}>
                <Suspense fallback={null}>
                  <DrawingCanvas
                    strokes={working.annotate}
                    onChange={(annotate) => setWorking((w) => ({ ...w, annotate }))}
                    tool="pen"
                    color="#c62828"
                    size={3}
                    paper="plain"
                    transparent
                    fixedHeight
                    pencilOnly={settings.pencilOnly}
                    height={paperH}
                    label="Annotation layer over the question"
                  />
                </Suspense>
              </div>
            )}
            {!annotating && working.annotate.length > 0 && (
              <div className="annotate-layer" style={{ pointerEvents: 'none' }} aria-hidden="true">
                <Suspense fallback={null}>
                  <DrawingCanvas strokes={working.annotate} onChange={() => {}} tool="pen" color="#c62828" size={3} paper="plain" transparent fixedHeight pencilOnly={false} height={paperH} label="" />
                </Suspense>
              </div>
            )}
            <div className="stem">
              <span className="q-num">{number}.</span>
              {inst.stem ? <MathText src={inst.stem} inline /> : null}
            </div>
            {inst.diagram && (
              <figure className="diagram">
                <div role="img" aria-label={inst.diagram.alt} dangerouslySetInnerHTML={{ __html: diagramHtml(inst.diagram.svg) }} />
                <figcaption>Figure {number}</figcaption>
              </figure>
            )}
            {inst.parts.map((p, i) => {
              const st = parts[i];
              const r = st.result;
              const marked = !!r && r.verdict !== 'invalid' && r.verdict !== 'unanswered';
              const locked = marked || gaveUp || done;
              const mine = selfScore(p.scheme, st.ticks, p.answer.type === 'self');
              const showSelf = r && r.score < r.max && (r.selfMarkable || p.answer.type === 'self' || r.verdict === 'unanswered');
              return (
                <section className="q-part" key={p.label || i} aria-label={p.label ? `Part ${p.label}` : 'Question'}>
                  <div className="q-part-head">
                    {!singleLabel && <span className="q-part-label">({p.label})</span>}
                    <MathText className="q-part-prompt" src={p.prompt} />
                    <span className="q-marks" aria-label={`${p.marks} marks`}>
                      ({p.marks})
                    </span>
                  </div>
                  {p.answer.type !== 'self' ? (
                    <div className={`answer ${!locked ? 'sticky' : ''}`}>
                      <div className="answer-row">
                        <AnswerInput spec={p.answer} value={st.response} onChange={(response) => setPart(i, { response, result: st.result?.verdict === 'invalid' || st.result?.verdict === 'unanswered' ? undefined : st.result })} onSubmit={() => !locked && check(i)} disabled={locked} partLabel={p.label} />
                        {!locked && (
                          <button className="btn btn-primary" onClick={() => check(i)} disabled={!hasResponse(st.response)}>
                            Check
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    !st.revealed && (
                      <div className="part-actions">
                        <button className="btn btn-primary" onClick={() => check(i)}>
                          I've written my answer — show the model answer
                        </button>
                      </div>
                    )
                  )}
                  {r && (
                    <div className={`feedback ${r.verdict}`} role="status" aria-live="polite">
                      <div className="feedback-head">
                        <Icon name={r.verdict === 'correct' ? 'check' : r.verdict === 'partial' || r.verdict === 'self' ? 'info' : 'x'} />
                        <span>{verdictText[r.verdict]}</span>
                        {marked || r.verdict === 'self' || r.verdict === 'unanswered' ? (
                          <span className="score-pill">
                            {' '}
                            · {r.score}/{r.max}
                            {mine > r.score ? ` (self-marked ${mine}/${r.max})` : ''}
                          </span>
                        ) : null}
                        {r.ft && <span className="chip">ft</span>}
                      </div>
                      {r.messages.length > 0 && (
                        <ul>
                          {r.messages.map((m, k) => (
                            <li key={k}>
                              <MathText src={m} inline />
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {p.answer.type === 'self' && st.revealed && (
                    <div className="panel">
                      <div className="panel-title">Model answer</div>
                      <div className="panel-body">
                        <MathText src={p.answer.model} />
                      </div>
                    </div>
                  )}
                  <div className="part-actions">
                    {!locked && st.hints < 3 && st.steps === 0 && (
                      <button className="btn btn-small" onClick={() => setPart(i, { hints: st.hints + 1 })}>
                        <Icon name="bulb" /> {st.hints === 0 ? 'Hint' : `Next hint (${st.hints + 1}/3)`}
                      </button>
                    )}
                    {!locked && st.steps === 0 && p.solution.length > 1 && (
                      <button className="btn btn-small" onClick={() => setPart(i, { steps: 1 })}>
                        <Icon name="list" /> Step by step
                      </button>
                    )}
                    {(r || gaveUp) && (
                      <button className="btn btn-small" onClick={() => setPart(i, { showScheme: !st.showScheme })} aria-expanded={st.showScheme}>
                        <Icon name="scheme" /> Mark scheme
                      </button>
                    )}
                    {(marked || gaveUp || r?.verdict === 'self') && (
                      <button className="btn btn-small" onClick={() => setPart(i, { showSolution: !st.showSolution })} aria-expanded={st.showSolution}>
                        <Icon name="book" /> {st.showSolution ? 'Hide' : 'Show'} worked solution
                      </button>
                    )}
                  </div>
                  {st.hints > 0 && (
                    <div aria-live="polite">
                      {p.hints.slice(0, st.hints).map((h, k) => (
                        <div className="hint" key={k}>
                          <strong>{['Nudge', 'Method', 'First step'][k]}: </strong>
                          <MathText src={h} inline />
                        </div>
                      ))}
                    </div>
                  )}
                  {st.steps > 0 && (
                    <div className="panel steps-panel" role="region" aria-label={`Step by step${singleLabel ? '' : `, part ${p.label}`}`}>
                      <div className="panel-title">Step by step</div>
                      <div className="panel-body">
                        <ol className="steps">
                          {p.solution.slice(0, locked ? p.solution.length : st.steps).map((step, k) => (
                            <li key={k}>
                              <MathText className="solution-step" src={step} />
                            </li>
                          ))}
                        </ol>
                        {!locked &&
                          (st.steps < p.solution.length - 1 ? (
                            <>
                              <p className="small muted">Try the next step on paper first, then check it.</p>
                              <button className="btn btn-small" onClick={() => setPart(i, { steps: st.steps + 1 })}>
                                Show step {st.steps + 1} of {p.solution.length}
                              </button>
                            </>
                          ) : (
                            <p className="small">
                              <b>The last step is yours:</b> finish it and {p.answer.type === 'self' ? 'compare with the model answer' : 'check your answer'}.
                            </p>
                          ))}
                      </div>
                    </div>
                  )}
                  {st.showScheme && (
                    <SchemePanel
                      part={p}
                      ticks={st.ticks}
                      onTicks={showSelf ? (ticks) => setPart(i, { ticks }) : null}
                      auto={r?.score ?? 0}
                      where={singleLabel ? '' : `part ${p.label}`}
                      noAnswer={gaveUp || r?.verdict === 'unanswered'}
                    />
                  )}
                  {st.showSolution && (
                    <div className="panel">
                      <div className="panel-title">Worked solution</div>
                      <div className="panel-body">
                        {p.solution.map((s, k) => (
                          <MathText className="solution-step" key={k} src={s} />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </article>
          <div className="q-footer">
            {!allDone && !gaveUp && (
              <button className="btn" onClick={giveUp}>
                Give up &amp; show solutions
              </button>
            )}
            {allDone && (
              <span className="score-pill" aria-live="polite">
                Total: {autoScore}/{total}
                {selfTotal > autoScore ? ` · with self-marking ${selfTotal}/${total}` : ''}
              </span>
            )}
            <span className="spacer" />
            {onNext && (
              <button className={`btn ${allDone ? 'btn-primary' : ''}`} onClick={onNext}>
                {allDone ? nextLabel : 'Skip'} <Icon name="next" />
              </button>
            )}
          </div>
        </div>
        {workingCol}
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export function useInstanceKey(inst: Instance | null): string {
  return useMemo(() => (inst ? `${inst.templateId}:${inst.seed}` : ''), [inst]);
}
