/**
 * Build plugin: puts a small inline script in index.html that, for a deep link (#/q/<id>, #/exams,
 * …), adds <link rel="modulepreload"> for that route's chunks straight away. They then download
 * alongside the main bundle instead of after it has run (src/preload.ts does the same at runtime,
 * one network round later).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, Rolldown } from 'vite';

const PAGES: Record<string, string> = {
  q: 'src/pages/QuestionPage.tsx',
  practice: 'src/pages/Practice.tsx',
  review: 'src/pages/Review.tsx',
  set: 'src/pages/SetRunner.tsx',
  exams: 'src/pages/Exams.tsx',
  progress: 'src/pages/Progress.tsx',
  reference: 'src/pages/Reference.tsx',
  flashcards: 'src/pages/Flashcards.tsx',
  'past-papers': 'src/pages/PastPapers.tsx',
  settings: 'src/pages/Settings.tsx',
  print: 'src/pages/PrintSet.tsx',
  account: 'src/pages/Logins.tsx',
  logins: 'src/pages/Logins.tsx',
  join: 'src/pages/Logins.tsx',
};
const QUESTION_VIEW = 'src/components/QuestionView.tsx';
const WITH_QUESTIONS = ['q', 'practice', 'review', 'set'];
const FIXED_TEMPLATES = 'src/content/fixed/templates.ts';
const CHAPTER_INDEX = /^src\/content\/templates\/([A-Z]+\d)-(\d+)\/index\.ts$/;

/** Template id → chapter, by the `p1.13.` prefix convention; ids that break it are listed in `x`. */
const prefixChapter = (id: string) => id.split('.').slice(0, 2).join('.').toUpperCase();

// Runs in the page before the stylesheet (a pending stylesheet would hold an inline script back).
// Low priority: the main bundle and stylesheet still come first, these follow without waiting for them.
const RUNTIME = `(function(d){try{var h=location.hash.replace(/^#\\/?/,'').split('?')[0].split('/'),r=h[0],l=(d.p[r]||[]).slice(),s={},i,k;
if(d.w.indexOf(r)>=0)l=l.concat(d.v);
if(r==='q'&&h[1]){var id=decodeURIComponent(h[1]);l=l.concat(d.c[id.slice(0,3)==='fx.'?'fixed':d.x[id]||id.split('.').slice(0,2).join('.').toUpperCase()]||[])}
for(i=0;i<l.length;i++){if(s[l[i]])continue;s[l[i]]=1;k=document.createElement('link');k.rel='modulepreload';k.fetchPriority='low';k.href=d.b+d.f[l[i]];document.head.appendChild(k)}}catch(e){}})`;

export function routePreload(root: string): Plugin {
  let base = '/';
  return {
    name: 'route-preload',
    apply: 'build',
    configResolved(c) {
      base = c.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const chunks = Object.values(ctx.bundle).filter((c): c is Rolldown.OutputChunk => c.type === 'chunk');
        const byFile = new Map(chunks.map((c) => [c.fileName, c]));
        const bySource = new Map(chunks.filter((c) => c.facadeModuleId).map((c) => [path.relative(root, c.facadeModuleId!).split(path.sep).join('/'), c]));
        const closure = (file: string, into = new Set<string>()) => {
          if (!into.has(file)) {
            into.add(file);
            for (const dep of byFile.get(file)?.imports ?? []) closure(dep, into);
          }
          return into;
        };
        const entry = chunks.find((c) => c.isEntry);
        if (!entry) throw new Error('route-preload: no entry chunk');
        const loaded = closure(entry.fileName);

        const files: string[] = [];
        const indexOf = (f: string) => (files.includes(f) ? files.indexOf(f) : files.push(f) - 1);
        const need = (source: string) => {
          const c = bySource.get(source);
          if (!c) throw new Error(`route-preload: no chunk for ${source}`);
          return [...closure(c.fileName)].filter((f) => !loaded.has(f)).map(indexOf);
        };

        const pages = Object.fromEntries(Object.entries(PAGES).map(([route, src]) => [route, need(src)]));
        const chapters: Record<string, number[]> = { fixed: need(FIXED_TEMPLATES) };
        for (const src of bySource.keys()) {
          const m = CHAPTER_INDEX.exec(src);
          if (m) chapters[`${m[1]}.${m[2]}`] = need(src);
        }
        const bank = JSON.parse(fs.readFileSync(path.join(root, 'src/content/bank-index.json'), 'utf8')) as { templates: { id: string; chapter: string; fixed?: boolean }[] };
        const exceptions = Object.fromEntries(bank.templates.filter((t) => !t.fixed && prefixChapter(t.id) !== t.chapter).map((t) => [t.id, t.chapter]));

        const data = { b: base, f: files, p: pages, w: WITH_QUESTIONS, v: need(QUESTION_VIEW), c: chapters, x: exceptions };
        const script = `<script>${RUNTIME}(${JSON.stringify(data)})</script>`;
        const at = html.search(/<link rel="stylesheet"/);
        return at < 0 ? html.replace('</head>', `${script}</head>`) : html.slice(0, at) + script + '\n    ' + html.slice(at);
      },
    },
  };
}
