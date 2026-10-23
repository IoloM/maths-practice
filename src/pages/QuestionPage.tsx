import { useEffect, useState } from 'react';
import { getInstance, ENTRY_BY_ID, InvalidSeedError } from '../content/bank';
import type { Instance } from '../engine/templates/types';
import { QuestionView } from '../components/QuestionView';
import { Loading, ErrorBox } from '../components/bits';
import { navigate, href } from '../router';
import { useProgress } from '../lib/useProgress';
import { scoreOf } from '../progress/mastery';
import { formatDuration } from '../lib/attempt';
import { PastPaperRefs } from '../components/PastPaperRefs';

/** A single question by template + seed (shareable URL). */
export function QuestionPage({ id, seed }: { id: string; seed: number }) {
  const [inst, setInst] = useState<Instance | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setInst(null);
    setError(null);
    getInstance(id, seed)
      .then((i) => alive && setInst(i))
      .catch((e) => alive && setError(e instanceof InvalidSeedError ? 'This question number did not pass its checks — try another.' : (e as Error).message));
    return () => {
      alive = false;
    };
  }, [id, seed]);
  const { attempts } = useProgress();
  const history = attempts.filter((a) => a.templateId === id).sort((a, b) => b.finishedAt - a.finishedAt);
  const meta = ENTRY_BY_ID.get(id);
  if (!meta) return <ErrorBox>Unknown question type “{id}”.</ErrorBox>;
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ margin: 0 }}>
            <a href={href(`/chapter/${meta.chapter}`)}>← Chapter</a>{meta.fixed ? ' · fixed question' : ` · question #${seed}`}
          </p>
          <h1>{meta.title}</h1>
        </div>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!inst && !error && <Loading />}
      {inst && <QuestionView key={`${id}:${seed}`} inst={inst} meta={meta} mode="shared" onNext={() => navigate('/practice', { t: id })} nextLabel="More like this" />}
      {inst && <PastPaperRefs family={meta.family} />}
      {history.length > 0 && (
        <section className="card">
          <h2>Your history with this question type</h2>
          <ul className="list">
            {history.slice(0, 20).map((a) => (
              <li key={a.id}>
                <a className="list-link" href={href(`/q/${a.templateId}/${a.seed}`)}>
                  <span style={{ flex: 1 }}>
                    {new Date(a.finishedAt).toLocaleString()}
                    <span className="muted small">
                      {' '}
                      · #{a.seed} · {a.mode}
                      {a.parts.some((p) => p.hints > 0) ? ' · hints used' : ''}
                    </span>
                  </span>
                  <span className="muted small">{formatDuration(a.durationMs)}</span>
                  <span className="score-pill">
                    {scoreOf(a)}/{a.marks}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
