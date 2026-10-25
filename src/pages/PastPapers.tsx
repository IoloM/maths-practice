import { useEffect, useMemo, useState } from 'react';
import { PAPER_TITLES, PAST_PAPERS, PAST_PAPER_BY_ID, PAST_QUESTIONS, type PastPaper, type PastQuestion } from '../content/past-papers';
import { BANK, type BankEntry } from '../content/bank-meta';
import { seedsFor } from '../content/bank-seeds';
import { MINUTES_PER_MARK } from '../lib/sets';
import { href } from '../router';
import { Icon } from '../components/Icon';
import { startSet } from './Exams';
import { LOSS_REASONS, boundariesFor, clearPaper, lossesByReason, paperScore, savePaperMark, setLossReasons, setPaperDone, setQuestionNote, usePaperResults, type PaperResult, type PaperResults } from '../lib/paper-results';

type Filter = 'all' | 'pure' | 'stats' | 'mech';
const FILTERS: { id: Filter; label: string; test: (p: PastPaper) => boolean }[] = [
  { id: 'all', label: 'All papers', test: () => true },
  { id: 'pure', label: 'Pure (Papers 1 and 2)', test: (p) => p.paper === '1' || p.paper === '2' },
  { id: 'stats', label: 'Statistics', test: (p) => p.paper === '31' || p.paper === '3' },
  { id: 'mech', label: 'Mechanics', test: (p) => p.paper === '32' || p.paper === '3' },
];

const byFamily = new Map<string, BankEntry[]>();
for (const e of BANK.templates) byFamily.set(e.family, [...(byFamily.get(e.family) ?? []), e]);
const templatesFor = (q: PastQuestion) => q.families.flatMap((f) => byFamily.get(f) ?? []);
const familyTitle = (f: string) => byFamily.get(f)?.[0]?.title.replace(/^Exam-style: /, '') ?? f;

/** A practice question type for each question on the paper: from its first family, closest in marks. */
function paperSet(qs: PastQuestion[]) {
  return qs.map((q) => {
    const pool = byFamily.get(q.families[0]) ?? templatesFor(q);
    const best = [...pool].sort((a, b) => Math.abs(a.marks - q.marks) - Math.abs(b.marks - q.marks))[0];
    const seeds = seedsFor(best.id);
    return { templateId: best.id, seed: seeds[Math.floor(Math.random() * seeds.length)], marks: best.marks };
  });
}

