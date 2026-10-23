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
- Handwriting: Apple Pencil Scribble (and Windows / Android handwriting) straight into plain-text
  answer boxes, free and offline. **Ask your AI app**: after checking an answer, the question, mark
  scheme and a picture of the working go to the student's own Claude, ChatGPT or Gemini (share
  sheet, or copy and paste), which marks it line by line — no API key, nothing for the app to pay.
- Optional, with the small server in `server/` (Cloudflare's free plan):
  - **Logins** that an admin makes for people (Settings → Manage logins): each person's progress,
    history and settings are saved to their account and follow them to any device. Passwords are
    stretched in the app (PBKDF2) before they are sent; temporary passwords must be changed at first
    sign-in; admins can reset passwords, switch logins off and see who is practising.
  - **Sync without a login**, end-to-end encrypted with a sync code.
  - **Built-in AI** (only with a paid Anthropic API key on the server): Claude reads a handwritten
    answer into the box, or marks working inside the app.
- Works on iPhone, iPad, Android, Windows, Mac and Chromebook — installable PWA.
- Fully offline after the first visit (no CDNs, no tracking, no login). Without the server it makes
  no third-party calls at all.
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
cd server && npm test          # the Worker: logins, admin, saved data, sync, access code, daily cap, AI calls (mocked)
```

`TEMPLATE_SEEDS=1000 npm test` runs more seeds per template.

Quality bars: axe (WCAG 2.1 AA and best practice) passes on every page in light and dark mode;
Lighthouse mobile performance ≥ 90 on every main page (accessibility, best practices and SEO 100).
The HTML carries a static app frame and a per-route preload map (`scripts/vite-app-shell.ts`,
`scripts/vite-route-preload.ts`), pages and question chapters load on demand, and the service
worker precaches everything for offline use.

## Deploy

Every push to `main` runs `.github/workflows/deploy.yml`: type check → tests → bank freshness →
coverage gate → server tests → build → Playwright (in the Playwright container) → GitHub Pages. The
site is served from `/maths-practice/` with hash routing (`#/q/<template>/<seed>` deep links).

### The server (logins, sync, optional AI)

`server/` is a Cloudflare Worker with a D1 database (the free plan is plenty). One command sets it up
or re-deploys it — double-click `Set up logins and sync.command`, or:

```bash
server/setup.sh                 # sign in, create the database, deploy, make your admin login, connect the app
server/setup.sh --skip-secrets  # re-deploy only
server/setup.sh --new-admin     # add another admin login (or reset yours)
```

It sets the repository variable `API_URL` and rebuilds the site so the app knows the address. The
built-in AI step is optional and skipped by default: it needs an Anthropic API key (a Claude
subscription doesn't include API use), costs about 1p to read an answer and 3–5p to mark working
with `claude-opus-5-5`, and is capped at 200 calls a day (`DAILY_AI_LIMIT` in `server/wrangler.toml`).

## Project layout

See [PLAN.md](PLAN.md) for the architecture and [DECISIONS.md](DECISIONS.md) for every default chosen.
Templates live in `src/content/templates/<Book>-<Chapter>/` — see [CONTRIBUTING.md](CONTRIBUTING.md)
for how to add one.

## Not affiliated with Pearson

All questions are original and written in the style of 9MA0. Spec references follow the
Pearson Edexcel 9MA0 specification (Issue 4); textbook chapters follow the Pearson Edexcel A level
Mathematics books.
