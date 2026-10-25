import { useEffect, useState } from 'react';
import { BANK } from '../content/bank-meta';
import { CHAPTERS } from '../content/chapters';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { mastery, groupBy, scoreOf } from '../progress/mastery';
import { isDue, isQuestionCard } from '../srs/fsrs';
import { todayKey } from '../lib/dates';
import { getStore } from '../storage';
import type { SetRecord } from '../storage/types';
import { RagBadge } from '../components/bits';
import { Icon } from '../components/Icon';
import { useSettings } from '../lib/settings';
import { formatExamDate, upcomingExams } from '../lib/exams';
import { doneToday, lastDays, streak } from '../lib/streak';
import { cloudMe, assignments } from '../lib/cloud';
import type { Attempt, CardRecord } from '../storage/types';
import { buildPlan, type PlanInput } from '../lib/plan';
import { usePaperResults } from '../lib/paper-results';
import { isOpen, mistakesFrom, useMistakeNotes } from '../lib/mistakes';
import { flagged, useTopicMarks } from '../lib/topics';

const PRIORITY = [
  { label: 'Integration (Pure Y1 13.5–13.7)', chapter: 'P1.13' },
  { label: 'Integration (Pure Y2)', chapter: 'P2.11' },
  { label: 'Hypothesis testing', chapter: 'SM1.7' },
  { label: 'Forces and motion', chapter: 'SM1.10' },
  { label: 'Modelling assumptions', chapter: 'SM1.8' },
  { label: 'Binomial cumulative probabilities', chapter: 'SM1.6' },
  { label: 'Histograms', chapter: 'SM1.3' },
  { label: 'Variance', chapter: 'SM1.2' },
  { label: 'Inclined planes', chapter: 'SM2.5' },
];

