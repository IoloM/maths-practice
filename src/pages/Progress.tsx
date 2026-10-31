import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useProgress } from '../lib/useProgress';
import { CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { SPEC } from '../content/spec';
import { ENTRY_BY_ID } from '../content/bank';
import { groupBy, mastery, scoreOf } from '../progress/mastery';
import { frequentErrors, humanise, minutesPerMark, specMastery, weeklyTrend, type WeekPoint } from '../progress/stats';
import { RagBadge, Loading, ragOf } from '../components/bits';
import { href } from '../router';
import { formatDuration } from '../lib/attempt';
import { isDue, isQuestionCard } from '../srs/fsrs';
import { getStore } from '../storage';
import type { SetRecord } from '../storage/types';
import { MINUTES_PER_MARK, setMarks } from '../lib/sets';
import { PredictedGrade } from '../components/PredictedGrade';
import { GradeChart, type PaperPoint } from '../components/GradeChart';
import { BADGES, earned } from '../lib/badges';
import { Icon } from '../components/Icon';
import { finishedPapers, lossesByFamily, lossesByReason, paperScore, usePaperResults, type PaperResults } from '../lib/paper-results';
import { PAPER_TITLES, PAST_PAPER_BY_ID, isAS } from '../content/past-papers';
import { BANK } from '../content/bank-meta';

const RAG_VAR: Record<string, string> = { r: 'var(--bad)', a: 'var(--warn)', g: 'var(--good)', none: 'var(--border-strong)' };

function TrendChart({ pts }: { pts: WeekPoint[] }) {
  const W = 640,
    H = 200,
    L = 34,
    R = 10,
    T = 10,
    B = 26;
  const x = (i: number) => L + ((W - L - R) * i) / Math.max(1, pts.length - 1);
  const y = (p: number) => T + (H - T - B) * (1 - p);
  const withData = pts.map((p, i) => ({ p, i })).filter((d) => d.p.pct !== null);
  const path = withData.map((d, k) => `${k ? 'L' : 'M'}${x(d.i).toFixed(1)},${y(d.p.pct!).toFixed(1)}`).join(' ');
  const lastTwo = withData.slice(-2);
  const summary = withData.length
    ? `Weekly percentage of marks scored over the last ${pts.length} weeks. Latest week: ${Math.round(withData[withData.length - 1].p.pct! * 100)}%${lastTwo.length === 2 ? `, previous week ${Math.round(lastTwo[0].p.pct! * 100)}%` : ''}.`
    : 'No attempts in the last few weeks.';
  const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return (
    <figure style={{ margin: 0 }}>
      <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {[0, 0.5, 0.8, 1].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke="var(--border)" strokeDasharray={g === 0.5 || g === 0.8 ? '4 4' : undefined} />
            <text x={L - 6} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--text-2)">
              {g * 100}%
            </text>
          </g>
        ))}
        {pts.map((p, i) =>
          i % 2 === pts.length % 2 ? null : (
            <text key={p.start} x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-2)">
              {fmt(p.start)}
            </text>
          ),
        )}
        {path && <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />}
        {withData.map((d) => (
          <circle key={d.i} cx={x(d.i)} cy={y(d.p.pct!)} r="4" fill={RAG_VAR[ragOf(d.p.pct)]} stroke="var(--surface)" strokeWidth="1.5">
            <title>
              Week of {fmt(d.p.start)}: {Math.round(d.p.pct! * 100)}% ({d.p.scored}/{d.p.marks} marks, {d.p.attempts} questions)
            </title>
          </circle>
        ))}
      </svg>
      <figcaption className="small muted">Dashed lines: amber (50%) and green (80%) thresholds.</figcaption>
    </figure>
  );
}

