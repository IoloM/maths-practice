import { lazy, Suspense, useEffect, useState } from 'react';
import { Icon } from './Icon';

const SearchDialog = lazy(() => import('./SearchDialog'));

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('math-field') !== null);

/** The search button in the header; Ctrl/⌘ K or / opens it from anywhere. */
export function SearchButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <button className="search-btn" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Search" title="Search (Ctrl K)">
        <Icon name="search" />
      </button>
      {open && (
        <Suspense fallback={null}>
          <SearchDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
