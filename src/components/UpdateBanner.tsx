import { useRegisterSW } from 'virtual:pwa-register/react';

/** Offers to reload when a new version has been downloaded (never reloads mid-question by itself). */
export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });
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
