/**
 * Distributions for 9MA0 Statistics: binomial, normal, t (for PMCC critical values).
 * Calculator-precision (double) implementations, tested against table values.
 */
import { nCr } from '../core/rational';

// ---------- binomial ----------
export function binomPmf(n: number, p: number, r: number): number {
  if (!Number.isInteger(r) || r < 0 || r > n) return 0;
  if (p === 0) return r === 0 ? 1 : 0;
  if (p === 1) return r === n ? 1 : 0;
  if (n <= 60) return nCr(n, r) * p ** r * (1 - p) ** (n - r);
  const lc = lgamma(n + 1) - lgamma(r + 1) - lgamma(n - r + 1);
  return Math.exp(lc + r * Math.log(p) + (n - r) * Math.log(1 - p));
}

/** P(X ⩽ r) for X ~ B(n, p). */
export function binomCdf(n: number, p: number, r: number): number {
  if (r < 0) return 0;
  if (r >= n) return 1;
  let s = 0;
  for (let i = 0; i <= Math.floor(r); i++) s += binomPmf(n, p, i);
  return Math.min(1, s);
}

/** P(a ⩽ X ⩽ b). */
export function binomRange(n: number, p: number, a: number, b: number): number {
  if (b < a) return 0;
  return binomCdf(n, p, b) - binomCdf(n, p, a - 1);
}

// ---------- normal ----------
/** Standard normal cdf Φ(z) — Marsaglia (2004), accurate to ~1e-15. */
export function phi(z: number): number {
  if (z < -8.5) return 0;
  if (z > 8.5) return 1;
  let s = z,
    t = 0,
    b = z,
    i = 1;
  const q = z * z;
  while (s !== t) {
    t = s;
    i += 2;
    b *= q / i;
    s = t + b;
  }
  return 0.5 + s * Math.exp(-0.5 * q - 0.91893853320467274178);
}

export function normalPdf(x: number, mu = 0, sigma = 1): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/** P(X < x) for X ~ N(mu, sigma²). */
export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return phi((x - mu) / sigma);
}

/** P(a < X < b). */
export function normalRange(a: number, b: number, mu = 0, sigma = 1): number {
  return normalCdf(b, mu, sigma) - normalCdf(a, mu, sigma);
}

/** Inverse standard normal Φ⁻¹(p): Acklam's algorithm + two Newton steps. */
export function invPhi(p: number): number {
  if (p <= 0 || p >= 1) throw new Error(`invPhi(${p})`);
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  let x: number;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pl) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  for (let i = 0; i < 2; i++) {
    const e = phi(x) - p;
    x -= e / normalPdf(x);
  }
  return x;
}

/** x with P(X < x) = p for X ~ N(mu, sigma²). */
export function invNormal(p: number, mu = 0, sigma = 1): number {
  return mu + sigma * invPhi(p);
}

// ---------- gamma / beta ----------
const LANCZOS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1;
  let a = LANCZOS[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 300,
    EPS = 1e-15,
    FPMIN = 1e-300;
  const qab = a + b,
    qap = a + 1,
    qam = a - 1;
  let c = 1,
    d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularised incomplete beta I_x(a, b). */
export function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

// ---------- t distribution ----------
export function tCdf(t: number, nu: number): number {
  const x = nu / (nu + t * t);
  const tail = 0.5 * ibeta(x, nu / 2, 0.5);
  return t >= 0 ? 1 - tail : tail;
}

export function invT(p: number, nu: number): number {
  let lo = -1000,
    hi = 1000;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (tCdf(m, nu) < p) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

/**
 * Critical value of the PMCC for sample size n at one-tailed significance
 * level alpha (two-tailed level 2·alpha): r = t / √(n − 2 + t²), t = t_{n−2}(1 − alpha).
 */
export function pmccCritical(n: number, alphaOneTail: number): number {
  const nu = n - 2;
  const t = invT(1 - alphaOneTail, nu);
  return t / Math.sqrt(nu + t * t);
}

// ---------- descriptive ----------
export function mean(xs: readonly number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
export function sxx(xs: readonly number[]): number {
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0);
}
/** Population-style s.d. √(Sxx/n), as in Edexcel. */
export function sdPop(xs: readonly number[]): number {
  return Math.sqrt(sxx(xs) / xs.length);
}
export function sdSample(xs: readonly number[]): number {
  return Math.sqrt(sxx(xs) / (xs.length - 1));
}
export function pmcc(xs: readonly number[], ys: readonly number[]): number {
  const mx = mean(xs),
    my = mean(ys);
  let sxy = 0,
    sx = 0,
    sy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sx += (xs[i] - mx) ** 2;
    sy += (ys[i] - my) ** 2;
  }
  return sxy / Math.sqrt(sx * sy);
}
