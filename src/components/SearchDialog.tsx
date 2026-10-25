import { useEffect, useMemo, useRef, useState } from 'react';
import { search, type Hit } from '../lib/search';
import { navigate } from '../router';
import { MathText } from './MathText';

/** Search everything: type, use the arrow keys, press Enter. */
export default function SearchDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const hits = useMemo(() => search(q), [q]);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    document.getElementById(`hit-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  const go = (h: Hit | undefined) => {
    if (!h) return;
    ref.current?.close();
    navigate(h.path, h.query);
  };
  return (
    <dialog ref={ref} className="search-dialog" aria-label="Search" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <div className="search-box">
        <input
          type="search"
          role="combobox"
          aria-label="Search topics, questions, past papers and formulae"
          aria-expanded={hits.length > 0}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={hits.length ? `hit-${active}` : undefined}
          placeholder="Search: e.g. integration by parts, binomial, June 2019"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') (e.preventDefault(), setActive((a) => Math.min(hits.length - 1, a + 1)));
            else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((a) => Math.max(0, a - 1)));
            else if (e.key === 'Enter') (e.preventDefault(), go(hits[active]));
          }}
        />
        <button className="btn btn-small" onClick={() => ref.current?.close()}>
          Close
        </button>
      </div>
      {q.trim() && !hits.length && <p className="muted search-empty">Nothing matches “{q.trim()}”.</p>}
      <ul id="search-results" role="listbox" aria-label="Results" className="search-results">
        {hits.map((h, i) => (
          <li key={i} id={`hit-${i}`} role="option" aria-selected={i === active} className={i === active ? 'active' : ''} onMouseMove={() => setActive(i)} onClick={() => go(h)}>
            <span className="search-kind">{h.kind}</span>
            <span className="search-title">
              <MathText src={h.title} inline />
              {h.sub && <span className="small muted"> · {h.sub}</span>}
            </span>
          </li>
        ))}
      </ul>
      {!q.trim() && <p className="small muted search-empty">Topics, question types, specification points, past-paper questions, formulae, flashcards and pages. Press / or Ctrl K to search from anywhere.</p>}
    </dialog>
  );
}
