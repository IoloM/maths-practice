import { useEffect, useState } from 'react';
import { PAPER_TITLES, PAST_PAPER_BY_ID, minutesPerMark } from '../content/past-papers';
import { questionsFor } from '../lib/paper-results';
import { elapsed, finish, loadSitting, mmss, moveTo, pace, paperMinutes, pause, resume, saveSitting, spentNow, start, type Sitting } from '../lib/sitting';
import { href, navigate } from '../router';
import { BookletButton } from '../components/BookletButton';
import { ErrorBox, Loading } from '../components/bits';
import { Icon } from '../components/Icon';

/** Keep the screen on while the clock runs (where the browser allows it). */
function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const get = () => void navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => {});
    get();
    const again = () => document.visibilityState === 'visible' && get();
    document.addEventListener('visibilitychange', again);
    return () => {
      document.removeEventListener('visibilitychange', again);
      void lock?.release().catch(() => {});
    };
  }, [on]);
}

/** Sit a real past paper as an exam: its own time, a clock, and the time each question takes. */
export function SitPaper({ paperId }: { paperId: string }) {
  const paper = PAST_PAPER_BY_ID.get(paperId);
  const qs = questionsFor(paperId);
  const [sitting, setSitting] = useState<Sitting | null | undefined>(undefined);
  const [other, setOther] = useState<Sitting | null>(null);
  const [now, setNow] = useState(Date.now());
  const running = !!sitting && !sitting.pausedAt;
  useWakeLock(running);

  useEffect(() => {
    void loadSitting().then((s) => {
      if (s && s.paperId !== paperId) {
        setOther(s);
        setSitting(null);
      } else setSitting(s);
    });
  }, [paperId]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const change = (s: Sitting) => {
    setSitting(s);
    setNow(Date.now());
    void saveSitting(s);
  };

  if (!paper || !qs.length) return <ErrorBox>That paper isn’t in the list. <a href={href('/past-papers')}>Past papers</a></ErrorBox>;
  if (sitting === undefined) return <Loading />;
  const title = `${paper.series} ${PAPER_TITLES[paper.paper]}`;
  const minutes = paperMinutes(paperId);
  const perMark = minutesPerMark(paper.paper);
  const marks = qs.reduce((t, q) => t + q.marks, 0);

  if (!sitting) {
    return (
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>
          <a href={href('/past-papers', { p: paperId })}>← Past papers</a>
        </p>
        <h1>Sit {title}</h1>
        {other && (
          <ErrorBox>
            You’re part-way through another paper ({PAST_PAPER_BY_ID.get(other.paperId)?.series} {PAPER_TITLES[PAST_PAPER_BY_ID.get(other.paperId)?.paper ?? '1']}).{' '}
            <a href={href(`/sit/${other.paperId}`)}>Go back to it</a>, or start this one and that one’s clock is dropped.
          </ErrorBox>
        )}
        <section className="card stack">
          <p style={{ margin: 0 }}>
            <b>{minutes} minutes</b> · {marks} marks · {qs.length} questions — the same time you’d get in the exam
            {paper.paper === 'as21' || paper.paper === 'as22' ? ' (the two sections of AS Paper 2 are sat together in 1 hour 15 minutes; this is half of that).' : '.'}
          </p>
          <ol className="tips">
            <li>
              Open the{' '}
              <a href={paper.qp} target="_blank" rel="noopener noreferrer">
                question paper (PDF)
              </a>{' '}
              — print it, or have it on another screen. Work on paper.
            </li>
            <li>Have a calculator ready. The formula booklet is here: <BookletButton className="btn btn-small" /></li>
            <li>As you move on to each question, tap it here, so you can see afterwards where the time went.</li>
            <li>When you finish, mark it with the official mark scheme and type in your marks.</li>
          </ol>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => change(start(paperId))}>
              <Icon name="play" /> Start — the clock begins now
            </button>
          </div>
        </section>
      </div>
    );
  }

  const spent = spentNow(sitting, now);
  const used = elapsed(sitting, now);
  const left = minutes * 60_000 - used;
  const ahead = pace(sitting, now);
  const idx = qs.findIndex((q) => q.q === sitting.current);
  const next = qs[idx + 1];
  const done = async () => {
    if (!window.confirm('Finish the paper and enter your marks?')) return;
    await finish(sitting);
    navigate('/past-papers', { p: paperId, mark: 1 });
  };

  return (
    <div className="stack exam">
      <div className="exam-bar" role="region" aria-label="Exam clock">
        <span className={`exam-clock ${left < 5 * 60_000 ? 'warn' : ''}`} aria-label={left >= 0 ? `Time remaining ${mmss(left)}` : `Over time by ${mmss(-left)}`}>
          <Icon name="clock" /> {left >= 0 ? mmss(left) : `+${mmss(-left)}`}
        </span>
        <span className={`small ${ahead < -2 ? 'slow' : 'muted'}`}>{sitting.pausedAt ? 'Paused' : ahead < -1 ? `${Math.round(-ahead)} min behind` : 'On pace'}</span>
        <span className="spacer" />
        <BookletButton className="btn btn-small" />
        <button className="btn btn-small" onClick={() => change(sitting.pausedAt ? resume(sitting) : pause(sitting))}>
          {sitting.pausedAt ? 'Resume' : 'Pause'}
        </button>
        <button className="btn btn-small btn-primary" onClick={() => void done()}>
          Finish
        </button>
      </div>
      <h1>{title}</h1>
      {left < 0 && <p className="card warn-text">Time’s up. Finish now to keep it like the real exam, or carry on and see how much longer you need.</p>}
      <section className="card stack">
        <div className="row-wrap">
          <span style={{ flex: 1 }}>
            Working on <b>question {sitting.current}</b> ({qs[idx]?.marks} marks, aim for {Math.round((qs[idx]?.marks ?? 0) * perMark)} min)
          </span>
          {next && (
            <button className="btn btn-primary" onClick={() => change(moveTo(sitting, next.q))} disabled={!!sitting.pausedAt}>
              On to question {next.q} <Icon name="next" />
            </button>
          )}
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          Going back to a question? Tap it below. Total so far {mmss(used)} of {minutes} min.
        </p>
      </section>
      <ul className="list sit-list" aria-label="Questions">
        {qs.map((q) => {
          const ms = spent[q.q] ?? 0;
          const aim = q.marks * perMark * 60_000;
          const on = q.q === sitting.current;
          return (
            <li key={q.q}>
              <button className={`list-link ${on ? 'current' : ''}`} aria-current={on ? 'step' : undefined} onClick={() => change(moveTo(sitting, q.q))} disabled={!!sitting.pausedAt}>
                <span className="chip">Q{q.q}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {q.marks} marks <span className="muted small">· aim {Math.round(aim / 60_000)} min</span>
                </span>
                <span className={`small ${ms > aim * 1.25 ? 'slow' : 'muted'}`}>{ms ? mmss(ms) : '–'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
