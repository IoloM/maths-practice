import { useMemo, useState } from 'react';
import { ENTRY_BY_ID } from '../content/bank-meta';
import { CHAPTER_BY_REF } from '../content/chapters';
import { href } from '../router';
import { useProgress } from '../lib/useProgress';
import { LOSS_REASONS, type LossReason } from '../lib/paper-results';
import { isOpen, mistakesFrom, updateNote, useMistakeNotes, type Mistake, type MistakeNote } from '../lib/mistakes';
import { Loading } from '../components/bits';
import { Icon } from '../components/Icon';

const when = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function Entry({ m, note }: { m: Mistake; note: MistakeNote | undefined }) {
  const meta = ENTRY_BY_ID.get(m.templateId);
  const ch = CHAPTER_BY_REF.get(m.chapter as never);
  const [text, setText] = useState(note?.note ?? '');
  const reasons = note?.reasons ?? [];
  const toggle = (r: LossReason) => void updateNote(m.key, (n) => ({ ...n, reasons: reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r] }));
  const fixed = m.fixedAt !== null;
  return (
    <li className={`card mistake ${fixed || note?.sorted ? 'fixed' : ''}`}>
      <div className="mistake-head">
        <a href={href(`/q/${m.templateId}/${m.seed}`)}>
          <b>{meta?.title ?? m.templateId}</b>
        </a>
        <span className="chip">{ch ? ch.title : m.chapter}</span>
        <span className="spacer" />
        <span className="small muted">
          {m.gaveUp ? 'gave up' : `${m.got}/${m.of}`} · {when(m.at)}
        </span>
      </div>
      {m.errors.length > 0 && <p className="small mistake-errors">Slip spotted: {m.errors.join(', ')}</p>}
      {fixed && (
        <p className="small good-text">
          <Icon name="check" /> Put right on {when(m.fixedAt!)} with full marks
        </p>
      )}
      <div className="why-chips" role="group" aria-label={`What went wrong on ${meta?.title ?? 'this question'}`}>
        {LOSS_REASONS.map((r) => (
          <button key={r.id} type="button" className={`btn btn-small why ${reasons.includes(r.id) ? 'on' : ''}`} aria-pressed={reasons.includes(r.id)} onClick={() => toggle(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <label className="sr-only" htmlFor={`note-${m.key}`}>
        Note to self about {meta?.title ?? 'this question'}
      </label>
      <textarea
        id={`note-${m.key}`}
        className="mistake-note"
        rows={2}
        maxLength={500}
        placeholder="Note to self: what to remember next time"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== (note?.note ?? '') && void updateNote(m.key, (n) => ({ ...n, note: text }))}
      />
      <div className="btn-row">
        <a className="btn btn-small btn-primary" href={href(`/q/${m.templateId}/${m.seed}`)}>
          Try it again
        </a>
        <a className="btn btn-small" href={href('/practice', { t: m.templateId })}>
          A similar one
        </a>
        {!fixed && (
          <button className="btn btn-small btn-ghost" onClick={() => void updateNote(m.key, (n) => ({ ...n, sorted: !n.sorted }))} aria-pressed={!!note?.sorted}>
            {note?.sorted ? 'Not sorted yet' : 'Mark as sorted'}
          </button>
        )}
      </div>
    </li>
  );
}

/** Every question where you dropped marks, with what went wrong, until you've put it right. */
export function Mistakes() {
  const { attempts, loading } = useProgress();
  const notes = useMistakeNotes();
  const [show, setShow] = useState<'open' | 'done'>('open');
  const [chapter, setChapter] = useState('');
  const all = useMemo(() => mistakesFrom(attempts), [attempts]);
  if (loading || !notes) return <Loading />;
  const open = all.filter((m) => isOpen(m, notes));
  const done = all.filter((m) => !isOpen(m, notes));
  const list = (show === 'open' ? open : done).filter((m) => !chapter || m.chapter === chapter);
  const chapters = [...new Set(all.map((m) => m.chapter))].sort();
  const redo = [...new Set(open.filter((m) => !chapter || m.chapter === chapter).map((m) => m.templateId))].slice(0, 40);
  return (
    <div className="stack">
      <div>
        <h1>Mistake notebook</h1>
        <p className="muted">
          Every question you dropped marks on. Note what went wrong, then put it right: full marks on that kind of question takes it off the list.
        </p>
      </div>
      {all.length === 0 ? (
        <p className="card">No mistakes yet. Questions where you drop marks will appear here.</p>
      ) : (
        <>
          <div className="row-wrap">
            <div className="tabs" role="tablist" aria-label="Which mistakes">
              <button role="tab" aria-selected={show === 'open'} className={`tab ${show === 'open' ? 'active' : ''}`} onClick={() => setShow('open')}>
                To put right ({open.length})
              </button>
              <button role="tab" aria-selected={show === 'done'} className={`tab ${show === 'done' ? 'active' : ''}`} onClick={() => setShow('done')}>
                Sorted ({done.length})
              </button>
            </div>
            <label className="row small">
              Topic
              <select value={chapter} onChange={(e) => setChapter(e.target.value)}>
                <option value="">All</option>
                {chapters.map((c) => (
                  <option key={c} value={c}>
                    {CHAPTER_BY_REF.get(c as never)?.title ?? c}
                  </option>
                ))}
              </select>
            </label>
            <span className="spacer" />
            {show === 'open' && redo.length > 0 && (
              <a className="btn btn-primary" href={href('/practice', { t: redo.join(','), from: 'mistakes' })}>
                <Icon name="refresh" /> Practise these ({redo.length})
              </a>
            )}
          </div>
          {list.length === 0 ? (
            <p className="card">{show === 'open' ? 'Nothing left to put right here — well done.' : 'Nothing sorted yet.'}</p>
          ) : (
            <div role="tabpanel">
              <ul className="stack mistake-list">
                {list.slice(0, 100).map((m) => (
                  <Entry key={m.key} m={m} note={notes[m.key]} />
                ))}
              </ul>
            </div>
          )}
          {list.length > 100 && <p className="small muted">Showing the latest 100.</p>}
        </>
      )}
    </div>
  );
}
