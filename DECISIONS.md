# Decisions

Every default chosen while building, with the reason. Newest entries are added at
the bottom of each section.

## Platform

| Decision | Why |
|---|---|
| **React 19 + Vite 8 + TypeScript 7** (not Svelte) | React has the largest ecosystem for the pieces we need (MathLive web component, canvas, testing). Svelte would be slightly smaller, but React's ~55 kB gzipped is well inside the 2 s budget. |
| Node 24 LTS (installed in `~/.local`) | Node wasn't on the Mac. 24 is the current Active LTS; checksums verified against nodejs.org. |
| Dependencies installed with `npm install --before=2026-10-01` | Supply-chain hygiene: avoid packages published in the last two weeks before install. The lockfile is committed and CI uses `npm ci`. |
| **Hash routing** (`#/q/<template>/<seed>`), own ~60-line router | Deep links work on GitHub Pages with no 404 tricks. No react-router dependency is needed for a handful of routes. |
| `base: '/maths-practice/'`, or `/` with `SITE_BASE=/` | The site lives at iolomaths.co.uk (built with `SITE_BASE=/` and pushed by CI to IoloM/iolomaths-site, whose Pages has the custom domain) and still at iolom.github.io/maths-practice. A custom domain on this repo would redirect the old address, and offline copies there could then never update; two sites let them update, move their progress across (`src/lib/move.ts`) and forward. |
| vite-plugin-pwa (`generateSW`, `registerType: 'prompt'`) | Precaches every built file, including lazy chunks and fonts, so the whole app works offline after the first visit. "Prompt" means an update never reloads the page in the middle of a question; a banner offers "Update". |
| No CDN or remote calls at runtime | School wifi blocks CDNs. Every font and library is bundled. MathLive is pointed at the KaTeX fonts already bundled (`fontsDirectory = null`), so the fonts aren't duplicated; MathLive sounds are disabled. |
| Fonts: KaTeX_Main (bundled with KaTeX, OFL) for question text; system UI stack for app chrome | Question text then matches the maths serif, as on an Edexcel paper, at no extra download. A system sans font for the chrome costs nothing. |

## Maths engine

| Decision | Why |
|---|---|
| **Own LaTeX/ASCII parser + numeric equivalence as the primary CAS** | Tested against CortexJS Compute Engine 0.141: `isEqual` returned *undefined* for `(x+1)^2` vs `x^2+2x+1` and for `sin²x+cos²x` vs `1`, and the core bundle is ~1 MB gzipped. A small, purpose-built parser for MathLive's LaTeX output is deterministic, fast (< 1 ms) and fully testable. Equivalence uses evaluation at random points inside the template's domain (the standard STACK/Möbius approach) with relative tolerance 1e-9. |
| **Compute Engine kept as a lazy fallback parser** | If our parser rejects some unusual LaTeX, CE (lazy chunk) parses it to MathJSON, which we convert to our AST. So CE is only downloaded when needed (it is still precached for offline use). |
| Exact arithmetic with `Q` (rationals on safe integers) | Answers like 32/3 or 4 − 2√3 must be exact. Overflow throws, which is treated as a rejected seed. |
| Seeded RNG: `sfc32` seeded by `cyrb128("templateId:seed")` | Fast, high quality and reproducible across browsers. The same template + seed always gives the same question, which makes questions shareable by URL. |
| Rejection sampling inside `generate` (`r.require(cond)`) with up to 500 retries | Gives clean numbers and no degenerate cases, and is deterministic for a given seed. |
| Seeds are positive 31-bit integers; the bank index lists the first ≥ 20 seeds (1, 2, 3 …) that pass validation | Simple and reproducible. Runtime "fresh" seeds are random 31-bit integers and run through the same `validateInstance` before display. |
| Probabilities default to awrt 4 d.p. (or 3 s.f. if the question says so) | Matches Edexcel mark-scheme practice for calculator/table values. |
| Statistical tables built from code (binomial cumulative, normal percentage points, PMCC critical values via the t distribution) | The brief forbids copied images. Values are computed and tested against known table entries. |
| g = 9.8 m s⁻² unless a question states otherwise; g-based answers accepted to 2 or 3 s.f. | Spec 8.3 and Edexcel convention (an answer that uses g = 9.8 should be given to 2 or 3 s.f.). |

