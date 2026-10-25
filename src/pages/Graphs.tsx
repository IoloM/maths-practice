import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { compile, keyPoints, niceStep, show, trace, type Compiled, type View } from '../lib/graphs';
import { TableWrap } from '../components/bits';
import { Icon } from '../components/Icon';

/** Three series at most: the first three categorical colours are distinguishable together in both themes. */
const MAX = 3;
const COLOURS = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)'];
const HOME: View = { x0: -10, x1: 10, y0: -7, y1: 7 };
const PRESETS: { name: string; fs: string[]; p?: Record<string, number> }[] = [
  {
    name: 'Transformations of sin',
    fs: ['y = a sin(bx + c) + d', 'y = sin(x)'],
    p: { a: 2, b: 1, c: 0, d: 0 },
  },
  {
    name: 'Completing the square',
    fs: ['y = (x + p)^2 + q'],
    p: { p: -2, q: -3 },
  },
  {
    name: 'Quadratic and a line',
    fs: ['y = x^2 - 4', 'y = mx + c'],
    p: { m: 1, c: 0 },
  },
  {
    name: 'Exponential growth and decay',
    fs: ['y = A e^(kx)'],
    p: { A: 1, k: 0.5 },
  },
  { name: 'ln and eˣ are inverses', fs: ['y = e^x', 'y = ln(x)', 'y = x'] },
  { name: 'Modulus', fs: ['y = |ax + b|', 'y = ax + b'], p: { a: 2, b: -3 } },
  { name: 'Reciprocal graphs', fs: ['y = k/x', 'y = k/x^2'], p: { k: 1 } },
  {
    name: 'Cubic with roots',
    fs: ['y = (x - a)(x - b)(x - c)'],
    p: { a: -2, b: 1, c: 3 },
  },
];

