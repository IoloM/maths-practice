import { BANK, type BankEntry } from '../content/bank-meta';
import { CHAPTER_BY_REF } from '../content/chapters';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { scoreOf } from '../progress/mastery';
import type { Attempt } from '../storage/types';
import { Loading } from '../components/bits';
import { Icon } from '../components/Icon';

/** Questions written to stretch: several topics in one, all at the top difficulty. */
export const STRETCH = BANK.templates.filter((t) => t.tags.includes('stretch'));
/** Other top-difficulty exam-style questions. */
const HARDEST = BANK.templates.filter((t) => t.difficulty === 5 && !t.tags.includes('stretch') && t.marks >= 8);

function Row({ t, attempts }: { t: BankEntry; attempts: Attempt[] }) {
  const mine = attempts.filter((a) => a.templateId === t.id);
  const best = mine.length ? Math.max(...mine.map((a) => scoreOf(a))) : null;
  return (
    <li>
      <a className="list-link" href={href('/practice', { t: t.id, from: 'stretch' })}>
        <span style={{ flex: 1 }}>
          <b>{t.title.replace(/^(A\* stretch|Exam-style): (.)/, (_, _p, c: string) => c.toUpperCase())}</b>
          <span className="small muted">
            {' '}
            · {CHAPTER_BY_REF.get(t.chapter)?.title ?? t.chapter} · {t.marks} marks · about {t.time} min
          </span>
        </span>
        <span className="small muted">{best === null ? 'not tried' : `best ${best}/${t.marks}`}</span>
      </a>
    </li>
  );
}

/** `#/stretch`: A* stretch problems — harder questions that mix topics, like the last questions on a paper. */
export function Stretch() {
  const { attempts, loading } = useProgress();
  if (loading) return <Loading />;
  const tried = new Set(attempts.map((a) => a.templateId));
  const done = STRETCH.filter((t) => tried.has(t.id)).length;
  return (
    <div className="stack">
      <div>
        <h1>A* stretch problems</h1>
        <p className="muted">Harder questions that join several topics together, like the last few questions on a paper. Each one is new every time you open it. Expect to think before you write — the hints are there if you’re stuck.</p>
      </div>
      <div className="btn-row">
        <a className="btn btn-primary" href={href('/practice', { t: STRETCH.map((t) => t.id).join(','), from: 'stretch' })}>
          <Icon name="mountain" /> Start stretch problems
        </a>
        <span className="small muted">
          {done} of {STRETCH.length} tried
        </span>
      </div>
      <section className="card stack" aria-labelledby="stretch-list">
        <h2 id="stretch-list">Stretch problems: several topics in one</h2>
        <ul className="list">
          {STRETCH.map((t) => (
            <Row key={t.id} t={t} attempts={attempts} />
          ))}
        </ul>
      </section>
      <section className="card stack" aria-labelledby="hardest-list">
        <h2 id="hardest-list">More top-difficulty exam questions</h2>
        <ul className="list">
          {HARDEST.map((t) => (
            <Row key={t.id} t={t} attempts={attempts} />
          ))}
        </ul>
      </section>
    </div>
  );
}
