import { useEffect, useMemo, useState } from 'react';
import { BANK } from '../content/bank-meta';
import { BOOK_NAMES, CHAPTERS, CHAPTER_BY_REF } from '../content/chapters';
import { SPEC_BY_REF } from '../content/spec';
import { CHANNEL, VIDEOS, videoCount, videoIds, type Video } from '../content/videos';
import { loadNotes, type TopicNotes } from '../content/notes';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { groupBy, mastery } from '../progress/mastery';
import { CHECK_GAPS, addLink, cleanUrl, dueChecks, flagged, markLearnt, nextCheck, removeLink, setFlag, setTopicNote, setWatched, useTopicMarks, youTubeId, type TopicMark, type TopicMarks } from '../lib/topics';
import { buildTimed, MINUTES_PER_MARK } from '../lib/sets';
import { startSet } from './Exams';
import { MathText } from '../components/MathText';
import { Difficulty, ErrorBox, Loading, RagBadge } from '../components/bits';
import { Icon } from '../components/Icon';
import { FlagChip, TopicFlagButtons } from '../components/TopicFlag';
import { VideoCard } from '../components/VideoCard';
import { usePastPapers } from '../components/PastPaperRefs';
import { ConfidencePicker } from '../components/ConfidencePicker';

const when = (t?: number) => (t ? new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '');

/** The worked example, one step at a time. */
function Example({ ex }: { ex: TopicNotes['example'] }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="learn-example">
      <MathText src={ex.q} />
      <ol className="steps">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i}>
            <MathText src={s} inline />
          </li>
        ))}
      </ol>
      {shown < ex.steps.length ? (
        <button className="btn btn-small" onClick={() => setShown(shown + 1)}>
          {shown === 0 ? 'Show the first step' : `Next step (${shown + 1} of ${ex.steps.length})`}
        </button>
      ) : (
        <button className="btn btn-small btn-ghost" onClick={() => setShown(0)}>
          Hide the solution
        </button>
      )}
    </div>
  );
}