export function Graphs() {
  const [srcs, setSrcs] = useState<string[]>(PRESETS[0].fs);
  const [params, setParams] = useState<Record<string, number>>(PRESETS[0].p ?? {});
  const [view, setView] = useState<View>(HOME);
  const [hover, setHover] = useState<number | null>(null);
  const drag = useRef<{ x: number; y: number; v: View } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const compiled = useMemo(
    () =>
      srcs.map((s): Compiled | string | null => {
        if (!s.trim()) return null;
        try {
          return compile(s);
        } catch (e) {
          return e instanceof Error ? e.message : 'Can’t read that';
        }
      }),
    [srcs],
  );
  const ok = compiled.map((c, i) => (c && typeof c !== 'string' ? { i, c } : null)).filter((x): x is { i: number; c: Compiled } => x !== null);
  const names = [...new Set(ok.flatMap(({ c }) => c.params))];
  const p = Object.fromEntries(names.map((n) => [n, params[n] ?? 1]));
  const fns = ok.map(
    ({ c }) =>
      (x: number) =>
        c.f(x, p),
  );
  const pts = useMemo(() => keyPoints(fns, view), [srcs, JSON.stringify(p), view]); // eslint-disable-line react-hooks/exhaustive-deps

  const W = 640,
    H = 440;
  const sx = (x: number) => (W * (x - view.x0)) / (view.x1 - view.x0);
  const sy = (y: number) => H - (H * (y - view.y0)) / (view.y1 - view.y0);
  const fromPx = (px: number, py: number) => [view.x0 + ((view.x1 - view.x0) * px) / W, view.y0 + ((view.y1 - view.y0) * (H - py)) / H];
  const gx = niceStep(view.x1 - view.x0),
    gy = niceStep(view.y1 - view.y0);
  const grid = (lo: number, hi: number, step: number) => Array.from({ length: Math.floor(hi / step) - Math.ceil(lo / step) + 1 }, (_, k) => (Math.ceil(lo / step) + k) * step);
  const zoom = (s: number) => {
    const cx = (view.x0 + view.x1) / 2,
      cy = (view.y0 + view.y1) / 2;
    setView({
      x0: cx - (cx - view.x0) * s,
      x1: cx + (view.x1 - cx) * s,
      y0: cy - (cy - view.y0) * s,
      y1: cy + (view.y1 - cy) * s,
    });
  };
  const local = (e: PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height];
  };
  const kinds: Record<string, string> = {
    root: 'Root',
    'y-intercept': 'y-intercept',
    maximum: 'Maximum',
    minimum: 'Minimum',
    intersection: 'Crossing',
  };
  const label = (i: number) => srcs[i].trim() || `f${i + 1}`;

  return (
    <div className="stack">
      <div>
        <h1>Graph plotter</h1>
        <p className="muted">
          Type up to three functions of <i>x</i> (radians). Any other letter becomes a slider, so you can watch transformations happen. Drag to move around; the key points are worked out for you.
        </p>
      </div>
      <div className="row-wrap small">
        <span className="muted">Try:</span>
        {PRESETS.map((pr) => (
          <button
            key={pr.name}
            className="btn btn-small"
            onClick={() => {
              setSrcs(pr.fs);
              setParams(pr.p ?? {});
              setView(HOME);
            }}
          >
            {pr.name}
          </button>
        ))}
      </div>
      <div className="graph-layout">
        <section className="card stack graph-fns" aria-label="Functions">
          {srcs.map((s, i) => {
            const c = compiled[i];
            return (
              <div key={i} className="row graph-fn">
                <span className="graph-swatch" style={{ background: COLOURS[i] }} aria-hidden="true" />
                <label className="sr-only" htmlFor={`fn-${i}`}>
                  Function {i + 1}
                </label>
                <input
                  id={`fn-${i}`}
                  type="text"
                  value={s}
                  spellCheck={false}
                  autoCapitalize="off"
                  placeholder="e.g. y = x^2 - 3x + 2"
                  onChange={(e) => setSrcs(srcs.map((x, j) => (j === i ? e.target.value : x)))}
                  aria-invalid={typeof c === 'string'}
                  aria-describedby={typeof c === 'string' ? `fn-err-${i}` : undefined}
                />
                {srcs.length > 1 && (
                  <button className="btn btn-small btn-ghost" onClick={() => setSrcs(srcs.filter((_, j) => j !== i))} aria-label={`Remove function ${i + 1}`}>
                    <Icon name="x" />
                  </button>
                )}
                {typeof c === 'string' && (
                  <span id={`fn-err-${i}`} className="error-text small">
                    {c}
                  </span>
                )}
              </div>
            );
          })}
          {srcs.length < MAX && (
            <div>
              <button className="btn btn-small" onClick={() => setSrcs([...srcs, ''])}>
                Add a function
              </button>
            </div>
          )}
          {names.map((n) => (
            <label key={n} className="row graph-slider">
              <span className="graph-param">{n}</span>
              <input type="range" min={-10} max={10} step={0.1} value={p[n]} onChange={(e) => setParams({ ...params, [n]: Number(e.target.value) })} aria-label={`${n} value`} />
              <input type="number" step={0.1} value={p[n]} onChange={(e) => setParams({ ...params, [n]: Number(e.target.value) || 0 })} aria-label={`${n} exact value`} style={{ width: '5.5em' }} />
            </label>
          ))}
        </section>
        <div className="stack graph-main">
          <div className="graph-box">
            <svg
              ref={svgRef}
              className="graph"
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`Graph of ${ok.map(({ i }) => label(i)).join('; ') || 'nothing yet'}, x from ${show(view.x0)} to ${show(view.x1)}. Key points are listed below.`}
              onPointerDown={(e) => {
                (e.target as Element).setPointerCapture?.(e.pointerId);
                const [x, y] = local(e);
                drag.current = { x, y, v: view };
              }}
              onPointerMove={(e) => {
                const [x, y] = local(e);
                if (drag.current) {
                  const d = drag.current;
                  const dx = ((x - d.x) * (d.v.x1 - d.v.x0)) / W,
                    dy = ((y - d.y) * (d.v.y1 - d.v.y0)) / H;
                  setView({
                    x0: d.v.x0 - dx,
                    x1: d.v.x1 - dx,
                    y0: d.v.y0 + dy,
                    y1: d.v.y1 + dy,
                  });
                } else setHover(fromPx(x, y)[0]);
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerLeave={() => {
                drag.current = null;
                setHover(null);
              }}
            >
              {grid(view.x0, view.x1, gx).map((x) => (
                <g key={`gx${x}`}>
                  <line x1={sx(x)} x2={sx(x)} y1={0} y2={H} stroke="var(--border)" />
                  {Math.abs(x) > gx / 2 && sx(x) > 14 && sx(x) < W - 14 && (
                    <text x={sx(x)} y={Math.min(H - 4, Math.max(12, sy(0) + 14))} textAnchor="middle" fontSize="11" fill="var(--text-2)">
                      {show(x)}
                    </text>
                  )}
                </g>
              ))}
              {grid(view.y0, view.y1, gy).map((y) => (
                <g key={`gy${y}`}>
                  <line x1={0} x2={W} y1={sy(y)} y2={sy(y)} stroke="var(--border)" />
                  {Math.abs(y) > gy / 2 && sy(y) > 10 && sy(y) < H - 10 && (
                    <text x={Math.min(W - 4, Math.max(4, sx(0) - 6))} y={sy(y) + 4} textAnchor={sx(0) < 30 ? 'start' : 'end'} fontSize="11" fill="var(--text-2)">
                      {show(y)}
                    </text>
                  )}
                </g>
              ))}
              <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} stroke="var(--text-2)" strokeWidth="1.5" />
              <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} stroke="var(--text-2)" strokeWidth="1.5" />
              {ok.map(({ i }, k) =>
                trace(fns[k], view).map((seg, j) => <polyline key={`${i}-${j}`} points={seg.map(([x, y]) => `${sx(x).toFixed(1)},${sy(y).toFixed(1)}`).join(' ')} fill="none" stroke={COLOURS[i]} strokeWidth="2.5" strokeLinejoin="round" />),
              )}
              {pts.map((pt, k) => (
                <circle key={k} cx={sx(pt.x)} cy={sy(pt.y)} r="4" fill="var(--surface)" stroke="var(--text)" strokeWidth="2" />
              ))}
              {hover !== null && <line x1={sx(hover)} x2={sx(hover)} y1={0} y2={H} stroke="var(--text-2)" strokeDasharray="3 3" />}
            </svg>
            {hover !== null && ok.length > 0 && (
              <div
                className="chart-tip small"
                style={{
                  left: `${Math.min(80, Math.max(20, (100 * sx(hover)) / W))}%`,
                }}
              >
                x = {show(hover)}
                {ok.map(({ i }, k) => (
                  <div key={i}>
                    <span className="graph-swatch" style={{ background: COLOURS[i] }} /> {Number.isFinite(fns[k](hover)) ? show(fns[k](hover)) : 'undefined'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="btn-row">
            <button className="btn btn-small" onClick={() => zoom(0.5)}>
              Zoom in
            </button>
            <button className="btn btn-small" onClick={() => zoom(2)}>
              Zoom out
            </button>
            <button className="btn btn-small" onClick={() => setView(HOME)}>
              <Icon name="refresh" /> Reset view
            </button>
          </div>
        </div>
      </div>
      <section className="card" aria-labelledby="key-points">
        <h2 id="key-points">Key points</h2>
        {pts.length ? (
          <TableWrap label="Key points table">
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">Point</th>
                  <th scope="col">On</th>
                  <th scope="col">x</th>
                  <th scope="col">y</th>
                </tr>
              </thead>
              <tbody>
                {pts.map((pt, k) => (
                  <tr key={k}>
                    <th scope="row">{kinds[pt.kind]}</th>
                    <td className="small">{pt.of.map((j) => label(ok[j].i)).join(' and ')}</td>
                    <td>{show(pt.x)}</td>
                    <td>{show(pt.y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <p className="muted small">None in view.</p>
        )}
        <p className="muted small">Worked out numerically, to 3 decimal places: use them to check your algebra, not instead of it.</p>
      </section>
    </div>
  );
}
