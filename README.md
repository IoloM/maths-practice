# Maths Practice — Edexcel A Level (9MA0)

Offline-first practice app for **Pearson Edexcel A Level Mathematics (9MA0)**: Pure (Papers 1 & 2) and
Statistics & Mechanics (Paper 3). Questions are generated from code templates, marked instantly with
Edexcel rules (awrt, s.f./d.p., exact forms, + c, follow-through, method marks) and come with hints,
worked solutions and mark schemes.

**Live:** https://iolomaths.co.uk/ (also still at https://iolom.github.io/maths-practice/, which offers to move each device's progress across and then forwards)

- 349 question types (62,948 verified questions) covering every 9MA0 spec point, plus 158
  explain-and-prove questions: proof, interpretation, modelling assumptions and the large data set.
  Long exam-style questions (10–14 marks) in Pure, Statistics and Mechanics.
- Past papers: all 31 A level (9MA0) and all 23 AS (8MA0) papers June 2018 – June 2025 indexed
  question by question (topic, marks, links to Pearson's own question paper and mark scheme), and
  every question type shows the real past-paper questions on the same topic ("PPQ").
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
  a grade (AS papers on AS boundaries), the topics that lose you marks, and a predicted grade that
  counts the A level ones.
- Exam countdown from your own exam dates; any mock or timed set prints as a paper with answer
  lines and a separate mark scheme.
- **Logins** that an admin makes (Settings → Manage logins). With the free Supabase project set up
  (`supabase/setup.sh`), logins work on every phone, tablet and computer: each person's progress,
  history, mocks, past-paper marks and settings are saved to their login and merged across devices
  (nothing is lost; the newest settings win). Without it, logins live on the device they were made
  on, with setup links for people's own devices.
- **Study group**: this week's leaderboard (marks, questions, streak — totals only, never answers)
  and work an admin sets for everyone, with due dates and who has done it.
- **Daily goal and streak** on the home page, with the last fortnight at a glance.
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
npm run build && npm run build:cloud-test && npm run e2e   # Playwright on phone / tablet / desktop (+ online logins), with axe accessibility checks
```

`TEMPLATE_SEEDS=1000 npm test` runs more seeds per template.

Quality bars: axe (WCAG 2.1 AA and best practice) passes on every page in light and dark mode;
Lighthouse mobile performance ≥ 90 on every main page (accessibility, best practices and SEO 100).
The HTML carries a static app frame and a per-route preload map (`scripts/vite-app-shell.ts`,
`scripts/vite-route-preload.ts`), pages and question chapters load on demand, and the service
worker precaches everything for offline use.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: type check → tests (including the
database's security rules in PGlite and the admin function) → bank freshness → coverage gate →
builds → Playwright (in the Playwright container; online logins against a pretend Supabase) →
GitHub Pages. The site is served from `/maths-practice/` with hash routing
(`#/q/<template>/<seed>` deep links).

### Online logins (Supabase)

`supabase/` holds the database (`migrations/`: tables and row-level security), the auth settings
(`config.toml`: public sign-up off) and the admin Edge Function (`functions/admin`: making,
resetting, switching off and removing logins — the only code with the secret key). The app has only
the publishable key. One command sets it all up or updates it — double-click
`Set up online logins.command`, or:

```bash
supabase/setup.sh              # sign in (GitHub), create the project, apply everything, make your admin login
supabase/setup.sh --new-admin  # add another admin, or reset your password
```

It sets the repository variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` and rebuilds the
site. `.github/workflows/keep-alive.yml` pings the project daily so the free plan never pauses it.

## Project layout

See [PLAN.md](PLAN.md) for the architecture and [DECISIONS.md](DECISIONS.md) for every default chosen.
Templates live in `src/content/templates/<Book>-<Chapter>/` — see [CONTRIBUTING.md](CONTRIBUTING.md)
for how to add one.

## Not affiliated with Pearson

All questions are original and written in the style of 9MA0. Spec references follow the
Pearson Edexcel 9MA0 specification (Issue 4); textbook chapters follow the Pearson Edexcel A level
Mathematics books.