## Content

| Decision | Why |
|---|---|
| Spec points: 62 Pure (1.1–10.5), 14 Statistics (1.1–5.3), 13 Mechanics (6.1–9.1) = **89** | Taken from Issue 4 of the 9MA0 spec. References are prefixed `P`, `S` and `M` (e.g. `P8.3`, `S5.2`, `M8.6`) because Stats and Mechanics restart numbering inside Paper 3. |
| AS vs A2 follows the spec's bold (AS-common) content | The spec marks AS-common content in bold. |
| Textbook mapping = Pearson Edexcel A level Mathematics (2017) books: Pure Year 1, Pure Year 2, Statistics & Mechanics Year 1 (Stats ch 1–7, Mechanics ch 8–11), Statistics & Mechanics Year 2 (Stats ch 1–3, Mechanics ch 4–8) | The brief's chapter list matches these books. Section numbers (e.g. 13.5) are best-effort from the book contents and are used only for filtering. |
| Several templates per file, grouped by textbook chapter folder; one lazy chunk per chapter | Related templates share helpers. One chunk per chapter keeps the first load small while the service worker still precaches everything. |
| The bank index (`bank-index.json`) is generated by `npm run bank` and committed; CI regenerates it and fails if it differs | The app can then browse ≥ 5,000 verified questions without loading every template. Freshness is enforced. |
| Fixed questions are TypeScript data (Markdown + LaTeX), either self-marked with a mark-scheme checklist or multiple choice | Proof, explanation, modelling-assumption and large-data-set questions can't be auto-marked reliably. |
| All question wording, numbers, contexts and diagrams are original | The brief forbids copying Pearson, IYGB or past papers. |

## Marking

| Decision | Why |
|---|---|
| A fully correct final answer earns the part's full marks | As the brief says (Edexcel: a correct answer from correct working earns full marks). |
| A wrong answer shows the scheme; the student ticks the M/B/dM lines their working shows. The final dependent A marks can't be self-awarded. Auto and self marks are stored separately | Honest self-assessment that doesn't inflate accuracy marks. |
| Hints: tier 1/2/3 multiply mastery credit by 0.85/0.7/0.5 (the strongest tier used counts) | "Using one is recorded and lowers mastery credit." |
| Missing `+ c` on an indefinite integral → full marks − 1, with feedback | The usual Edexcel scheme: the final A1 requires `+ c`. |
| Correct value given to too few s.f./d.p., or exact when a decimal was asked → lose the final A mark only | Edexcel awards the method marks in these cases. |
| Answer within 1 % but outside awrt → "premature rounding?" feedback; method marks self-assessed | Targets a common error without guessing marks. |

## Progress & modes

| Decision | Why |
|---|---|
| **FSRS** (ts-fsrs) with one card per template *family* | FSRS outperforms SM-2. Grouping by family means "area between curves" is reviewed as a skill, not per seed. |
| FSRS rating from performance: Again (< 50 % or gave up), Hard (50–80 % or hint tier ≥ 2), Good (≥ 80 %), Easy (100 %, no hints, under estimated time) | A transparent mapping from marks to recall quality. |
| Mastery = difficulty-weighted mean of the last 10 attempts' credit (newest weighted most, decay 0.85) | "Weighted for difficulty and hints … on recent attempts." Difficulty weight = 0.6 + 0.2 × d. |
| RAG: Red < 50 %, Amber 50–80 %, Green ≥ 80 %, grey = not attempted | As specified. |
| Mock papers: Papers 1 and 2 draw from all Pure templates (100 marks); Paper 3 = Statistics 50 + Mechanics 50; 1.2 min per mark | 9MA0 Papers 1 and 2 can both assess any Pure content. |
| Daily set ≈ 10 minutes (~8 marks), seeded by the date: due reviews first, then weakest families | Quick, and the same set all day on any device. |
| Storage: IndexedDB via `idb` behind a `Store` interface; `navigator.storage.persist()` requested on first save | So sync can be added later (Phase 6) without touching UI code. |
