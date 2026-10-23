/**
 * Seed lists as run lengths from seed 1, alternately kept and skipped, in base 36:
 * "5p" = seeds 1–205; "a.1.f" = 1–10 kept, 11 skipped, 12–26 kept.
 */
export function encodeSeeds(seeds: number[]): string {
  const runs: number[] = [];
  let next = 1,
    run = 0;
  for (const s of seeds) {
    if (s !== next) {
      // close the kept run, add the skipped run
      runs.push(run, s - next);
      run = 0;
    }
    run++;
    next = s + 1;
  }
  runs.push(run);
  return runs.map((n) => n.toString(36)).join('.');
}

export function decodeSeeds(code: string): number[] {
  const out: number[] = [];
  let s = 1;
  code.split('.').forEach((part, i) => {
    const n = parseInt(part, 36);
    if (i % 2 === 0) for (let k = 0; k < n; k++) out.push(s + k);
    s += n;
  });
  return out;
}
