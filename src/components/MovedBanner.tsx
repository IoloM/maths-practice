import { useEffect, useState } from 'react';
import { NEW_SITE, newSiteLive, onOldSite, pack, retireOldSite, sendTo } from '../lib/move';
import { cloudMe } from '../lib/cloud';
import { downloadBackup } from '../storage';

type State = { s: 'hidden' } | { s: 'offer' } | { s: 'moving' } | { s: 'done'; n: number } | { s: 'failed' };

/**
 * At the old address only, once the new one is up: says the app has moved, and moves everything
 * saved on this device across in one go.
 */
export function MovedBanner() {
  const [st, setSt] = useState<State>({ s: 'hidden' });
  useEffect(() => {
    if (!onOldSite()) return;
    let alive = true;
    void newSiteLive().then((live) => alive && live && setSt({ s: 'offer' }));
    return () => {
      alive = false;
    };
  }, []);
  if (st.s === 'hidden') return null;

  const move = () => {
    const win = window.open(`${NEW_SITE}#/move`, 'mp-move');
    if (!win) return setSt({ s: 'failed' });
    setSt({ s: 'moving' });
    sendTo(win, pack())
      .then(async (n) => {
        await retireOldSite();
        setSt({ s: 'done', n });
      })
      .catch(() => setSt({ s: 'failed' }));
  };

  return (
    <section className="card stack moved" aria-labelledby="moved-title">
      <h2 id="moved-title">Maths Practice has moved to iolomaths.co.uk</h2>
      {st.s === 'offer' && (
        <>
          <p>Same app, shorter address. Your progress on this device moves across in one go — then use the new address from now on.</p>
          <div className="btn-row">
            <button className="btn btn-primary" onClick={move}>
              Move my progress to iolomaths.co.uk
            </button>
          </div>
        </>
      )}
      {st.s === 'moving' && <p role="status">Moving your progress… keep this page open.</p>}
      {st.s === 'done' && (
        <>
          <p role="status">
            All moved{st.n ? ` — ${st.n} answered question${st.n === 1 ? '' : 's'}` : ''}. Use <b>iolomaths.co.uk</b> from now on. If you’d added the app to your home screen, add it again from the new address.
          </p>
          <div className="btn-row">
            <a className="btn btn-primary" href={NEW_SITE}>
              Open iolomaths.co.uk
            </a>
          </div>
        </>
      )}
      {st.s === 'failed' && (
        <>
          <p role="status">
            That didn’t work automatically (perhaps a pop-up was blocked).{' '}
            {cloudMe() ? 'You’re signed in, so your progress is saved to your login: open the new address and sign in.' : 'Download a backup, then open the new address and restore it in Settings.'}
          </p>
          <div className="btn-row">
            <button className="btn" onClick={move}>
              Try again
            </button>
            {!cloudMe() && (
              <button className="btn" onClick={() => void downloadBackup()}>
                Download a backup
              </button>
            )}
            <a className="btn btn-primary" href={NEW_SITE}>
              Open iolomaths.co.uk
            </a>
          </div>
        </>
      )}
    </section>
  );
}
