/**
 * `#/group`. Admins: the study group — this week's leaderboard, the work set for everyone with who
 * has done it, the topics the group finds hardest, and setting work and a weekly target. Members:
 * only the work set for them and their own results (the database doesn't let them see anyone else's).
 */
import { useEffect, useMemo, useState } from 'react';
import { href, navigate } from '../router';
import { getStore } from '../storage';
import { assignments, group, groupTarget, removeWork, type Assignment, type Member, type Result } from '../lib/cloud';
import { SetWorkForm, TargetForm, WeakTopics } from './GroupAdmin';
import { ENTRY_BY_ID } from '../content/bank-meta';
import { todayKey } from '../lib/dates';
import { thisWeek, weekStart } from '../lib/streak';
import { useProgress } from '../lib/useProgress';
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

function Leaderboard({ members, target, admin, onTarget }: { members: Member[]; target: number | null; admin: boolean; onTarget: () => void }) {
  const week = todayKey(weekStart());
  const rows = members
    .filter((m) => !m.disabled)
    .map((m) => {
      const w = m.summary?.week.start === week ? m.summary.week : { questions: 0, marks: 0, scored: 0 };
      return { m, w, streak: m.summary?.streak ?? 0, badges: m.summary?.badges ?? 0 };
    })
    .sort((a, b) => b.w.scored - a.w.scored || b.w.questions - a.w.questions || a.m.name.localeCompare(b.m.name));
  const there = target ? rows.filter((r) => r.w.questions >= target).length : 0;
  return (
    <section className="card stack" aria-labelledby="this-week">
      <h2 id="this-week">This week</h2>
      {target !== null && (
        <div className="group-target">
          <span>
            Target: <b>{target} questions each</b> this week · {there} of {rows.length} there
          </span>
          <div className="goal-bar" role="progressbar" aria-label="People who have reached the target" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={there}>
            <span style={{ width: `${rows.length ? (100 * there) / rows.length : 0}%` }} />
          </div>
        </div>
      )}
      {admin && <TargetForm target={target} onDone={onTarget} />}
      <TableWrap label="This week's leaderboard">
        <table className="data group-table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Person</th>
              <th scope="col">Marks</th>
              <th scope="col">Questions</th>
              <th scope="col">Streak</th>
              <th scope="col">Badges</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, w, streak, badges }, i) => (
              <tr key={m.id}>
                <td>{w.scored ? i + 1 : '–'}</td>
                <td>
                  <b>{m.name}</b>
                </td>
                <td>
                  {w.scored}
                  {w.marks ? <span className="muted small"> / {w.marks}</span> : null}
                </td>
                <td>
                  {w.questions}
                  {target ? <span className={`small ${w.questions >= target ? 'good-text-inline' : 'muted'}`}> / {target}</span> : null}
                </td>
                <td>{streak ? `${streak} day${streak === 1 ? '' : 's'}` : '–'}</td>
                <td>{badges || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="muted small">Marks scored since Monday. Everyone's app shares only these totals with the group — never answers or working.</p>
    </section>
  );
}

/** A member's own progress against the weekly target (no one else's). */
function MyTarget({ target }: { target: number }) {
  const { attempts } = useProgress();
  const done = thisWeek(attempts).questions;
  return (
    <section className="card group-target" aria-label="Your weekly target">
      <span>
        This week: <b>{done}</b> of <b>{target}</b> questions{done >= target ? ' — target reached!' : ''}
      </span>
      <div className="goal-bar" role="progressbar" aria-label="Weekly target" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(done, target)}>
        <span style={{ width: `${Math.min(100, (100 * done) / target)}%` }} />
      </div>
    </section>
  );
}

function Work({ a, results, members, meId, onChange }: { a: Assignment; results: Result[]; members: Member[] | null; meId: string; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const mine = results.find((r) => r.userId === meId);
  const due = dueText(a.due);
  const admin = members !== null;
  const active = (members ?? []).filter((m) => !m.disabled);
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
        {admin && (
          <button className="btn btn-small btn-ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
            {done.length} of {active.length} done
          </button>
        )}
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
      {admin && open && (
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
  const [target, setTarget] = useState<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const load = () => {
    setProblem(null);
    // only admins load the group: for members the database returns just themselves anyway
    Promise.all([me?.admin ? group() : Promise.resolve(null), assignments(), groupTarget()])
      .then(([g, w, t]) => {
        setMembers(g);
        setWork(w);
        setTarget(t);
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
        <h1>Set work</h1>
        <p className="muted">Sign in to see the work set for you.</p>
        <CloudSignIn />
      </div>
    );
  if (problem) return <ErrorBox>{problem}</ErrorBox>;
  if (!work || (me.admin && !members)) return <Loading />;
  const todo = work.list.filter((a) => !byWork.get(a.id)?.some((r) => r.userId === me.id));
  const finished = work.list.filter((a) => byWork.get(a.id)?.some((r) => r.userId === me.id));
  return (
    <div className="stack">
      <h1>{me.admin ? 'Study group' : 'Set work'}</h1>
      {!me.admin && target !== null && <MyTarget target={target} />}
      <section className="card stack" aria-labelledby="set-work">
        <h2 id="set-work">Set work</h2>
        {work.list.length ? (
          <>
            {todo.length > 0 && (
              <ul className="list">
                {todo.map((a) => (
                  <Work key={a.id} a={a} results={byWork.get(a.id) ?? []} members={members} meId={me.id} onChange={load} />
                ))}
              </ul>
            )}
            {todo.length === 0 && <p className="small">All done — nice work.</p>}
            {finished.length > 0 && (
              <details>
                <summary className="small">Done ({finished.length})</summary>
                <ul className="list">
                  {finished.map((a) => (
                    <Work key={a.id} a={a} results={byWork.get(a.id) ?? []} members={members} meId={me.id} onChange={load} />
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
            Set work by topic below, or make a mock or timed set on the <a href={href('/exams')}>Exams</a> page (or from a <a href={href('/past-papers')}>past paper</a>) and choose <b>Set this for the group</b> before starting it.
          </p>
        )}
      </section>
      {me.admin && members && (
        <>
          <Leaderboard members={members} target={target} admin onTarget={load} />
          <WeakTopics
            members={members}
            onSet={(c) => {
              setPicked([c]);
              setTimeout(() => document.getElementById('set-by-topic')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 0);
            }}
          />
          <SetWorkForm picked={picked} onPick={setPicked} onDone={load} />
        </>
      )}
    </div>
  );
}
