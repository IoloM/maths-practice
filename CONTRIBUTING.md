# Contributing: writing a question template

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
