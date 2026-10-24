/**
 * `#/group`: the study group — everyone with a login. This week's leaderboard (questions, marks,
 * streak), and work an admin has set for everyone, with who has done it.
 */
import { useEffect, useMemo, useState } from 'react';
import { href, navigate } from '../router';
import { getStore } from '../storage';
import { assignments, group, removeWork, type Assignment, type Member, type Result } from '../lib/cloud';
import { ENTRY_BY_ID } from '../content/bank-meta';
import { todayKey } from '../lib/dates';
import { weekStart } from '../lib/streak';
import { startSet } from './Exams';
import { useCloudMe, CloudSignIn } from './CloudLogins';
import { ErrorBox, Loading, TableWrap } from '../components/bits';
import { Icon } from '../components/Icon';

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
const marksOf = (a: Assignment) => a.items.reduce((t, it) => t + (ENTRY_BY_ID.get(it.templateId)?.marks ?? 0), 0);
const dueText = (due: string | null) => {
  if (!due) return null;
  const days = Math.round((new Date(`${due}T12:00:00`).getTime() - new Date(`${todayKey()}T12:00:00`).getTime()) / 86_400_000);
  const date = new Date(`${due}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return { overdue: days < 0, text: days < 0 ? `was due ${date}` : days === 0 ? 'due today' : days === 1 ? 'due tomorrow' : `due ${date}` };
};

/** Start (or carry on with) a piece of set work: the same questions for everyone. */
export async function startWork(a: Assignment) {
  const id = `assign-${a.id}`;
  if (await (await getStore()).getSet(id)) return navigate(`/set/${id}`); // already started (here or on another device)
  await startSet({ id: `assign-${a.id}`, kind: 'timed', title: a.title, items: a.items, durationMin: a.durationMin, assignmentId: a.id });
}

function Leaderboard({ members }: { members: Member[] }) {
  const week = todayKey(weekStart());
  const rows = members
    .filter((m) => !m.disabled)
    .map((m) => {
      const w = m.summary?.week.start === week ? m.summary.week : { questions: 0, marks: 0, scored: 0 };
      return { m, w, streak: m.summary?.streak ?? 0 };
    })
    .sort((a, b) => b.w.scored - a.w.scored || b.w.questions - a.w.questions || a.m.name.localeCompare(b.m.name));
  return (
    <section className="card stack" aria-labelledby="this-week">
      <h2 id="this-week">This week</h2>
      <TableWrap label="This week's leaderboard">
        <table className="data group-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Person</th>
              <th scope="col">Marks</th>
              <th scope="col">Questions</th>
              <th scope="col">Streak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, w, streak }, i) => (
              <tr key={m.id}>
                <td>{w.scored ? i + 1 : '–'}</td>
                <td>
                  <b>{m.name}</b>
                </td>
                <td>
                  {w.scored}
                  {w.marks ? <span className="muted small"> / {w.marks}</span> : null}
                </td>
                <td>{w.questions}</td>
                <td>{streak ? `${streak} day${streak === 1 ? '' : 's'}` : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="muted small">Marks scored since Monday. Everyone's app shares only these totals with the group — never answers or working.</p>
    </section>
  );
}

function Work({ a, results, members, meId, admin, onChange }: { a: Assignment; results: Result[]; members: Member[]; meId: string; admin: boolean; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const mine = results.find((r) => r.userId === meId);
  const due = dueText(a.due);
  const active = members.filter((m) => !m.disabled);
  const done = results.filter((r) => active.some((m) => m.id === r.userId));
  const marks = marksOf(a);
  return (
    <li className="work stack">
      <div className="row-wrap">
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{a.title}</b>
          <div className="small muted">
            {a.items.length} question{a.items.length === 1 ? '' : 's'} · {marks} marks · {a.durationMin} min
            {due && <span className={due.overdue && !mine ? 'error-text' : ''}> · {due.text}</span>}
          </div>
        </div>
        {mine ? (
          <span className="chip chip-accent">
            You: {mine.got}/{mine.of}
          </span>
        ) : (
          <button className="btn btn-primary btn-small" onClick={() => void startWork(a)}>
            <Icon name="play" /> Start
          </button>
        )}
      </div>
      <div className="row-wrap">
        <button className="btn btn-small btn-ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
          {done.length} of {active.length} done
        </button>
        {mine && (
          <a className="btn btn-small btn-ghost" href={href(`/set/assign-${a.id}`)}>
            Review
          </a>
        )}
        {admin && (
          <button className="btn btn-small btn-ghost" onClick={() => window.confirm(`Remove “${a.title}” for everyone?`) && void removeWork(a.id).then(onChange)}>
            Remove
          </button>
        )}
      </div>
      {open && (
        <ul className="list small">
          {active.map((m) => {
            const r = results.find((x) => x.userId === m.id);
            return (
              <li key={m.id} className="row-wrap" style={{ padding: '4px 0' }}>
                <span style={{ flex: 1 }}>{m.name}</span>
                <span className={r ? '' : 'muted'}>{r ? `${r.got}/${r.of} (${Math.round((100 * r.got) / r.of)}%)` : 'not yet'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function Group() {
  const me = useCloudMe();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [work, setWork] = useState<{ list: Assignment[]; results: Result[] } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const load = () => {
    setProblem(null);
    Promise.all([group(), assignments()])
      .then(([g, w]) => {
        setMembers(g);
        setWork(w);
      })
      .catch((e) => setProblem(message(e)));
  };
  useEffect(() => {
    if (me) load();
  }, [me]);
  const byWork = useMemo(() => {
    const m = new Map<string, Result[]>();
    for (const r of work?.results ?? []) m.set(r.assignmentId, [...(m.get(r.assignmentId) ?? []), r]);
    return m;
  }, [work]);

  if (!me)
    return (
      <div className="stack">
        <h1>Study group</h1>
        <p className="muted">Sign in to see your group: this week's leaderboard and the work set for everyone.</p>
        <CloudSignIn />
      </div>
    );
  if (problem) return <ErrorBox>{problem}</ErrorBox>;
  if (!members || !work) return <Loading />;
  const todo = work.list.filter((a) => !byWork.get(a.id)?.some((r) => r.userId === me.id));
  const finished = work.list.filter((a) => byWork.get(a.id)?.some((r) => r.userId === me.id));
  return (
    <div className="stack">
      <h1>Study group</h1>
      <section className="card stack" aria-labelledby="set-work">
        <h2 id="set-work">Set work</h2>
        {work.list.length ? (
          <>
            {todo.length > 0 && (
              <ul className="list">
                {todo.map((a) => (
                  <Work key={a.id} a={a} results={byWork.get(a.id) ?? []} members={members} meId={me.id} admin={me.admin} onChange={load} />
                ))}
              </ul>
            )}
            {todo.length === 0 && <p className="small">All done — nice work.</p>}
            {finished.length > 0 && (
              <details>
                <summary className="small">Done ({finished.length})</summary>
                <ul className="list">
                  {finished.map((a) => (
                    <Work key={a.id} a={a} results={byWork.get(a.id) ?? []} members={members} meId={me.id} admin={me.admin} onChange={load} />
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p className="muted small">Nothing set yet.</p>
        )}
        {me.admin && (
          <p className="small muted">
            To set work: make a mock or timed set on the <a href={href('/exams')}>Exams</a> page (or from a <a href={href('/past-papers')}>past paper</a>), then choose <b>Set this for the group</b> before starting it.
          </p>
        )}
      </section>
      <Leaderboard members={members} />
    </div>
  );
}
