import { useMemo, useState } from 'react';
import { entriesForChapter } from '../content/bank-meta';
import { usePastPapers } from '../components/PastPaperRefs';
import { CHAPTER_BY_REF, BOOK_NAMES } from '../content/chapters';
import { href, navigate } from '../router';
import { useProgress } from '../lib/useProgress';
import { groupBy, mastery } from '../progress/mastery';
import { Difficulty, RagBadge, ErrorBox } from '../components/bits';
import { Icon } from '../components/Icon';

export function ChapterPage({ chapter: chRef }: { chapter: string }) {
  const ch = CHAPTER_BY_REF.get(chRef as never);
  const entries = entriesForChapter(chRef);
  const pp = usePastPapers();
  const ppq = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of pp?.PAST_QUESTIONS ?? []) for (const f of q.families) m.set(f, (m.get(f) ?? 0) + 1);
    return m;
  }, [pp]);
  const [dmin, setDmin] = useState(1);
  const [dmax, setDmax] = useState(5);
  const { attempts } = useProgress();
  const byT = groupBy(attempts, (a) => a.templateId);
  if (!ch) return <ErrorBox>Unknown chapter {chRef}</ErrorBox>;
  const filtered = entries.filter((e) => e.difficulty >= dmin && e.difficulty <= dmax);
  const sections = [...new Set(entries.flatMap((e) => e.sections ?? ['']))].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  return (
    <div className={`stack year-${ch.year}`}>
      <div className="page-head">
        <div>
          <p className="small muted" style={{ margin: 0 }}>
            <a href={href('/topics')}>Topics</a> · {BOOK_NAMES[ch.book]} · Chapter {ch.n}
          </p>
          <h1>{ch.title}</h1>
        </div>
        <span className="spacer" />
        <RagBadge mastery={mastery(entries.flatMap((e) => byT.get(e.id) ?? []))} />
      </div>
      <div className="card row">
        <label className="row small">
          Difficulty from
          <select value={dmin} onChange={(e) => setDmin(Math.min(Number(e.target.value), dmax))}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          to
          <select value={dmax} onChange={(e) => setDmax(Math.max(Number(e.target.value), dmin))}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
        <span className="spacer" />
        <button className="btn btn-primary" disabled={!filtered.length} onClick={() => navigate('/practice', { c: chRef, dmin, dmax })}>
          <Icon name="play" /> Practise {filtered.length} question types
        </button>
      </div>
      {sections.map((sec) => {
        const list = filtered.filter((e) => (e.sections ?? [''])[0] === sec);
        if (!list.length) return null;
        const title = sec ? ch.sections[Number(sec.split('.')[1]) - 1] : '';
        return (
          <section key={sec} className="card">
            <h2>
              {sec} {title}
            </h2>
            <ul className="list">
              {list.map((e) => (
                <li key={e.id}>
                  <a className="list-link" href={href('/practice', { t: e.id })}>
                    <span style={{ flex: 1 }}>{e.title}</span>
                    <Difficulty d={e.difficulty} />
                    <span className="chip">{e.marks} marks</span>
                    {(ppq.get(e.family) ?? 0) > 0 && (
                      <span className="chip chip-accent" title={`Like ${ppq.get(e.family)} question(s) on real Edexcel papers`}>
                        PPQ × {ppq.get(e.family)}
                      </span>
                    )}
                    <RagBadge mastery={mastery(byT.get(e.id) ?? [])} />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
