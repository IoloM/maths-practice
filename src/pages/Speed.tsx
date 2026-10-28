/**
 * `#/speed`: a speed round — 10 quick questions against a 5-minute clock, marked as you go, with
 * your best score for each kind of round. `?area=…&seed=…` starts from a particular round (the same
 * questions every time), which is how a round can be repeated or shared.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SPEED_AREAS, SPEED_COUNT, SPEED_SECONDS, speedCorrect, speedRound, type SpeedQ } from '../lib/speed';
import { recordSpeed, useSpeed, type SpeedArea, type SpeedRecord } from '../lib/speed-records';
import { answerTex } from '../engine/marking/mark';
import type { Response } from '../engine/marking/types';
import { AnswerInput, hasResponse } from '../components/answers/AnswerInput';
import { MathText, Tex } from '../components/MathText';
import { Loading } from '../components/bits';
import { Icon } from '../components/Icon';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const AREA_LABEL = Object.fromEntries(SPEED_AREAS.map((a) => [a.id, a.label])) as Record<SpeedArea, string>;

interface Round {
  area: SpeedArea;
  seed: number;
  qs: SpeedQ[];
  started: number;
}
interface Done {
  round: Round;
  right: boolean[];
  seconds: number;
  best: boolean;
  before?: SpeedRecord;
}

const bestText = (r: SpeedRecord | undefined) => (r ? `Best ${r.best}/${SPEED_COUNT} in ${mmss(r.bestSeconds)} · ${r.rounds} round${r.rounds === 1 ? '' : 's'}` : 'Not tried yet');

function Running({ round, onDone, onQuit }: { round: Round; onDone: (right: boolean[], seconds: number) => void; onQuit: () => void }) {
  const [i, setI] = useState(0);
  const [response, setResponse] = useState<Response | undefined>();
  const [checked, setChecked] = useState<boolean | null>(null);
  const [right, setRight] = useState<boolean[]>([]);
  const [now, setNow] = useState(Date.now());
  const box = useRef<HTMLDivElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const left = Math.ceil((SPEED_SECONDS * 1000 - (now - round.started)) / 1000);
  const q = round.qs[i];

  const finish = useCallback(
    (marks: boolean[]) => {
      if (finished.current) return;
      finished.current = true;
      const full = Array.from({ length: SPEED_COUNT }, (_, k) => marks[k] ?? false);
      onDone(full, Math.min(SPEED_SECONDS, Math.round((Date.now() - round.started) / 1000)));
    },
    [onDone, round.started],
  );

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (left <= 0) finish(right);
  }, [left, right, finish]);
  useEffect(() => {
    if (checked === null) return void box.current?.querySelector<HTMLElement>('input, textarea, math-field')?.focus();
    // after the Enter that checked the answer has finished, or it would press "Next" too
    const t = window.setTimeout(() => nextBtn.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [i, checked]);

  const check = () => {
    if (checked !== null || !hasResponse(response)) return;
    const ok = speedCorrect(q, response);
    setChecked(ok);
    setRight((r) => [...r, ok]);
  };
  const next = (marks = right) => {
    if (i + 1 >= SPEED_COUNT) return finish(marks);
    setI(i + 1);
    setResponse(undefined);
    setChecked(null);
  };
  const skip = () => {
    const marks = [...right, false];
    setRight(marks);
    next(marks);
  };

  return (
    <div className="stack speed">
      <div className="speed-bar" role="group" aria-label="Speed round">
        <h1 className="speed-title">
          {AREA_LABEL[round.area]} speed round <span className="muted">· question {i + 1} of {SPEED_COUNT}</span>
        </h1>
        <span className="speed-score" role="img" aria-label={`${right.filter(Boolean).length} right so far`}>
          {right.map((ok, k) => (
            <span key={k} className={ok ? 'speed-dot ok' : 'speed-dot no'} aria-hidden="true" />
          ))}
        </span>
        <span className={`timer${left <= 30 ? ' speed-low' : ''}`} role="timer" aria-label={`${mmss(left)} left`}>
          <Icon name="clock" /> {mmss(left)}
        </span>
      </div>
      <section className="card stack" aria-label={`Question ${i + 1}`}>
        <span className="small muted">{q.kind}</span>
        <MathText src={q.prompt} className="speed-q" />
        <div ref={box}>
          <AnswerInput key={i} spec={q.answer} value={response} onChange={setResponse} onSubmit={check} disabled={checked !== null} partLabel="" />
        </div>
        {checked === null ? (
          <div className="btn-row">
            <button className="btn btn-primary" onClick={check} disabled={!hasResponse(response)}>
              Check
            </button>
            <button className="btn btn-ghost" onClick={skip}>
              Skip
            </button>
          </div>
        ) : (
          <>
            <div className={`feedback ${checked ? 'correct' : 'incorrect'}`} role="status">
              <b>{checked ? '✓ Right' : '✗ Not quite'}</b>
              {!checked && (
                <>
                  {' '}
                  — the answer is <Tex tex={answerTex(q.answer)} />
                </>
              )}
              <MathText src={q.how} className="small" />
            </div>
            <div className="btn-row">
              <button ref={nextBtn} className="btn btn-primary" onClick={() => next()}>
                {i + 1 >= SPEED_COUNT ? 'See how you did' : 'Next question'} <Icon name="next" />
              </button>
            </div>
          </>
        )}
      </section>
      <div>
        <button className="btn btn-small btn-ghost" onClick={onQuit}>
          Stop this round
        </button>
      </div>
    </div>
  );
}

function Results({ done, onAgain, onPick }: { done: Done; onAgain: () => void; onPick: () => void }) {
  const got = done.right.filter(Boolean).length;
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => again.current?.focus(), []);
  return (
    <div className="stack">
      <h1>
        {got}/{SPEED_COUNT} in {mmss(done.seconds)}
      </h1>
      <p role="status">
        {done.best ? (done.before ? `A new personal best for ${AREA_LABEL[done.round.area]} — beating ${done.before.best}/${SPEED_COUNT} in ${mmss(done.before.bestSeconds)}.` : `Your first ${AREA_LABEL[done.round.area]} round — that's the score to beat.`) : `Your best is ${done.before!.best}/${SPEED_COUNT} in ${mmss(done.before!.bestSeconds)}.`}
        {done.seconds >= SPEED_SECONDS && got < SPEED_COUNT ? ' Time ran out — anything unanswered counts as wrong.' : ''}
      </p>
      <div className="btn-row">
        <button ref={again} className="btn btn-primary" onClick={onAgain}>
          <Icon name="bolt" /> Go again
        </button>
        <button className="btn" onClick={onPick}>
          Choose another round
        </button>
      </div>
      <ol className="list card speed-review">
        {done.round.qs.map((q, k) => (
          <li key={k}>
            <span className={done.right[k] ? 'speed-mark ok' : 'speed-mark no'}>{done.right[k] ? '✓' : '✗'}</span>
            <div>
              <MathText src={q.prompt} />
              <span className="small">
                Answer: <Tex tex={answerTex(q.answer)} />
              </span>
              <MathText src={q.how} className="small muted" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Speed({ query }: { query: URLSearchParams }) {
  const recs = useSpeed();
  const fixed = useMemo(() => {
    const area = query.get('area') as SpeedArea | null;
    const seed = Number(query.get('seed'));
    return area && SPEED_AREAS.some((a) => a.id === area) && Number.isInteger(seed) && seed > 0 ? { area, seed } : null;
  }, [query]);
  const [round, setRound] = useState<Round | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const used = useRef(false);

  const start = (area: SpeedArea) => {
    const seed = fixed && fixed.area === area && !used.current ? fixed.seed : Math.floor(Math.random() * 1e9) + 1;
    used.current = true;
    setDone(null);
    setRound({ area, seed, qs: speedRound(area, seed), started: Date.now() });
    window.scrollTo({ top: 0 });
  };
  const onDone = useCallback(
    (right: boolean[], seconds: number) => {
      if (!round) return;
      const before = recs?.[round.area];
      void recordSpeed(round.area, { at: Date.now(), got: right.filter(Boolean).length, seconds }).then((best) => {
        setDone({ round, right, seconds, best, before });
        setRound(null);
      });
    },
    [round, recs],
  );

  if (!recs) return <Loading />;
  if (round) return <Running round={round} onDone={onDone} onQuit={() => setRound(null)} />;
  if (done) return <Results done={done} onAgain={() => start(done.round.area)} onPick={() => setDone(null)} />;
  return (
    <div className="stack">
      <div>
        <h1>Speed rounds</h1>
        <p className="muted">10 quick questions, 5 minutes on the clock. Each is marked as soon as you answer. Calculator allowed; give answers exactly or to 3 significant figures unless the question says otherwise.</p>
      </div>
      <div className="grid">
        {SPEED_AREAS.map((a) => (
          <section key={a.id} className="card tile stack" aria-label={`${a.label} speed round`}>
            <h2>
              <Icon name="bolt" /> {a.label}
            </h2>
            <span className="muted">{a.blurb}</span>
            <span className="small">{bestText(recs[a.id])}</span>
            <div>
              <button className="btn btn-primary" onClick={() => start(a.id)} autoFocus={fixed?.area === a.id}>
                Start {a.label.toLowerCase()} round
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
