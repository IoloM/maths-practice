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

**Deploy**: live at https://iolom.github.io/maths-practice/ (GitHub Pages, deployed by CI on every push).

## Phase 6 — More questions, past papers, flashcards, predicted grade ✅ (23 Oct 2026)

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
- Sync between devices, admin-made logins and AI reading/marking of handwriting (built on a
  Cloudflare Worker) were built and then removed at the owner's request: the app stays a static,
  offline site with no server. Moving progress between devices is the backup file.
- **CI**: e2e runs in the Playwright container (42 → 9 minutes).

## Phase 7 — Past-paper marks, countdown, printing, logins on the device ✅ (23 Oct 2026)

- **Real past-paper marks** (`src/lib/paper-results.ts`): on the past papers page, enter your mark
  for each question (capped at its maximum) after marking the official paper. Each paper shows your
  score and a grade on that year's boundaries (or the latest); Progress lists the papers you've
  marked and the topics where real papers lose you marks (a question's dropped marks are shared
  between the topics it tests), with practice links. Finished papers count towards the predicted
  grade alongside app mocks.
- **Exam countdown**: your three exam dates in Settings; the home page counts down calendar days.
- **Printable papers** (`#/print/<set>`): any mock or timed set as a paper — instructions, questions
  and diagrams, lettered options, ruled answer lines (borders, so they print), then the mark scheme
  from a new page, optionally with worked solutions. Black on white whatever the theme.
- **Logins on the device** (`src/lib/logins.ts`, `src/pages/Logins.tsx`): Settings → Set up logins
  makes your admin login (keeping the progress already there); Manage logins makes logins for
  people with a temporary password (changed at first sign-in), resets passwords, shares admin and
  removes logins (and their data). Each login has its own IndexedDB database and settings; signed
  out, the app shows only a "Who's practising?" screen. A setup link (`#/join?c=…`, name and
  username only) makes someone's login on their own device, where they choose the password.
  Passwords are salted PBKDF2. There is no server, so logins don't follow people between devices
  (backups do).

## Phase 8 — Logins on every device, study group, daily goal ✅ (24 Oct 2026)

- **Online logins on Supabase** (free plan; the owner signs in with GitHub): `supabase/migrations`
  (profiles, progress, stats, assignments, results; row-level security: your own progress only,
  members see names and weekly totals, only admins set work; `save_progress` saves with a version so
  devices merge rather than overwrite), `supabase/functions/admin` (make, reset, switch off, remove
  logins; the only code with the secret key), auth with sign-up off and usernames as
  `<name>@login.invalid`. The app uses the publishable key only (`src/lib/cloud.ts`) and loads the
  Supabase client only when needed.
- **Sync** (`src/lib/sync.ts`, `sync-merge.ts`): each person's attempts, review cards, mocks,
  drafts, past-paper marks and preferences (theme, answer boxes, paper, exam dates, daily goal) are
  merged across devices on start, after practising, when back online and when leaving the app;
  handwriting stays on the device it was drawn on. Signing in on a device brings across what was
  practised there before (as a guest or with a device login of the same username).
