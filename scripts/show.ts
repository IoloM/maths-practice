/** Debug: print instances. npx tsx scripts/show.ts <templateId|all> [seed] */
import { ALL_TEMPLATES } from '../src/content/templates/all.gen';
import { generateInstance } from '../src/engine/templates/validate';
import { answerTex, canonicalResponse } from '../src/engine/marking/mark';
const [id = 'all', seedS = '1'] = process.argv.slice(2);
for (const t of ALL_TEMPLATES.filter((t) => id === 'all' || t.id === id || t.id.includes(id))) {
  const inst = generateInstance(t, Number(seedS));
  console.log(`\n=== ${t.id} (seed ${seedS}) [${t.marks}] ===`);
  if (inst.stem) console.log('STEM:', inst.stem);
  for (const p of inst.parts) {
    console.log(`(${p.label}) [${p.marks}] ${p.prompt}`);
    console.log('  ANSWER:', answerTex(p.answer), ' | canonical:', JSON.stringify(canonicalResponse(p.answer)));
    console.log('  SCHEME:', p.scheme.map((l) => `${l.code}: ${l.text}`).join(' / '));
    console.log('  HINTS:', p.hints.join(' / '));
    console.log('  SOLUTION:', p.solution.join('\n            '));
    console.log('  ERRORS:', p.errors.map((e) => e.id).join(', '));
  }
}
