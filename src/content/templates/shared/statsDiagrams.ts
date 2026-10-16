/** SVG diagrams for statistics: histograms and box plots. */
import { esc } from '../../../engine/core/svg';
import { fmtNum } from '../../../engine/core/format';

/** Histogram with frequency density on the vertical axis. bounds has k+1 entries, fd has k. */
export function histogramSvg(bounds: number[], fd: number[], opts: { xLabel: string; yTicks?: number; showScale?: boolean }): string {
  const W = 380,
    H = 250,
    L = 46,
    B = 36,
    T = 14,
    R = 14;
  const x0 = bounds[0],
    x1 = bounds[bounds.length - 1];
  const yMax = Math.max(...fd) * 1.15;
  const X = (x: number) => L + ((x - x0) / (x1 - x0)) * (W - L - R);
  const Y = (y: number) => H - B - (y / yMax) * (H - B - T);
  const out: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="dg" role="img">`];
  // grid / ticks
  const ticks = opts.yTicks ?? 5;
  const step = niceStep(yMax / ticks);
  for (let y = 0; y <= yMax + 1e-9; y += step) {
    if (opts.showScale !== false) out.push(`<text class="dg-label dg-small" x="${L - 6}" y="${(Y(y) + 4).toFixed(1)}" text-anchor="end">${fmtNum(Math.round(y * 1000) / 1000)}</text>`);
    out.push(`<line class="dg-tick" x1="${L - 3}" y1="${Y(y).toFixed(1)}" x2="${L}" y2="${Y(y).toFixed(1)}"/>`);
    if (y > 0) out.push(`<line class="dg-tick dg-dash" style="opacity:.35" x1="${L}" y1="${Y(y).toFixed(1)}" x2="${W - R}" y2="${Y(y).toFixed(1)}"/>`);
  }
  fd.forEach((f, i) => {
    out.push(`<rect class="dg-shade" style="stroke:currentColor" x="${X(bounds[i]).toFixed(1)}" y="${Y(f).toFixed(1)}" width="${(X(bounds[i + 1]) - X(bounds[i])).toFixed(1)}" height="${(Y(0) - Y(f)).toFixed(1)}"/>`);
  });
  for (const b of bounds) out.push(`<text class="dg-label dg-small" x="${X(b).toFixed(1)}" y="${H - B + 15}" text-anchor="middle">${fmtNum(b)}</text>`);
  out.push(`<line class="dg-axis" x1="${L}" y1="${Y(0)}" x2="${W - R}" y2="${Y(0)}"/><line class="dg-axis" x1="${L}" y1="${Y(0)}" x2="${L}" y2="${T}"/>`);
  out.push(`<text class="dg-label dg-small" x="${(L + W - R) / 2}" y="${H - 4}" text-anchor="middle">${esc(opts.xLabel)}</text>`);
  out.push(`<text class="dg-label dg-small" x="12" y="${(H - B + T) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(H - B + T) / 2})">Frequency density</text>`);
  out.push('</svg>');
  return out.join('');
}

function niceStep(x: number): number {
  const p = 10 ** Math.floor(Math.log10(x));
  const m = x / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/** One or two box plots on a shared scale. Each: [min, q1, med, q3, max, outliers[]]. */
export function boxPlotSvg(plots: { label: string; five: [number, number, number, number, number]; outliers?: number[] }[], range: [number, number], xLabel: string): string {
  const W = 380,
    H = 60 + plots.length * 60,
    L = 70,
    R = 16;
  const X = (x: number) => L + ((x - range[0]) / (range[1] - range[0])) * (W - L - R);
  const out: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="dg" role="img">`];
  plots.forEach((p, i) => {
    const y = 30 + i * 60;
    const [mn, q1, md, q3, mx] = p.five;
    out.push(`<text class="dg-label dg-small" x="${L - 8}" y="${y + 4}" text-anchor="end">${esc(p.label)}</text>`);
    out.push(`<line class="dg-line" x1="${X(mn)}" y1="${y}" x2="${X(q1)}" y2="${y}"/><line class="dg-line" x1="${X(q3)}" y1="${y}" x2="${X(mx)}" y2="${y}"/>`);
    out.push(`<line class="dg-line" x1="${X(mn)}" y1="${y - 8}" x2="${X(mn)}" y2="${y + 8}"/><line class="dg-line" x1="${X(mx)}" y1="${y - 8}" x2="${X(mx)}" y2="${y + 8}"/>`);
    out.push(`<rect class="dg-shade" style="stroke:currentColor" x="${X(q1)}" y="${y - 14}" width="${X(q3) - X(q1)}" height="28"/><line class="dg-line" x1="${X(md)}" y1="${y - 14}" x2="${X(md)}" y2="${y + 14}"/>`);
    for (const o of p.outliers ?? []) out.push(`<text class="dg-label" x="${X(o)}" y="${y + 5}" text-anchor="middle">×</text>`);
  });
  const yAxis = H - 26;
  out.push(`<line class="dg-axis" x1="${L}" y1="${yAxis}" x2="${W - R}" y2="${yAxis}"/>`);
  const step = niceStep((range[1] - range[0]) / 8);
  for (let v = Math.ceil(range[0] / step) * step; v <= range[1] + 1e-9; v += step) {
    out.push(`<line class="dg-tick" x1="${X(v)}" y1="${yAxis}" x2="${X(v)}" y2="${yAxis + 4}"/><text class="dg-label dg-small" x="${X(v)}" y="${yAxis + 16}" text-anchor="middle">${fmtNum(Math.round(v * 100) / 100)}</text>`);
  }
  out.push(`<text class="dg-label dg-small" x="${W - R}" y="${H - 1}" text-anchor="end">${esc(xLabel)}</text>`);
  out.push('</svg>');
  return out.join('');
}
