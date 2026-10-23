# Progress

## Phase 1 — Skeleton ✅ (16 Oct 2026)

**Built**
- Vite 8 + React 19 + TypeScript 7 app; hash routing; PWA (manifest, icons, Workbox precache of every
  asset, update prompt, iOS install guidance); fonts and libraries bundled locally.
- Storage: `Store` interface with IndexedDB implementation (+ memory fallback), drafts autosave,
  `navigator.storage.persist()`, JSON backup / restore (merge or replace).
- Maths engine: seeded RNG, exact rationals, rational-exponent polynomials, expression AST with
  LaTeX printer, numerical methods, SVG diagram kit.
- Stats library: binomial, normal (Φ, Φ⁻¹), t distribution, PMCC critical values — tested against
  table values.
- Marking engine (first cut): LaTeX/ASCII parser, numeric equivalence, Edexcel accuracy rules,
  exact values, + c detection, lists, coordinates, vectors, intervals/set notation, equations,
  choices, hypothesis tests, form checks, common errors, follow-through, self-marking.
- Pure Year 1 Chapter 13 Integration, end to end: 14 templates (13.1–13.7, deepest at 13.5–13.7),
  each with computed answers, Edexcel-style mark scheme, three hints, common errors, worked
  solution and SVG diagrams; each verified by an independent method.
- Question UI: Edexcel paper styling, per-part checking, feedback, hints, mark scheme with
  self-award ticks, worked solutions, give-up, share links, annotation layer.
- Working area: handwriting canvas (Pointer Events, pressure, coalesced events, perfect-freehand,
  pen/highlighter/eraser, undo/redo, plain/lined/squared paper, grows as you write, pencil-only palm
  rejection, PNG export) and typed working with live KaTeX preview.
- Practice sessions, topics browser, basic progress page, settings.

**Tests**: template suite (14 templates × 300 seeds), stats references, Playwright on
desktop Chrome, iPhone (WebKit), iPad landscape (WebKit) and Pixel (Chromium): answer, wrong-answer
self-marking, drawing, offline, backup/restore.

**Coverage**: 14 templates · 336 verified questions · spec points P8.1–P8.3 covered.

## Phase 2 — Marking engine ✅ (16 Oct 2026)

- Every answer type marks: numeric (awrt, s.f./d.p., 2–3 s.f. for g, tolerance, table-value
  alternatives), exact (fractions, surds, π, e, ln; short decimals treated as exact), expressions
  with form checks, integrals (+ c, additive constant only), equations (any rearrangement or a
  required form), order-free lists (degrees vs radians), coordinates, vectors (i j k or column),
  intervals and set notation (including integer critical regions), choice, structured hypothesis tests.
- Common errors (auto-dropped when they coincide with the right answer for a seed), follow-through,
  self-marking of method lines, a lazy Compute Engine fallback parser.
- Suite: ~430 equivalent/non-equivalent answer pairs plus part-level tests (all green).

## Phase 3 — Content ✅

**Templates: 329 · verified questions in the bank index: 7,896 · spec points with ≥ 3 templates: 89 / 89.**

Every Edexcel 9MA0 spec point now has at least three primary templates, across every chapter of the
Pearson Pure 1 & 2 and Statistics & Mechanics 1 & 2 books. Each template generates text, computed
answers, an Edexcel-style mark scheme, three hints, common errors and a worked solution, and is
checked on 200 seeds by an independent method (numerical calculus, brute-force enumeration,
simulation or direct substitution).

Highlights by area
- **Pure Year 1**: algebra and proof, quadratics, inequalities, graphs, lines, circles, factor
  theorem, binomial expansion, trigonometry (ratios, graphs, identities, equations), 2D vectors,
  differentiation (first principles to optimisation), integration (13.5–13.7 in depth),
  exponentials and logarithms (laws, equations, log graphs of non-linear data, modelling).
- **Pure Year 2**: partial fractions, functions (composite, inverse, range, modulus, modelling),
  sequences and series (recurrence, sigma, AP, GP, sum to infinity, modelling), radians and small
  angles, sec/cosec/cot and inverse trig, addition/double-angle formulae and R cos(θ − α), identity
  proofs, trig modelling, parametric equations, chain/product/quotient rules, connected rates,
  implicit and parametric differentiation, numerical methods, integration in depth (standard,
  substitution, parts, partial fractions, trapezium rule, limits of sums, differential equations),
  3D vectors.