/** One question: marks, and if any were dropped, why (and a note to self). */
function MarkRow({ paperId, q, result }: { paperId: string; q: PastQuestion; result?: PaperResult }) {
  const m = result?.marks[q.q];
  const lost = m !== undefined && m < q.marks;
  const why = result?.reasons?.[q.q] ?? [];
  const [note, setNote] = useState(result?.notes?.[q.q] ?? '');
  return (
    <li className="mark-row-wrap">
      <div className="mark-row">
        <span className="chip">Q{q.q}</span>
        <span className="mark-topic">
          {q.topic}
          {result?.times?.[q.q] !== undefined && (
            <span className={`small ${result.times[q.q] > q.marks * MINUTES_PER_MARK * 60 * 1.25 ? 'slow' : 'muted'}`}>
              {' '}
              · took {Math.round(result.times[q.q] / 60)} min (aim {Math.round(q.marks * MINUTES_PER_MARK)})
            </span>
          )}
          {lost && (
            <>
              {' '}
              <a className="small" href={href('/practice', { t: templatesFor(q).map((e) => e.id).join(',') })}>
                Practise this
              </a>
            </>
          )}
        </span>
        <label className="mark-input">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={q.marks}
            step={1}
            value={m ?? ''}
            aria-label={`Your marks for question ${q.q}, out of ${q.marks}`}
            onChange={(e) => void savePaperMark(paperId, q.q, e.target.value === '' ? null : Number(e.target.value))}
          />
          <span className="muted">/ {q.marks}</span>
        </label>
      </div>
      {lost && (
        <div className="mark-why">
          <span className="small muted">Why marks went:</span>
          <div className="why-chips" role="group" aria-label={`Why marks were lost on question ${q.q}`}>
            {LOSS_REASONS.map((r) => {
              const on = why.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`btn btn-small why ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  onClick={() => void setLossReasons(paperId, q.q, on ? why.filter((w) => w !== r.id) : [...why, r.id])}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            className="mark-note"
            value={note}
            placeholder="Note to self (optional), e.g. forgot the constant of integration"
            aria-label={`Note for question ${q.q}`}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (result?.notes?.[q.q] ?? '') && void setQuestionNote(paperId, q.q, note)}
          />
        </div>
      )}
    </li>
  );
}

/** Enter your marks question by question after doing the paper, from the official mark scheme. */
function MarkEntry({ paperId, qs, result }: { paperId: string; qs: PastQuestion[]; result?: PaperResult }) {
  const score = paperScore(paperId, result);
  const b = boundariesFor(paperId);
  const reasons = result ? lossesByReason({ [paperId]: result }) : [];
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="small muted" style={{ margin: 0 }}>
        Do the paper on paper, mark it with the official mark scheme, then type your mark for each question. Where you lost marks, tap why — it shows which kind of mistake costs you most. Leave a box empty if you didn&rsquo;t do that question yet.
      </p>
      <div className="row-wrap small">
        <label className="row">
          Done on <input type="date" value={result?.done ?? ''} onChange={(e) => void setPaperDone(paperId, e.target.value, result?.minutes)} />
        </label>
        <label className="row">
          Time taken{' '}
          <input type="number" inputMode="numeric" min={1} max={300} value={result?.minutes ?? ''} style={{ width: '5em' }} onChange={(e) => void setPaperDone(paperId, result?.done, Number(e.target.value) || undefined)} /> min
        </label>
      </div>
      <ul className="list mark-entry">
        {qs.map((q) => (
          <MarkRow key={q.q} paperId={paperId} q={q} result={result} />
        ))}
      </ul>
      <div className="row-wrap">
        <span role="status" style={{ flex: 1 }}>
          {score.complete ? (
            <>
              <b>
                {score.got} / {score.max}
              </b>{' '}
              ({Math.round((100 * score.got) / score.max)}%) — about grade <b>{score.grade}</b> <span className="muted small">on {b.series} overall boundaries (a rough guide from one paper)</span>
            </>
          ) : score.marked ? (
            <>
              {score.got} / {score.of} on the {score.marked} question{score.marked === 1 ? '' : 's'} marked so far ({score.questions - score.marked} to go)
            </>
          ) : (
            <span className="muted">No marks entered yet.</span>
          )}
        </span>
        {score.marked > 0 && (
          <button className="btn btn-small btn-ghost" onClick={() => window.confirm('Clear your marks for this paper?') && void clearPaper(paperId)}>
            Clear my marks
          </button>
        )}
      </div>
      {reasons.length > 0 && (
        <p className="small" style={{ margin: 0 }}>
          <b>Where the marks went:</b> {reasons.map((r) => `${r.label} ${Math.round(r.lost)}`).join(' · ')}
        </p>
      )}
    </div>
  );
}

/** The papers you've marked, at the top: score, grade, when — tap to open. */
function YourPapers({ results, onOpen }: { results: PaperResults; onOpen: (id: string) => void }) {
  const mine = Object.entries(results)
    .map(([id, r]) => ({ id, r, s: paperScore(id, r), p: PAST_PAPER_BY_ID.get(id) }))
    .filter((x) => x.p && x.s.marked)
    .sort((a, b) => (b.r.done ?? '').localeCompare(a.r.done ?? '') || b.r.updatedAt - a.r.updatedAt);
  const reasons = lossesByReason(results);
  return (
    <section className="card stack" aria-labelledby="your-papers">
      <h2 id="your-papers" className="h3">
        Your papers
      </h2>
      {mine.length ? (
        <>
          <ul className="list">
            {mine.map(({ id, r, s, p }) => (
              <li key={id}>
                <button className="list-link" onClick={() => onOpen(id)}>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    {p!.series} · {PAPER_TITLES[p!.paper]}
                    {r.done && <span className="muted small"> · done {new Date(`${r.done}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  </span>
                  <span className={`chip ${s.complete ? 'chip-accent' : ''}`}>{s.complete ? `${s.got}/${s.max} · ${s.grade}` : `${s.got}/${s.of} so far`}</span>
                </button>
              </li>
            ))}
          </ul>
          {reasons.length > 0 && (
            <p className="small" style={{ margin: 0 }}>
              <b>Across your papers, marks went on:</b> {reasons.map((x) => `${x.label} (${Math.round(x.lost)})`).join(', ')}
            </p>
          )}
        </>
      ) : (
        <p className="small" style={{ margin: 0 }}>
          Done a real paper? Find it below, tap <b>Enter my marks</b>, and type your mark for each question. You&rsquo;ll get your score, a grade, and which topics and kinds of mistake cost you most.
        </p>
      )}
    </section>
  );
}