function Badges({ have }: { have: Set<string> }) {
  return (
    <section className="card stack" aria-labelledby="badges-h">
      <h2 id="badges-h">
        Badges <span className="muted small">{have.size} of {BADGES.length}</span>
      </h2>
      <ul className="badges">
        {BADGES.map((b) => (
          <li key={b.id} className={have.has(b.id) ? 'got' : ''}>
            <Icon name="award" />
            <span>
              <b>{b.title}</b>
              <span className="small">{b.how}</span>
              <span className="sr-only">{have.has(b.id) ? ' (earned)' : ' (not yet)'}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bar({ value, label, right }: { value: number | null; label: ReactNode; right: ReactNode }) {
  const pct = value === null ? 0 : Math.max(0, Math.min(1, value));
  return (
    <div className="bar-row">
      <span className="small">{label}</span>
      <span className="bar" role="presentation">
        <span style={{ width: `${pct * 100}%`, background: RAG_VAR[ragOf(value)] }} />
      </span>
      <span className="small">{right}</span>
    </div>
  );
}

const FAMILY_IDS = new Map<string, string[]>();
const FAMILY_TITLE = new Map<string, string>();
for (const e of BANK.templates) {
  FAMILY_IDS.set(e.family, [...(FAMILY_IDS.get(e.family) ?? []), e.id]);
  if (!FAMILY_TITLE.has(e.family)) FAMILY_TITLE.set(e.family, e.title.replace(/^Exam-style: /, ''));
}

/** Real past papers you've marked, and the topics that lose you marks in them. */
function RealPapers({ results }: { results: PaperResults }) {
  const papers = Object.entries(results)
    .map(([id, r]) => ({ id, r, s: paperScore(id, r), p: PAST_PAPER_BY_ID.get(id) }))
    .filter((x) => x.p && x.s.marked)
    .sort((a, b) => b.r.updatedAt - a.r.updatedAt);
  const losses = lossesByFamily(results).slice(0, 8);
  const reasons = lossesByReason(results);
  return (
    <section className="card stack" aria-labelledby="real-papers">
      <h2 id="real-papers">Real past papers</h2>
      {papers.length ? (
        <>
          <ul className="list">
            {papers.map(({ id, s, p }) => (
              <li key={id}>
                <a className="list-link" href={href('/past-papers', { p: id })}>
                  <span style={{ flex: 1 }}>
                    {p!.series} · {PAPER_TITLES[p!.paper]}
                  </span>
                  {s.complete ? (
                    <span className="chip chip-accent">
                      {s.got}/{s.max} · {s.grade}
                    </span>
                  ) : (
                    <span className="chip">
                      {s.got}/{s.of} so far ({s.marked} of {s.questions} questions)
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          {reasons.length > 0 && (
            <p className="small">
              <b>Kinds of mistake:</b> {reasons.map((r) => `${r.label} (${Math.round(r.lost)} marks)`).join(', ')}
            </p>
          )}
          {losses.length > 0 && (
            <>
              <h3 className="h3">Where real papers lose you marks</h3>
              <ul className="list">
                {losses.map((l) => (
                  <li key={l.family}>
                    <a className="list-link" href={href('/practice', { t: (FAMILY_IDS.get(l.family) ?? []).join(',') })}>
                      <span style={{ flex: 1 }}>{FAMILY_TITLE.get(l.family) ?? l.family}</span>
                      <span className="chip">
                        lost {Math.round(l.lost)} of {Math.round(l.of)} marks
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <p className="muted">
          Done a real Pearson paper? <a href={href('/past-papers')}>Enter your marks question by question</a> to see your score and grade, and which topics lose you marks.
        </p>
      )}
    </section>
  );
}

export function Progress() {
  const { attempts, cards, loading } = useProgress();
  const results = usePaperResults();
  const [sets, setSets] = useState<SetRecord[]>([]);
  useEffect(() => {
    void getStore().then(async (s) => setSets(await s.allSets()));
  }, [attempts.length]);
  const trend = useMemo(() => weeklyTrend(attempts), [attempts]);
  const bySpec = useMemo(() => specMastery(attempts), [attempts]);
  const mpmStream = useMemo(() => minutesPerMark(attempts, (a) => CHAPTER_BY_REF.get(a.chapter as never)?.stream ?? 'Other'), [attempts]);
  const errors = useMemo(() => frequentErrors(attempts), [attempts]);
  const mocks = useMemo(
    () =>
      sets
        .filter((s) => s.kind === 'mock' && s.status === 'finished')
        .map((s) => ({ got: attempts.filter((a) => a.setId === s.id).reduce((t, a) => t + scoreOf(a), 0), of: setMarks(s.items), finishedAt: s.finishedAt ?? s.createdAt, label: s.title })),
    [sets, attempts],
  );
  const overTime = useMemo((): PaperPoint[] => {
    const real = Object.entries(results ?? {}).flatMap(([id, r]): PaperPoint[] => {
      const sc = paperScore(id, r);
      const p = PAST_PAPER_BY_ID.get(id);
      // the chart is against A level boundaries, so AS papers stay out of it
      if (!sc.complete || !p || isAS(p.paper)) return [];
      return [{ label: `${p.series} ${PAPER_TITLES[p.paper].split(':')[0]}`, got: sc.got, of: sc.max, finishedAt: r.done ? new Date(`${r.done}T12:00:00`).getTime() : r.updatedAt, kind: 'paper' }];
    });
    return [...real, ...mocks.map((m) => ({ ...m, kind: 'mock' as const }))];
  }, [results, mocks]);
  if (loading) return <Loading />;
  const byCh = groupBy(attempts, (a) => a.chapter);
  const marks = attempts.reduce((s, a) => s + a.marks, 0);
  const got = attempts.reduce((s, a) => s + scoreOf(a), 0);
  const time = attempts.reduce((s, a) => s + a.durationMs, 0);
  const recent = [...attempts].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 30);
  const due = cards.filter((c) => isQuestionCard(c) && isDue(c)).length;
  const topics = [...new Set(SPEC.map((s) => s.topic))];
  const finishedSets = sets.filter((s) => s.status === 'finished' && s.kind !== 'daily').sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
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
          <span className="muted small">minutes per mark (exam pace {MINUTES_PER_MARK})</span>
        </div>
        <a className="card kpi" href={href('/review')}>
          <b>{due}</b>
          <span className="muted small">due for review</span>
        </a>
      </div>

      <PredictedGrade mocks={mocks} papers={results ? finishedPapers(results, true) : []} />
      {overTime.length > 0 && (
        <section className="card" aria-labelledby="grades-over-time">
          <h2 id="grades-over-time">Grades over time</h2>
          <GradeChart points={overTime} />
        </section>
      )}
      {results && <RealPapers results={results} />}
      <Badges have={new Set(earned({ attempts, sets, papers: results ?? {} }).map((b) => b.id))} />
      <a className="card tile" href={href('/confidence')}>
        <h2>
          <Icon name="target" /> Confidence vs reality
        </h2>
        <span className="muted">Rate how sure you feel about each topic and see where it doesn’t match your marks</span>
      </a>

      <section className="card">
        <h2>Trend</h2>
        <TrendChart pts={trend} />
      </section>

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

      <section className="card stack">
        <h2>By specification point</h2>
        <p className="small muted">
          {bySpec.size} of {SPEC.length} spec points practised. Red below 50%, amber 50–80%, green 80% and above (recent attempts count most; hints and harder questions are weighted).
        </p>
        {topics.map((topic) => {
          const rows = SPEC.filter((s) => s.topic === topic && bySpec.has(s.ref));
          if (!rows.length) return null;
          return (
            <details key={topic}>
              <summary>
                {topic} <span className="muted small">({rows.length} practised)</span>
              </summary>
              {rows.map((s) => {
                const m = bySpec.get(s.ref)!;
                return (
                  <a key={s.ref} href={href('/practice', { s: s.ref })} className="plain-link">
                    <Bar value={m.mastery} label={`${s.ref} ${s.title}`} right={`${m.mastery === null ? '–' : Math.round(m.mastery * 100) + '%'} · ${m.attempts}`} />
                  </a>
                );
              })}
            </details>
          );
        })}
      </section>

      <section className="card stack">
        <h2>Time per mark</h2>
        <p className="small muted">In the exam you have about {MINUTES_PER_MARK} minutes per mark.</p>
        {['Pure', 'Statistics', 'Mechanics'].map((st) => {
          const v = mpmStream.get(st);
          return <Bar key={st} value={v ? Math.min(1, MINUTES_PER_MARK / v.mpm) : null} label={st} right={v ? `${v.mpm.toFixed(2)} min/mark` : 'no data'} />;
        })}
      </section>

      <section className="card">
        <h2>Frequent mistakes</h2>
        <ul className="list">
          {errors.map((e) => (
            <li key={`${e.templateId}|${e.errorId}`}>
              <a className="list-link" href={href('/practice', { t: e.templateId })}>
                <span style={{ flex: 1 }}>
                  {humanise(e.errorId)}
                  <span className="muted small"> · {ENTRY_BY_ID.get(e.templateId)?.title ?? e.templateId}</span>
                </span>
                <span className="chip">×{e.count}</span>
              </a>
            </li>
          ))}
          {!errors.length && <li className="muted">No recognised common mistakes yet.</li>}
        </ul>
      </section>

      <section className="card">
        <h2>Mock papers and timed sets</h2>
        <ul className="list">
          {finishedSets.map((s) => {
            const as = attempts.filter((a) => a.setId === s.id);
            const sg = as.reduce((t, a) => t + scoreOf(a), 0),
              sm = as.reduce((t, a) => t + a.marks, 0);
            return (
              <li key={s.id}>
                <a className="list-link" href={href(`/set/${s.id}`)}>
                  <span style={{ flex: 1 }}>
                    {s.title}
                    <span className="muted small"> · {new Date(s.finishedAt ?? s.createdAt).toLocaleDateString()}</span>
                  </span>
                  <RagBadge mastery={sm ? sg / sm : null} />
                  <span className="score-pill">
                    {sg}/{sm}
                  </span>
                </a>
              </li>
            );
          })}
          {!finishedSets.length && (
            <li className="muted">
              None yet — try a <a href={href('/exams')}>mock paper or timed set</a>.
            </li>
          )}
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
                  <span className="muted small">
                    {' '}
                    · {CHAPTER_BY_REF.get(a.chapter as never)?.title} · {new Date(a.finishedAt).toLocaleDateString()}
                    {a.mode !== 'practice' && a.mode !== 'shared' ? ` · ${a.mode}` : ''}
                  </span>
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
