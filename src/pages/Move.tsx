import { useEffect, useState } from 'react';
import { NEW_SITE, receive } from '../lib/move';

/** `#/move` at the new address: takes what the old address sends (see lib/move.ts). */
export function Move() {
  const [st, setSt] = useState<{ s: 'waiting' } | { s: 'done'; n: number } | { s: 'error'; m: string }>({ s: 'waiting' });
  useEffect(
    () =>
      receive(
        (n) => setSt({ s: 'done', n }),
        (m) => setSt({ s: 'error', m }),
      ),
    [],
  );
  return (
    <div className="stack">
      <h1>Moving your progress</h1>
      {st.s === 'waiting' && <p role="status">Bringing your progress across from the old address…</p>}
      {st.s === 'done' && (
        <>
          <p role="status">Done{st.n ? `: ${st.n} answered question${st.n === 1 ? '' : 's'} brought across` : ''}. You can close the old page.</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => window.location.replace(NEW_SITE)}>
              Start practising
            </button>
          </div>
        </>
      )}
      {st.s === 'error' && (
        <p role="status">
          {st.m === 'none' ? 'This page brings your progress across from the old address. Open the old address and press “Move my progress”.' : `That didn’t work: ${st.m}.`}{' '}
          <a href="#/">Go to the app</a>
        </p>
      )}
    </div>
  );
}