- **Statistics**: sampling and the large data set, measures and representations, histograms,
  correlation and regression, probability (Venn, trees, two-way tables, conditional, modelling),
  binomial and normal distributions, choosing a distribution, hypothesis tests.
- **Mechanics**: units and derived quantities, kinematics (language, graphs, suvat, vertical
  motion, variable acceleration, 2D vectors), forces and Newton's laws (connected particles,
  pulleys, inclined planes, friction, dynamics in a plane), projectiles, moments (rods, tilting,
  ladders).

Engine improvements made along the way: interval answers accept either strict or non-strict
inequalities where Edexcel does, and accept f(x), g⁻¹(x) etc. for ranges; the validator now catches
un-interpolated `${…}` text and double backslashes; the LaTeX printer separates symbols from
following letters (π r, not \\pir); degree units print without a stray space.

**Fixed questions: 158** — proof (deduction, exhaustion, counter-example, contradiction, spotting errors),
explaining and interpreting in Pure, statistics interpretation and hypothesis-test language, large data
set knowledge (Met Office stations, units, “tr”, n/a, Perth's seasons, sampling from it) and mechanics
modelling assumptions. Proofs are self-marked against a model proof; the rest are auto-marked
multiple choice. They work as single-seed question types, so practice, review and progress handle
them like any other question. Multiple-choice options are shown in a stable shuffled order so the
correct answer is never always first.

## Phase 4 — Modes, mocks, dashboard, reference ✅

- **Practice modes**: topic (chapter / spec point / question type), mixed (everything, or Pure /
  Statistics / Mechanics), and **review** — spaced repetition by question family (FSRS), most
  overdue first.
- **Today's set**: five questions picked for you each day (due reviews, weakest chapters, something
  new), with instant feedback.
- **Mock papers**: Paper 1, Paper 2 (Pure, 100 marks), Paper 3 (Statistics section then Mechanics
  section, 50 + 50), half papers and section practice; 1.2 minutes per mark; questions drawn at
  random, easier first, one per family. **Timed sets** for any area or chapter (10–50 marks).
- **Exam conditions**: countdown, autosaved answers and per-question working, no marking until you
  finish (or time runs out). **Results**: score by section, time per mark, and a review of each
  question with your answer, feedback, mark scheme (tick method marks you earned) and worked solution.
- **Sharing**: single questions and whole sets have links that reproduce exactly the same questions.
- **Progress dashboard**: weekly trend, red/amber/green by chapter and by spec point, time per mark
  by area against exam pace, most frequent mistakes, mock/timed history, recent questions; each
  question page shows your history with that question type.
- **Reference**: formulae (Pure, Statistics, Mechanics) and statistical tables generated in the app
  (cumulative binomial for n = 5…50, normal percentage points, PMCC critical values).
- Settings: delete all progress (with confirmation).
- Fixed a crash when a new question arrived in the same render as a route change.

**Tests**: 1,707 unit tests (templates, fixed questions, marking pairs, stats, sets, dashboard
statistics) and 36 Playwright runs across desktop Chrome, iPhone and iPad (WebKit) and Pixel
(Chrome), including an exam set end to end and the generated tables.

## Phase 5 — Accessibility, performance, polish ✅

- **Accessibility**: axe-core (WCAG 2.1 A/AA and best practice, moderate impact or worse) runs on
  every main page, a question with a diagram, fixed questions (including options that are all
  maths), and the exam view, in light and dark mode on all four devices. Fixed along the way: tab
  structure, a keyboard-focusable working canvas, duplicate diagram roles, dark-mode contrast,
  heading order, and accessible names for maths-only options (a spoken version: "x squared",
  "1 over 2", "H sub 0").
- **Performance** (Lighthouse mobile, simulated slow 4G; accessibility, best practices and SEO are
  100 on every page):

  | page | performance | | page | performance |
  |---|---|---|---|---|
  | home | 98 | | progress | 93 |
  | topics | 97 | | settings | 93 |
  | chapter | 96 | | review | 92 |
  | exams | 96 | | practice | 91 |
  | reference | 94 | | question pages | 90 |

  Desktop question page: 100. Main bundle 877 KB → 460 KB (115 KB gzipped): pages load on demand,
  the bank index is separate from the maths engine, the HTML carries a static app frame (generated
  from the same nav and icons) and a preload map so a deep link fetches its page and question
  chapter alongside the main bundle, KaTeX fonts are preloaded, banners float rather than shift
  the layout, and a saved dark theme applies before first paint.
