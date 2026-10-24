# Contributing: writing questions

Every generated question is a **template**: a TypeScript object whose `generate(rng)` builds one
complete question from random parameters, and whose `verify(instance)` re-derives the answers by a
different method. Nothing the student sees as an answer, solution step or mark-scheme value is typed
by hand.

## Where templates live

```
src/content/templates/<Book>-<Chapter>/<topic>.ts   e.g. P1-13/areas.ts
```

Each file `export default`s an array of templates. Run `npm run gen` after adding a file (it
regenerates the per-chapter index files and the lazy loaders), then `npm run bank`.

## The checklist (enforced by `npm test` and `npm run bank`)

For every seed tested (≥ 200 in CI):

1. `generate` succeeds (use `r.require(cond)` to reject bad parameters — never produce zero
   denominators, impossible probabilities or impossible mechanics).
2. `verify` passes — confirm answers **independently**: differentiate an integral back, integrate
   numerically, substitute roots, recompute probabilities a second way, resolve in another direction.
3. The canonical answer typed into the marker scores full marks.
4. No common error is marked correct, and none awards full marks.
5. Scheme marks add up to the part's marks; part marks add up to the template's marks.
6. The worked solution contains the final answer (`answerTex(spec)`).
7. Every `$…$` renders in KaTeX; no NaN / Infinity / undefined anywhere; diagrams have alt text.
8. At least 40 distinct questions per 200 seeds (variety).

## Worked example

```ts
import { Q } from '../../../engine/core/rational';
import { Poly } from '../../../engine/core/poly';
import { evaluate, num } from '../../../engine/core/expr';
import { expectClose, integrate } from '../../../engine/core/numeric';
import { answerTex } from '../../../engine/marking/mark';
import type { ExactSpec } from '../../../engine/marking/types';
import { A1, M1, ans, defineTemplate, dM1, err, md, part } from '../../../engine/templates/helpers';
import { dx } from '../shared/calculus';

export default [
  defineTemplate({
    id: 'p1.13.example-definite',          // unique, stable (it is in shared URLs)
    family: 'p1.13.definite',             // spaced-repetition skill group
    title: 'Definite integral of a quadratic',
    spec: ['P8.3'],                        // primary spec point first
    chapter: 'P1.13',
    sections: ['13.4'],
    level: 'AS',
    paper: [1, 2],
    difficulty: 2,                         // 1–5 (5 = A*/synoptic)
    marks: 4,
    time: 5,                               // minutes ≈ 1.2 × marks
    commands: ['Find'],
    tags: ['integration', 'definite'],
    generate(r) {
      const a = r.int(1, 4), b = r.intNZ(-5, 5);
      const lo = r.int(0, 2), hi = lo + r.int(1, 3);
      const f = Poly.coeffs([b, 0, 3 * a]);            // 3a x² + b
      const F = f.integ();
      const v = F.evalQ(hi).sub(F.evalQ(lo));
      r.require(!v.isZero);                             // constraint
      const A: ExactSpec = ans.exact(num(v), ['exact']);
      return {
        parts: [
          part({
            marks: 4,
            prompt: md`Find the exact value of $\displaystyle\int_{${lo}}^{${hi}} \left(${f.toLatex()}\right)${dx}$.`,
            answer: A,
            scheme: [
              M1(md`$x^{n} \to x^{n+1}$`),
              A1(md`$${F.toLatex()}$`),
              dM1('Substitutes the limits and subtracts'),
              A1(md`$${answerTex(A)}$`),
            ],
            hints: ['Integrate first, then use the limits.', md`$\int_a^b \mathrm{f}\,\mathrm{d}x = \mathrm{F}(b) - \mathrm{F}(a)$`, md`$\int (${f.toLatex()})${dx} = ${F.toLatex()}$`],
            errors: [err('reversed-limits', ans.exact(num(v.neg())), 'Subtract F(lower) from F(upper).', 2)],
            solution: [md`$\left[${F.toLatex()}\right]_{${lo}}^{${hi}} = ${answerTex(A)}$`],
          }),
        ],
        params: { a, b, lo, hi },
      };
    },
    verify(inst) {
      const { a, b, lo, hi } = inst.params as Record<string, number>;
      const exact = evaluate((inst.parts[0].answer as ExactSpec).value);
      expectClose(integrate((x) => 3 * a * x * x + b, lo, hi), exact, 'Simpson vs exact');
    },
  }),
];
```

### Answer types (`ans.*`)

