import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getInstance, ENTRY_BY_ID } from '../content/bank';
import { pickNext, type SessionConfig, candidates } from '../lib/session';
import type { Instance } from '../engine/templates/types';
import { QuestionView } from '../components/QuestionView';
import { Loading, ErrorBox } from '../components/bits';
import { useProgress } from '../lib/useProgress';
import { CHAPTER_BY_REF } from '../content/chapters';
import { SPEC_BY_REF } from '../content/spec';
import { href } from '../router';
import { PastPaperRefs } from '../components/PastPaperRefs';
import { PAST_QUESTIONS } from '../content/past-papers';

const PPQ_FAMILIES = [...new Set(PAST_QUESTIONS.flatMap((q) => q.families))];
import type { Mode } from '../storage/types';

export function Practice({ query }: { query: URLSearchParams }) {
  const cfg: SessionConfig = useMemo(
    () => ({
      chapters: query.get('c')?.split(',').filter(Boolean),
      templates: query.get('t')?.split(',').filter(Boolean),
      specs: query.get('s')?.split(',').filter(Boolean),
      streams: query.get('st')?.split(',').filter(Boolean),
      minMarks: Number(query.get('mm') ?? 0),
      families: query.get('pp') ? PPQ_FAMILIES : undefined,
      dmin: Number(query.get('dmin') ?? 1),
      dmax: Number(query.get('dmax') ?? 5),
    }),
    [query],
  );
  const mode: Mode = (cfg.chapters?.length ?? 0) > 1 || query.get('mixed') ? 'mixed' : 'practice';
  const { attempts, loading } = useProgress();
  const [inst, setInst] = useState<Instance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [n, setN] = useState(1);
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

  const title = query.get('from') === 'mistakes' ? 'Putting mistakes right' : cfg.templates?.length === 1 ? ENTRY_BY_ID.get(cfg.templates[0])?.title : cfg.chapters?.length === 1 ? CHAPTER_BY_REF.get(cfg.chapters[0] as never)?.title : cfg.specs?.length === 1 ? `${cfg.specs[0]} ${SPEC_BY_REF.get(cfg.specs[0] as never)?.title ?? ''}` : cfg.families ? 'Topics that have come up on past papers' : cfg.minMarks ? 'Long exam-style questions' : cfg.streams?.length === 1 ? `Mixed practice — ${cfg.streams[0]}` : 'Mixed practice';
  const pool = candidates(cfg).length;

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="small muted" style={{ margin: 0 }}>
            {cfg.chapters?.length === 1 ? <a href={href(`/chapter/${cfg.chapters[0]}`)}>← Chapter</a> : <a href={href('/topics')}>← Topics</a>} · {pool} question types
          </p>
          <h1>{title}</h1>
        </div>
      </div>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!inst && !error && <Loading label="Preparing a question…" />}
      {inst && ENTRY_BY_ID.get(inst.templateId) && (
        <QuestionView
          key={`${inst.templateId}:${inst.seed}`}
          inst={inst}
          meta={ENTRY_BY_ID.get(inst.templateId)!}
          number={n}
          mode={mode}
          onNext={() => {
            setN((x) => x + 1);
            void next();
          }}
        />
      )}
      {inst && ENTRY_BY_ID.get(inst.templateId) && <PastPaperRefs family={ENTRY_BY_ID.get(inst.templateId)!.family} />}
    </div>
  );
}
