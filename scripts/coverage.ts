/**
 * Coverage report: templates and verified instances per 9MA0 spec point.
 * A template counts towards its PRIMARY spec point (first in its list) for the gate;
 * secondary references are reported separately.
 * Exit 1 if any spec point has fewer than MIN templates (unless --allow-gaps).
 */
import bank from '../src/content/bank-index.json' with { type: 'json' };
import { SPEC } from '../src/content/spec';

const MIN = 3;
const allowGaps = process.argv.includes('--allow-gaps');
type E = { id: string; spec: string[]; seeds: number[]; fixed?: boolean };
const GEN = (bank.templates as E[]).filter((t) => !t.fixed);
const FIX = (bank.templates as E[]).filter((t) => t.fixed);
const rows = SPEC.map((sp) => {
  const primary = GEN.filter((t) => t.spec[0] === sp.ref);
  const secondary = GEN.filter((t) => t.spec.slice(1).includes(sp.ref));
  const fixed = FIX.filter((f) => f.spec.includes(sp.ref)).length;
  return { ref: sp.ref, title: sp.title, t: primary.length, inst: primary.reduce((s, t) => s + t.seeds.length, 0), sec: secondary.length, fixed };
});
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(`${pad('spec', 7)}${pad('tmpl', 6)}${pad('inst', 7)}${pad('+sec', 6)}${pad('fixed', 7)}title`);
for (const r of rows) console.log(`${pad(r.ref, 7)}${pad(r.t, 6)}${pad(r.inst, 7)}${pad(r.sec, 6)}${pad(r.fixed, 7)}${r.t < MIN ? '✗ ' : '  '}${r.title}`);
const gaps = rows.filter((r) => r.t < MIN);
console.log(`\n${bank.totals.templates} templates · ${bank.totals.questions} verified questions · ${bank.totals.fixed} fixed questions`);
console.log(`${rows.length - gaps.length}/${rows.length} spec points have ≥ ${MIN} templates`);
if (gaps.length && !allowGaps) {
  console.error(`Coverage gate failed: ${gaps.length} spec points below ${MIN} templates.`);
  process.exit(1);
}
