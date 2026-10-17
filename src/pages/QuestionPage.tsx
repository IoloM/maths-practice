import { useEffect, useState } from 'react';
import { getInstance, ENTRY_BY_ID, InvalidSeedError } from '../content/bank';
import type { Instance } from '../engine/templates/types';
import { QuestionView } from '../components/QuestionView';
import { Loading, ErrorBox } from '../components/bits';
import { navigate, href } from '../router';

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
    </div>
  );
}
