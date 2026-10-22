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
