import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles/app.css';
import App from './App';
import { SettingsProvider, readSettings } from './lib/settings';
import { preloadForHash } from './preload';

preloadForHash(window.location.hash);

// save to the person's account or sync with their other devices (only loaded once signed in or a sync code is set)
let signedIn = false;
try {
  signedIn = !!localStorage.getItem('mp.account.v1');
} catch {
  /* private mode */
}
if (signedIn || readSettings().syncCode) void import('./lib/sync').then((m) => m.startAutoSync());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
