import { useState } from 'react';
import { GRADES, LATEST, gradeFor, needed, predict, type MockResult } from '../lib/grades';
import { TableWrap } from './bits';

export interface PaperPoint extends MockResult {
  label: string;
  kind: 'mock' | 'paper';
}

const pct = (f: number) => `${Math.round(100 * f)}%`;
const day = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * Every finished paper in order (real past papers as filled circles, app mocks as hollow squares),
 * the predicted grade after each one as a line, and the grade boundaries behind them.
 */
export function GradeChart({ points }: { points: PaperPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = [...points].sort((a, b) => a.finishedAt - b.finishedAt);
  if (!pts.length) return null;
  const pred = pts.map((_, i) => predict(pts.slice(0, i + 1))!);
  const W = 640,
    H = 240,
    L = 40,
    R = 44,
    T = 12,
    B = 28;
  const lo = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.got / p.of), needed('C')) * 10) / 10 - 0.05);
  const x = (i: number) => (pts.length === 1 ? (L + W - R) / 2 : L + ((W - L - R) * i) / (pts.length - 1));
  const y = (f: number) => T + (H - T - B) * (1 - (f - lo) / (1 - lo));
  const line = pred.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.frac).toFixed(1)}`).join(' ');
  const last = pred[pred.length - 1];
  const summary = `${pts.length} paper${pts.length === 1 ? '' : 's'}. Latest: ${pts[pts.length - 1].label}, ${pct(pts[pts.length - 1].got / pts[pts.length - 1].of)}. Predicted grade now ${last.grade} (${pct(last.frac)}).`;
  const shown = GRADES.filter((g) => needed(g) >= lo);
  const h = hover === null ? null : pts[hover];
  return (
    <figure className="grade-chart" style={{ margin: 0 }}>
      <div className="chart-legend small" aria-hidden="true">
        <span>
          <svg width="12" height="12">
            <circle cx="6" cy="6" r="5" fill="var(--accent)" />
          </svg>{' '}
          Real past paper
        </span>
        <span>
          <svg width="12" height="12">
            <rect x="1.5" y="1.5" width="9" height="9" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          </svg>{' '}
          App mock
        </span>
        <span>
          <svg width="18" height="12">
            <line x1="0" x2="18" y1="6" y2="6" stroke="var(--text)" strokeWidth="2" />
          </svg>{' '}
          Predicted grade
        </span>
      </div>
      <div className="chart-box">
        <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={summary} onMouseLeave={() => setHover(null)}>
          {shown.map((g) => (
            <g key={g}>
              <line x1={L} x2={W - R} y1={y(needed(g))} y2={y(needed(g))} stroke="var(--border)" strokeDasharray="4 4" />
              <text x={W - R + 16} y={y(needed(g)) + 4} fontSize="11" fill="var(--text-2)">
                {g}
              </text>
            </g>
          ))}
          {[lo, 1].map((f) => (
            <text key={f} x={L - 6} y={y(f) + 4} textAnchor="end" fontSize="11" fill="var(--text-2)">
              {pct(f)}
            </text>
          ))}
          {pts.length > 1 && <path d={line} fill="none" stroke="var(--text)" strokeWidth="2" />}
          {pts.map((p, i) => {
            const cx = x(i),
              cy = y(p.got / p.of);
            return (
              <g key={i} role="img" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${p.label}, ${day(p.finishedAt)}: ${pct(p.got / p.of)}, predicted ${pred[i].grade} after it`}>
                <rect x={cx - 14} y={T} width="28" height={H - T - B} fill="transparent" />
                {p.kind === 'paper' ? (
                  <circle cx={cx} cy={cy} r="6" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
                ) : (
                  <rect x={cx - 5} y={cy - 5} width="10" height="10" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
                )}
              </g>
            );
          })}
          {pts.length <= 12 &&
            pts.map((p, i) => (
              <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-2)">
                {day(p.finishedAt)}
              </text>
            ))}
        </svg>
        {h && hover !== null && (
          <div className="chart-tip small" style={{ left: `${(100 * x(hover)) / W}%` }} role="status">
            <b>{h.label}</b>
            <br />
            {day(h.finishedAt)} · {h.got}/{h.of} ({pct(h.got / h.of)}, about {gradeFor(h.got / h.of)})
            <br />
            Predicted grade after it: <b>{pred[hover].grade}</b>
          </div>
        )}
      </div>
      <figcaption className="small muted">Dashed lines: {LATEST.series} grade boundaries. The prediction uses your last 300 marks of papers.</figcaption>
      <details>
        <summary className="small">Show as a table</summary>
        <TableWrap label="Papers over time">
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Paper</th>
                <th scope="col">Score</th>
                <th scope="col">Predicted after</th>
              </tr>
            </thead>
            <tbody>
              {pts.map((p, i) => (
                <tr key={i}>
                  <td>{day(p.finishedAt)}</td>
                  <th scope="row">{p.label}</th>
                  <td>
                    {p.got}/{p.of} ({pct(p.got / p.of)})
                  </td>
                  <td>
                    {pred[i].grade} ({pct(pred[i].frac)})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </details>
    </figure>
  );
}
