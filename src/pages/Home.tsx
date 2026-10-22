import { useEffect, useState } from 'react';
import { BANK } from '../content/bank-meta';
import { CHAPTERS } from '../content/chapters';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { mastery, groupBy, scoreOf } from '../progress/mastery';
import { isDue } from '../srs/fsrs';
import { todayKey } from '../lib/dates';
import { getStore } from '../storage';
import type { SetRecord } from '../storage/types';
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
  const { attempts, cards } = useProgress();
  const [daily, setDaily] = useState<SetRecord | null>(null);
  const dailyId = `daily-${todayKey()}`;
  useEffect(() => {
    void getStore().then(async (s) => setDaily((await s.getSet(dailyId)) ?? null));
  }, [dailyId]);
  const byCh = groupBy(attempts, (a) => a.chapter);
  const marks = attempts.reduce((s, a) => s + a.marks, 0);
  const got = attempts.reduce((s, a) => s + scoreOf(a), 0);
  const last = attempts[attempts.length - 1];
  const due = cards.filter((c) => isDue(c)).length;
  const dailyDone = daily ? new Set(attempts.filter((a) => a.setId === dailyId).map((a) => `${a.templateId}:${a.seed}`)).size : 0;
  return (
    <div className="stack">
      <div>
        <h1>Edexcel A Level Maths practice</h1>
        <p className="muted">
          9MA0 Pure, Statistics and Mechanics · {BANK.totals.templates} question types · {BANK.totals.questions.toLocaleString()} verified questions · {BANK.totals.fixed} explain-and-prove questions · works offline
        </p>
      </div>
      <div className="grid">
        {last && (
          <a className="card tile" href={href('/practice', { c: last.chapter })}>
            <h2>
              <Icon name="play" /> Continue
            </h2>
            <span className="muted">{CHAPTERS.find((c) => c.ref === last.chapter)?.title ?? last.chapter}</span>
          </a>
        )}
        <a className="card tile" href={href('/exams')}>
          <h2>
            <Icon name="refresh" /> Today’s set
          </h2>
          <span className="muted">{daily ? `${dailyDone}/${daily.items.length} done` : '5 questions picked for you'}</span>
        </a>
        <a className="card tile" href={href('/review')}>
          <h2>
            <Icon name="review" /> Review
          </h2>
          <span className="muted">{due ? `${due} due now` : 'Nothing due'}</span>
        </a>
        <a className="card tile" href={href('/topics')}>
          <h2>
            <Icon name="book" /> Topic practice
          </h2>
          <span className="muted">Choose a textbook chapter or spec point</span>
        </a>
        <div className="card tile">
          <h2>
            <Icon name="grid" /> Mixed practice
          </h2>
          <span className="row-wrap small">
            <a href={href('/practice', { mixed: 1 })}>Everything</a>
            <a href={href('/practice', { mixed: 1, st: 'Pure' })}>Pure</a>
            <a href={href('/practice', { mixed: 1, st: 'Statistics' })}>Statistics</a>
            <a href={href('/practice', { mixed: 1, st: 'Mechanics' })}>Mechanics</a>
          </span>
        </div>
        <a className="card tile" href={href('/exams')}>
          <h2>
            <Icon name="clock" /> Mock papers
          </h2>
          <span className="muted">Papers 1, 2 and 3 under timed conditions</span>
        </a>
        <a className="card tile" href={href('/progress')}>
          <h2>
            <Icon name="chart" /> Progress
          </h2>
          <span className="muted">{attempts.length ? `${attempts.length} questions · ${marks ? Math.round((100 * got) / marks) : 0}% of marks` : 'No attempts yet'}</span>
        </a>
        <a className="card tile" href={href('/reference')}>
          <h2>
            <Icon name="scheme" /> Formulae & tables
          </h2>
          <span className="muted">Formula booklet, binomial, normal and PMCC tables</span>
        </a>
      </div>
      <section className="card">
        <h2>Priority topics</h2>
        <ul className="list">
          {PRIORITY.map((p) => (
            <li key={p.label}>
              <a className="list-link" href={href(`/chapter/${p.chapter}`)}>
                <span style={{ flex: 1 }}>{p.label}</span>
                <RagBadge mastery={mastery(byCh.get(p.chapter) ?? [])} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
