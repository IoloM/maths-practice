/**
 * Build plugin: fills <div id="root"> in index.html with a static copy of the app frame (header,
 * navigation, a loading line), drawn from the same nav list and icons as App.tsx. The frame paints
 * as soon as the HTML and CSS arrive; React replaces it on its first render.
 */
import type { Plugin } from 'vite';
import { NAV } from '../src/nav';
import { ICON_PATHS } from '../src/components/icon-paths';

const icon = (name: string) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]
    .split(' M')
    .map((seg, i) => `<path d="${i === 0 ? seg : `M${seg}`}"></path>`)
    .join('')}</svg>`;

export function appShell(): Plugin {
  const shell = [
    '<header class="app-header"><div class="app-header-inner">',
    '<a class="brand" href="#/"><span class="brand-mark" aria-hidden="true">∫</span><span>Maths Practice</span></a>',
    `<nav class="nav nav-desktop" aria-label="Main">${NAV.map((n) => `<a href="#${n.path}">${n.label}</a>`).join('')}</nav>`,
    '</div></header>',
    '<main class="app-main" id="main" tabindex="-1"><p class="muted" role="status">Loading…</p></main>',
    `<nav class="tabbar" aria-label="Main">${NAV.filter((n) => n.mobile)
      .map((n) => `<a href="#${n.path}">${icon(n.icon)}${n.label}</a>`)
      .join('')}</nav>`,
  ].join('');
  return {
    name: 'app-shell',
    transformIndexHtml(html) {
      if (!html.includes('<div id="root"></div>')) throw new Error('app-shell: <div id="root"></div> not found in index.html');
      return html.replace('<div id="root"></div>', `<div id="root">${shell}</div>`);
    },
  };
}