function Notes({ notes }: { notes: TopicNotes }) {
  return (
    <section className="card stack learn-notes" aria-labelledby="notes-h">
      <h2 id="notes-h">Notes</h2>
      <p className="learn-intro">
        <MathText src={notes.intro} inline />
      </p>
      <h3>Key ideas</h3>
      <ul className="tips">
        {notes.key.map((k, i) => (
          <li key={i}>
            <MathText src={k} inline />
          </li>
        ))}
      </ul>
      {notes.formulae && (
        <>
          <h3>Results to know</h3>
          {notes.formulae.map(([label, tex], i) => (
            <div className="formula" key={i}>
              <div className="small muted">{label}</div>
              <MathText src={tex} />
            </div>
          ))}
        </>
      )}
      <h3>Worked example</h3>
      <Example ex={notes.example} />
      <h3>Where marks go</h3>
      <ul className="tips">
        {notes.mistakes.map((k, i) => (
          <li key={i}>
            <MathText src={k} inline />
          </li>
        ))}
      </ul>
      <h3>Exam tips</h3>
      <ul className="tips">
        {notes.tips.map((k, i) => (
          <li key={i}>
            <MathText src={k} inline />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Your own notes for the topic, and videos or pages you've found. */
function Mine({ chapter, mark }: { chapter: string; mark: TopicMark | undefined }) {
  const [text, setText] = useState(mark?.note ?? '');
  const [saved, setSaved] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const add = () => {
    const u = cleanUrl(url);
    if (!u) return setProblem('That doesn’t look like a web address (it should start https://).');
    setProblem(null);
    void addLink(chapter, { url: u, title: title.trim() || (youTubeId(u) ? 'YouTube video' : new URL(u).hostname) });
    setUrl('');
    setTitle('');
  };
  return (
    <section className="card stack" aria-labelledby="mine-h">
      <h2 id="mine-h">Your notes</h2>
      <label className="sr-only" htmlFor="topic-note">
        Your notes for this topic
      </label>
      <textarea
        id="topic-note"
        className="mistake-note"
        rows={6}
        maxLength={5000}
        placeholder="Write it in your own words: what clicked, what to remember, questions to ask your teacher…"
        value={text}
        onChange={(e) => (setText(e.target.value), setSaved(false))}
        onBlur={() => text !== (mark?.note ?? '') && void setTopicNote(chapter, text).then(() => setSaved(true))}
      />
      {saved && <span className="small good-text">Saved</span>}
      <h3>Your videos and links</h3>
      {(mark?.links ?? []).length > 0 ? (
        <ul className="stack learn-links">
          {mark!.links!.map((l) => {
            const yt = youTubeId(l.url);
            return (
              <li key={l.url}>
                {yt ? (
                  <VideoCard id={yt} title={l.title} />
                ) : (
                  <a href={l.url} target="_blank" rel="noopener noreferrer nofollow">
                    {l.title}
                  </a>
                )}
                <button className="btn btn-small btn-ghost" onClick={() => void removeLink(chapter, l.url)} aria-label={`Remove ${l.title}`}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="small muted" style={{ margin: 0 }}>
          Found a video or page that helped? Add it here — YouTube links play right on this page.
        </p>
      )}
      <div className="row-wrap">
        <input type="url" inputMode="url" placeholder="https://…" aria-label="Link to add" value={url} onChange={(e) => setUrl(e.target.value)} style={{ flex: 2, minWidth: 0 }} />
        <input type="text" placeholder="What is it? (optional)" aria-label="Name for the link" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
        <button className="btn btn-small" onClick={add} disabled={!url.trim()}>
          Add link
        </button>
      </div>
      {problem && <p className="error-text small">{problem}</p>}
    </section>
  );
}

/** Practise from the easiest kind of question upwards, then a short timed set and real past-paper questions. */
function Path({ chapter }: { chapter: string }) {
  const { attempts } = useProgress();
  const pp = usePastPapers();
  const entries = useMemo(() => BANK.templates.filter((t) => t.chapter === chapter).sort((a, b) => a.difficulty - b.difficulty || a.marks - b.marks), [chapter]);
  const byT = groupBy(attempts, (a) => a.templateId);
  const families = new Set(entries.map((e) => e.family));
  const ppq = (pp?.PAST_QUESTIONS ?? []).filter((q) => q.families.some((f) => families.has(f))).slice(-6).reverse();
  const specs = [...new Set(entries.flatMap((e) => e.spec))].sort();
  const test = () => {
    const items = buildTimed(entries, 15, Math.floor(Math.random() * 1e9));
    const marks = items.reduce((t, it) => t + (BANK.templates.find((e) => e.id === it.templateId)?.marks ?? 0), 0);
    void startSet({ kind: 'timed', title: `${CHAPTER_BY_REF.get(chapter as never)?.title ?? chapter}: topic test`, items, durationMin: Math.max(5, Math.round(marks * MINUTES_PER_MARK)) });
  };
  return (
    <section className="card stack" aria-labelledby="path-h">
      <h2 id="path-h">Practise it, step by step</h2>
      <p className="small muted" style={{ margin: 0 }}>
        Start with the easiest kind of question. Use <b>Step by step</b> on a question to see the method a step at a time, then try the next one on your own.
      </p>
      <ol className="list learn-path">
        {entries.slice(0, 8).map((e) => (
          <li key={e.id}>
            <a className="list-link" href={href('/practice', { t: e.id })}>
              <span style={{ flex: 1 }}>{e.title}</span>
              <Difficulty d={e.difficulty} />
              <RagBadge mastery={mastery(byT.get(e.id) ?? [])} />
            </a>
          </li>
        ))}
      </ol>
      <div className="btn-row">
        <a className="btn btn-primary" href={href('/practice', { c: chapter })}>
          <Icon name="play" /> Practise the whole topic
        </a>
        <button className="btn" onClick={test} disabled={!entries.length}>
          <Icon name="clock" /> 15-mark topic test
        </button>
        <a className="btn" href={href(`/chapter/${chapter}`)}>
          All {entries.length} question types
        </a>
      </div>
      {ppq.length > 0 && (
        <>
          <h3>On real past papers</h3>
          <ul className="list small">
            {ppq.map((q) => (
              <li key={`${q.paper}-${q.q}`}>
                <a className="list-link" href={href('/past-papers', { p: q.paper })}>
                  <span className="chip">
                    {pp?.PAST_PAPER_BY_ID.get(q.paper)?.series} {pp?.PAPER_TITLES[pp.PAST_PAPER_BY_ID.get(q.paper)?.paper ?? '1'].split(':')[0]}
                  </span>
                  <span style={{ flex: 1 }}>
                    Q{q.q}: {q.topic}
                  </span>
                  <span className="chip">{q.marks} marks</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      {specs.length > 0 && (
        <p className="small muted" style={{ margin: 0 }}>
          Specification: {specs.map((s) => `${s} ${SPEC_BY_REF.get(s as never)?.title ?? ''}`).join(' · ')}
        </p>
      )}
    </section>
  );
}

/** How many of a topic's videos you've watched. */
const watchedCount = (chapter: string, mark: TopicMark | undefined) => {
  const w = new Set(mark?.watched ?? []);
  return videoIds(chapter).filter((id) => w.has(id)).length;
};

/** One video: press it to play it here, with a tick for when you've watched it. */
function Lesson({ v, open, watched, onPlay, onToggle }: { v: Video; open: boolean; watched: boolean; onPlay: () => void; onToggle: () => void }) {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return (
    <li className={`lesson${watched ? ' watched' : ''}`}>
      <div className="lesson-row">
        <button className="lesson-play" onClick={onPlay} aria-expanded={open} disabled={offline} title={offline ? 'Videos need an internet connection' : undefined}>
          <Icon name={watched ? 'check' : 'play'} />
          <span>{v.title}</span>
        </button>
        <label className="lesson-tick small">
          <input type="checkbox" checked={watched} onChange={onToggle} aria-label={`Watched: ${v.title}`} />
          <span aria-hidden="true">Watched</span>
        </label>
      </div>
      {open && (
        <div className="video-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
            title={v.title}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}
    </li>
  );
}

/** A list of videos for a topic; playing one ticks it watched. Only one plays at a time. */
function useLessons(chapter: string, mark: TopicMark | undefined) {
  const [playing, setPlaying] = useState<string | null>(null);
  // ticks show straight away; the saved list catches up a moment later
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const saved = new Set(mark?.watched ?? []);
  const isWatched = (id: string) => ticked[id] ?? saved.has(id);
  const tick = (id: string, on: boolean) => {
    setTicked((t) => ({ ...t, [id]: on }));
    void setWatched(chapter, id, on);
  };
  return (where: string, list: Video[]) => (
    <ul className="lessons">
      {list.map((v) => {
        const key = `${where}:${v.id}`;
        return (
          <Lesson
            key={key}
            v={v}
            open={playing === key}
            watched={isWatched(v.id)}
            onPlay={() => {
              setPlaying(playing === key ? null : key);
              if (!isWatched(v.id)) tick(v.id, true);
            }}
            onToggle={() => tick(v.id, !isWatched(v.id))}
          />
        );
      })}
    </ul>
  );
}

/** Start here: the whole chapter in one video. */
function ChapterVideo({ chapter, mark }: { chapter: string; mark: TopicMark | undefined }) {
  const lessons = useLessons(chapter, mark);
  const t = VIDEOS[chapter];
  if (!t?.summary.length) return null;
  return (
    <section className="card stack" aria-labelledby="start-h">
      <h2 id="start-h">Start here: the whole chapter</h2>
      <p className="small muted" style={{ margin: 0 }}>
        Mr Bicen goes through everything in the chapter. Watch it first, or again before a test.
      </p>
      {lessons('summary', t.summary)}
    </section>
  );
}

/** Videos for each textbook section, with practice for that section. */
function SectionVideos({ chapter, mark }: { chapter: string; mark: TopicMark | undefined }) {
  const lessons = useLessons(chapter, mark);
  const ch = CHAPTER_BY_REF.get(chapter as never)!;
  const t = VIDEOS[chapter];
  const practice = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const e of BANK.templates) if (e.chapter === chapter) for (const sec of e.sections ?? []) m.set(sec, [...(m.get(sec) ?? []), e.id]);
    return m;
  }, [chapter]);
  if (!t) return null;
  const total = videoCount(chapter);
  const seen = watchedCount(chapter, mark);
  const extras = t.videos.filter((v) => !v.sections?.length);
  return (
    <section className="card stack" aria-labelledby="videos-h">
      <div className="row-wrap">
        <h2 id="videos-h" style={{ flex: 1, margin: 0 }}>
          Section by section
        </h2>
        <span className="small muted">
          {seen} of {total} videos watched
        </span>
      </div>
      <progress className="lesson-progress" max={total} value={seen} aria-label={`${seen} of ${total} videos watched`} />
      {ch.sections.map((title, i) => {
        const sec = `${ch.n}.${i + 1}`;
        const vs = t.videos.filter((v) => v.sections?.includes(i + 1));
        const ids = practice.get(sec) ?? [];
        return (
          <div key={sec} className="lesson-section">
            <h3>
              {sec} {title}
            </h3>
            {vs.length ? lessons(sec, vs) : <p className="small muted">In the chapter video above.</p>}
            {ids.length > 0 && (
              <a className="small" href={href('/practice', { t: ids.join(',') })}>
                Practise {sec}: {ids.length} kind{ids.length === 1 ? '' : 's'} of question
              </a>
            )}
          </div>
        );
      })}
      {extras.length > 0 && (
        <div className="lesson-section">
          <h3>Exam questions and extras</h3>
          {lessons('extras', extras)}
        </div>
      )}
      <p className="small muted" style={{ margin: 0 }}>
        Videos by{' '}
        <a href="https://www.youtube.com/@BicenMaths" target="_blank" rel="noopener noreferrer">
          {CHANNEL}
        </a>{' '}
        on YouTube ·{' '}
        {t.playlists.map((p, i) => (
          <span key={p}>
            {i > 0 && ' · '}
            <a href={`https://www.youtube.com/playlist?list=${p}`} target="_blank" rel="noopener noreferrer">
              {t.playlists.length > 1 ? `Playlist ${i + 1}` : 'The whole playlist'}
            </a>
          </span>
        ))}
      </p>
    </section>
  );
}

/** `#/learn/<chapter>`: notes, videos, practice and your own notes for one topic. */
export function LearnTopic({ chapter }: { chapter: string }) {
  const ch = CHAPTER_BY_REF.get(chapter as never);
  const marks = useTopicMarks();
  const { attempts } = useProgress();
  const [notes, setNotes] = useState<TopicNotes | null | undefined>(undefined);
  useEffect(() => {
    void loadNotes(chapter).then((n) => setNotes(n ?? null));
  }, [chapter]);
  if (!ch) return <ErrorBox>Unknown topic {chapter}</ErrorBox>;
  const m = mastery(attempts.filter((a) => a.chapter === chapter));
  return (
    <div className={`stack year-${ch.year}`}>
      <div className="page-head">
        <div>
          <p className="small muted" style={{ margin: 0 }}>
            <a href={href('/learn')}>Learn</a> · {BOOK_NAMES[ch.book]} · Chapter {ch.n}
          </p>
          <h1>{ch.title}</h1>
        </div>
        <span className="spacer" />
        <RagBadge mastery={m} />
      </div>
      <TopicFlagButtons chapter={chapter} />
      {marks && <LearntStatus chapter={chapter} mark={marks[chapter]} />}
      <div className="row-wrap small">
        <span className="muted">How confident are you?</span>
        <ConfidencePicker chapter={chapter} title={ch.title} value={marks?.[chapter]?.confidence} />
        <a href={href('/confidence')}>Confidence vs reality</a>
      </div>
      <nav className="booklet-jump small" aria-label="On this page">
        <a href="#start-h" onClick={(e) => (e.preventDefault(), document.getElementById('start-h')?.scrollIntoView({ behavior: 'smooth' }))}>
          Start here
        </a>{' '}
        ·{' '}
        <a href="#notes-h" onClick={(e) => (e.preventDefault(), document.getElementById('notes-h')?.scrollIntoView({ behavior: 'smooth' }))}>
          Notes
        </a>{' '}
        ·{' '}
        <a href="#videos-h" onClick={(e) => (e.preventDefault(), document.getElementById('videos-h')?.scrollIntoView({ behavior: 'smooth' }))}>
          Section by section
        </a>{' '}
        ·{' '}
        <a href="#path-h" onClick={(e) => (e.preventDefault(), document.getElementById('path-h')?.scrollIntoView({ behavior: 'smooth' }))}>
          Practise
        </a>{' '}
        ·{' '}
        <a href="#mine-h" onClick={(e) => (e.preventDefault(), document.getElementById('mine-h')?.scrollIntoView({ behavior: 'smooth' }))}>
          Your notes
        </a>
      </nav>
      <ChapterVideo chapter={chapter} mark={marks?.[chapter]} />
      {notes === undefined ? <Loading /> : notes ? <Notes notes={notes} /> : <p className="card muted">Notes for this topic are on the way.</p>}
      <SectionVideos chapter={chapter} mark={marks?.[chapter]} />
      <Path chapter={chapter} />
      {marks && <Mine key={chapter} chapter={chapter} mark={marks[chapter]} />}
    </div>
  );
}

function TopicList({ chapters, empty }: { chapters: string[]; empty: string }) {
  const marks = useTopicMarks();
  const { attempts } = useProgress();
  const byCh = groupBy(attempts, (a) => a.chapter);
  if (!chapters.length) return <p className="small muted">{empty}</p>;
  return (
    <ul className="list">
      {chapters.map((c) => {
        const ch = CHAPTER_BY_REF.get(c as never);
        return (
          <li key={c} className="learn-row">
            <a className="list-link" href={href(`/learn/${c}`)}>
              <span style={{ flex: 1 }}>
                <b>{ch?.title ?? c}</b>
                <span className="small muted">
                  {' '}
                  · {ch ? `${ch.stream} Y${ch.year}` : ''}
                  {marks?.[c]?.since ? ` · since ${when(marks[c].since)}` : ''} · {watchedCount(c, marks?.[c])}/{videoCount(c)} videos watched
                </span>
              </span>
              <RagBadge mastery={mastery(byCh.get(c) ?? [])} />
            </a>
            <button className="btn btn-small" onClick={() => void markLearnt(c)} aria-label={`I’ve learnt ${ch?.title ?? c}`} title="Unmark it — three quick check-ins follow over the next three weeks">
              <Icon name="check" /> I’ve learnt it
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Check-ins on topics you've learnt: due now, and coming up. */
function Checkins({ marks }: { marks: TopicMarks }) {
  const due = dueChecks(marks);
  const later = Object.entries(marks)
    .map(([c, m]) => [c, nextCheck(m)] as const)
    .filter(([c, t]) => t !== null && !due.includes(c))
    .sort((a, b) => a[1]! - b[1]!);
  if (!due.length && !later.length) return null;
  const title = (c: string) => CHAPTER_BY_REF.get(c as never)?.title ?? c;
  return (
    <section className="card stack" aria-labelledby="checkins-h">
      <h2 id="checkins-h">Check-ins</h2>
      <p className="small muted" style={{ margin: 0 }}>
        Quick checks on topics you’ve learnt, after 3, 7 and 21 days, so they stick.
      </p>
      <ul className="list">
        {due.map((c) => (
          <li key={c} className="learn-row">
            <span style={{ flex: 1 }}>
              <b>{title(c)}</b> <span className="small muted">· check-in {(marks[c].checks?.length ?? 0) + 1} of {CHECK_GAPS.length}, due now</span>
            </span>
            <a className="btn btn-small btn-primary" href={href(`/checkin/${c}`)}>
              Start check-in
            </a>
          </li>
        ))}
        {later.map(([c, t]) => (
          <li key={c} className="learn-row">
            <span style={{ flex: 1 }}>
              {title(c)} <span className="small muted">· check-in {(marks[c].checks?.length ?? 0) + 1} of {CHECK_GAPS.length} on {when(t!)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Where a learnt topic is up to with its check-ins. */
function LearntStatus({ chapter, mark }: { chapter: string; mark: TopicMark | undefined }) {
  if (mark?.flag) {
    return (
      <p className="small" style={{ margin: 0 }}>
        Got it?{' '}
        <button className="btn btn-small" onClick={() => void markLearnt(chapter)}>
          <Icon name="check" /> I’ve learnt it
        </button>{' '}
        <span className="muted">Three quick check-ins follow over the next three weeks.</span>
      </p>
    );
  }
  if (!mark?.learnt) return null;
  const next = nextCheck(mark);
  const done = mark.checks ?? [];
  return (
    <p className="small card learnt-status" style={{ margin: 0 }}>
      Learnt on {when(mark.learnt)}. Check-ins: {done.length ? done.map((c) => `${c.got}/${c.of}`).join(', ') : 'none yet'}
      {next === null ? ' — all done.' : next <= Date.now() ? ' · one is due now ' : ` · next on ${when(next)}`}
      {next !== null && next <= Date.now() && (
        <a className="btn btn-small btn-primary" href={href(`/checkin/${chapter}`)}>
          Start check-in
        </a>
      )}
    </p>
  );
}

/** `#/learn`: the topics you've marked, suggestions, and every topic's notes and videos. */
export function Learn() {
  const marks = useTopicMarks();
  const { attempts } = useProgress();
  if (!marks) return <Loading />;
  const help = flagged(marks, 'help');
  const learn = flagged(marks, 'learn');
  const byCh = groupBy(attempts, (a) => a.chapter);
  const suggest = [...byCh.entries()]
    .filter(([c, as]) => as.length >= 2 && !marks[c]?.flag)
    .map(([c, as]) => ({ c, m: mastery(as) ?? 1 }))
    .filter((x) => x.m < 0.6)
    .sort((a, b) => a.m - b.m)
    .slice(0, 3);
  const books = ['P1', 'P2', 'SM1', 'SM2'] as const;
  return (
    <div className="stack">
      <div>
        <h1>Learn</h1>
        <p className="muted">
          Mark the topics you want to learn or need help with — on any topic, or from a question you got wrong. Each topic has notes, a worked example, videos, practice from easy to exam level, and space for your own notes.
        </p>
        <p className="small" style={{ margin: 0 }}>
          Not sure where to start? <a href={href('/confidence')}>Rate your confidence in each topic</a> and see where it doesn’t match your marks.
        </p>
      </div>
      <section className="card stack" aria-labelledby="help-h">
        <h2 id="help-h">Need help</h2>
        <TopicList chapters={help} empty="Nothing marked. On a topic, press “I need help with this”." />
      </section>
      <section className="card stack" aria-labelledby="want-h">
        <h2 id="want-h">Want to learn</h2>
        <TopicList chapters={learn} empty="Nothing marked yet. Choose a topic below and press “I want to learn this”." />
      </section>
      <Checkins marks={marks} />
      {suggest.length > 0 && (
        <section className="card stack" aria-labelledby="suggest-h">
          <h2 id="suggest-h">Worth a look</h2>
          <p className="small muted" style={{ margin: 0 }}>
            Topics where you’re getting under 60% of the marks.
          </p>
          <ul className="list">
            {suggest.map(({ c, m }) => (
              <li key={c} className="learn-row">
                <a className="list-link" href={href(`/learn/${c}`)}>
                  <span style={{ flex: 1 }}>{CHAPTER_BY_REF.get(c as never)?.title ?? c}</span>
                  <span className="small muted">{Math.round(100 * m)}%</span>
                </a>
                <button className="btn btn-small" onClick={() => void setFlag(c, 'help')}>
                  Mark: need help
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2>Every topic</h2>
      {books.map((b) => (
        <section key={b} className={`card ${b === 'P2' || b === 'SM2' ? 'year-2' : ''}`} aria-label={BOOK_NAMES[b]}>
          <h3>{BOOK_NAMES[b]}</h3>
          <ul className="list">
            {CHAPTERS.filter((c) => c.book === b).map((c) => (
              <li key={c.ref}>
                <a className="list-link" href={href(`/learn/${c.ref}`)}>
                  <span className="chip">{c.n}</span>
                  <span style={{ flex: 1 }}>{c.title}</span>
                  <FlagChip flag={marks[c.ref]?.flag} />
                  <span className="small muted">{watchedCount(c.ref, marks[c.ref]) ? `${watchedCount(c.ref, marks[c.ref])}/${videoCount(c.ref)} watched` : `${videoCount(c.ref)} videos`}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
