import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'katex/dist/katex.min.css';
import './styles/app.css';
import App from './App';
import { SettingsProvider } from './lib/settings';
import { cloudMe } from './lib/cloud';
import { preloadForHash } from './preload';

preloadForHash(window.location.hash);

// signed in online: keep progress the same on every device (the Supabase client loads only then)
if (cloudMe()) void import('./lib/sync').then((m) => m.startAutoSync());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
);
