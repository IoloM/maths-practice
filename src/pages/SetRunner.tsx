import { useEffect, useMemo, useRef, useState } from 'react';
import { diagramHtml } from '../components/diagram';
import { getInstance, ENTRY_BY_ID, type BankEntry } from '../content/bank';
import type { Instance } from '../engine/templates/types';
import type { MarkResult, Response } from '../engine/marking/types';
import { getStore } from '../storage';
import type { Attempt, SetRecord, Working } from '../storage/types';
import { encodeSet, setMarks, decodeSet } from '../lib/sets';
import { attemptsForSet, markInstance } from '../lib/set-marking';
import { partAttemptFrom, selfScore, formatDuration } from '../lib/attempt';
import { recordAttempt, updateAttempt } from '../progress/record';
import { scoreOf } from '../progress/mastery';
import { useProgress } from '../lib/useProgress';
import { useSettings } from '../lib/settings';
import { QuestionView } from '../components/QuestionView';
import { AnswerInput } from '../components/answers/AnswerInput';
import { MathText } from '../components/MathText';
import { Icon } from '../components/Icon';
import { ErrorBox, Loading } from '../components/bits';
import { SchemePanel } from '../components/SchemePanel';
import { BookletButton } from '../components/BookletButton';
import { ReadAloud } from '../components/ReadAloud';
import { SaveButton } from '../components/SaveButton';
import { questionSpeech } from '../lib/speech';
import { WorkingArea, emptyWorking } from '../working/WorkingArea';
import { href, navigate, shareUrl } from '../router';
import { startSet } from './Exams';
import { LATEST, gradeFor } from '../lib/grades';
import { cloudMe, handIn, setWork } from '../lib/cloud';
import { currentLogin } from '../lib/logins';
import { CHECK_GAPS, recordCheck, setFlag } from '../lib/topics';
import { CHAPTER_BY_REF } from '../content/chapters';

/** `#/set/import?c=<code>` — create a set from a shared link, then open it. */
/** "got/of" from a challenge link, if it makes sense. */
function parseBeat(beat: string | undefined, by: string | undefined): SetRecord['challenge'] {
  const m = /^(\d{1,3})\/(\d{1,3})$/.exec(beat ?? '');
  if (!m || +m[1] > +m[2] || !+m[2]) return undefined;
  return { by: (by ?? '').trim().slice(0, 40) || 'Someone', got: +m[1], of: +m[2] };
}

export function ImportSet({ code, beat, by }: { code: string; beat?: string; by?: string }) {
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    const s = decodeSet(code);
    if (!s || s.items.some((i) => !ENTRY_BY_ID.has(i.templateId))) {
      setErr('This shared set link is not valid (it may be from a newer version of the app).');
      return;
    }
    const challenge = parseBeat(beat, by);
    void startSet({ ...s, title: s.title, ...(challenge ? { challenge } : {}) });
  }, [code, beat, by]);
  return err ? <ErrorBox>{err}</ErrorBox> : <Loading label="Opening the shared set…" />;
}

