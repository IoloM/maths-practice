/** Number formatting with Edexcel conventions (s.f., d.p., LaTeX). */

/** Round to n significant figures (returns a number). */
export function roundSF(x: number, n: number): number {
  if (x === 0 || !Number.isFinite(x)) return x;
  const p = n - 1 - Math.floor(Math.log10(Math.abs(x)));
  return roundDP(x, p);
}

/** Round half away from zero to dp decimal places (dp may be negative). */
export function roundDP(x: number, dp: number): number {
  if (!Number.isFinite(x)) return x;
  // use exponent notation to avoid binary drift, e.g. 1.005 → 1.01
  const s = Math.abs(x);
  const r = Number(Math.round(Number(`${toPlain(s)}e${dp}`)) + `e${-dp}`);
  return Math.sign(x) * r;
}

function toPlain(x: number): string {
  const s = String(x);
  if (!/e/i.test(s)) return s;
  return x.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
}

/** String to n s.f., keeping trailing zeros (e.g. 2.50). */
export function fmtSF(x: number, n: number): string {
  if (x === 0) return n > 1 ? `0.${'0'.repeat(n - 1)}` : '0';
  const r = roundSF(x, n);
  const mag = Math.floor(Math.log10(Math.abs(r)));
  const dp = Math.max(0, n - 1 - mag);
  return fixed(r, dp);
}

/** String to dp decimal places. */
export function fmtDP(x: number, dp: number): string {
  return fixed(roundDP(x, dp), Math.max(0, dp));
}

function fixed(x: number, dp: number): string {
  let s = Math.abs(x).toFixed(dp);
  if (Number(s) === 0) return s; // avoid "-0.00"
  if (x < 0) s = `-${s}`;
  return s;
}

/** Shortest clean decimal (up to 10 dp), no trailing zeros. */
export function fmtNum(x: number, maxDp = 10): string {
  const s = fmtDP(x, maxDp);
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}

/** LaTeX for a decimal: uses a proper minus and thin-space thousands grouping for ≥ 10 000. */
export function texNum(x: number | string): string {
  let s = typeof x === 'number' ? fmtNum(x) : x;
  const neg = s.startsWith('-');
  if (neg) s = s.slice(1);
  const [i, f] = s.split('.');
  const ig = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : i;
  return `${neg ? '-' : ''}${ig}${f !== undefined ? `.${f}` : ''}`;
}

/** Count significant figures in a decimal literal as typed ("0.0250" → 3, "1200" → 2). */
export function countSF(lit: string): number {
  let s = lit.trim().replace(/^[+-]/, '');
  if (/e/i.test(s)) s = s.split(/e/i)[0];
  if (s.includes('.')) {
    const digits = s.replace('.', '').replace(/^0+/, '');
    return digits.length;
  }
  const t = s.replace(/^0+/, '').replace(/0+$/, '');
  return Math.max(1, t.length);
}

/** Count decimal places in a literal ("2.50" → 2). */
export function countDP(lit: string): number {
  const s = lit.trim();
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

/** "3 significant figures" phrasing. */
export function accuracyPhrase(acc: { sf?: number; dp?: number }): string {
  if (acc.sf) return `${acc.sf} significant figure${acc.sf === 1 ? '' : 's'}`;
  if (acc.dp !== undefined) return `${acc.dp} decimal place${acc.dp === 1 ? '' : 's'}`;
  return '';
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
