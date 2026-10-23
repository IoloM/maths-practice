/**
 * Builds the question bank:
 * - src/content/bank-index.json: template metadata and how many verified questions each has;
 * - src/content/bank-seeds.json: the verified seeds themselves (run-length coded, loaded lazily).
 * Every listed seed passes validateInstance (constraints, verify(), self-marking, KaTeX…) and gives a
 * question different from every earlier listed seed of that template.
 * Usage: npx tsx scripts/build-bank.ts [--check]   (--check: fail if the committed files are stale)
 */
import fs from 'node:fs';
import path from 'node:path';
import { ALL_TEMPLATES } from '../src/content/templates/all.gen';
import { FIXED } from '../src/content/fixed/index';
import { generateInstance, validSeedInstance } from '../src/engine/templates/validate';
import { fixedToTemplate } from '../src/content/fixed/adapter';
import { encodeSeeds } from '../src/content/seed-runs';
import type { Instance, TemplateMeta } from '../src/engine/templates/types';

/** Distinct verified questions kept per template. */
const SEEDS_PER_TEMPLATE = 200;
const MAX_SEED = 5000;
const MIN_SEEDS = 20;
const dir = path.resolve(import.meta.dirname, '../src/content');
const indexFile = path.join(dir, 'bank-index.json');
const seedsFile = path.join(dir, 'bank-seeds.json');

export interface BankEntry extends TemplateMeta {
  /** number of verified questions */
  n: number;
  fixed?: boolean;
}

/** What the student sees: two seeds with the same text and diagram are the same question. */
const fingerprint = (inst: Instance) => JSON.stringify([inst.stem ?? '', inst.parts.map((p) => p.prompt), inst.diagram?.svg ?? '']);

const entries: BankEntry[] = [];
const seedRuns: Record<string, string> = {};
let failures = 0;
for (const t of ALL_TEMPLATES) {
  const seeds: number[] = [];
  const seen = new Set<string>();
  for (let s = 1; s <= MAX_SEED && seeds.length < SEEDS_PER_TEMPLATE; s++) {
    // repeats are skipped before the (slower) full validation
    let key: string;
    try {
      key = fingerprint(generateInstance(t, s));
    } catch {
      continue;
    }
    if (seen.has(key) || !validSeedInstance(t, s)) continue;
    seen.add(key);
    seeds.push(s);
  }
  if (seeds.length < MIN_SEEDS) {
    console.error(`✗ ${t.id}: only ${seeds.length} distinct valid seeds`);
    failures++;
  }
  const { generate: _g, verify: _v, ...meta } = t;
  entries.push({ ...meta, n: seeds.length });
  seedRuns[t.id] = encodeSeeds(seeds);
}
const generatedCount = entries.length,
  generatedQuestions = entries.reduce((s, e) => s + e.n, 0);
for (const f of FIXED) {
  const { generate: _g, verify: _v, ...meta } = fixedToTemplate(f);
  if (!validSeedInstance(fixedToTemplate(f), 0)) {
    console.error(`✗ fixed ${f.id} fails validation`);
    failures++;
  }
  entries.push({ ...meta, n: 1, fixed: true });
}
const index = {
  version: 2,
  templates: entries,
  totals: {
    templates: generatedCount,
    questions: generatedQuestions,
    fixed: FIXED.length,
  },
};
const files: [string, string][] = [
  [indexFile, JSON.stringify(index, null, 1) + '\n'],
  [seedsFile, JSON.stringify(seedRuns, null, 1) + '\n'],
];
if (process.argv.includes('--check')) {
  const stale = files.filter(([f, json]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== json).map(([f]) => path.basename(f));
  if (stale.length) {
    console.error(`${stale.join(' and ')} stale — run \`npm run bank\` and commit.`);
    process.exit(1);
  }
  console.log('bank index and seeds are up to date');
} else {
  for (const [f, json] of files) fs.writeFileSync(f, json);
  console.log(`bank: ${index.totals.templates} templates, ${index.totals.questions} verified questions, ${index.totals.fixed} fixed`);
}
if (failures) process.exit(1);
