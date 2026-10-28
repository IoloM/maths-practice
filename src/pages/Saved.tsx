import { ENTRY_BY_ID } from '../content/bank-meta';
import { CHAPTER_BY_REF } from '../content/chapters';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { savedList, setSaved, useSaved } from '../lib/saved';
import { scoreOf } from '../progress/mastery';
import { Loading } from '../components/bits';
import { Icon } from '../components/Icon';

const day = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** `#/saved`: questions you starred to come back to. */
export function Saved() {
  const saved = useSaved();
  const { attempts, loading } = useProgress();
  if (!saved || loading) return <Loading />;
  const list = savedList(saved).filter((q) => ENTRY_BY_ID.has(q.templateId));
  const types = [...new Set(list.map((q) => q.templateId))].slice(0, 40);
  return (
    <div className="stack">
      <div>
        <h1>Saved for later</h1>
        <p className="muted">Questions you’ve starred — tricky ones to try again, or ones to ask about. Press the star on any question to add it.</p>
      </div>
      {list.length === 0 ? (
        <p className="card">
          Nothing saved yet. On any question, press <b>Save for later</b>.
        </p>
      ) : (
        <>
          <div className="btn-row">
            <a className="btn btn-primary" href={href('/practice', { t: types.join(','), from: 'saved' })}>
              <Icon name="play" /> Practise questions like these
            </a>
          </div>
          <ul className="list card">
            {list.map((q) => {
              const meta = ENTRY_BY_ID.get(q.templateId)!;
              const tries = attempts.filter((a) => a.templateId === q.templateId && a.seed === q.seed).sort((a, b) => b.finishedAt - a.finishedAt);
              const last = tries[0];
              return (
                <li key={`${q.templateId}:${q.seed}`} className="learn-row">
                  <a className="list-link" href={href(`/q/${q.templateId}/${q.seed}`)}>
                    <span style={{ flex: 1 }}>
                      <b>{meta.title}</b>
                      <span className="small muted">
                        {' '}
                        · {CHAPTER_BY_REF.get(meta.chapter)?.title ?? meta.chapter} · saved {day(q.savedAt)}
                      </span>
                    </span>
                    <span className="small muted">{last ? `last: ${scoreOf(last)}/${last.marks}` : 'not tried'}</span>
                  </a>
                  <button className="btn btn-small btn-ghost" onClick={() => void setSaved(q.templateId, q.seed, false)} aria-label={`Take ${meta.title} off your saved list`}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