- **Admin**: make logins with just a name and username — each person chooses their own password the
  first time they sign in (no passwords to pass on; until then, anyone who knew the username could
  claim it, so admins see who hasn't); reset (back to "choose a password"), share admin, switch off,
  remove; move device logins online with the same usernames. The setup script makes the owner's
  admin login the same way.
- **Study group** (`#/group`): this week's leaderboard and set work — an admin turns any mock or
  timed set into work for everyone (with a due date); results are handed in automatically and
  update when self-marking changes them.
- **Daily goal and streak** on the home page (goal in Settings, synced).
- **Setup**: `supabase/setup.sh` / `Set up online logins.command` (tested end to end against
  stand-ins); a daily keep-alive workflow. Until it is run, logins stay on each device.
- **Tests**: the migration's security rules run in real Postgres (PGlite); the admin function's
  handler; sync between two devices; online logins end to end in the browser against a pretend
  Supabase that runs the real admin handler.

## Phase 9 — Top-tier study tools ✅ (24–25 Oct 2026)

- **Formula booklet**: the whole exam booklet in one tab (with the tables), "Not in the booklet"
  (the specification's Appendix 1), a guide to mark schemes, and a booklet pop-up on every question
  and mock paper.
- **Self-marking** (`SchemePanel`, `src/lib/self-mark.ts`): the answer, what each mark is for,
  accuracy marks tied to their method mark, the final mark left to the checker, a running total.
  Proofs and explanations can now be self-marked in full.
- **Today's plan**, **mistake notebook** (`#/mistakes`, notes synced), **step by step**,
  **search** (/ or Ctrl K),
  **grades over time** and **badges** (Progress), **sitting a real past paper** with a clock and
  time per question (`#/sit/<paper>`).
- **Study group**: set work by topic, the topics the group finds hardest, a weekly target
  (`group_target` table), due-soon reminders in the app, "beat my score" challenge links.
- **Accessibility**: text size, Atkinson Hyperlegible (bundled, offline), read aloud with the
  device's voices (maths spoken via `tex-speech`).
- **Large data set explorer** (`#/data`): reads the user's own copy of Pearson's spreadsheet on the
  device (SheetJS, loaded lazily) — summaries the Edexcel way, box plots, scatter with PMCC and
  regression, random and systematic samples. The data itself isn't bundled.
- **Graph plotter** (`#/graphs`): up to three functions, sliders for other letters, roots,
  turning points and crossings.
- **More questions**: long exam-style questions (binomial, cubic curves, friction with connected
  particles, a rough slope there and back) and 17 "show that"/explain questions in Mechanics and
  Statistics.
- **Nightly backups**: `Turn on nightly backups.command` (launchd, 2:30am, into
  `~/Maths Practice backups`, latest 30 kept; the secret key lives in the login keychain).
- **Fix**: a finished question no longer re-saves every half second.

## Phase 10 — Learn: topics you want to learn or need help with ✅ (25 Oct 2026)

- Adaptive difficulty and phone reminders were taken out (the reminders' table, function, secrets
  and workflow too — no device had them on).
- **Mark topics** "I need help with this" / "I want to learn this" on a chapter, from a question you
  got wrong, or from the Learn page (`src/lib/topics.ts`, synced and in backups).
- **Learn** (`#/learn`, `#/learn/<chapter>`): revision notes for all 45 chapters (key ideas, results to
  know, a worked example revealed a step at a time, where marks go, exam tips — `src/content/notes`),
  87 videos from A level channels (each id checked with YouTube's oEmbed; they load from
  youtube-nocookie.com only when played — `src/content/videos.ts`), a practice path from the
  easiest question type up, a 15-mark topic test, real past-paper questions on the topic, and your own
  notes and links (YouTube links play on the page).
- Today's plan starts with a topic you asked for help with; admins see who asked for help on what in
  the group's "hardest topics" report.

## Phase 11 — Admin-only group, check-ins, confidence, reports ✅ (26 Oct 2026)

- **Study group and leaderboard are admin-only**, enforced by the database
  (`20261028000000_group_admin_only.sql`): members read only their own profile, stats and set-work
  results. Members get a "Set work" page with their own work and their own progress towards the
  weekly target.
- **Check-ins**: "I’ve learnt it" on a marked topic starts three short checks (about 10 marks of the
  topic’s easier questions) after 3, 7 and 21 days (`#/checkin/<chapter>`), in today’s plan and on
  the Learn pages; a weak check-in offers to mark the topic "need help" again.
- **Confidence vs reality** (`#/confidence`): rate each topic, see it next to your marks, and the
  topics you feel sure about but drop marks on come first.
- **Progress reports** (`#/report/<id>`, `#/report/all`, admins): totals, predicted grade, topics,
  help requests, past papers, mocks and recent questions, one person per printed page.
