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

## Phase 3 — Content waves (in progress)

Wave A (priority topics) so far: binomial distribution (8), binomial hypothesis testing and
critical regions (6), normal distribution incl. approximation and tests for a mean (10),
correlation tests and log models (5), regression interpretation (3), measures of spread —
variance, coding, combined samples, interpolation (7).

**Still to do in Wave A:** Pure Year 2 integration, forces and motion, modelling assumptions
(fixed questions), histograms, inclined planes. Then Waves B–E and fixed questions.
