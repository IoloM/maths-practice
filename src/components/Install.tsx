import { useEffect, useState } from 'react';
import { useSettings } from '../lib/settings';

interface BIPEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BIPEvent | null = null;
const subs = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    subs.forEach((f) => f());
  });
}

export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
export const isIOS = () => typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

function useDeferred() {
  const [, setT] = useState(0);
  useEffect(() => {
    const f = () => setT((t) => t + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return deferred;
}

export function InstallHelp() {
  const d = useDeferred();
  if (isStandalone()) return <p className="small muted">Installed — you're using the app from your Home Screen.</p>;
  if (isIOS())
    return (
      <p className="small">
        On iPhone or iPad: tap <b>Share</b> (the square with an arrow) then <b>Add to Home Screen</b>. Safari can delete data for websites you haven't added to your Home Screen, so installing keeps your progress safe. Back up regularly too.
      </p>
    );
  return d ? (
    <button
      className="btn btn-primary"
      onClick={async () => {
        await d.prompt();
        deferred = null;
      }}
    >
      Install app
    </button>
  ) : (
    <p className="small muted">Use your browser's “Install app” or “Add to Home screen” option. Once installed it works fully offline.</p>
  );
}

/** Banner nudging iOS Safari users to install (data safety). */
export function InstallBanner() {
  const { settings, update } = useSettings();
  const d = useDeferred();
  if (isStandalone()) return null;
  if (Date.now() - settings.installDismissed < 7 * 24 * 3600 * 1000) return null;
  if (!isIOS() && !d) return null;
  return (
    <div className="banner" role="region" aria-label="Install the app">
      <p className="small">{isIOS() ? 'Add Maths Practice to your Home Screen (Share → Add to Home Screen) so Safari keeps your progress and it works offline.' : 'Install Maths Practice for offline use.'}</p>
      {!isIOS() && d && (
        <button
          className="btn btn-primary btn-small"
          onClick={async () => {
            await d.prompt();
            deferred = null;
          }}
        >
          Install
        </button>
      )}
      <button className="btn btn-small btn-ghost" onClick={() => update({ installDismissed: Date.now() })}>
        Not now
      </button>
    </div>
  );
}