export function SetRunner({ id }: { id: string }) {
  const [set, setSet] = useState<SetRecord | null | undefined>(undefined);
  const [insts, setInsts] = useState<Instance[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  if (!insts) return <Loading label="Preparing questions…" />;
  const metas = set.items.map((it) => ENTRY_BY_ID.get(it.templateId)!);
  const save = async (s: SetRecord) => {
    setSet(s);
    await (await getStore()).putSet(s);
  };
  if (set.kind === 'daily') return <DailyRunner set={set} insts={insts} metas={metas} />;
  if (set.status === 'new') return <ExamIntro set={set} metas={metas} onStart={() => save({ ...set, status: 'running', startedAt: Date.now() })} />;
  if (set.status === 'running') return <ExamView set={set} insts={insts} metas={metas} onSave={save} />;
  return <SetResults set={set} insts={insts} metas={metas} />;
}

// ---------------------------------------------------------------- daily set: one at a time, instant feedback
function DailyRunner({ set, insts, metas }: { set: SetRecord; insts: Instance[]; metas: BankEntry[] }) {
  const { attempts, loading } = useProgress();
  const done = useMemo(() => new Set(attempts.filter((a) => a.setId === set.id).map((a) => `${a.templateId}:${a.seed}`)), [attempts, set.id]);
  const firstOpen = (from: number) => {
    for (let i = from; i < insts.length; i++) if (!done.has(`${insts[i].templateId}:${insts[i].seed}`)) return i;
    return insts.length;
  };
  const [idx, setIdx] = useState<number | null>(null);
  useEffect(() => {
    if (!loading && idx === null) setIdx(firstOpen(0));
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps
  if (loading || idx === null) return <Loading />;
  const mine = attempts.filter((a) => a.setId === set.id);
  if (idx >= insts.length) {
    const got = mine.reduce((s, a) => s + scoreOf(a), 0),
      of = mine.reduce((s, a) => s + a.marks, 0);
    return (
      <div className="stack">
        <h1>{set.title}</h1>
        <div className="card stack">
          <h2>Done for today</h2>
          <p>
            You scored <b>{got}</b> out of <b>{of}</b>. A new set will be ready tomorrow.
          </p>
          <ul className="list">
            {insts.map((inst, i) => {
              const a = mine.find((x) => x.templateId === inst.templateId && x.seed === inst.seed);
              return (
                <li key={i}>
                  <a className="list-link" href={href(`/q/${inst.templateId}/${inst.seed}`)}>
                    <span style={{ flex: 1 }}>{metas[i].title}</span>
                    {a && (
                      <span className="score-pill">
                        {scoreOf(a)}/{a.marks}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="btn-row">
            <a className="btn btn-primary" href={href('/exams')}>
              Back to exams and sets
            </a>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ margin: 0 }}>
            <a href={href('/exams')}>← Exams and sets</a> · question {idx + 1} of {insts.length}
          </p>
          <h1>{set.title}</h1>
        </div>
      </div>
      <QuestionView inst={insts[idx]} meta={metas[idx]} number={idx + 1} mode="daily" setId={set.id} onNext={() => setIdx(firstOpen(idx + 1))} nextLabel={idx + 1 < insts.length ? 'Next question' : 'Finish'} />
    </div>
  );
}

/** Admins: give everyone in the study group this set to do, with a due date. */
function SetForGroup({ set, marks }: { set: SetRecord; marks: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [due, setDue] = useState('');
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  if (!open)
    return (
      <div className="btn-row">
        <button className="btn btn-small" onClick={() => setOpen(true)}>
          Set this for the group
        </button>
      </div>
    );
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await setWork({ title: title.trim() || set.title, items: set.items.map(({ templateId, seed }) => ({ templateId, seed })), durationMin: set.durationMin, due: due || null });
          setState({ ok: true, text: 'Set for the group — it’s on everyone’s Set work page.' });
        } catch (err) {
          setState({ ok: false, text: (err as Error).message });
        }
      }}
    >
      <div className="panel-title">Set for the group</div>
      <div className="panel-body stack">
        <label className="stack">
          <span className="small">Title</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>
        <label className="row">
          Due (optional) <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <p className="small muted">
          {set.items.length} questions · {marks} marks · {set.durationMin} minutes. Everyone gets the same questions.
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" type="submit" disabled={state?.ok}>
            Set it
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
        {state && (
          <p className={`small ${state.ok ? '' : 'error-text'}`} role="status">
            {state.text}
          </p>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- exam: intro
function ExamIntro({ set, metas, onStart }: { set: SetRecord; metas: BankEntry[]; onStart: () => void }) {
  const marks = metas.reduce((s, m) => s + m.marks, 0);
  return (
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>
        <a href={href('/exams')}>← Exams and sets</a>
      </p>
      <h1>{set.title}</h1>
      {set.challenge && (
        <p className="card challenge" role="note">
          <Icon name="award" /> <b>{set.challenge.by}</b> scored {set.challenge.got}/{set.challenge.of} on these questions. Can you beat it?
        </p>
      )}
      <div className="card stack">
        <p>
          <b>{metas.length}</b> questions · <b>{marks}</b> marks · <b>{set.durationMin}</b> minutes
        </p>
        <ul>
          <li>Answers are not marked until you finish (or the time runs out).</li>
          <li>Use a calculator. The formula booklet and statistical tables open from the button at the top while you work.</li>
          <li>Show your working in the working area or on paper; method marks can be self-awarded afterwards.</li>
          <li>Your answers are saved as you go, so you can close the app and come back. The clock keeps running.</li>
        </ul>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={onStart}>
            <Icon name="clock" /> Start — the timer begins now
          </button>
          <a className="btn" href={href(`/print/${set.id}`)}>
            <Icon name="download" /> Print it instead
          </a>
        </div>
        {cloudMe()?.admin && !set.assignmentId && <SetForGroup set={set} marks={marks} />}
      </div>
    </div>
  );
}

const mmss = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- exam: answering under timed conditions
function ExamView({ set, insts, metas, onSave }: { set: SetRecord; insts: Instance[]; metas: BankEntry[]; onSave: (s: SetRecord) => Promise<void> }) {
  const { settings } = useSettings();
  const [responses, setResponses] = useState<Record<string, Response>>(set.responses ?? {});
  const [working, setWorking] = useState<Record<number, Working>>(set.working ?? {});
  const [openWork, setOpenWork] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const endAt = (set.startedAt ?? Date.now()) + set.durationMin * 60_000;
  const remaining = Math.max(0, endAt - now);
  const latest = useRef({ responses, working });
  latest.current = { responses, working };

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // autosave answers and working
  useEffect(() => {
    const t = setTimeout(() => void getStore().then((st) => st.putSet({ ...set, responses, working })), 700);
    return () => clearTimeout(t);
  }, [responses, working, set]);

  const finish = async (timeUp: boolean) => {
    if (busy) return;
    if (!timeUp && !window.confirm('Finish and mark this set now?')) return;
    setBusy(true);
    const finishedAt = Date.now();
    const done: SetRecord = { ...set, responses: latest.current.responses, working: latest.current.working, finishedAt, status: 'finished' };
    const totalMs = Math.min(finishedAt - (set.startedAt ?? finishedAt), set.durationMin * 60_000);
    const atts = attemptsForSet(done, insts, metas, totalMs);
    for (let i = 0; i < atts.length; i++) await recordAttempt({ ...atts[i], working: latest.current.working[i] }, metas[i].time);
    await onSave(done);
    window.scrollTo({ top: 0 });
  };
  const timeUpFired = useRef(false);
  useEffect(() => {
    if (remaining === 0 && !timeUpFired.current) {
      timeUpFired.current = true;
      void finish(true);
    }
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = insts.reduce((s, inst, i) => s + inst.parts.filter((p) => p.answer.type !== 'self' && responses[`${i}:${p.label}`] !== undefined && responses[`${i}:${p.label}`] !== '').length, 0);
  const answerable = insts.reduce((s, inst) => s + inst.parts.filter((p) => p.answer.type !== 'self').length, 0);
  const sectionAt = new Map((set.sections ?? []).map((s) => [s.from, s.name]));

  return (
    <div className="stack exam">
      <div className="exam-bar" role="region" aria-label="Exam controls">
        <span className={`exam-clock ${remaining < 5 * 60_000 ? 'warn' : ''}`} aria-label={`Time remaining ${mmss(remaining)}`}>
          <Icon name="clock" /> {mmss(remaining)}
        </span>
        <span className="muted small">
          {answered}/{answerable} answered
        </span>
        <span className="spacer" />
        <BookletButton className="btn btn-small" />
        <button className="btn btn-small btn-primary" onClick={() => void finish(false)} disabled={busy}>
          Finish &amp; mark
        </button>
      </div>
      <h1>{set.title}</h1>
      {insts.map((inst, i) => (
        <div key={i} className="stack">
          {sectionAt.has(i) && <h2 className="exam-section">{sectionAt.get(i)}</h2>}
          <article className="paper" aria-label={`Question ${i + 1}`}>
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
            {inst.parts.map((p) => (
              <section className="q-part" key={p.label || 'only'} aria-label={p.label ? `Question ${i + 1} part ${p.label}` : `Question ${i + 1}`}>
                <div className="q-part-head">
                  {p.label && <span className="q-part-label">({p.label})</span>}
                  <MathText className="q-part-prompt" src={p.prompt} />
                  <span className="q-marks" aria-label={`${p.marks} marks`}>
                    ({p.marks})
                  </span>
                </div>
                {p.answer.type === 'self' ? (
                  <p className="small muted">Write your answer in the working area or on paper — you will self-mark it against the mark scheme at the end.</p>
                ) : (
                  <div className="answer">
                    <div className="answer-row">
                      <AnswerInput spec={p.answer} value={responses[`${i}:${p.label}`]} onChange={(r) => setResponses((x) => ({ ...x, [`${i}:${p.label}`]: r }))} onSubmit={() => {}} partLabel={p.label} questionNumber={i + 1} />
                    </div>
                  </div>
                )}
              </section>
            ))}
            <div className="part-actions">
              <ReadAloud className="btn btn-small" text={() => questionSpeech(inst, i + 1)} label={`Read question ${i + 1} aloud`} />
              <button className="btn btn-small" onClick={() => setOpenWork(openWork === i ? null : i)} aria-expanded={openWork === i}>
                <Icon name="pen" /> {openWork === i ? 'Hide working' : 'Working'}
              </button>
            </div>
          </article>
          {openWork === i && <WorkingArea working={working[i] ?? emptyWorking(settings.paper, settings.workingMode)} onChange={(w) => setWorking((x) => ({ ...x, [i]: w }))} exportName={`working-${set.id}-q${i + 1}`} />}
        </div>
      ))}
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => void finish(false)} disabled={busy}>
          Finish &amp; mark
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- results and review
function responseText(inst: Instance, k: number, r: Response | undefined | null): string {
  if (r === undefined || r === null || r === '') return '—';
  const a = inst.parts[k].answer;
  if (a.type === 'choice') return (Array.isArray(r) ? r : [String(r)]).map((x) => a.options[Number(x)] ?? x).join('; ');
  if (Array.isArray(r)) return r.filter(Boolean).map((x) => `$${x}$`).join(', ');
  if (typeof r === 'object') return Object.values(r).filter(Boolean).join(' · ');
  return `$${r}$`;
}

function ReviewQuestion({ inst, n, attempt, results }: { inst: Instance; n: number; attempt: Attempt; results: MarkResult[] }) {
  const [ticks, setTicks] = useState<boolean[][]>(() => inst.parts.map((p, k) => p.scheme.map((_, j) => attempt.parts[k]?.self?.ticks.includes(j) ?? false)));
  const [showSol, setShowSol] = useState(false);
  const save = (next: boolean[][]) => {
    setTicks(next);
    const parts = inst.parts.map((p, k) => partAttemptFrom(p.label, results[k], attempt.parts[k]?.response ?? null, next[k], p.scheme, 0, p.answer.type === 'self'));
    void updateAttempt({ ...attempt, parts });
  };
  return (
    <article className="paper" aria-label={`Review question ${n}`}>
      <div className="stem">
        <span className="q-num">{n}.</span>
        {inst.stem ? <MathText src={inst.stem} inline /> : null}
      </div>
      {inst.diagram && (
        <figure className="diagram">
          <div role="img" aria-label={inst.diagram.alt} dangerouslySetInnerHTML={{ __html: diagramHtml(inst.diagram.svg) }} />
        </figure>
      )}
      {inst.parts.map((p, k) => {
        const r = results[k];
        const canSelf = (p.answer.type === 'self' || r.selfMarkable) && r.score < r.max;
        const self = selfScore(p.scheme, ticks[k], p.answer.type === 'self');
        return (
          <section className="q-part" key={p.label || k}>
            <div className="q-part-head">
              {p.label && <span className="q-part-label">({p.label})</span>}
              <MathText className="q-part-prompt" src={p.prompt} />
              <span className="q-marks">({p.marks})</span>
            </div>
            {p.answer.type !== 'self' && (
              <p className="small">
                Your answer: <MathText src={responseText(inst, k, attempt.parts[k]?.response)} inline />
              </p>
            )}
            <div className={`feedback ${r.verdict}`}>
              <div className="feedback-head">
                <Icon name={r.verdict === 'correct' ? 'check' : r.verdict === 'partial' || r.verdict === 'self' ? 'info' : 'x'} />
                <span className="score-pill">
                  {Math.max(r.score, self)}/{r.max}
                  {self > r.score ? ' (self-marked)' : ''}
                </span>
                {r.ft && <span className="chip">ft</span>}
              </div>
              {r.messages.length > 0 && (
                <ul>
                  {r.messages.map((m, j) => (
                    <li key={j}>
                      <MathText src={m} inline />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {p.answer.type === 'self' && (
              <div className="panel">
                <div className="panel-title">Model answer</div>
                <div className="panel-body">
                  <MathText src={p.answer.model} />
                </div>
              </div>
            )}
            <SchemePanel
              part={p}
              ticks={ticks[k]}
              onTicks={canSelf ? (t) => save(ticks.map((row, kk) => (kk === k ? t : row))) : null}
              auto={r.score}
              where={`in question ${n}${p.label ? ` part ${p.label}` : ''}`}
              noAnswer={r.verdict === 'unanswered'}
            />
            {showSol && (
              <div className="panel">
                <div className="panel-title">Worked solution</div>
                <div className="panel-body">
                  {p.solution.map((s, j) => (
                    <MathText className="solution-step" key={j} src={s} />
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
      <div className="part-actions">
        <button className="btn btn-small" onClick={() => setShowSol((x) => !x)} aria-expanded={showSol}>
          <Icon name="book" /> {showSol ? 'Hide' : 'Show'} worked solutions
        </button>
        <a className="btn btn-small" href={href('/practice', { t: inst.templateId })}>
          Practise more like this
        </a>
        <SaveButton templateId={inst.templateId} seed={inst.seed} className="btn btn-small" />
      </div>
    </article>
  );
}

/** After a topic check-in: record it, and say whether the topic has stuck. */
function CheckinResult({ chapter, n, setId, got, of }: { chapter: string; n: number; setId: string; got: number; of: number }) {
  const title = CHAPTER_BY_REF.get(chapter as never)?.title ?? chapter;
  const ok = of > 0 && got / of >= 0.6;
  const [again, setAgain] = useState(false);
  useEffect(() => {
    if (of > 0) void recordCheck(chapter, { at: Date.now(), got, of, set: setId });
  }, [chapter, setId, got, of]);
  const left = CHECK_GAPS.length - (n + 1);
  return (
    <div className={`card stack checkin-result ${ok ? 'won' : ''}`} role="status">
      <b>
        Check-in {n + 1} of {CHECK_GAPS.length} on {title}: {got}/{of}
      </b>
      {ok ? (
        <span>{left ? `It’s sticking. Next check-in in ${CHECK_GAPS[n + 1]} days.` : 'All three check-ins done — you’ve learnt it.'}</span>
      ) : (
        <>
          <span>It hasn’t quite stuck yet. Go back over the notes and try a few more, then mark it learnt again.</span>
          <div className="btn-row">
            <button className="btn btn-small btn-primary" disabled={again} onClick={() => void setFlag(chapter, 'help').then(() => setAgain(true))}>
              {again ? 'Marked: need help' : 'Mark it “need help” again'}
            </button>
            <a className="btn btn-small" href={href(`/learn/${chapter}`)}>
              Notes and videos
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function SetResults({ set, insts, metas }: { set: SetRecord; insts: Instance[]; metas: BankEntry[] }) {
  const { attempts, loading } = useProgress();
  const [open, setOpen] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // work set for the group: hand in the score, and again whenever self-marking changes it
  const handedIn = useRef<number | null>(null);
  useEffect(() => {
    if (loading || !set.assignmentId || !cloudMe()) return;
    const of = setMarks(set.items);
    const got = attempts.filter((a) => a.setId === set.id).reduce((s, a) => s + scoreOf(a), 0);
    if (!of || handedIn.current === got) return;
    const t = setTimeout(() => {
      handIn(set.assignmentId!, Math.min(got, of), of)
        .then(() => (handedIn.current = got))
        .catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [loading, attempts, set]);
  const results = useMemo(
    () =>
      insts.map((inst, i) => {
        const responses: Record<string, Response | undefined> = {};
        for (const p of inst.parts) responses[p.label] = set.responses?.[`${i}:${p.label}`];
        return markInstance(inst, responses);
      }),
    [insts, set.responses],
  );
  if (loading) return <Loading />;
  const mine = insts.map((inst) => attempts.find((a) => a.setId === set.id && a.templateId === inst.templateId && a.seed === inst.seed));
  const total = setMarks(set.items);
  const got = mine.reduce((s, a) => s + (a ? scoreOf(a) : 0), 0);
  const used = (set.finishedAt ?? 0) - (set.startedAt ?? 0);
  const pct = total ? Math.round((100 * got) / total) : 0;
  const grade = set.kind === 'mock' && total ? gradeFor(got / total) : null;
  const sections = set.sections?.length ? set.sections : [{ name: 'Questions', from: 0, to: insts.length }];
  const share = async (challenge = false) => {
    const name = currentLogin()?.name;
    const extra = challenge ? `&beat=${got}/${total}${name ? `&by=${encodeURIComponent(name)}` : ''}` : '';
    const url = shareUrl(`/set/import?c=${encodeURIComponent(encodeSet(set))}${extra}`);
    const text = challenge ? `I got ${got}/${total} on “${set.title}”. Can you beat it?` : undefined;
    try {
      if (navigator.share) await navigator.share({ title: set.title, text, url });
      else {
        await navigator.clipboard.writeText(text ? `${text} ${url}` : url);
        setToast(challenge ? 'Challenge copied — send it to a friend' : 'Link copied — anyone with it gets the same questions');
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      /* cancelled */
    }
  };
  const ch = set.challenge;
  const ci = set.checkin;
  return (
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>
        <a href={href('/exams')}>← Exams and sets</a>
      </p>
      <h1>{set.title}</h1>
      <div className="kpis">
        <div className="card kpi">
          <b>
            {got}/{total}
          </b>
          <span className="muted small">marks ({pct}%)</span>
        </div>
        <div className="card kpi">
          <b>{formatDuration(Math.max(0, used))}</b>
          <span className="muted small">of {set.durationMin} min allowed</span>
        </div>
        <div className="card kpi">
          <b>{total ? (used / 60000 / total).toFixed(2) : '–'}</b>
          <span className="muted small">minutes per mark (target 1.2)</span>
        </div>
        {grade && (
          <a className="card kpi" href={href('/progress')}>
            <b>{grade}</b>
            <span className="muted small">grade for {pct}% on {LATEST.series} boundaries</span>
          </a>
        )}
      </div>
      {ci && <CheckinResult chapter={ci.chapter} n={ci.n} setId={set.id} got={got} of={total} />}
      {ch && (
        <p className={`card challenge ${got > ch.got ? 'won' : ''}`} role="status">
          <Icon name="award" />{' '}
          {got > ch.got ? (
            <>
              <b>You beat {ch.by}!</b> {got}/{total} against their {ch.got}/{ch.of}.
            </>
          ) : got === ch.got ? (
            <>
              <b>A draw with {ch.by}:</b> you both got {got}/{total}.
            </>
          ) : (
            <>
              <b>
                {ch.by} wins this one: {ch.got}/{ch.of}
              </b>{' '}
              against your {got}/{total}. Tick any method marks you earned below — they count.
            </>
          )}
        </p>
      )}
      <p className="small muted">
        Auto-marked answers are scored already. Open each question to compare your working with the mark scheme and tick any method marks you earned. <a href={href(`/print/${set.id}`)}>Print this paper and its mark scheme</a>
      </p>
      {sections.map((sec) => (
        <section className="card" key={sec.name}>
          <h2>
            {sec.name}
            <span className="muted small">
              {' '}
              · {mine.slice(sec.from, sec.to).reduce((s, a) => s + (a ? scoreOf(a) : 0), 0)}/{metas.slice(sec.from, sec.to).reduce((s, m) => s + m.marks, 0)}
            </span>
          </h2>
          <ul className="list">
            {insts.slice(sec.from, sec.to).map((inst, j) => {
              const i = sec.from + j;
              const a = mine[i];
              return (
                <li key={i} className="stack">
                  <button className="list-link" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                    <span className="chip">Q{i + 1}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{metas[i].title}</span>
                    <span className="score-pill">
                      {a ? scoreOf(a) : 0}/{metas[i].marks}
                    </span>
                  </button>
                  {open === i && a && <ReviewQuestion inst={inst} n={i + 1} attempt={a} results={results[i]} />}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => void share(true)}>
          <Icon name="award" /> Challenge a friend to beat {got}/{total}
        </button>
        <button className="btn" onClick={() => void share()}>
          <Icon name="share" /> Share these questions
        </button>
        <button className="btn" onClick={() => navigate('/exams')}>
          Back to exams and sets
        </button>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
