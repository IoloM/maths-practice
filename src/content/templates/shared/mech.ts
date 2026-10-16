/** Shared helpers for mechanics templates: constants, units, 2-D vectors and SVG force diagrams. */
import { esc } from '../../../engine/core/svg';
import { fmtNum } from '../../../engine/core/format';
import type { Rng } from '../../../engine/core/rng';

export const G = 9.8;
export const U = {
  ms2: String.raw`\text{m s}^{-2}`,
  ms: String.raw`\text{m s}^{-1}`,
  N: String.raw`\text{N}`,
  kg: String.raw`\text{kg}`,
  m: String.raw`\text{m}`,
  s: String.raw`\text{s}`,
  Nm: String.raw`\text{N m}`,
};

export type V2 = [number, number];
export const vAdd = (...vs: V2[]): V2 => vs.reduce<V2>((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
export const vScale = (k: number, v: V2): V2 => [k * v[0], k * v[1]];
export const vLen = (v: V2) => Math.hypot(v[0], v[1]);
export const polar = (mag: number, deg: number): V2 => [mag * Math.cos((deg * Math.PI) / 180), mag * Math.sin((deg * Math.PI) / 180)];
export const rad = (deg: number) => (deg * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

/** An angle for an inclined plane: either tan α = p/q (exact sin, cos) or a whole number of degrees. */
export interface Angle {
  tex: string;
  /** "where tan α = 3/4" or "" */
  given: string;
  sin: number;
  cos: number;
  tan: number;
  deg: number;
  exact: boolean;
  sinTex: string;
  cosTex: string;
}

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [7, 24, 25],
  [8, 15, 17],
  [4, 3, 5],
];

export function pickAngle(r: Rng, sym = '\\alpha', allowExact = true): Angle {
  if (allowExact && r.bool(0.55)) {
    const [o, a, h] = r.pick(TRIPLES);
    return {
      tex: sym,
      given: `$\\tan ${sym} = \\frac{${o}}{${a}}$`,
      sin: o / h,
      cos: a / h,
      tan: o / a,
      deg: deg(Math.atan2(o, a)),
      exact: true,
      sinTex: `\\frac{${o}}{${h}}`,
      cosTex: `\\frac{${a}}{${h}}`,
    };
  }
  const d = r.pick([10, 15, 20, 25, 30, 35, 40]);
  return {
    tex: `${d}^{\\circ}`,
    given: '',
    sin: Math.sin(rad(d)),
    cos: Math.cos(rad(d)),
    tan: Math.tan(rad(d)),
    deg: d,
    exact: false,
    sinTex: `\\sin ${d}^{\\circ}`,
    cosTex: `\\cos ${d}^{\\circ}`,
  };
}

export const n3 = (x: number) => fmtNum(Math.round(x * 1000) / 1000);

// ---------------------------------------------------------------- SVG
const W = 360,
  H = 240;

function arrow(x1: number, y1: number, x2: number, y2: number, label?: string, cls = 'dg-line', lx = 0, ly = 0): string {
  let s = `<line class="${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" marker-end="url(#ah)"/>`;
  if (label) {
    const dx = x2 - x1,
      dy = y2 - y1,
      L = Math.hypot(dx, dy) || 1;
    const tx = x2 + (dx / L) * 12 + lx,
      ty = y2 + (dy / L) * 12 + 5 + ly;
    s += `<text class="dg-label" x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle">${esc(label)}</text>`;
  }
  return s;
}

const head = (w = W, h = H) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" class="dg" role="img"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="dg-arrow"/></marker></defs>`;

export type PlaneForce = 'up' | 'down' | 'normal' | 'weight' | 'horizontal' | 'friction-up' | 'friction-down';

/** Particle on an inclined plane rising to the right, with selected forces. */
export function planeDiagram(opts: { angleDeg: number; angleLabel: string; forces: { kind: PlaneForce; label: string }[]; particle?: string; pulley?: boolean; hanging?: string }): string {
  const a = Math.max(14, Math.min(48, opts.angleDeg));
  const t = rad(a);
  const x0 = 30,
    y0 = 205,
    len = 270;
  const x1 = x0 + len * Math.cos(t),
    y1 = y0 - len * Math.sin(t);
  const out = [head()];
  out.push(`<polygon class="dg-line" points="${x0},${y0} ${x1.toFixed(1)},${y0} ${x1.toFixed(1)},${y1.toFixed(1)}" style="fill:none"/>`);
  // angle arc
  const r = 34;
  out.push(`<path class="dg-line" d="M${x0 + r},${y0} A${r},${r} 0 0 0 ${(x0 + r * Math.cos(t)).toFixed(1)},${(y0 - r * Math.sin(t)).toFixed(1)}" style="fill:none"/>`);
  out.push(`<text class="dg-label" x="${x0 + r + 10}" y="${y0 - 6}">${esc(opts.angleLabel)}</text>`);
  // block
  const s = 0.48;
  const bx = x0 + len * s * Math.cos(t),
    by = y0 - len * s * Math.sin(t);
  const ux = Math.cos(t),
    uy = -Math.sin(t); // up the plane
  const nx = -Math.sin(t),
    ny = -Math.cos(t); // outward normal
  const b = 22;
  const c = [bx + nx * (b / 2), by + ny * (b / 2)];
  const corner = (p: number, q: number) => `${(bx + ux * p * b + nx * q * b - (ux * b) / 2).toFixed(1)},${(by + uy * p * b + ny * q * b - (uy * b) / 2).toFixed(1)}`;
  out.push(`<polygon class="dg-shade" points="${corner(0, 0)} ${corner(1, 0)} ${corner(1, 1)} ${corner(0, 1)}" style="stroke:currentColor"/>`);
  if (opts.particle) out.push(`<text class="dg-label" x="${(c[0] - 4).toFixed(1)}" y="${(c[1] + 5).toFixed(1)}">${esc(opts.particle)}</text>`);
  const L = 58;
  for (const f of opts.forces) {
    switch (f.kind) {
      case 'up':
      case 'friction-up':
        out.push(arrow(c[0] + ux * 14, c[1] + uy * 14, c[0] + ux * (14 + L), c[1] + uy * (14 + L), f.label));
        break;
      case 'down':
      case 'friction-down':
        out.push(arrow(c[0] - ux * 14, c[1] - uy * 14, c[0] - ux * (14 + L), c[1] - uy * (14 + L), f.label));
        break;
      case 'normal':
        out.push(arrow(c[0] + nx * 14, c[1] + ny * 14, c[0] + nx * (14 + L), c[1] + ny * (14 + L), f.label));
        break;
      case 'weight':
        out.push(arrow(c[0], c[1] + 12, c[0], c[1] + 12 + L, f.label));
        break;
      case 'horizontal':
        out.push(arrow(c[0] - 14 - L, c[1], c[0] - 14, c[1], f.label, 'dg-line', -L - 10, 0));
        break;
    }
  }
  if (opts.pulley) {
    out.push(`<circle class="dg-line" cx="${(x1 + 2).toFixed(1)}" cy="${(y1 - 10).toFixed(1)}" r="10" style="fill:none"/>`);
    out.push(`<line class="dg-line" x1="${(c[0] + ux * 11).toFixed(1)}" y1="${(c[1] + uy * 11).toFixed(1)}" x2="${(x1 - 6).toFixed(1)}" y2="${(y1 - 18).toFixed(1)}"/>`);
    out.push(`<line class="dg-line" x1="${(x1 + 12).toFixed(1)}" y1="${(y1 - 10).toFixed(1)}" x2="${(x1 + 12).toFixed(1)}" y2="${(y1 + 60).toFixed(1)}"/>`);
    out.push(`<rect class="dg-shade" x="${(x1 + 2).toFixed(1)}" y="${(y1 + 60).toFixed(1)}" width="20" height="20" style="stroke:currentColor"/>`);
    if (opts.hanging) out.push(`<text class="dg-label" x="${(x1 + 27).toFixed(1)}" y="${(y1 + 76).toFixed(1)}">${esc(opts.hanging)}</text>`);
  }
  out.push('</svg>');
  return out.join('');
}

/** Two particles hanging over a fixed smooth pulley. */
export function pulleyDiagram(left: string, right: string): string {
  const out = [head(240, 240)];
  out.push(`<line class="dg-line" x1="70" y1="12" x2="170" y2="12"/><line class="dg-line" x1="120" y1="12" x2="120" y2="40"/>`);
  out.push(`<circle class="dg-line" cx="120" cy="52" r="16" style="fill:none"/><circle class="dg-point" cx="120" cy="52" r="2.5"/>`);
  out.push(`<line class="dg-line" x1="104" y1="52" x2="104" y2="150"/><line class="dg-line" x1="136" y1="52" x2="136" y2="120"/>`);
  out.push(`<rect class="dg-shade" x="92" y="150" width="24" height="24" style="stroke:currentColor"/><rect class="dg-shade" x="124" y="120" width="24" height="24" style="stroke:currentColor"/>`);
  out.push(`<text class="dg-label" x="66" y="167" text-anchor="end">${esc(left)}</text><text class="dg-label" x="156" y="137">${esc(right)}</text>`);
  out.push('</svg>');
  return out.join('');
}

/** Particle on a horizontal table connected over a pulley at the edge to a hanging particle. */
export function tableDiagram(onTable: string, hanging: string, extra?: string): string {
  const out = [head(320, 220)];
  out.push(`<line class="dg-line" x1="20" y1="90" x2="250" y2="90"/><line class="dg-line" x1="250" y1="90" x2="250" y2="210"/>`);
  out.push(`<rect class="dg-shade" x="80" y="64" width="30" height="26" style="stroke:currentColor"/>`);
  out.push(`<text class="dg-label" x="95" y="56" text-anchor="middle">${esc(onTable)}</text>`);
  out.push(`<circle class="dg-line" cx="258" cy="82" r="9" style="fill:none"/>`);
  out.push(`<line class="dg-line" x1="110" y1="77" x2="258" y2="73"/><line class="dg-line" x1="267" y1="82" x2="267" y2="150"/>`);
  out.push(`<rect class="dg-shade" x="255" y="150" width="24" height="24" style="stroke:currentColor"/>`);
  out.push(`<text class="dg-label" x="286" y="167">${esc(hanging)}</text>`);
  if (extra) out.push(`<text class="dg-label dg-small" x="40" y="110">${esc(extra)}</text>`);
  out.push('</svg>');
  return out.join('');
}

/** Car towing a trailer along a horizontal road. */
export function towDiagram(car: string, trailer: string): string {
  const out = [head(340, 120)];
  out.push(`<line class="dg-line" x1="10" y1="96" x2="330" y2="96"/>`);
  out.push(`<rect class="dg-shade" x="40" y="62" width="90" height="30" style="stroke:currentColor"/><rect class="dg-shade" x="180" y="52" width="110" height="40" style="stroke:currentColor"/>`);
  out.push(`<line class="dg-line" x1="130" y1="80" x2="180" y2="80"/>`);
  out.push(`<text class="dg-label" x="85" y="54" text-anchor="middle">${esc(trailer)}</text><text class="dg-label" x="235" y="44" text-anchor="middle">${esc(car)}</text>`);
  out.push(arrow(292, 72, 330, 72, 'D'));
  out.push('</svg>');
  return out.join('');
}

/** Forces acting on a particle at given bearings (degrees anticlockwise from positive x). */
export function forceDiagram(forces: { angle: number; label: string }[], showAxes = true): string {
  const out = [head(260, 240)];
  const cx = 130,
    cy = 120;
  if (showAxes) {
    out.push(`<line class="dg-tick dg-dash" x1="30" y1="${cy}" x2="230" y2="${cy}"/><line class="dg-tick dg-dash" x1="${cx}" y1="20" x2="${cx}" y2="220"/>`);
  }
  out.push(`<circle class="dg-point" cx="${cx}" cy="${cy}" r="4"/>`);
  for (const f of forces) {
    const [dx, dy] = polar(70, f.angle);
    out.push(arrow(cx, cy, cx + dx, cy - dy, f.label));
  }
  out.push('</svg>');
  return out.join('');
}

/** Lift with a person inside. */
export function liftDiagram(label: string): string {
  const out = [head(200, 220)];
  out.push(`<line class="dg-line" x1="100" y1="6" x2="100" y2="50"/>`);
  out.push(`<rect class="dg-line" x="50" y="50" width="100" height="140" style="fill:none"/>`);
  out.push(`<circle class="dg-line" cx="100" cy="120" r="9" style="fill:none"/><line class="dg-line" x1="100" y1="129" x2="100" y2="165"/><line class="dg-line" x1="100" y1="165" x2="88" y2="188"/><line class="dg-line" x1="100" y1="165" x2="112" y2="188"/><line class="dg-line" x1="84" y1="142" x2="116" y2="142"/>`);
  out.push(`<text class="dg-label" x="106" y="30">T</text><text class="dg-label dg-small" x="100" y="210" text-anchor="middle">${esc(label)}</text>`);
  out.push('</svg>');
  return out.join('');
}
