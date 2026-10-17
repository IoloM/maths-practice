/**
 * Display order for multiple-choice options. Authors (and generators) often list the correct option
 * first; showing the options in a stable pseudo-random order, derived from the option texts, stops
 * position from giving the answer away. Stored responses still use the original indices.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function choiceOrder(options: readonly string[]): number[] {
  const salt = options.join('\u0001');
  const keyed = options.map((o, i) => ({ i, k: hash(`${salt}\u0002${i}\u0002${o}`) }));
  keyed.sort((a, b) => a.k - b.k || a.i - b.i);
  return keyed.map((x) => x.i);
}
