import { useEffect, useRef } from 'react';
import { BookletContents } from './Booklet';
import { href } from '../router';

/** The formula booklet as a side sheet: Escape, Close or a tap outside closes it. */
export default function BookletDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="booklet-title" onClose={onClose} onClick={(e) => e.target === ref.current && ref.current?.close()}>
      <div className="sheet-head">
        <h2 id="booklet-title">Formula booklet</h2>
        <a className="btn btn-small btn-ghost" href={href('/reference')} target="_blank" rel="noreferrer">
          Open as a page
        </a>
        <button className="btn btn-small" onClick={() => ref.current?.close()} autoFocus>
          Close
        </button>
      </div>
      <div className="sheet-body">
        <BookletContents level={3} />
      </div>
    </dialog>
  );
}
