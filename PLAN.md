# Maths Practice — Plan

Edexcel A Level Mathematics (9MA0) practice app: Pure (Papers 1 & 2) and Applied
(Paper 3: Statistics + Mechanics). Static PWA, offline-first, hosted at
**https://iolom.github.io/maths-practice/**.

Source of truth for spec points: *Pearson Edexcel Level 3 Advanced GCE in Mathematics
(9MA0) Specification, Issue 4 (February 2020)*, the current issue as of October 2026.

---

## 1. Architecture

```
┌──────────────────────────── Browser (PWA, works offline) ────────────────────────────┐
│  React UI (hash router)                                                              │
│   ├─ Pages: Home · Topics · Practice · Question · Review · Mock · Daily · Dashboard  │
│   │         Reference (formula booklet, tables) · Settings (backup/restore)          │
│   ├─ Components: MathText (Markdown-lite + KaTeX), AnswerFields, WorkingArea         │
│   └─ Lazy chunks: MathLive keyboard · drawing canvas · CE fallback parser · content  │
│                                                                                      │
│  Engine (pure TypeScript, no DOM, runs in Node for tests/scripts)                    │
│   ├─ core:     rng (sfc32 + cyrb128) · Q (exact rationals) · Poly · Expr AST         │
│   │            · format (s.f./d.p., LaTeX numbers) · svg diagram kit                 │
│   ├─ stats:    binomial, normal (cdf/inv), t-dist → PMCC critical values             │
│   ├─ marking:  parser (LaTeX/ASCII → Expr) · numeric equivalence · form checks       │
│   │            · per-answer-type markers · common errors · follow-through · scoring  │
│   └─ templates: defineTemplate · registry · validateInstance                          │
│                                                                                      │
│  Content: spec points · textbook chapters · templates/* · fixed/* · bank-index.json  │
│  Progress: Store interface → IndexedDB impl (idb) · backup JSON · FSRS cards         │
│  Service worker (Workbox via vite-plugin-pwa): precaches every asset                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

* **No server.** Everything (generation, marking, progress) runs in the browser.
  GitHub Pages serves static files only.
* **Engine is DOM-free** so the same code generates questions in the app, in
  Vitest, and in `scripts/` (bank builder, coverage report).
* **Questions are code.** A template is `generate(rng) → Instance`. The instance
  holds the text, the computed answers, the worked solution, the mark scheme,
  hints, common-error rules and an SVG diagram, all built from the same
  parameters. Nothing a student sees as an answer is typed by hand.

## 2. Data model

### Template (TypeScript object)
```ts
interface Template {
  id: string;            // 'p1.13.area-between-line-curve'
  family: string;        // SRS grouping, e.g. 'p1.13.area'
  title: string;
  spec: SpecRef[];       // e.g. ['P8.3'] (P = Papers 1/2, S = Paper 3 A, M = Paper 3 B)
  chapter: ChapterRef;   // e.g. 'P1.13' (book P1/P2/SM1/SM2 + chapter)
  sections?: string[];   // textbook sections, e.g. ['13.7']
  level: 'AS' | 'A2';
  paper: (1 | 2 | 3)[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  marks: number;         // total marks
  time: number;          // minutes (≈1.2 × marks)
  commands: CommandWord[]; // 'Find', 'Show that', 'Hence', ...
  tags: string[];
  generate(r: Rng): Instance;          // may throw Reject → resample
  verify(i: Instance): void;           // independent re-derivation; throws on failure
}
```

### Instance (generated, never persisted)
```ts
interface Instance {
  templateId: string; seed: number;
  stem?: string;                      // Markdown + $LaTeX$
  diagram?: { svg: string; alt: string };
  parts: Part[];
  params: Record<string, unknown>;    // for verify()
}
interface Part {
  label: string;                      // 'a', 'b', 'i' … or '' for single-part
  marks: number;
  prompt: string;
  answer: AnswerSpec;                 // see §4
  ft?: FollowThrough;                 // recompute answer from earlier responses
  scheme: SchemeLine[];               // { code: 'M1'|'A1'|'B1'|'dM1'|'A1ft'…, text }
  hints: [string, string, string];    // nudge, method, first step
  errors: CommonError[];              // likely wrong answers → targeted feedback
  solution: string[];                 // worked steps with this instance's numbers
}
```

### Fixed question (data, for proof / explain / modelling / LDS)
`{ id, spec, chapter, level, marks, prompt, modelAnswer, checklist: SchemeLine[], kind: 'self' | 'choice', options?, correct? }`

### Persisted (IndexedDB, `Store` interface)
| store       | key                       | contents |
|-------------|---------------------------|----------|
| `attempts`  | auto id                   | templateId, seed, mode, setId, started/finished, durationMs, per-part `{response, auto:{score,max,verdict,errorId,ft}, self:{score}, hints}`, working `{mode, strokes, text, annotate}` |
| `drafts`    | `${templateId}:${seed}`   | in-progress responses + working |
| `cards`     | family                    | FSRS card state |
| `sets`      | id                        | mock / timed / daily sets: question list, timer, status |
| `settings`  | key                       | theme, paper style, pencil-only, onboarding flags |

Backup = one JSON file `{ app, version, exportedAt, stores: {...} }`; restore
validates the schema and replaces (or merges) store contents.

## 3. Folder structure

```
.github/workflows/deploy.yml   CI: typecheck → unit tests → coverage gate → build → e2e → Pages
public/                        icons, robots, apple-touch-icon
scripts/
  build-bank.ts                validates seeds → src/content/bank-index.json
  coverage.ts                  templates + instances per spec point; exit 1 if < 3
src/
  main.tsx, App.tsx, router.ts, styles/
  pages/                       one file per route
  components/                  MathText, QuestionView, AnswerField*, Feedback, …
  working/                     canvas (lazy), typed working
  engine/
    core/                      rng, rational, poly, expr, format, svg
    stats/                     distributions, tables
    marking/                   parse, equivalence, forms, numeric, markers, index
    templates/                 types, define, registry, validate, helpers (scheme/hints/errors)
  content/
    spec.ts, chapters.ts
    templates/<book>/<chapter>/*.ts   (grouped by textbook chapter → one lazy chunk each)
    fixed/*.ts
    bank-index.json            generated
  storage/                     Store interface, IndexedDB impl, backup
  progress/                    mastery, RAG, trends
  srs/                         FSRS wrapper
tests/                         Vitest: engine, stats, marking pairs, all templates × 200 seeds
e2e/                           Playwright: phone / tablet / desktop
```

## 4. Marking engine

1. **Parse** the response: MathLive LaTeX or typed ASCII → `Expr`. Own
   recursive-descent parser for the subset A level needs; Compute Engine is
   lazy-loaded only as a fallback parser.
2. **Compare** by answer type:
   * `numeric`: Edexcel accuracy rules (awrt, s.f./d.p.); a correct value given
     at too low a precision or in exact form when a decimal is required loses
     the final A mark, with feedback.
   * `exact`: numeric match to 1e-9 and no decimal literals (unless exact).
   * `expr` / `equation`: numeric equivalence at random points in the
     template's domain, with optional form checks (factorised, completed
     square, y = mx + c, a + b√c, simplified …).
   * `integral`: differs by a constant; missing `+ c` → lose final A1.
   * `list`, `coord`, `vector`, `interval` (incl. set notation), `choice`,
     `hypothesis` (H₀/H₁/statistic/comparison/conclusion), `self`.
3. **Common errors**: each rule is a wrong value (a function of the template
   parameters) with feedback and optional partial marks.
4. **Follow-through**: a part may recompute its answer from the student's
   earlier answers; marks are then awarded as ft.
5. **Self-marking**: if the final answer is wrong the scheme is shown and the
   method lines (M/B/dM, not the dependent final A) can be ticked. Auto and self
   marks are stored separately.

## 5. Correctness gates (CI)

* Every template × ≥ 200 seeds: constraints, `verify()` (independent method),
  canonical answer self-marks full, common errors ≠ correct answer, scheme marks
  sum = part marks, worked solution contains the final answer, no NaN/Infinity,
  every LaTeX string renders in KaTeX with `throwOnError`.
* Stats library vs reference values (B(10,0.3) P(X⩽3) = 0.6496, Φ⁻¹(0.975) =
  1.9600, PMCC n = 10 one-tail 5 % = 0.5494, …).
* Marking suite ≥ 300 equivalent / non-equivalent pairs.
* Coverage gate: every spec point ≥ 3 templates. Bank index must be fresh.
* Playwright on phone / tablet / desktop viewports.

## 6. Phases

| # | Phase | Contents | Exit criteria |
|---|-------|----------|---------------|
| 1 | Skeleton | Vite/React/TS, PWA + offline, Pages deploy, Store + backup, KaTeX, core maths libs, parser + markers for integration answers, **Pure Year 1 Integration** templates end to end (marking, feedback, hints, solutions, schemes), canvas + typed working, template test harness, stats lib, first e2e | Deployed URL, tests green |
| 2 | Marking engine | All answer types, form checks, common errors, follow-through, self-marking, ≥ 300-pair suite | Suite green, deployed |
| 3 | Content waves | Wave A priority topics (integration P1+P2, hypothesis testing, forces & motion, modelling assumptions, binomial cumulative, histograms, variance, inclined planes) → Wave B Pure Y1 → Wave C Pure Y2 → Wave D Stats → Wave E Mechanics → fixed questions to ≥ 150 | ≥ 3 templates per spec point, ≥ 250 templates, ≥ 5,000 seeds, coverage report after each wave |
| 4 | Modes & progress | Topic / mixed / review (FSRS) / timed & mock builder / daily; RAG dashboard, trends, history, time per mark, frequent errors | Deployed |
| 5 | Polish | a11y (WCAG AA, keyboard, MathML), Lighthouse ≥ 90, offline + cross-device e2e, iPad + Pencil tuning, README + CONTRIBUTING | Definition of done |
| 6 | Optional | Sync, AI feedback (only on request) | — |
