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

## Phase 3 — Content (templates ✅, fixed questions in progress)

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

**Still to do in Phase 3:** at least 150 fixed questions (proof, explain/interpret, modelling
assumptions, large data set knowledge).