- **Robustness**: a page whose code fails to download (an old tab after an update, or offline before
  caching finished) shows Reload / Home instead of a blank screen.
- **iPad / Apple Pencil**: pressure, coalesced events, Pencil-only mode with palm rejection and
  iOS stylus-touch filtering; drawing is covered by the tablet WebKit e2e run.
- Docs: README feature list and quality bars; CONTRIBUTING covers fixed questions and sets.

**Tests**: 1,725 unit tests and 154 Playwright runs across the four devices (13 app flows — offline on Chromium only — plus
axe on 13 views in light and dark) — all green.

**Deploy**: waiting on GitHub sign-in (`gh auth login`); everything is committed and ready to push.

## Phase 6 — More questions, past papers, sync and AI ✅ (23 Oct 2026)

- **Questions**: 349 question types and **62,948 verified questions** (the bank keeps up to 200
  distinct verified seeds per type, stored as compact seed runs). New: binomial expansion for
  rational n (approximating surds, partial fractions then expand, finding n and k, products), and
  13 long exam-style questions (10–14 marks) across Pure, Statistics and Mechanics with a
  "Long questions" practice mode.
- **Past papers (PPQ)**: every 9MA0 paper from June 2018 to June 2025 (31 papers) indexed
  question by question — topic, marks and the matching question types — with links to Pearson's
  question papers and mark schemes (no Pearson content is copied). Question pages show "Past paper
  questions on this topic"; chapters show PPQ counts; a past-papers page filters by year, paper and
  topic and builds a timed set on any paper's topics.
- **Predicted grade** from mock papers using the June 2023–2026 grade boundaries.
- **Flashcards** (89 cards: formulae to learn and key facts, FSRS spaced repetition) and
  **calculator tips** on the formulae page.
- **Sync between devices** (`src/lib/sync.ts`, `server/`): a 20-character sync code gives the row id
  (SHA-256) and an AES-GCM key (PBKDF2), so the server stores only compressed ciphertext. Syncs on
  start, after progress changes and when back online; merging never loses an attempt (union),
  keeps the newest card and draft, and the most advanced mock; handwriting strokes stay on the
  device that drew them. Writes use optimistic versions and retry on a clash.
- **AI handwriting and marking** (`server/src/ai.ts`, Claude `claude-opus-5-5` with structured
  output and the server-side refusal fallback):
  - *Write it*: a pad next to answer boxes; the AI reads the handwriting into the box to check.
  - *AI: mark my working*: after checking a part (or reviewing a mock), the working is marked line
    by line against the mark scheme with short feedback and a next step; its ticks can be taken as
    self-marks.
  - Apple Pencil Scribble into plain-text answer boxes (free, offline) is explained in Settings.
  - The key lives only in Cloudflare secrets; the app sends an access code; a daily cap (200)
    limits spending.
- **Logins** (`server/src/auth.ts`, `src/lib/account.ts`, `#/account`, `#/admin`): the admin makes
  logins in the app and gets a temporary password to pass on (must be changed at first sign-in).
  Signed in, progress, history, mocks, review cards and preferences (theme, answer boxes, paper,
  working) are saved to the account and merged across devices; signing out removes them from the
  device. Passwords are stretched in the browser (PBKDF2, 100k rounds) and the Worker keeps a salted
  SHA-256 of that — the free plan's 10 ms CPU limit rules out PBKDF2 on the server. Bearer tokens
  (hashed in the database, 90 days), 20 wrong passwords a day per login before it pauses, admins
  can reset, switch off and delete logins and see questions, score and last active.
- **Free AI marking** (`src/components/AskAi.tsx`): a Claude subscription doesn't cover API use, so
  rather than pay for the API the app hands the question, mark scheme, model solution, answer and a
  picture of the working to the student's own AI app (share sheet on phones and iPads; copy and
  paste on computers). The paid built-in AI stays available but is off unless a key is set.
- **Server**: Cloudflare Worker + D1, one-step `server/setup.sh` (double-click
  `Set up logins and sync.command`) that also makes the admin login.
- **CI**: e2e runs in the Playwright container (42 → 9 minutes); the server is type-checked and tested.