| helper | use for | notes |
|---|---|---|
| `ans.num(v, { sf: 3 })` | decimals | awrt; `{ dp: 4 }`, `{ sfRange: [2, 3] }` (g = 9.8), `{ tol }` |
| `ans.exact(expr, forms?)` | fractions, surds, π, e, ln | decimals lose the final A mark |
| `ans.expr(expr, vars, { domain, forms })` | algebraic answers | numeric equivalence in `domain` |
| `ans.integral(expr)` | indefinite integrals | any constant; missing + c → −1 |
| `ans.eq(lhs, rhs, vars, forms)` | equations of lines/curves | `'y=mx+c'`, `'ax+by+c=0'` |
| `ans.list(items, { v, angle })` | roots, angles | order-free, all and only |
| `ans.coord(x, y)`, `ans.vec([…])` | points, vectors | |
| `ans.interval(set, v, { integer, setNotation })` | inequalities, critical regions | |
| `ans.choice(options, correct)` | interpretation, conclusions | |
| `ans.hyp({...})` | hypothesis tests | H₀, H₁, statistic, decision, conclusion |
| `ans.self(model)` | proofs, "show that", explanations | self-marked with the scheme |

### Writing style

- Original wording only — never copy from Pearson, IYGB or past papers.
- Edexcel notation: `\leqslant`, `\geqslant`, `\mathrm{H_0}`, `\mathbf{i}`, `\text{m s}^{-1}`,
  "Give your answer to 3 significant figures."
- Command words: Find, Show that, Hence, Hence or otherwise, Prove, Explain, State, Sketch…
- Hints are three tiers: nudge, method, first step (with this instance's numbers).
- Common errors are *values the wrong method would produce*, with feedback that names the mistake.

Run `npx tsx scripts/show.ts <template-id> <seed>` to print a generated question.

## Fixed questions (proof, explain, interpret, modelling, large data set)

Questions that cannot be generated from parameters are written once in `src/content/fixed/`
(`proof.ts`, `pure.ts`, `statistics.ts`, `large-data-set.ts`, `mechanics.ts`) with two helpers:

```ts
// self-marked against a model answer: one mark per point ("M1 …", "A1 …", "A1* …" set the code; plain text is B1)
selfQ({ ...DED, id: 'fx.proof.three-consecutive-integers', title: 'Sum of three consecutive integers',
  tags: ['proof', 'deduction'], difficulty: 1,
  prompt: md`Prove that the sum of any three consecutive integers is a multiple of $3$.`,
  model: md`Let the integers be $n$, $n + 1$, $n + 2$ … so the sum is a multiple of $3$.`,
  points: ['M1 Uses n, n + 1, n + 2 for a general integer n', 'A1 Sum = 3(n + 1)', 'A1* Concludes'],
  hints: ['…', '…', '…'] }),

// auto-marked multiple choice: B1 for the right option (and B1 for the reason when marks: 2)
choiceQ({ ...CEX, id: 'fx.proof.ce-square-inequality', title: '…', tags: ['proof', 'counter-example'],
  prompt: md`Which value of $x$ is a counter-example to …?`,
  options: [md`$x = -3$`, md`$x = 3$`, md`$x = 2$`, md`$x = 0$`], correct: 0,
  why: md`$(-3)^{2} = 9 > 4$ but $-3 < 2$.`, hints: ['…', '…', '…'] }),
```

- Ids start `fx.` and never change (they appear in shared links and saved progress).
- Options are shown in a stable shuffled order, so the correct one can be listed first. Options
  written in maths get a spoken version for screen readers automatically (`src/lib/tex-speech.ts`).
- Each fixed question is a single-seed question type (seed `0`), so practice, review, sets and
  progress treat it like any other. `npm run bank` validates it; `tests/fixed.test.ts` requires at
  least 150.

## Sets and papers

Mock papers, timed sets and today's set are lists of `(templateId, seed)` built in `src/lib/sets.ts`
from the bank index alone (no engine code), so they are reproducible and shareable
(`#/set/import?c=kind~minutes~id:seed,…~title`). Paper definitions (`PAPERS`) choose questions by
stream and paper; `fillToMarks` hits the mark total exactly where it can, one question per family,
easier first.

## Working on online logins

`supabase/` is the backend; `src/lib/cloud.ts` the only app code that talks to it. `npm test` checks
the migration's security rules in PGlite (`tests/supabase-sql.test.ts`) and the admin function
(`tests/admin-function.test.ts`); `npm run build:cloud-test` builds the app against a pretend
project that `e2e/fake-supabase.ts` serves to `e2e/cloud.spec.ts`. Change the database with a new
file in `supabase/migrations/` (never edit an applied one), then run `supabase/setup.sh` to apply it.

