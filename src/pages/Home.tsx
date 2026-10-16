import { BANK } from '../content/bank';
import { CHAPTERS } from '../content/chapters';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { mastery, groupBy, scoreOf } from '../progress/mastery';
import { RagBadge } from '../components/bits';
import { Icon } from '../components/Icon';

const PRIORITY = [
  { label: 'Integration (Pure Y1 13.5–13.7)', chapter: 'P1.13' },
  { label: 'Integration (Pure Y2)', chapter: 'P2.11' },
  { label: 'Hypothesis testing', chapter: 'SM1.7' },
  { label: 'Forces and motion', chapter: 'SM1.10' },
  { label: 'Modelling assumptions', chapter: 'SM1.8' },
  { label: 'Binomial cumulative probabilities', chapter: 'SM1.6' },
  { label: 'Histograms', chapter: 'SM1.3' },
  { label: 'Variance', chapter: 'SM1.2' },
  { label: 'Inclined planes', chapter: 'SM2.5' },
];

export function Home() {
  const { attempts } = useProgress();
  const byCh = groupBy(attempts, (a) => a.chapter);
  const marks = attempts.reduce((s, a) => s + a.marks, 0);
  const got = attempts.reduce((s, a) => s + scoreOf(a), 0);
  const available = new Set<string>(BANK.templates.map((t) => t.chapter));
  const last = attempts[attempts.length - 1];
  return (
    <div className="stack">
      <div>
        <h1>Edexcel A Level Maths practice</h1>
        <p className="muted">
          9MA0 Pure, Statistics and Mechanics · {BANK.totals.templates} question types · {BANK.totals.questions.toLocaleString()} verified questions · works offline
        </p>
      </div>
      <div className="grid">
        {last && (
          <a className="card tile" href={href('/practice', { c: last.chapter })}>
            <h3>
              <Icon name="play" /> Continue
            </h3>
            <span className="muted">{CHAPTERS.find((c) => c.ref === last.chapter)?.title ?? last.chapter}</span>
          </a>
        )}
        <a className="card tile" href={href('/topics')}>
          <h3>
            <Icon name="book" /> Topic practice
          </h3>
          <span className="muted">Choose a textbook chapter or spec point</span>
        </a>
        <a className="card tile" href={href('/progress')}>
          <h3>
            <Icon name="chart" /> Progress
          </h3>
          <span className="muted">{attempts.length ? `${attempts.length} questions · ${marks ? Math.round((100 * got) / marks) : 0}% of marks` : 'No attempts yet'}</span>
        </a>
      </div>
      <section className="card">
        <h2>Priority topics</h2>
        <ul className="list">
          {PRIORITY.map((p) => {
            const has = available.has(p.chapter);
            const m = mastery(byCh.get(p.chapter) ?? []);
            const ch = CHAPTERS.find((c) => c.ref === p.chapter);
            return (
              <li key={p.label}>
                {has ? (
                  <a className="list-link" href={href(`/chapter/${p.chapter}`)}>
                    <span style={{ flex: 1 }}>{p.label}</span>
                    <RagBadge mastery={m} />
                  </a>
                ) : (
                  <div className="list-link" aria-disabled="true">
                    <span style={{ flex: 1 }} className="muted">
                      {p.label}
                    </span>
                    <span className="chip">{ch ? `${ch.book} ch ${ch.n}` : ''} · coming soon</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