/** Today's questions against the daily goal, the streak, and the last fortnight at a glance. */
function GoalCard({ attempts, goal }: { attempts: Attempt[]; goal: number }) {
  const today = doneToday(attempts);
  const run = streak(attempts);
  const days = lastDays(attempts, 14);
  const pct = Math.min(100, Math.round((100 * today) / goal));
  return (
    <section className="card goal" aria-label="Daily goal">
      <div className="goal-main">
        <div className="goal-text">
          <b>
            {today} of {goal}
          </b>{' '}
          questions today{today >= goal ? ' — goal met!' : ''}
          <div className="goal-bar" role="progressbar" aria-label="Daily goal" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(today, goal)}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className={`goal-streak ${run ? 'on' : ''}`}>
          <Icon name="flame" />
          <span>
            <b>{run}</b> day{run === 1 ? '' : 's'}
            <br />
            <span className="muted small">streak</span>
          </span>
        </div>
      </div>
      <ol className="goal-days" aria-label="The last two weeks">
        {days.map((d) => (
          <li key={d.day} className={d.count >= goal ? 'met' : d.count ? 'some' : ''} title={`${new Date(`${d.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}: ${d.count} question${d.count === 1 ? '' : 's'}`}>
            <span className="sr-only">
              {d.day}: {d.count} questions
            </span>
          </li>
        ))}
      </ol>
      <a className="small" href={href('/settings')}>
        Change goal
      </a>
    </section>
  );
}

/** Signed in online: set work not handed in yet. */
function useSetWork(): PlanInput['setWork'] | null {
  const [work, setWork] = useState<PlanInput['setWork'] | null>(null);
  useEffect(() => {
    const me = cloudMe();
    if (!me) return;
    assignments()
      .then(({ list, results }) =>
        setWork(list.filter((a) => !results.some((r) => r.assignmentId === a.id && r.userId === me.id)).map((a) => ({ id: a.id, title: a.title, due: a.due, minutes: a.durationMin }))),
      )
      .catch(() => setWork(null));
  }, []);
  return work;
}

/** What's most worth doing today, ticking itself off as you go. */
function PlanCard({ attempts, cards, setWork, exams }: { attempts: Attempt[]; cards: CardRecord[]; setWork: PlanInput['setWork']; exams: PlanInput['exams'] }) {
  const papers = usePaperResults();
  const notes = useMistakeNotes();
  const topics = useTopicMarks();
  if (!papers || !notes || !topics) return null;
  const items = buildPlan({ attempts, cards, papers, notes, setWork, exams, topics });
  if (!items.length) return null;
  const left = items.filter((i) => !i.done);
  const minutes = left.reduce((t, i) => t + i.minutes, 0);
  return (
    <section className="card plan" aria-labelledby="plan-h">
      <div className="plan-head">
        <h2 id="plan-h">Your plan for today</h2>
        <span className="small muted">{left.length ? `about ${minutes} min left` : 'all done — nice work'}</span>
      </div>
      <ol className="plan-list">
        {items.map((i) => (
          <li key={i.id} className={i.done ? 'done' : ''}>
            <a href={href(i.path, i.query)}>
              <span className="plan-tick" aria-hidden="true">
                {i.done ? <Icon name="check" /> : null}
              </span>
              <span className="plan-text">
                <b>{i.title}</b>
                <span className="small muted">
                  {i.detail}
                  {!i.done && ` · ${i.minutes} min`}
                </span>
              </span>
              <span className="sr-only">{i.done ? '(done)' : ''}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Signed in online: the study group, with how much set work is waiting. */
function GroupTile({ todo }: { todo: number | null }) {
  return (
    <a className="card tile" href={href('/group')}>
      <h2>
        <Icon name="users" /> Study group
      </h2>
      <span className="muted">{todo ? `${todo} piece${todo === 1 ? '' : 's'} of set work to do` : 'This week’s leaderboard and set work'}</span>
    </a>
  );
}

export function Home() {
  const { attempts, cards } = useProgress();
  const { settings } = useSettings();
  const exams = upcomingExams(settings.examDates);
  const anyDates = Object.values(settings.examDates).some(Boolean);
  const [daily, setDaily] = useState<SetRecord | null>(null);
  const dailyId = `daily-${todayKey()}`;
  useEffect(() => {
    void getStore().then(async (s) => setDaily((await s.getSet(dailyId)) ?? null));
  }, [dailyId]);
  const byCh = groupBy(attempts, (a) => a.chapter);
  const marks = attempts.reduce((s, a) => s + a.marks, 0);
  const got = attempts.reduce((s, a) => s + scoreOf(a), 0);
  const last = attempts[attempts.length - 1];
  const due = cards.filter((c) => isQuestionCard(c) && isDue(c)).length;
  const flashDue = cards.filter((c) => !isQuestionCard(c) && isDue(c)).length;
  const dailyDone = daily ? new Set(attempts.filter((a) => a.setId === dailyId).map((a) => `${a.templateId}:${a.seed}`)).size : 0;
  const setWork = useSetWork();
  const notes = useMistakeNotes();
  const openMistakes = notes ? mistakesFrom(attempts).filter((m) => isOpen(m, notes)).length : 0;
  const topicMarks = useTopicMarks();
  const helpTopics = topicMarks ? flagged(topicMarks, 'help').length : 0;
  return (
    <div className="stack">
      <div>
        <h1>Edexcel A Level Maths practice</h1>
        <p className="muted">
          9MA0 Pure, Statistics and Mechanics · {BANK.totals.templates} question types · {BANK.totals.questions.toLocaleString()} verified questions · {BANK.totals.fixed} explain-and-prove questions · works offline
        </p>
      </div>
      {exams.length > 0 ? (
        <section className="card countdown" aria-label="Exam countdown">
          <div className="countdown-main">
            <b className="countdown-days">{exams[0].days === 0 ? 'Today' : exams[0].days}</b>
            <span>
              {exams[0].days === 0 ? `${exams[0].label} — good luck!` : `day${exams[0].days === 1 ? '' : 's'} to ${exams[0].label}`}
              <br />
              <span className="muted small">{formatExamDate(exams[0].date)}</span>
            </span>
          </div>
          {exams.length > 1 && (
            <ul className="countdown-rest small">
              {exams.slice(1).map((e) => (
                <li key={e.id}>
                  {e.label.split(':')[0]}: <b>{e.days}</b> days ({formatExamDate(e.date)})
                </li>
              ))}
            </ul>
          )}
          <a className="small" href={href('/settings')}>
            Change dates
          </a>
        </section>
      ) : (
        !anyDates && (
          <p className="small" style={{ margin: 0 }}>
            <a href={href('/settings')}>Add your exam dates</a> for a countdown.
          </p>
        )
      )}
      <GoalCard attempts={attempts} goal={settings.dailyGoal} />
      <PlanCard attempts={attempts} cards={cards} setWork={setWork ?? []} exams={exams} />
      <div className="grid">
        {cloudMe() && <GroupTile todo={setWork ? setWork.length : null} />}
        {last && (
          <a className="card tile" href={href('/practice', { c: last.chapter })}>
            <h2>
              <Icon name="play" /> Continue
            </h2>
            <span className="muted">{CHAPTERS.find((c) => c.ref === last.chapter)?.title ?? last.chapter}</span>
          </a>
        )}
        <a className="card tile" href={href('/exams')}>
          <h2>
            <Icon name="refresh" /> Today’s set
          </h2>
          <span className="muted">{daily ? `${dailyDone}/${daily.items.length} done` : '5 questions picked for you'}</span>
        </a>
        <a className="card tile" href={href('/review')}>
          <h2>
            <Icon name="review" /> Review
          </h2>
          <span className="muted">{due ? `${due} due now` : 'Nothing due'}</span>
        </a>
        <a className="card tile" href={href('/learn')}>
          <h2>
            <Icon name="bulb" /> Learn a topic
          </h2>
          <span className="muted">{helpTopics ? `${helpTopics} topic${helpTopics === 1 ? '' : 's'} you need help with` : 'Notes, worked examples and videos for every topic'}</span>
        </a>
        <a className="card tile" href={href('/mistakes')}>
          <h2>
            <Icon name="x" /> Mistake notebook
          </h2>
          <span className="muted">{openMistakes ? `${openMistakes} to put right` : 'Questions you dropped marks on'}</span>
        </a>
        <a className="card tile" href={href('/topics')}>
          <h2>
            <Icon name="book" /> Topic practice
          </h2>
          <span className="muted">Choose a textbook chapter or spec point</span>
        </a>
        <div className="card tile">
          <h2>
            <Icon name="grid" /> Mixed practice
          </h2>
          <span className="row-wrap small">
            <a href={href('/practice', { mixed: 1 })}>Everything</a>
            <a href={href('/practice', { mixed: 1, st: 'Pure' })}>Pure</a>
            <a href={href('/practice', { mixed: 1, st: 'Statistics' })}>Statistics</a>
            <a href={href('/practice', { mixed: 1, st: 'Mechanics' })}>Mechanics</a>
            <a href={href('/practice', { mixed: 1, mm: 10 })}>Long questions</a>
          </span>
        </div>
        <a className="card tile" href={href('/exams')}>
          <h2>
            <Icon name="clock" /> Mock papers
          </h2>
          <span className="muted">Papers 1, 2 and 3 under timed conditions</span>
        </a>
        <a className="card tile" href={href('/progress')}>
          <h2>
            <Icon name="chart" /> Progress
          </h2>
          <span className="muted">{attempts.length ? `${attempts.length} questions · ${marks ? Math.round((100 * got) / marks) : 0}% of marks` : 'No attempts yet'}</span>
        </a>
        <a className="card tile" href={href('/past-papers')}>
          <h2>
            <Icon name="scheme" /> Past papers
          </h2>
          <span className="muted">Every 9MA0 paper 2018–2025 by question, with practice on each topic</span>
        </a>
        <a className="card tile" href={href('/flashcards')}>
          <h2>
            <Icon name="bulb" /> Flashcards
          </h2>
          <span className="muted">{flashDue ? `${flashDue} due now` : 'Formulae you must learn (not in the booklet)'}</span>
        </a>
        <a className="card tile" href={href('/graphs')}>
          <h2>
            <Icon name="graph" /> Graph plotter
          </h2>
          <span className="muted">Plot functions and slide through transformations</span>
        </a>
        <a className="card tile" href={href('/data')}>
          <h2>
            <Icon name="graph" /> Large data set
          </h2>
          <span className="muted">Explore the weather data for Paper 3: summaries, box plots, scatter, sampling</span>
        </a>
        <a className="card tile" href={href('/reference')}>
          <h2>
            <Icon name="scheme" /> Formula booklet
          </h2>
          <span className="muted">The exam booklet, what to learn, statistical tables and how marking works</span>
        </a>
      </div>
      <section className="card">
        <h2>Priority topics</h2>
        <ul className="list">
          {PRIORITY.map((p) => (
            <li key={p.label}>
              <a className="list-link" href={href(`/chapter/${p.chapter}`)}>
                <span style={{ flex: 1 }}>{p.label}</span>
                <RagBadge mastery={mastery(byCh.get(p.chapter) ?? [])} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
