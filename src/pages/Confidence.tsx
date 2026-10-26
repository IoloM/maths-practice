import { BOOK_NAMES, CHAPTERS } from '../content/chapters';
import { BANK } from '../content/bank-meta';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { setFlag, useTopicMarks } from '../lib/topics';
import { VERDICTS, actualLevel, byChapter, verdict, type Verdict } from '../lib/confidence';
import { ConfidencePicker } from '../components/ConfidencePicker';
import { Loading } from '../components/bits';

const PRACTISABLE = new Set(BANK.templates.map((t) => t.chapter));

/** `#/confidence`: how sure you feel about each topic, next to how you're actually scoring. */
export function Confidence() {
  const marks = useTopicMarks();
  const { attempts, loading } = useProgress();
  if (!marks || loading) return <Loading />;
  const byCh = byChapter(attempts);
  const rows = CHAPTERS.filter((c) => PRACTISABLE.has(c.ref)).map((c) => {
    const a = actualLevel(byCh.get(c.ref) ?? []);
    const conf = marks[c.ref]?.confidence;
    return { c, a, conf, v: verdict(conf, a.level) };
  });
  const count = (v: Verdict) => rows.filter((r) => r.v === v).length;
  const over = rows.filter((r) => r.v === 'over').sort((x, y) => (y.conf ?? 0) - (y.a.level ?? 0) - ((x.conf ?? 0) - (x.a.level ?? 0)) || (x.a.pct ?? 0) - (y.a.pct ?? 0));
  const books = ['P1', 'P2', 'SM1', 'SM2'] as const;
  return (
    <div className="stack">
      <div>
        <h1>Confidence vs reality</h1>
        <p className="muted">
          Rate how confident you feel about each topic. Next to it is how you’re actually scoring (75%+ counts as confident, 50%+ as getting there). Topics you feel sure about but drop marks on are the ones to work on first.
        </p>
      </div>
      <div className="kpis">
        {(['over', 'under', 'right', 'untested'] as const).map((v) => (
          <div key={v} className={`card kpi verdict-${v}`}>
            <b>{count(v)}</b>
            <span className="muted small">{VERDICTS[v]}</span>
          </div>
        ))}
      </div>
      {over.length > 0 && (
        <section className="card stack" aria-labelledby="over-h">
          <h2 id="over-h">More confident than your marks</h2>
          <ul className="list">
            {over.map(({ c, a }) => (
              <li key={c.ref} className="learn-row">
                <span style={{ flex: 1 }}>
                  <b>{c.title}</b> <span className="small muted">· you’re getting {a.pct}% of the marks</span>
                </span>
                <a className="btn btn-small" href={href('/practice', { c: c.ref })}>
                  Practise
                </a>
                <button className="btn btn-small" onClick={() => void setFlag(c.ref, 'help')} disabled={marks[c.ref]?.flag === 'help'}>
                  {marks[c.ref]?.flag === 'help' ? 'Marked: need help' : 'Mark: need help'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {books.map((b) => (
        <section key={b} className={`card ${b === 'P2' || b === 'SM2' ? 'year-2' : ''}`} aria-label={BOOK_NAMES[b]}>
          <h2 className="h3">{BOOK_NAMES[b]}</h2>
          <ul className="list confidence-list">
            {rows
              .filter((r) => r.c.book === b)
              .map(({ c, a, conf, v }) => (
                <li key={c.ref}>
                  <a className="confidence-title" href={href(`/learn/${c.ref}`)}>
                    {c.title}
                  </a>
                  <ConfidencePicker chapter={c.ref} title={c.title} value={conf} />
                  <span className="small confidence-actual">{a.pct === null ? <span className="muted">not practised</span> : `${a.pct}% (${a.questions} questions)`}</span>
                  <span className={`chip verdict-chip verdict-${v}`}>{VERDICTS[v]}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
