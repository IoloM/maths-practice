import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Rating, type Grade } from 'ts-fsrs';
import { DECKS, FLASHCARDS, type DeckId, type Flashcard } from '../content/flashcards';
import { MathText } from '../components/MathText';
import { Loading } from '../components/bits';
import { Icon } from '../components/Icon';
import { useProgress } from '../lib/useProgress';
import { getStore } from '../storage';
import { notifyProgress } from '../progress/record';
import { FLASH_PREFIX, isDue, review, toCard } from '../srs/fsrs';
import type { CardRecord } from '../storage/types';
import { href } from '../router';

/** New cards introduced per study session (due cards always come first). */
const NEW_PER_SESSION = 15;
const family = (c: Flashcard) => FLASH_PREFIX + c.id;

const GRADES: { grade: Grade; label: string; key: string; hint: string }[] = [
  { grade: Rating.Again, label: 'Again', key: '1', hint: 'Didn’t know it — see it again soon' },
  { grade: Rating.Hard, label: 'Hard', key: '2', hint: 'Got it, with effort' },
  { grade: Rating.Good, label: 'Good', key: '3', hint: 'Knew it' },
  { grade: Rating.Easy, label: 'Easy', key: '4', hint: 'Knew it instantly' },
];

function deckStats(deck: DeckId, byFamily: Map<string, CardRecord>) {
  const cards = FLASHCARDS.filter((c) => c.deck === deck);
  const recs = cards.map((c) => byFamily.get(family(c)));
  const due = cards.filter((_, i) => recs[i] && isDue(recs[i]!));
  const fresh = cards.filter((_, i) => !recs[i]);
  return { cards, due, fresh, learned: cards.length - fresh.length };
}

export function Flashcards() {
  const { cards, loading } = useProgress();
  const [session, setSession] = useState<{ deck: DeckId; queue: Flashcard[]; done: number } | null>(null);
  const [browse, setBrowse] = useState<DeckId | null>(null);
  const byFamily = useMemo(() => new Map(cards.filter((c) => c.family.startsWith(FLASH_PREFIX)).map((c) => [c.family, c])), [cards]);
  if (loading) return <Loading />;

  if (session) return <Study session={session} byFamily={byFamily} onDone={() => setSession(null)} onNext={setSession} />;

  return (
    <div className="stack">
      <div>
        <h1>Flashcards</h1>
        <p className="muted">
          Learn the formulae that aren’t in the exam booklet, and the facts examiners expect. Cards you find hard come back sooner (spaced repetition). The booklet’s own formulae are on the{' '}
          <a href={href('/reference')}>Formulae page</a>.
        </p>
      </div>
      {DECKS.map((d) => {
        const st = deckStats(d.id, byFamily);
        const toStudy = st.due.length + Math.min(NEW_PER_SESSION, st.fresh.length);
        return (
          <section className="card stack" key={d.id}>
            <h2>
              <Icon name="book" /> {d.title}
            </h2>
            <p className="muted small">{d.blurb}</p>
            <p className="small">
              <strong>{st.due.length}</strong> due · <strong>{st.fresh.length}</strong> new · <strong>{st.learned}</strong> of {st.cards.length} started
            </p>
            <div className="btn-row">
              <button
                className="btn btn-primary"
                disabled={toStudy === 0}
                onClick={() => setSession({ deck: d.id, queue: [...st.due, ...st.fresh.slice(0, NEW_PER_SESSION)], done: 0 })}
              >
                {toStudy ? `Study ${toStudy} card${toStudy === 1 ? '' : 's'}` : 'Nothing due — well done'}
              </button>
              <button className="btn" aria-expanded={browse === d.id} onClick={() => setBrowse(browse === d.id ? null : d.id)}>
                {browse === d.id ? 'Hide cards' : 'Browse all'}
              </button>
            </div>
            {browse === d.id && (
              <dl className="flash-list">
                {st.cards.map((c) => (
                  <div key={c.id} className="flash-row">
                    <dt>
                      <span className="chip">{c.topic}</span> <MathText src={c.front} inline />
                    </dt>
                    <dd>
                      <MathText src={c.back} inline />
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Study({
  session,
  byFamily,
  onDone,
  onNext,
}: {
  session: { deck: DeckId; queue: Flashcard[]; done: number };
  byFamily: Map<string, CardRecord>;
  onDone: () => void;
  onNext: (s: { deck: DeckId; queue: Flashcard[]; done: number }) => void;
}) {
  const [shown, setShown] = useState(false);
  const card = session.queue[0];
  const showRef = useRef<HTMLButtonElement>(null);
  const goodRef = useRef<HTMLButtonElement>(null);
  const deck = DECKS.find((d) => d.id === session.deck)!;

  // a card marked "Again" can come straight back, so reset on every step, not just a new id
  useEffect(() => {
    setShown(false);
    showRef.current?.focus();
  }, [card?.id, session.done]);
  useEffect(() => {
    if (shown) goodRef.current?.focus();
  }, [shown]);

  const rate = useCallback(
    async (grade: Grade) => {
      const store = await getStore();
      const f = family(card);
      await store.putCard(review(await store.getCard(f), f, grade));
      notifyProgress();
      const rest = session.queue.slice(1);
      // "Again" comes back at the end of this session too
      onNext({ ...session, queue: grade === Rating.Again ? [...rest, card] : rest, done: session.done + 1 });
    },
    [card, session, onNext],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card || e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setShown(true);
      } else if (shown) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) void rate(g.grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, shown, rate]);

  if (!card) {
    const left = FLASHCARDS.filter((c) => c.deck === session.deck && byFamily.get(family(c)))
      .map((c) => toCard(byFamily.get(family(c))).due.getTime())
      .filter((t) => t > Date.now())
      .sort((a, b) => a - b)[0];
    return (
      <div className="stack">
        <h1>{deck.title}</h1>
        <div className="card stack" role="status">
          <h2>
            <Icon name="check" /> Session complete
          </h2>
          <p>
            You reviewed {session.done} card{session.done === 1 ? '' : 's'}.{left ? ` Next card due ${new Date(left).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.` : ''}
          </p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={onDone}>
              Back to decks
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row-wrap">
        <h1 style={{ flex: 1, margin: 0 }}>{deck.title}</h1>
        <span className="muted small">
          {session.done} done · {session.queue.length} to go
        </span>
        <button className="btn btn-small" onClick={onDone}>
          Stop
        </button>
      </div>
      <section className="card flashcard" aria-live="polite">
        <span className="chip">{card.topic}</span>
        <div className="flash-front">
          <MathText src={card.front} />
        </div>
        {shown && (
          <div className="flash-back">
            <MathText src={card.back} />
          </div>
        )}
      </section>
      {!shown ? (
        <div className="btn-row">
          <button ref={showRef} className="btn btn-primary" onClick={() => setShown(true)}>
            Show answer
          </button>
          <span className="muted small">or press Space</span>
        </div>
      ) : (
        <div className="stack" style={{ gap: 6 }}>
          <span className="small muted">How well did you know it? (keys 1–4)</span>
          <div className="btn-row flash-grades">
            {GRADES.map((g) => (
              <button key={g.label} ref={g.grade === Rating.Good ? goodRef : undefined} className={`btn ${g.grade === Rating.Good ? 'btn-primary' : ''}`} title={g.hint} onClick={() => void rate(g.grade)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
