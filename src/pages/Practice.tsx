import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInstance, ENTRY_BY_ID } from '../content/bank';
import { pickNext, type SessionConfig, candidates } from '../lib/session';
import type { Instance } from '../engine/templates/types';
import { QuestionView } from '../components/QuestionView';
import { Loading, ErrorBox, plural } from '../components/bits';
import { useProgress } from '../lib/useProgress';
import { CHAPTER_BY_REF } from '../content/chapters';
import { SPEC_BY_REF } from '../content/spec';
import { href } from '../router';
import { PastPaperRefs } from '../components/PastPaperRefs';
import { PAST_QUESTIONS } from '../content/past-papers';
import { useSettings } from '../lib/settings';
import { scoreOf } from '../progress/mastery';
import { Icon } from '../components/Icon';
import type { Attempt, Mode } from '../storage/types';

const PPQ_FAMILIES = [...new Set(PAST_QUESTIONS.flatMap((q) => q.families))];

const sessionTotals = (as: Attempt[]) => {
  const got = as.reduce((t, a) => t + scoreOf(a), 0),
    of = as.reduce((t, a) => t + a.marks, 0);
  return { got, of, pct: of ? Math.round((100 * got) / of) : 0, minutes: Math.max(1, Math.round(as.reduce((t, a) => t + a.durationMs, 0) / 60_000)) };
};

/** What you did this session: marks, time, and the questions to look at again. */
function SessionSummary({ session, onMore }: { session: Attempt[]; onMore: () => void }) {
  const t = sessionTotals(session);
  const again = session.filter((a) => scoreOf(a) < a.marks);
  return (
    <section className="card stack session-summary" aria-labelledby="session-h">
      <h2 id="session-h">Session summary</h2>
      <div className="week-kpis">
        <div>
          <b>{session.length}</b>
          <span className="muted small">{session.length === 1 ? 'question' : 'questions'}</span>
        </div>
        <div>
          <b>
            {t.got}/{t.of}
          </b>
          <span className="muted small">marks ({t.pct}%)</span>
        </div>
        <div>
          <b>{t.minutes}</b>
          <span className="muted small">{t.minutes === 1 ? 'minute' : 'minutes'}</span>
        </div>
      </div>
      {again.length ? (
        <>
          <h3>Worth another go</h3>
          <ul className="list">
            {again.map((a) => (
              <li key={`${a.templateId}:${a.seed}`}>
                <a className="list-link" href={href(`/q/${a.templateId}/${a.seed}`)}>
                  <span style={{ flex: 1 }}>{ENTRY_BY_ID.get(a.templateId)?.title ?? a.templateId}</span>
                  <span className="chip">
                    {scoreOf(a)}/{a.marks}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p style={{ margin: 0 }}>Full marks on every question. Try something harder, or a timed set.</p>
      )}
      <div className="btn-row">
        <button className="btn btn-primary" onClick={onMore}>
          <Icon name="play" /> Keep practising
        </button>
        <a className="btn" href={href('/progress')}>
          See your progress
        </a>
      </div>
    </section>
  );
}

export function Practice({ query }: { query: URLSearchParams }) {
  const { settings } = useSettings();
  const cfg: SessionConfig = useMemo(() => {
    const chapters = query.get('c')?.split(',').filter(Boolean);
    const templates = query.get('t')?.split(',').filter(Boolean);
    return {
      chapters,
      templates,
      specs: query.get('s')?.split(',').filter(Boolean),
      streams: query.get('st')?.split(',').filter(Boolean),
      minMarks: Number(query.get('mm') ?? 0),
      families: query.get('pp') ? PPQ_FAMILIES : undefined,
      // AS: mixed practice stays in Year 1 (a chapter or question chosen by name is still honoured)
      level: settings.course === 'as' && !chapters?.length && !templates?.length ? 'AS' : undefined,
      dmin: Number(query.get('dmin') ?? 1),
      dmax: Number(query.get('dmax') ?? 5),
    };
  }, [query, settings.course]);
  const mode: Mode = (cfg.chapters?.length ?? 0) > 1 || query.get('mixed') ? 'mixed' : 'practice';
  const { attempts, loading } = useProgress();
  const [inst, setInst] = useState<Instance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(1);
  // this visit's finished questions, for the running total and the summary
  const [session, setSession] = useState<Attempt[]>([]);
  const [summary, setSummary] = useState(false);
  useEffect(() => {
    setSession([]);
    setSummary(false);
  }, [cfg]);
  const recent = useRef<string[]>([]);
  const attemptsRef = useRef(attempts);
  attemptsRef.current = attempts;

  const next = useCallback(async () => {
    setError(null);
    try {
      const pick = await pickNext(cfg, attemptsRef.current, recent.current);
      if (!pick) {
        setError('No questions match this selection yet.');
        return;
      }
      recent.current = [...recent.current.slice(-4), pick.templateId];
      const i = await getInstance(pick.templateId, pick.seed);
      setInst(i);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    }
  }, [cfg]);

  useEffect(() => {
    if (!loading && !inst) void next();
  }, [loading, inst, next]);

  const title = query.get('from') === 'mistakes' ? 'Putting mistakes right' : query.get('from') === 'saved' ? 'Questions like the ones you saved' : query.get('from') === 'stretch' && (cfg.templates?.length ?? 0) > 1 ? 'A* stretch problems' : cfg.templates?.length === 1 ? ENTRY_BY_ID.get(cfg.templates[0])?.title : cfg.chapters?.length === 1 ? CHAPTER_BY_REF.get(cfg.chapters[0] as never)?.title : cfg.specs?.length === 1 ? `${cfg.specs[0]} ${SPEC_BY_REF.get(cfg.specs[0] as never)?.title ?? ''}` : cfg.families ? 'Topics that have come up on past papers' : cfg.minMarks ? 'Long exam-style questions' : cfg.streams?.length === 1 ? `Mixed practice — ${cfg.streams[0]}` : 'Mixed practice';
  const pool = candidates(cfg).length;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ margin: 0 }}>
            {cfg.chapters?.length === 1 ? <a href={href(`/chapter/${cfg.chapters[0]}`)}>← Chapter</a> : <a href={href('/topics')}>← Topics</a>} · {plural(pool, 'question type')}
          </p>
          <h1>{title}</h1>
        </div>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {session.length > 0 && !summary && (
        <div className="session-bar small" role="status">
          <span>
            This session: <b>{plural(session.length, 'question')}</b> · {sessionTotals(session).got}/{sessionTotals(session).of} marks ({sessionTotals(session).pct}%) · {plural(sessionTotals(session).minutes, 'min', 'min')}
          </span>
          <button className="btn btn-small" onClick={() => setSummary(true)}>
            Finish and see summary
          </button>
        </div>
      )}
      {summary && <SessionSummary session={session} onMore={() => setSummary(false)} />}
      {!inst && !error && <Loading label="Preparing a question…" />}
      {!summary && inst && ENTRY_BY_ID.get(inst.templateId) && (
        <QuestionView
          key={`${inst.templateId}:${inst.seed}`}
          inst={inst}
          meta={ENTRY_BY_ID.get(inst.templateId)!}
          number={n}
          mode={mode}
          onFinished={(a) => setSession((xs) => [...xs, a])}
          onNext={() => {
            setN((x) => x + 1);
            void next();
          }}
        />
      )}
      {!summary && inst && ENTRY_BY_ID.get(inst.templateId) && <PastPaperRefs family={ENTRY_BY_ID.get(inst.templateId)!.family} />}
    </div>
  );
}
