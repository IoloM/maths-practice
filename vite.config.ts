import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };
import { routePreload } from './scripts/vite-route-preload';
import { appShell } from './scripts/vite-app-shell';

let sha = 'dev';
try {
  sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch {
  /* not a git checkout */
}

export default defineConfig({
  base: '/maths-practice/',
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}+${sha}`),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 4000,
  },
  plugins: [
    react(),
    appShell(),
    routePreload(import.meta.dirname),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Maths Practice — Edexcel A Level',
        short_name: 'Maths Practice',
        description: 'Offline Edexcel A Level Maths practice with instant marking.',
        id: '/maths-practice/',
        start_url: '/maths-practice/',
        scope: '/maths-practice/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f7f8',
        theme_color: '#1D5C63',
        categories: ['education'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // phone reminders: the push and notification-click handlers (public/push-sw.js)
        importScripts: ['push-sw.js'],
      },
      devOptions: { enabled: false },
    }),
  ],
});
