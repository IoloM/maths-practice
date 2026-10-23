import { useCallback, useMemo, useRef, useState } from 'react';
import { BANK, ENTRY_BY_ID, freshSeed, getInstance, seedsFor, type BankEntry } from '../content/bank';
import type { Instance } from '../engine/templates/types';
import { QuestionView } from '../components/QuestionView';
import { ErrorBox, Loading } from '../components/bits';
import { Icon } from '../components/Icon';
import { useProgress } from '../lib/useProgress';
import { isDue, toCard } from '../srs/fsrs';
import { CHAPTER_BY_REF } from '../content/chapters';
import { href } from '../router';

/** Spaced-repetition review: question families whose FSRS card is due, most overdue first. */
export function Review() {
  const { attempts, cards, loading } = useProgress();
  const [inst, setInst] = useState<Instance | null>(null);
  const [n, setN] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const doneThisSession = useRef(new Set<string>());
  const byFamily = useMemo(() => {
    const m = new Map<string, BankEntry[]>();
    for (const e of BANK.templates) m.set(e.family, [...(m.get(e.family) ?? []), e]);
    return m;
  }, []);
  const due = useMemo(
    () =>
      cards
        .filter((c) => isDue(c) && byFamily.has(c.family))
        .sort((a, b) => toCard(a).due.getTime() - toCard(b).due.getTime()),
    [cards, byFamily],
  );
  const nextDue = useMemo(() => cards.filter((c) => !isDue(c)).map((c) => toCard(c).due.getTime()).sort((a, b) => a - b)[0], [cards]);

  const next = useCallback(async () => {
    setError(null);
    const card = due.find((c) => !doneThisSession.current.has(c.family));
    if (!card) {
      setInst(null);
      setN(-1);
      return;
    }
    doneThisSession.current.add(card.family);
    const entries = byFamily.get(card.family)!;
    const e = entries[Math.floor(Math.random() * entries.length)];
    const seen = new Set(attempts.filter((a) => a.templateId === e.id).map((a) => a.seed));
    const unseen = seedsFor(e.id).filter((s) => !seen.has(s));
    try {
      const seed = unseen.length ? unseen[Math.floor(Math.random() * unseen.length)] : await freshSeed(e.id, seen);
      setInst(await getInstance(e.id, seed));
      setN((x) => x + 1);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError((err as Error).message);
    }
  }, [due, byFamily, attempts]);

  if (loading) return <Loading />;
  if (inst && n > 0) {
    const meta = ENTRY_BY_ID.get(inst.templateId)!;
    return (
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>
          <a href={href('/review')} onClick={() => setInst(null)}>
            ← Review
          </a>{' '}
          · review question {n} · {CHAPTER_BY_REF.get(meta.chapter)?.title}
        </p>
        {error && <ErrorBox>{error}</ErrorBox>}
        <QuestionView inst={inst} meta={meta} number={n} mode="review" onNext={() => void next()} nextLabel="Next review" />
      </div>
    );
  }
  return (
    <div className="stack">
      <h1>Review</h1>
      <p className="muted">
        Topics come back for review just before you are likely to forget them (spaced repetition). Questions you found hard come back sooner; easy ones are spaced further apart.
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="card stack">
        {n === -1 && <p>Session complete — nothing else is due right now.</p>}
        {due.length ? (
          <>
            <p>
              <b>{due.length}</b> question {due.length === 1 ? 'type is' : 'types are'} due for review.
            </p>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => void next()}>
                <Icon name="review" /> Start review
              </button>
            </div>
          </>
        ) : (
          <p>
            Nothing is due.{' '}
            {nextDue ? `The next review is due ${new Date(nextDue).toLocaleString()}.` : 'Practise some topics first — each question type you attempt is scheduled for review.'}
          </p>
        )}
      </div>
      {due.length > 0 && (
        <section className="card">
          <h2>Due now</h2>
          <ul className="list">
            {due.slice(0, 30).map((c) => {
              const e = byFamily.get(c.family)![0];
              return (
                <li key={c.family}>
                  <a className="list-link" href={href('/practice', { t: byFamily.get(c.family)!.map((x) => x.id).join(',') })}>
                    <span style={{ flex: 1 }}>{e.title}</span>
                    <span className="muted small">{CHAPTER_BY_REF.get(e.chapter)?.title}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
