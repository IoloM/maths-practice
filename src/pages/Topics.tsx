import { useState } from 'react';
import { BANK } from '../content/bank-meta';
import { CHAPTERS, BOOK_NAMES } from '../content/chapters';
import { SPEC } from '../content/spec';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { groupBy, mastery } from '../progress/mastery';
import { RagBadge } from '../components/bits';
import { FlagChip } from '../components/TopicFlag';
import { useTopicMarks } from '../lib/topics';

export function Topics() {
  const [view, setView] = useState<'chapters' | 'spec'>('chapters');
  const { attempts } = useProgress();
  const marks = useTopicMarks();
  const byCh = groupBy(attempts, (a) => a.chapter);
  const bySpec = groupBy(attempts, (a) => a.spec);
  const count = (ch: string) => BANK.templates.filter((t) => t.chapter === ch).length;
  const books = ['P1', 'P2', 'SM1', 'SM2'] as const;
  return (
    <div className="stack">
      <div className="page-head">
        <h1>Topics</h1>
        <a className="btn btn-small" href={href('/learn')}>
          Learn: notes and videos
        </a>
        <span className="spacer" />
        <div className="working-tabs" role="tablist" aria-label="Browse by" style={{ border: 'none' }}>
          <button role="tab" aria-selected={view === 'chapters'} onClick={() => setView('chapters')}>
            Textbook chapters
          </button>
          <button role="tab" aria-selected={view === 'spec'} onClick={() => setView('spec')}>
            Spec points
          </button>
        </div>
      </div>
      {view === 'chapters' ? (
        books.map((b) => (
          <section key={b} className={b === 'P2' || b === 'SM2' ? 'year-2' : ''}>
            <h2>{BOOK_NAMES[b]}</h2>
            <div className="grid">
              {CHAPTERS.filter((c) => c.book === b).map((c) => {
                const n = count(c.ref);
                return n ? (
                  <a key={c.ref} className="card tile" href={href(`/chapter/${c.ref}`)}>
                    <span className="small muted">
                      {c.stream} · Chapter {c.n}
                    </span>
                    <h3>{c.title}</h3>
                    <span className="row small">
                      <span className="muted">{n} question types</span>
                      <FlagChip flag={marks?.[c.ref]?.flag} />
                      <span className="spacer" />
                      <RagBadge mastery={mastery(byCh.get(c.ref) ?? [])} />
                    </span>
                  </a>
                ) : (
                  <div key={c.ref} className="card tile" style={{ opacity: 0.6 }} aria-disabled="true">
                    <span className="small muted">
                      {c.stream} · Chapter {c.n}
                    </span>
                    <h3>{c.title}</h3>
                    <span className="small muted">Coming soon</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      ) : (
        <section className="card">
          <ul className="list">
            {SPEC.map((s) => {
              const n = BANK.templates.filter((t) => t.spec.includes(s.ref)).length;
              return (
                <li key={s.ref}>
                  {n ? (
                    <a className="list-link" href={href('/practice', { s: s.ref })}>
                      <b style={{ minWidth: 56 }}>{s.ref}</b>
                      <span style={{ flex: 1 }}>{s.title}</span>
                      <span className="chip">{n}</span>
                      <RagBadge mastery={mastery(bySpec.get(s.ref) ?? [])} />
                    </a>
                  ) : (
                    <div className="list-link muted">
                      <b style={{ minWidth: 56 }}>{s.ref}</b>
                      <span style={{ flex: 1 }}>{s.title}</span>
                      <span className="chip">soon</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