export function PastPapers({ open, mark = false }: { open?: string; mark?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(open ?? null);
  const [marking, setMarking] = useState<string | null>(mark && open ? open : null);
  const results = usePaperResults();
  useEffect(() => {
    if (open) document.getElementById(`paper-${open}`)?.scrollIntoView({ block: 'start' });
  }, [open]);

  const needle = search.trim().toLowerCase();
  const papers = PAST_PAPERS.filter(FILTERS.find((f) => f.id === filter)!.test).slice().reverse();
  const matches = (q: PastQuestion) => !needle || q.topic.toLowerCase().includes(needle) || q.families.some((f) => familyTitle(f).toLowerCase().includes(needle));
  const series = [...new Set(papers.map((p) => p.series))];

  const common = useMemo(() => {
    const count = new Map<string, number>();
    for (const q of PAST_QUESTIONS) for (const f of q.families) count.set(f, (count.get(f) ?? 0) + 1);
    return [...count.entries()].filter(([f]) => !f.endsWith('.exam-style')).sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, []);

  return (
    <div className="stack">
      <div>
        <h1>Past papers</h1>
        <p className="muted">
          Every Pearson Edexcel 9MA0 paper from June 2018 to June 2025, question by question. Open the official paper and mark scheme, see what each question tests, and practise the same kind of question here with
          new numbers. (Pearson keeps the latest year&rsquo;s papers for teachers only.)
        </p>
        <div className="btn-row">
          <a className="btn btn-primary" href={href('/practice', { mixed: 1, pp: 1 })}>
            <Icon name="play" /> Practise topics that have come up
          </a>
        </div>
      </div>

      {results && (
        <YourPapers
          results={results}
          onOpen={(id) => {
            setFilter('all');
            setSearch('');
            setMarking(id);
            setTimeout(() => document.getElementById(`paper-${id}`)?.scrollIntoView({ block: 'start' }), 0);
          }}
        />
      )}

      <section className="card">
        <h2 className="h3">Most common topics</h2>
        <ul className="list">
          {common.map(([f, n]) => (
            <li key={f}>
              <a className="list-link" href={href('/practice', { t: (byFamily.get(f) ?? []).map((e) => e.id).join(',') })}>
                <span style={{ flex: 1 }}>{familyTitle(f)}</span>
                <span className="chip chip-accent">{n} questions</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="row-wrap">
        <label className="row">
          Show{' '}
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="row" style={{ flex: 1 }}>
          Topic{' '}
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. binomial, projectile, partial fractions" style={{ flex: 1, minWidth: 0 }} />
        </label>
      </div>

      {series.map((s) => (
        <section key={s} className="stack" style={{ gap: 10 }}>
          <h2>{s}</h2>
          {papers
            .filter((p) => p.series === s)
            .map((p) => {
              const qs = PAST_QUESTIONS.filter((q) => q.paper === p.id);
              const shown = qs.filter(matches);
              if (needle && !shown.length) return null;
              const isOpen = expanded === p.id || !!needle;
              const isMarking = marking === p.id;
              const marks = qs.reduce((t, q) => t + q.marks, 0);
              const score = paperScore(p.id, results?.[p.id]);
              return (
                <article key={p.id} id={`paper-${p.id}`} className="card stack" style={{ gap: 8 }}>
                  <div className="row-wrap">
                    <h3 style={{ flex: 1, margin: 0 }}>{PAPER_TITLES[p.paper]}</h3>
                    {score.complete ? (
                      <span className="chip chip-accent">
                        You: {score.got}/{score.max} · {score.grade}
                      </span>
                    ) : score.marked ? (
                      <span className="chip">
                        Marked {score.marked} of {score.questions}
                      </span>
                    ) : null}
                    <span className="muted small">
                      {qs.length} questions · {marks} marks
                    </span>
                  </div>
                  <div className="btn-row">
                    <a className="btn btn-small" href={p.qp} target="_blank" rel="noopener noreferrer">
                      Question paper (PDF)
                    </a>
                    <a className="btn btn-small" href={p.ms} target="_blank" rel="noopener noreferrer">
                      Mark scheme (PDF)
                    </a>
                    <a className="btn btn-small btn-primary" href={href(`/sit/${p.id}`)}>
                      <Icon name="clock" /> Sit as an exam
                    </a>
                    <button
                      className="btn btn-small"
                      onClick={() => {
                        const items = paperSet(qs);
                        const total = items.reduce((t, it) => t + it.marks, 0);
                        void startSet({ kind: 'timed', title: `${s} ${PAPER_TITLES[p.paper].split(':')[0]}: same topics, new questions`, items: items.map(({ templateId, seed }) => ({ templateId, seed })), durationMin: Math.round(total * MINUTES_PER_MARK) });
                      }}
                    >
                      Timed set on these topics
                    </button>
                    {!needle && (
                      <button className="btn btn-small" aria-expanded={isOpen && !isMarking} onClick={() => (setMarking(null), setExpanded(isOpen && !isMarking ? null : p.id))}>
                        {isOpen && !isMarking ? 'Hide questions' : 'Show questions'}
                      </button>
                    )}
                    <button className="btn btn-small" aria-expanded={isMarking} onClick={() => setMarking(isMarking ? null : p.id)}>
                      {isMarking ? 'Done entering marks' : score.marked ? 'Edit my marks' : 'Enter my marks'}
                    </button>
                  </div>
                  {isMarking ? (
                    <MarkEntry paperId={p.id} qs={qs} result={results?.[p.id]} />
                  ) : (
                    isOpen && (
                    <ul className="list">
                      {shown.map((q) => (
                        <li key={q.q}>
                          <a className="list-link" href={href('/practice', { t: templatesFor(q).map((e) => e.id).join(',') })}>
                            <span className="chip">Q{q.q}</span>
                            <span style={{ flex: 1 }}>
                              {q.topic}
                              <span className="muted small"> · practise: {q.families.map(familyTitle).join('; ')}</span>
                            </span>
                            <span className="chip">{q.marks} marks</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    )
                  )}
                </article>
              );
            })}
        </section>
      ))}
      <p className="muted small">Question papers and mark schemes © Pearson Education Ltd, linked from Pearson&rsquo;s website. Topic summaries are our own.</p>
    </div>
  );
}
