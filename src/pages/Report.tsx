/**
 * `#/report/<id>` or `#/report/all` (admins): a printable progress report for one person or everyone,
 * from the summary each person's app shares with admins — totals, topics, past papers, mocks and
 * recent questions. Never answers or working. Print it, or save it as a PDF from the print dialog.
 */
import { useEffect, useState } from 'react';
import { activities, group, type ActivitySummary, type Member } from '../lib/cloud';
import { CHAPTER_BY_REF } from '../content/chapters';
import { PAPER_TITLES, PAST_PAPER_BY_ID, isASPaper } from '../content/past-papers';
import { predict, type MockResult } from '../lib/grades';
import { href } from '../router';
import { useCloudMe, CloudSignIn } from './CloudLogins';
import { ErrorBox, Loading } from '../components/bits';
import { Icon } from '../components/Icon';

const day = (t?: number | string | null) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
const pct = (got: number, of: number) => (of ? `${Math.round((100 * got) / of)}%` : '–');

function PersonReport({ m, w }: { m: Member; w: ActivitySummary | undefined }) {
  if (!w)
    return (
      <section className="report-person card stack">
        <h2>{m.name}</h2>
        <p className="muted">{m.name} hasn’t saved any work yet.</p>
      </section>
    );
  const t = w.totals;
  const results: MockResult[] = [
    ...w.papers.filter((p) => p.complete && !isASPaper(p.id)).map((p) => ({ got: p.got, of: p.max, finishedAt: p.at, kind: 'paper' as const })),
    ...w.sets.filter((s) => s.kind === 'mock' && s.of > 0).map((s) => ({ got: s.got, of: s.of, finishedAt: s.at, kind: 'mock' as const })),
  ];
  const grade = predict(results);
  const help = new Set(w.help ?? []);
  return (
    <section className="report-person card stack" aria-label={`Report for ${m.name}`}>
      <div className="report-head">
        <div>
          <h2>{m.name}</h2>
          <span className="small muted">
            {m.username} · last active {day(t.questions ? Math.max(...w.recent.map((r) => r.at), 0) : m.lastSeen)} · report made {day(Date.now())}
          </span>
        </div>
        {grade && (
          <div className="report-grade">
            <b>{grade.grade}</b>
            <span className="small muted">predicted, from {grade.papers} paper{grade.papers === 1 ? '' : 's'}</span>
          </div>
        )}
      </div>
      <table className="data report-table">
        <tbody>
          <tr>
            <th scope="row">Questions answered</th>
            <td>{t.questions}</td>
            <th scope="row">Marks scored</th>
            <td>
              {t.scored}/{t.marks} ({pct(t.scored, t.marks)})
            </td>
          </tr>
          <tr>
            <th scope="row">This week</th>
            <td>
              {t.week.questions} questions ({pct(t.week.scored, t.week.marks)})
            </td>
            <th scope="row">Time practising</th>
            <td>
              {Math.floor(t.minutes / 60)}h {t.minutes % 60}m · streak {t.streak} day{t.streak === 1 ? '' : 's'}
            </td>
          </tr>
        </tbody>
      </table>
      {help.size > 0 && (
        <p style={{ margin: 0 }}>
          <b>Asked for help with:</b> {[...help].map((c) => CHAPTER_BY_REF.get(c as never)?.title ?? c).join(', ')}
        </p>
      )}
      {w.chapters.length > 0 && (
        <>
          <h3>Topics (weakest first)</h3>
          <table className="data report-table">
            <thead>
              <tr>
                <th scope="col">Topic</th>
                <th scope="col">Questions</th>
                <th scope="col">Marks</th>
                <th scope="col">Last practised</th>
              </tr>
            </thead>
            <tbody>
              {w.chapters.map((c) => (
                <tr key={c.chapter}>
                  <th scope="row">
                    {c.title}
                    {help.has(c.chapter) ? ' (asked for help)' : ''}
                  </th>
                  <td>{c.questions}</td>
                  <td>{c.pct}%</td>
                  <td>{day(c.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {w.papers.length > 0 && (
        <>
          <h3>Real past papers</h3>
          <ul className="report-list">
            {w.papers.map((p) => {
              const pp = PAST_PAPER_BY_ID.get(p.id);
              return (
                <li key={p.id}>
                  {pp ? `${pp.series} ${PAPER_TITLES[pp.paper]}` : p.id}: {p.complete ? `${p.got}/${p.max} (${pct(p.got, p.max)})` : `${p.got}/${p.of} so far`} · {day(p.done ?? p.at)}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {w.sets.length > 0 && (
        <>
          <h3>Mocks and timed sets</h3>
          <ul className="report-list">
            {w.sets.map((s, i) => (
              <li key={i}>
                {s.title}: {s.got}/{s.of} ({pct(s.got, s.of)}) · {day(s.at)}
              </li>
            ))}
          </ul>
        </>
      )}
      {w.recent.length > 0 && (
        <>
          <h3>Recent questions</h3>
          <ul className="report-list">
            {w.recent.slice(0, 10).map((r, i) => (
              <li key={i}>
                {r.title}: {r.scored}/{r.marks} · {day(r.at)}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        From the summary {m.name}’s app shares with admins — no answers or working.
      </p>
    </section>
  );
}

export function Report({ who }: { who: string }) {
  const me = useCloudMe();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [work, setWork] = useState<Map<string, ActivitySummary> | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    if (!me?.admin) return;
    Promise.all([group(), activities()])
      .then(([g, a]) => {
        setMembers(g);
        setWork(a);
      })
      .catch((e) => setProblem(e instanceof Error ? e.message : 'Couldn’t load the reports'));
  }, [me]);
  if (!me)
    return (
      <div className="stack">
        <h1>Progress reports</h1>
        <CloudSignIn />
      </div>
    );
  if (!me.admin) return <ErrorBox>Only an admin can see progress reports.</ErrorBox>;
  if (problem) return <ErrorBox>{problem}</ErrorBox>;
  if (!members || !work) return <Loading />;
  const people = (who === 'all' ? members.filter((m) => !m.disabled) : members.filter((m) => m.id === who)).sort((a, b) => a.name.localeCompare(b.name));
  if (!people.length) return <ErrorBox>That login wasn’t found.</ErrorBox>;
  return (
    <div className="stack report">
      <div className="row-wrap no-print">
        <h1 style={{ flex: 1, margin: 0 }}>{who === 'all' ? 'Progress reports' : `Progress report: ${people[0].name}`}</h1>
        <a className="btn" href={href('/logins')}>
          Back
        </a>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Icon name="download" /> Print or save as PDF
        </button>
      </div>
      {people.map((m) => (
        <PersonReport key={m.id} m={m} w={work.get(m.id)} />
      ))}
    </div>
  );
}
