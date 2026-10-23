# Maths Practice — Edexcel A Level (9MA0)

Offline-first practice app for **Pearson Edexcel A Level Mathematics (9MA0)**: Pure (Papers 1 & 2) and
Statistics & Mechanics (Paper 3). Questions are generated from code templates, marked instantly with
Edexcel rules (awrt, s.f./d.p., exact forms, + c, follow-through, method marks) and come with hints,
worked solutions and mark schemes.

**Live:** https://iolom.github.io/maths-practice/

- 349 question types (62,948 verified questions) covering every 9MA0 spec point, plus 158
  explain-and-prove questions: proof, interpretation, modelling assumptions and the large data set.
  Long exam-style questions (10–14 marks) in Pure, Statistics and Mechanics.
- Past papers: all 31 9MA0 papers June 2018 – June 2025 indexed question by question (topic,
  marks, links to Pearson's own question paper and mark scheme), and every question type shows the
  real past-paper questions on the same topic ("PPQ").
- Topic, mixed and spaced-repetition review practice; today's set; mock Papers 1–3 and timed sets
  under exam conditions (1.2 minutes per mark, marked at the end); shareable links for questions and sets.
- Progress dashboard (red/amber/green by chapter and spec point, trend, time per mark, frequent
  mistakes) and a predicted grade from mock papers using recent grade boundaries.
- Flashcards (formulae to learn and key facts, spaced repetition), formulae and statistical tables
  generated in the app, and calculator tips.
- Handwritten working with Apple Pencil (pressure, palm rejection) or typed working.
- Works on iPhone, iPad, Android, Windows, Mac and Chromebook — installable PWA.
- Fully offline after the first visit (no CDNs, no third-party calls, no tracking, no login).
- Real past papers: enter your marks question by question from Pearson's mark scheme for a score,
  a grade, the topics that lose you marks, and a predicted grade that counts them.
- Exam countdown from your own exam dates; any mock or timed set prints as a paper with answer
  lines and a separate mark scheme.
- **Logins on the device**: an admin makes logins (Settings → Manage logins), each with its own
  progress, history and settings, and a "Who's practising?" sign-in screen. A setup link makes
  someone's login on their own phone or tablet, where they choose the password. With no server,
  logins stay on the device they were made on.
- Progress stays on your device (IndexedDB); one-tap backup/restore to a JSON file.

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173/maths-practice/
```

Node 24 LTS. Dependencies are pinned in `package-lock.json`.

## Test

```bash
npm test                 # Vitest: engine, stats, marking pairs, every template × 200 seeds
npm run bank             # regenerate the template registry + verified bank index
npm run bank:check       # CI: bank index must be fresh
npm run coverage         # templates + instances per spec point (fails if any < 3)
npm run build && npm run e2e   # Playwright on phone / tablet / desktop, including axe accessibility checks
```

`TEMPLATE_SEEDS=1000 npm test` runs more seeds per template.

Quality bars: axe (WCAG 2.1 AA and best practice) passes on every page in light and dark mode;
Lighthouse mobile performance ≥ 90 on every main page (accessibility, best practices and SEO 100).
The HTML carries a static app frame and a per-route preload map (`scripts/vite-app-shell.ts`,
`scripts/vite-route-preload.ts`), pages and question chapters load on demand, and the service
worker precaches everything for offline use.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: type check → tests → bank freshness →
coverage gate → build → Playwright (in the Playwright container) → GitHub Pages. The
site is served from `/maths-practice/` with hash routing (`#/q/<template>/<seed>` deep links).

## Project layout

See [PLAN.md](PLAN.md) for the architecture and [DECISIONS.md](DECISIONS.md) for every default chosen.
Templates live in `src/content/templates/<Book>-<Chapter>/` — see [CONTRIBUTING.md](CONTRIBUTING.md)
for how to add one.

## Not affiliated with Pearson

All questions are original and written in the style of 9MA0. Spec references follow the
Pearson Edexcel 9MA0 specification (Issue 4); textbook chapters follow the Pearson Edexcel A level
Mathematics books.
