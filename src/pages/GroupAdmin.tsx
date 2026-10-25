/**
 * Admin tools on the study group page: set work by choosing topics, see which topics the group
 * finds hardest (from what everyone's app shares), and set a weekly target.
 */
import { useEffect, useMemo, useState } from 'react';
import { BANK, ENTRY_BY_ID } from '../content/bank-meta';
import { CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { MINUTES_PER_MARK, buildTimed } from '../lib/sets';
import { activities, setGroupTarget, setWork, type Member } from '../lib/cloud';
import { todayKey } from '../lib/dates';
import { TableWrap } from '../components/bits';
import { Icon } from '../components/Icon';

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
const STREAMS = [
  { name: 'Pure Year 1', test: (c: (typeof CHAPTERS)[number]) => c.stream === 'Pure' && c.year === 1 },
  { name: 'Pure Year 2', test: (c: (typeof CHAPTERS)[number]) => c.stream === 'Pure' && c.year === 2 },
  { name: 'Statistics', test: (c: (typeof CHAPTERS)[number]) => c.stream === 'Statistics' },
  { name: 'Mechanics', test: (c: (typeof CHAPTERS)[number]) => c.stream === 'Mechanics' },
];
const LEVELS = [
  { id: 'any', label: 'Mixed', min: 1, max: 5 },
  { id: 'easy', label: 'Easier (1–3)', min: 1, max: 3 },
  { id: 'hard', label: 'Exam level and harder (3–5)', min: 3, max: 5 },
];
const PRACTISABLE = new Set(BANK.templates.map((t) => t.chapter));

/** Choose topics, marks and a due date; everyone gets the same questions. */
export function SetWorkForm({ picked, onPick, onDone }: { picked: string[]; onPick: (c: string[]) => void; onDone: () => void }) {
  const [marks, setMarks] = useState(20);
  const [level, setLevel] = useState('any');
  const [due, setDue] = useState('');
  const [title, setTitle] = useState('');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const lv = LEVELS.find((l) => l.id === level)!;
  const items = useMemo(() => {
    const pool = BANK.templates.filter((t) => picked.includes(t.chapter) && t.difficulty >= lv.min && t.difficulty <= lv.max);
    return pool.length ? buildTimed(pool, marks, seed) : [];
  }, [picked, marks, lv, seed]);
  const total = items.reduce((t, it) => t + (ENTRY_BY_ID.get(it.templateId)?.marks ?? 0), 0);
  const auto = picked.length === 1 ? CHAPTER_BY_REF.get(picked[0] as never)?.title ?? '' : picked.length ? `${picked.length} topics` : '';
  const toggle = (c: string) => onPick(picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c]);
  const submit = async () => {
    setBusy(true);
    setProblem(null);
    try {
      await setWork({ title: (title.trim() || auto).slice(0, 80), items, durationMin: Math.max(1, Math.round(total * MINUTES_PER_MARK)), due: due || null });
      onPick([]);
      setTitle('');
      setDue('');
      setSeed(Math.floor(Math.random() * 1e9));
      onDone();
    } catch (e) {
      setProblem(message(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card stack" id="set-by-topic" aria-labelledby="set-by-topic-h">
      <h2 id="set-by-topic-h">Set work by topic</h2>
      <fieldset className="topic-pick">
        <legend className="small muted">Topics</legend>
        {STREAMS.map((s) => {
          const chs = CHAPTERS.filter((c) => s.test(c) && PRACTISABLE.has(c.ref));
          const n = chs.filter((c) => picked.includes(c.ref)).length;
          return (
            <details key={s.name} open={n > 0}>
              <summary>
                {s.name}
                {n ? <span className="chip chip-accent">{n}</span> : null}
              </summary>
              <div className="topic-grid">
                {chs.map((c) => (
                  <label key={c.ref} className="row small">
                    <input type="checkbox" checked={picked.includes(c.ref)} onChange={() => toggle(c.ref)} />
                    {c.title}
                  </label>
                ))}
              </div>
            </details>
          );
        })}
      </fieldset>
      <div className="row-wrap">
        <label className="row">
          Marks
          <select value={marks} onChange={(e) => setMarks(Number(e.target.value))}>
            {[10, 15, 20, 30, 40, 50].map((m) => (
              <option key={m} value={m}>
                {m} ({Math.round(m * MINUTES_PER_MARK)} min)
              </option>
            ))}
          </select>
        </label>
        <label className="row">
          Questions
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label className="row">
          Due <input type="date" value={due} min={todayKey()} onChange={(e) => setDue(e.target.value)} />
        </label>
      </div>
      <label className="row">
        Title
        <input type="text" value={title} maxLength={80} placeholder={auto || 'e.g. Integration homework'} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
      </label>
      {picked.length > 0 && (
        <div className="small">
          {items.length ? (
            <>
              <b>
                {items.length} questions · {total} marks · {Math.round(total * MINUTES_PER_MARK)} min:
              </b>{' '}
              {items.map((it) => ENTRY_BY_ID.get(it.templateId)?.title).join('; ')}{' '}
              <button className="btn btn-small btn-ghost" onClick={() => setSeed(Math.floor(Math.random() * 1e9))}>
                <Icon name="refresh" /> Different questions
              </button>
            </>
          ) : (
            <span className="error-text">No questions match — choose more topics or a different level.</span>
          )}
        </div>
      )}
      {problem && <p className="error-text">{problem}</p>}
      <div className="btn-row">
        <button className="btn btn-primary" disabled={!items.length || busy} onClick={() => void submit()}>
          {busy ? 'Setting…' : 'Set it for everyone'}
        </button>
      </div>
    </section>
  );
}

interface TopicRow {
  chapter: string;
  title: string;
  people: number;
  avg: number;
  struggling: string[];
}

/** Which topics the group finds hardest, from each person's shared work (chapters practised, % of marks). */
export function WeakTopics({ members, onSet }: { members: Member[]; onSet: (chapter: string) => void }) {
  const [rows, setRows] = useState<TopicRow[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    activities()
      .then((acts) => {
        const by = new Map<string, { pcts: number[]; struggling: string[] }>();
        for (const m of members.filter((x) => !x.disabled)) {
          for (const c of acts.get(m.id)?.chapters ?? []) {
            if (c.questions < 2) continue;
            const e = by.get(c.chapter) ?? { pcts: [], struggling: [] };
            e.pcts.push(c.pct);
            if (c.pct < 50) e.struggling.push(m.name);
            by.set(c.chapter, e);
          }
        }
        setRows(
          [...by.entries()]
            .map(([chapter, e]) => ({ chapter, title: CHAPTER_BY_REF.get(chapter as never)?.title ?? chapter, people: e.pcts.length, avg: Math.round(e.pcts.reduce((t, p) => t + p, 0) / e.pcts.length), struggling: e.struggling }))
            .sort((a, b) => a.avg - b.avg)
            .slice(0, 12),
        );
      })
      .catch((e) => setProblem(message(e)));
  }, [members]);
  return (
    <section className="card stack" aria-labelledby="weak-topics-h">
      <h2 id="weak-topics-h">Topics the group finds hardest</h2>
      {problem ? (
        <p className="error-text">{problem}</p>
      ) : !rows ? (
        <p className="muted small">Loading…</p>
      ) : !rows.length ? (
        <p className="muted small">Nothing yet: this fills in as people practise (each topic needs a couple of questions from someone).</p>
      ) : (
        <TableWrap label="Hardest topics">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Average</th>
                <th scope="col">People</th>
                <th scope="col">Under 50%</th>
                <th scope="col">
                  <span className="sr-only">Set work</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.chapter}>
                  <th scope="row">{r.title}</th>
                  <td>{r.avg}%</td>
                  <td>{r.people}</td>
                  <td className="small">{r.struggling.join(', ') || '–'}</td>
                  <td>
                    <button className="btn btn-small" onClick={() => onSet(r.chapter)} aria-label={`Set work on ${r.title}`}>
                      Set work
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}
      <p className="muted small">From the chapters each person has practised (their % of marks). Only admins see this.</p>
    </section>
  );
}

/** Set or clear the weekly target. */
export function TargetForm({ target, onDone }: { target: number | null; onDone: () => void }) {
  const [n, setN] = useState(target ?? 30);
  const [problem, setProblem] = useState<string | null>(null);
  const save = (v: number | null) =>
    setGroupTarget(v)
      .then(onDone)
      .catch((e) => setProblem(message(e)));
  return (
    <div className="row-wrap small">
      <label className="row">
        Weekly target: questions each
        <input type="number" inputMode="numeric" min={1} max={1000} value={n} onChange={(e) => setN(Math.max(1, Math.min(1000, Math.round(Number(e.target.value) || 1))))} style={{ width: '5em' }} />
      </label>
      <button className="btn btn-small" onClick={() => void save(n)}>
        {target === null ? 'Set target' : 'Change target'}
      </button>
      {target !== null && (
        <button className="btn btn-small btn-ghost" onClick={() => void save(null)}>
          No target
        </button>
      )}
      {problem && <span className="error-text">{problem}</span>}
    </div>
  );
}
