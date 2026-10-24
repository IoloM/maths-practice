import { lazy, Suspense, useState } from 'react';
import { Icon } from './Icon';

const BookletDialog = lazy(() => import('./BookletDialog'));

/** Opens the exam formula booklet and tables over the page, as you'd have them in the exam. */
export function BookletButton({ className = 'btn btn-small btn-ghost' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)} aria-haspopup="dialog" title="The formula booklet and statistical tables">
        <Icon name="scheme" /> Formula booklet
      </button>
      {open && (
        <Suspense fallback={null}>
          <BookletDialog onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
