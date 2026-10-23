import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles/app.css';
import App from './App';
import { SettingsProvider, readSettings } from './lib/settings';
import { preloadForHash } from './preload';

preloadForHash(window.location.hash);

// sync with the user's other devices (only loaded once a sync code is set)
if (readSettings().syncCode) void import('./lib/sync').then((m) => m.startAutoSync());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
