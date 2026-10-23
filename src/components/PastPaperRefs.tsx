import { useEffect, useState } from 'react';
import { href } from '../router';

type Mod = typeof import('../content/past-papers');
let loading: Promise<Mod> | null = null;

/** The past paper index, loaded after first render so it never delays a question appearing. */
export function usePastPapers(): Mod | null {
  const [mod, setMod] = useState<Mod | null>(null);
  useEffect(() => {
    let alive = true;
    loading ??= import('../content/past-papers');
    void loading.then((m) => alive && setMod(m));
    return () => {
      alive = false;
    };
  }, []);
  return mod;
}

/** "Came up in June 2022 Paper 2 Q7 …" for a question family. */
export function PastPaperRefs({ family }: { family: string }) {
  const pp = usePastPapers();
  if (!pp) return null;
  const qs = pp.pastQuestionsFor(family);
  if (!qs.length) return null;
  const shown = [...qs].sort((a, b) => b.paper.localeCompare(a.paper)).slice(0, 6);
  return (
    <section className="card ppq-refs" aria-labelledby="ppq-refs">
      <h2 id="ppq-refs" className="h3">
        Past paper questions like this <span className="chip chip-accent">PPQ × {qs.length}</span>
      </h2>
      <ul className="list">
        {shown.map((q) => {
          const p = pp.PAST_PAPER_BY_ID.get(q.paper)!;
          return (
            <li key={`${q.paper}-${q.q}`}>
              <a className="list-link" href={href('/past-papers', { p: q.paper })}>
                <span style={{ flex: 1 }}>
                  {p.series} · {pp.PAPER_TITLES[p.paper].split(':')[0]} · Q{q.q}
                  <span className="muted small"> · {q.topic}</span>
                </span>
                <span className="chip">{q.marks} marks</span>
              </a>
            </li>
          );
        })}
      </ul>
      {qs.length > shown.length && <p className="muted small">…and {qs.length - shown.length} more on the past papers page.</p>}
    </section>
  );
}
