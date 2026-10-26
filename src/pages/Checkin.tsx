import { useEffect, useState } from 'react';
import { BANK } from '../content/bank-meta';
import { CHAPTER_BY_REF } from '../content/chapters';
import { getStore } from '../storage';
import { navigate } from '../router';
import { buildTimed, MINUTES_PER_MARK, setMarks } from '../lib/sets';
import { loadTopicMarks } from '../lib/topics';
import { startSet } from './Exams';
import { ErrorBox, Loading } from '../components/bits';

/**
 * `#/checkin/<chapter>`: start (or carry on with) the next check-in on a topic you've learnt — about
 * 10 marks of the topic's easier questions, timed at exam pace.
 */
export function Checkin({ chapter }: { chapter: string }) {
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    void (async () => {
      const ch = CHAPTER_BY_REF.get(chapter as never);
      const m = (await loadTopicMarks())[chapter];
      if (!ch || !m?.learnt) return setProblem('There’s no check-in for that topic. Mark a topic as learnt on the Learn page first.');
      const n = Math.min(2, m.checks?.length ?? 0);
      const id = `checkin-${chapter}-${m.learnt}-${n}`;
      if (await (await getStore()).getSet(id)) return navigate(`/set/${id}`, undefined, true);
      const pool = BANK.templates.filter((t) => t.chapter === chapter && t.difficulty <= 3);
      const items = buildTimed(pool.length >= 3 ? pool : BANK.templates.filter((t) => t.chapter === chapter), 10, Math.floor(Math.random() * 1e9));
      await startSet({ id, kind: 'timed', title: `Check-in ${n + 1}: ${ch.title}`, items, durationMin: Math.max(5, Math.round(setMarks(items) * MINUTES_PER_MARK)), checkin: { chapter, n } });
    })();
  }, [chapter]);
  return problem ? <ErrorBox>{problem}</ErrorBox> : <Loading label="Picking your check-in questions…" />;
}
