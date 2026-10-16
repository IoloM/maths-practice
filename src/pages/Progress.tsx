import { useProgress } from '../lib/useProgress';
import { CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { ENTRY_BY_ID } from '../content/bank';
import { groupBy, mastery, scoreOf } from '../progress/mastery';
import { RagBadge, Loading } from '../components/bits';
import { href } from '../router';
import { formatDuration } from '../lib/attempt';

export function Progress() {
  const { attempts, loading } = useProgress();
  if (loading) return <Loading />;
  const byCh = groupBy(attempts, (a) => a.chapter);
  const marks = attempts.reduce((s, a) => s + a.marks, 0);
  const got = attempts.reduce((s, a) => s + scoreOf(a), 0);
  const time = attempts.reduce((s, a) => s + a.durationMs, 0);
  const recent = [...attempts].reverse().slice(0, 30);
  return (
    <div className="stack">
      <h1>Progress</h1>
      <div className="kpis">
        <div className="card kpi">
          <b>{attempts.length}</b>
          <span className="muted small">questions attempted</span>
        </div>
        <div className="card kpi">
          <b>{marks ? Math.round((100 * got) / marks) : 0}%</b>
          <span className="muted small">
            of marks ({got}/{marks})
          </span>
        </div>
        <div className="card kpi">
          <b>{marks ? (time / 60000 / Math.max(1, marks)).toFixed(1) : '–'}</b>
          <span className="muted small">minutes per mark</span>
        </div>
      </div>
      <section className="card">
        <h2>By chapter</h2>
        <ul className="list">
          {CHAPTERS.filter((c) => byCh.has(c.ref)).map((c) => (
            <li key={c.ref}>
              <a className="list-link" href={href(`/chapter/${c.ref}`)}>
                <span className="chip">
                  {c.book} ch {c.n}
                </span>
                <span style={{ flex: 1 }}>{c.title}</span>
                <span className="muted small">{byCh.get(c.ref)!.length} attempts</span>
                <RagBadge mastery={mastery(byCh.get(c.ref)!)} />
              </a>
            </li>
          ))}
          {!byCh.size && <li className="muted">Nothing yet — start with a topic.</li>}
        </ul>
      </section>
      <section className="card">
        <h2>Recent questions</h2>
        <ul className="list">
          {recent.map((a) => (
            <li key={a.id}>
              <a className="list-link" href={href(`/q/${a.templateId}/${a.seed}`)}>
                <span style={{ flex: 1 }}>
                  {ENTRY_BY_ID.get(a.templateId)?.title ?? a.templateId}
                  <span className="muted small"> · {CHAPTER_BY_REF.get(a.chapter as never)?.title} · {new Date(a.finishedAt).toLocaleDateString()}</span>
                </span>
                <span className="muted small">{formatDuration(a.durationMs)}</span>
                <span className="score-pill">
                  {scoreOf(a)}/{a.marks}
                </span>
              </a>
            </li>
          ))}
          {!recent.length && <li className="muted">No attempts yet.</li>}
        </ul>
      </section>
    </div>
  );
}
