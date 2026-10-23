import { useEffect, useState } from 'react';
import { BANK, type BankEntry } from '../content/bank-meta';
import { CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { getStore } from '../storage';
import type { SetRecord } from '../storage/types';
import { PAPERS, MINUTES_PER_MARK, buildDaily, buildPaper, buildTimed, newSetId, setMarks, todayKey } from '../lib/sets';
import { useProgress } from '../lib/useProgress';
import { scoreOf } from '../progress/mastery';
import { href, navigate } from '../router';
import { Icon } from '../components/Icon';
import { Loading } from '../components/bits';

const AREAS: { id: string; label: string; test: (e: BankEntry) => boolean }[] = [
  { id: 'pure1', label: 'Pure Year 1', test: (e) => e.chapter.startsWith('P1.') },
  { id: 'pure2', label: 'Pure Year 2', test: (e) => e.chapter.startsWith('P2.') },
  { id: 'pure', label: 'All Pure', test: (e) => e.chapter.startsWith('P') },
  { id: 'stats', label: 'All Statistics', test: (e) => CHAPTER_BY_REF.get(e.chapter)?.stream === 'Statistics' },
  { id: 'mech', label: 'All Mechanics', test: (e) => CHAPTER_BY_REF.get(e.chapter)?.stream === 'Mechanics' },
  { id: 'long', label: 'Long exam-style questions (10+ marks)', test: (e) => e.marks >= 10 },
  { id: 'all', label: 'Everything', test: () => true },
];

export async function startSet(rec: Omit<SetRecord, 'id' | 'createdAt' | 'status'> & { id?: string }): Promise<void> {
  const store = await getStore();
  const set: SetRecord = { ...rec, id: rec.id ?? newSetId(rec.kind), createdAt: Date.now(), status: 'new' };
  await store.putSet(set);
  navigate(`/set/${set.id}`);
}

export function Exams() {
  const { attempts, cards, loading } = useProgress();
  const [sets, setSets] = useState<SetRecord[] | null>(null);
  const [area, setArea] = useState('pure1');
  const [marks, setMarksTarget] = useState(20);
  useEffect(() => {
    void (async () => setSets((await (await getStore()).allSets()).sort((a, b) => b.createdAt - a.createdAt)))();
  }, []);
  if (loading || !sets) return <Loading />;

  const day = todayKey();
  const dailyId = `daily-${day}`;
  const daily = sets.find((s) => s.id === dailyId);
  const dailyDone = daily ? new Set(attempts.filter((a) => a.setId === dailyId).map((a) => `${a.templateId}:${a.seed}`)).size : 0;

  const openDaily = async () => {
    if (daily) return navigate(`/set/${dailyId}`);
    const items = buildDaily(day, attempts, cards);
    await startSet({ id: dailyId, kind: 'daily', title: `Daily set — ${new Date().toLocaleDateString()}`, items, durationMin: 0 });
  };
  const chapterOptions = CHAPTERS.filter((c) => BANK.templates.some((t) => t.chapter === c.ref));

  const startTimed = async () => {
    const areaDef = AREAS.find((a) => a.id === area);
    const pool = BANK.templates.filter((e) => (areaDef ? areaDef.test(e) : e.chapter === area));
    const items = buildTimed(pool, marks, Date.now() % 2 ** 31);
    const got = setMarks(items);
    const label = areaDef?.label ?? CHAPTER_BY_REF.get(area as never)?.title ?? area;
    await startSet({ kind: 'timed', title: `${label} — ${got} marks`, items, durationMin: Math.round(got * MINUTES_PER_MARK) });
  };

  return (
    <div className="stack">
      <div>
        <h1>Exams and sets</h1>
        <p className="muted">Exam-style practice: answers are marked only when you finish. Allow 1.2 minutes per mark, as in the real papers.</p>
      </div>

      <section className="card stack">
        <h2>
          <Icon name="refresh" /> Today's set
        </h2>
        <p className="muted small">Five questions chosen for you: topics due for review, your weakest chapters, and something new. Instant feedback on each.</p>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={openDaily}>
            {daily ? (dailyDone >= daily.items.length ? 'Review today’s set' : `Continue (${dailyDone}/${daily.items.length} done)`) : 'Start today’s set'}
          </button>
        </div>
      </section>

      <section className="card stack">
        <h2>
          <Icon name="clock" /> Mock papers
        </h2>
        <p className="muted small">A full paper is 100 marks in 2 hours. Questions are drawn at random from the whole bank for that paper, easier first.</p>
        <p className="small">
          Want the real thing? <a href={href('/past-papers')}>Past papers 2018–2025</a> links every official Edexcel paper and mark scheme, question by question.
        </p>
        <ul className="list">
          {PAPERS.map((p) => {
            const m = p.sections.reduce((s, x) => s + x.marks, 0);
            return (
              <li key={p.id}>
                <div className="list-link">
                  <span style={{ flex: 1 }}>
                    {p.title}
                    <span className="muted small">
                      {' '}
                      · {m} marks · {Math.round(m * MINUTES_PER_MARK)} min
                    </span>
                  </span>
                  <button
                    className="btn btn-small btn-primary"
                    onClick={async () => {
                      const { items, sections, marks: got } = buildPaper(p, Date.now() % 2 ** 31);
                      await startSet({ kind: 'mock', title: p.title, items, sections, durationMin: Math.round(got * MINUTES_PER_MARK) });
                    }}
                  >
                    Start
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card stack">
        <h2>
          <Icon name="grid" /> Timed set
        </h2>
        <div className="row-wrap">
          <label className="row">
            Topics{' '}
            <select value={area} onChange={(e) => setArea(e.target.value)}>
              <optgroup label="Areas">
                {AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Chapters">
                {chapterOptions.map((c) => (
                  <option key={c.ref} value={c.ref}>
                    {c.book} ch {c.n}: {c.title}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <label className="row">
            Marks{' '}
            <select value={marks} onChange={(e) => setMarksTarget(Number(e.target.value))}>
              {[10, 15, 20, 25, 30, 40, 50].map((m) => (
                <option key={m} value={m}>
                  {m} marks · {Math.round(m * MINUTES_PER_MARK)} min
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary" onClick={startTimed}>
            Start timed set
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Your sets</h2>
        <ul className="list">
          {sets
            .filter((s) => s.kind !== 'daily' || s.id === dailyId || s.status === 'finished')
            .map((s) => {
              const as = attempts.filter((a) => a.setId === s.id);
              const got = as.reduce((t, a) => t + scoreOf(a), 0),
                of = setMarks(s.items);
              return (
                <li key={s.id}>
                  <a className="list-link" href={href(`/set/${s.id}`)}>
                    <span className="chip">{s.kind}</span>
                    <span style={{ flex: 1 }}>
                      {s.title}
                      <span className="muted small"> · {new Date(s.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className="muted small">{s.status === 'finished' ? 'finished' : s.status === 'running' ? 'in progress' : 'not started'}</span>
                    {as.length > 0 && (
                      <span className="score-pill">
                        {got}/{of}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          {!sets.length && <li className="muted">No sets yet.</li>}
        </ul>
      </section>
    </div>
  );
}
