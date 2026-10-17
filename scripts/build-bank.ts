/**
 * Builds src/content/bank-index.json: template metadata + ≥ 20 validated seeds per template.
 * Every listed seed passes validateInstance (constraints, verify(), self-marking, KaTeX…).
 * Usage: npx tsx scripts/build-bank.ts [--check]   (--check: fail if the committed index is stale)
 */
import fs from 'node:fs';
import path from 'node:path';
import { ALL_TEMPLATES } from '../src/content/templates/all.gen';
import { FIXED } from '../src/content/fixed/index';
import { validSeedInstance } from '../src/engine/templates/validate';
import { fixedToTemplate } from '../src/content/fixed/adapter';
import type { TemplateMeta } from '../src/engine/templates/types';

const SEEDS_PER_TEMPLATE = 24;
const out = path.resolve(import.meta.dirname, '../src/content/bank-index.json');

export interface BankEntry extends TemplateMeta {
  seeds: number[];
  fixed?: boolean;
}

const entries: BankEntry[] = [];
let failures = 0;
for (const t of ALL_TEMPLATES) {
  const seeds: number[] = [];
  for (let s = 1; s <= 3000 && seeds.length < SEEDS_PER_TEMPLATE; s++) if (validSeedInstance(t, s)) seeds.push(s);
  if (seeds.length < 20) {
    console.error(`✗ ${t.id}: only ${seeds.length} valid seeds`);
    failures++;
  }
  const { generate: _g, verify: _v, ...meta } = t;
  entries.push({ ...meta, seeds });
}
const generatedCount = entries.length,
  generatedQuestions = entries.reduce((s, e) => s + e.seeds.length, 0);
for (const f of FIXED) {
  const { generate: _g, verify: _v, ...meta } = fixedToTemplate(f);
  if (!validSeedInstance(fixedToTemplate(f), 0)) {
    console.error(`✗ fixed ${f.id} fails validation`);
    failures++;
  }
  entries.push({ ...meta, seeds: [0], fixed: true });
}
const index = {
  version: 1,
  templates: entries,
  totals: {
    templates: generatedCount,
    questions: generatedQuestions,
    fixed: FIXED.length,
  },
};
const json = JSON.stringify(index, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (cur !== json) {
    console.error('bank-index.json is stale — run `npm run bank` and commit it.');
    process.exit(1);
  }
  console.log('bank-index.json is up to date');
} else {
  fs.writeFileSync(out, json);
  console.log(`bank: ${index.totals.templates} templates, ${index.totals.questions} verified questions, ${index.totals.fixed} fixed`);
}
if (failures) process.exit(1);
