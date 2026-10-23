import { useEffect, useMemo, useState } from 'react';
import { PAPER_TITLES, PAST_PAPERS, PAST_QUESTIONS, type PastPaper, type PastQuestion } from '../content/past-papers';
import { BANK, type BankEntry } from '../content/bank-meta';
import { seedsFor } from '../content/bank-seeds';
import { MINUTES_PER_MARK } from '../lib/sets';
import { href } from '../router';
import { Icon } from '../components/Icon';
import { startSet } from './Exams';

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

export function PastPapers({ open }: { open?: string }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(open ?? null);
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
              const marks = qs.reduce((t, q) => t + q.marks, 0);
              return (
                <article key={p.id} id={`paper-${p.id}`} className="card stack" style={{ gap: 8 }}>
                  <div className="row-wrap">
                    <h3 style={{ flex: 1, margin: 0 }}>{PAPER_TITLES[p.paper]}</h3>
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
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => {
                        const items = paperSet(qs);
                        const total = items.reduce((t, it) => t + it.marks, 0);
                        void startSet({ kind: 'timed', title: `${s} ${PAPER_TITLES[p.paper].split(':')[0]}: same topics, new questions`, items: items.map(({ templateId, seed }) => ({ templateId, seed })), durationMin: Math.round(total * MINUTES_PER_MARK) });
                      }}
                    >
                      Timed set on these topics
                    </button>
                    {!needle && (
                      <button className="btn btn-small" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : p.id)}>
                        {isOpen ? 'Hide questions' : 'Show questions'}
                      </button>
                    )}
                  </div>
                  {isOpen && (
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
