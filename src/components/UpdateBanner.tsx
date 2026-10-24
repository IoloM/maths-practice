import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const startedAt = Date.now();
/** Pages where reloading can't interrupt anything (no answer being typed, no exam running). */
const SAFE = new Set(['', 'topics', 'chapter', 'progress', 'exams', 'review', 'reference', 'flashcards', 'past-papers', 'settings', 'account', 'logins', 'group']);
const safeToReload = () => Date.now() - startedAt < 10_000 || SAFE.has(window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]);

/**
 * Keeps the app up to date. A new version (checked hourly and whenever the app comes back to the
 * front) is applied straight away when that can't interrupt anything — just after opening, or away
 * from a question, practice or exam set. Otherwise it waits, with an "Update now" button.
 */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      setInterval(() => void reg.update(), 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void reg.update();
      });
    },
  });
  useEffect(() => {
    if (!needRefresh) return;
    if (safeToReload()) void updateServiceWorker(true);
    // a waiting update applies as soon as the student leaves the question or set
    const onRoute = () => safeToReload() && void updateServiceWorker(true);
    window.addEventListener('hashchange', onRoute);
    return () => window.removeEventListener('hashchange', onRoute);
  }, [needRefresh, updateServiceWorker]);
  if (needRefresh)
    return (
      <div className="banner" role="status">
        <p className="small">A new version is ready.</p>
        <button className="btn btn-primary btn-small" onClick={() => void updateServiceWorker(true)}>
          Update now
        </button>
        <button className="btn btn-small btn-ghost" onClick={() => setNeedRefresh(false)}>
          Later
        </button>
      </div>
    );
  if (offlineReady)
    return (
      <div className="banner" role="status">
        <p className="small">Ready to work offline.</p>
        <button className="btn btn-small btn-ghost" onClick={() => setOfflineReady(false)}>
          OK
        </button>
      </div>
    );
  return null;
}
