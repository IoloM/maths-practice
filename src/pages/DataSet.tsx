import { useMemo, useRef, useState } from 'react';
import { QUALIFICATION_PAGE } from '../content/booklet';
import { readFile, relation, sample, saveData, savedData, summary, values, type LdsData, type Sheet, type Summary } from '../lib/lds';
import { href } from '../router';
import { TableWrap } from '../components/bits';
import { Icon } from '../components/Icon';

const f = (x: number, dp = 2) => (Number.isInteger(x) ? String(x) : x.toFixed(dp));
/** Units from the end of a heading such as "Daily Mean Temperature (0900-0900) (°C)". */
const short = (v: string) => v.replace(/^Daily\s+/i, '').replace(/\s*\(\d{4}-\d{4}\)/g, '');

/** Box plots on one scale: one per group, outliers as crosses. */
function BoxPlots({ groups, label }: { groups: { name: string; s: Summary }[]; label: string }) {
  const W = 640,
    L = 110,
    R = 16,
    row = 54;
  const H = 30 + groups.length * row;
  const lo = Math.min(...groups.map((g) => g.s.min)),
    hi = Math.max(...groups.map((g) => g.s.max));
  const pad = (hi - lo) * 0.04 || 1;
  const x = (v: number) => L + ((W - L - R) * (v - lo + pad)) / (hi - lo + 2 * pad);
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Box plots of ${label}: ${groups.map((g) => `${g.name} median ${f(g.s.median)}, quartiles ${f(g.s.q1)} and ${f(g.s.q3)}, range ${f(g.s.min)} to ${f(g.s.max)}`).join('; ')}`}>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={x(t)} x2={x(t)} y1={6} y2={H - 22} stroke="var(--border)" strokeDasharray="3 4" />
          <text x={x(t)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-2)">
            {f(t, 1)}
          </text>
        </g>
      ))}
      {groups.map((g, i) => {
        const y = 14 + i * row,
          h = 26,
          m = y + h / 2;
        const iqr = g.s.q3 - g.s.q1;
        const inside = (v: number) => v >= g.s.q1 - 1.5 * iqr && v <= g.s.q3 + 1.5 * iqr;
        const wl = Math.min(...[g.s.min, g.s.q1].filter(inside)),
          wh = Math.max(...[g.s.max, g.s.q3].filter(inside));
        return (
          <g key={g.name}>
            <text x={L - 8} y={m + 4} textAnchor="end" fontSize="12" fill="var(--text)">
              {g.name}
            </text>
            <line x1={x(wl)} x2={x(g.s.q1)} y1={m} y2={m} stroke="var(--text-2)" strokeWidth="2" />
            <line x1={x(g.s.q3)} x2={x(wh)} y1={m} y2={m} stroke="var(--text-2)" strokeWidth="2" />
            <line x1={x(wl)} x2={x(wl)} y1={y + 6} y2={y + h - 6} stroke="var(--text-2)" strokeWidth="2" />
            <line x1={x(wh)} x2={x(wh)} y1={y + 6} y2={y + h - 6} stroke="var(--text-2)" strokeWidth="2" />
            <rect x={x(g.s.q1)} y={y} width={Math.max(1, x(g.s.q3) - x(g.s.q1))} height={h} rx="4" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
            <line x1={x(g.s.median)} x2={x(g.s.median)} y1={y} y2={y + h} stroke="var(--accent)" strokeWidth="3" />
            {[...new Set(g.s.outliers)].map((o) => (
              <text key={o} x={x(o)} y={m + 4} textAnchor="middle" fontSize="12" fill="var(--text)">
                ×
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function Scatter({ rel, xl, yl }: { rel: NonNullable<ReturnType<typeof relation>>; xl: string; yl: string }) {
  const W = 640,
    H = 300,
    L = 46,
    R = 12,
    T = 10,
    B = 34;
  const xs = rel.pts.map((p) => p[0]),
    ys = rel.pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sx = (v: number) => L + ((W - L - R) * (v - x0)) / (x1 - x0 || 1);
  const sy = (v: number) => T + (H - T - B) * (1 - (v - y0) / (y1 - y0 || 1));
  return (
    <svg className="trend" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Scatter diagram of ${yl} against ${xl}: ${rel.pts.length} days, product moment correlation coefficient ${rel.r.toFixed(3)}.`}>
      <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--border-strong)" />
      <line x1={L} x2={L} y1={T} y2={H - B} stroke="var(--border-strong)" />
      {[x0, x1].map((v) => (
        <text key={`x${v}`} x={sx(v)} y={H - B + 16} textAnchor="middle" fontSize="11" fill="var(--text-2)">
          {f(v, 1)}
        </text>
      ))}
      {[y0, y1].map((v) => (
        <text key={`y${v}`} x={L - 6} y={sy(v) + 4} textAnchor="end" fontSize="11" fill="var(--text-2)">
          {f(v, 1)}
        </text>
      ))}
      <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle" fontSize="11" fill="var(--text-2)">
        {xl}
      </text>
      {rel.pts.map(([x, y], i) => (
        <circle key={i} cx={sx(x)} cy={sy(y)} r="3.5" fill="var(--accent)" fillOpacity="0.55" />
      ))}
      <line x1={sx(x0)} x2={sx(x1)} y1={sy(rel.a + rel.b * x0)} y2={sy(rel.a + rel.b * x1)} stroke="var(--text)" strokeWidth="2" />
    </svg>
  );
}

function Loader({ onData }: { onData: (d: LdsData) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  return (
    <section className="card stack">
      <h2>Open the large data set</h2>
      <ol className="tips">
        <li>
          Download the large data set (an Excel file) from{' '}
          <a href={QUALIFICATION_PAGE} target="_blank" rel="noreferrer">
            Pearson’s A level Maths page
          </a>{' '}
          — it’s under <b>Course materials</b> — or ask your teacher for it.
        </li>
        <li>Open it here. It stays on this device: nothing is uploaded.</li>
      </ol>
      <input
        ref={ref}
        type="file"
        accept=".xls,.xlsx,.ods,.csv"
        className="sr-only"
        aria-label="Large data set file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setProblem(null);
          try {
            const d = await readFile(file);
            if (!d) setProblem('No weather data found in that file. Each sheet needs a “Date” column.');
            else {
              saveData(d);
              onData(d);
            }
          } catch {
            setProblem('That file couldn’t be read. Try the Excel file from Pearson.');
          } finally {
            setBusy(false);
            e.target.value = '';
          }
        }}
      />
      <div className="btn-row">
        <button className="btn btn-primary" onClick={() => ref.current?.click()} disabled={busy}>
          <Icon name="upload" /> {busy ? 'Reading…' : 'Open the file'}
        </button>
      </div>
      {problem && <p className="error-text">{problem}</p>}
    </section>
  );
}

/** Explore the large data set: summaries, box plots, scatter diagrams with the PMCC, and sampling. */
export function DataSet() {
  const [data, setData] = useState<LdsData | null>(() => savedData());
  const stations = useMemo(() => [...new Set(data?.sheets.map((s) => s.station) ?? [])], [data]);
  const years = useMemo(() => [...new Set(data?.sheets.map((s) => s.year) ?? [])].sort(), [data]);
  const [station, setStation] = useState('');
  const [year, setYear] = useState('all');
  const [variable, setVariable] = useState('');
  const [compare, setCompare] = useState('');
  const [yVar, setYVar] = useState('');
  const [trace0, setTrace0] = useState(true);
  const [k, setK] = useState(20);
  const [seed, setSeed] = useState(1);
  const [kind, setKind] = useState<'random' | 'systematic'>('random');

  if (!data)
    return (
      <div className="stack">
        <Head />
        <Loader onData={setData} />
      </div>
    );

  const st = station || stations[0];
  const v = variable || data.variables.find((x) => /temp/i.test(x)) || data.variables[0];
  const pick = (name: string): Sheet[] => data.sheets.filter((s) => s.station === name && (year === 'all' || String(s.year) === year));
  const sheets = pick(st);
  const vals = values(sheets, v, trace0);
  const sum = summary(vals.xs);
  const other = compare ? summary(values(pick(compare), v, trace0).xs) : null;
  const yv = yVar || data.variables.find((x) => x !== v) || v;
  const rel = relation(sheets, v, yv, trace0);
  const days = sheets.flatMap((s) => s.dates.map((d, i) => ({ d, v: s.cols[v]?.[i] ?? null })));
  const chosen = sample(days.length, k, kind, seed).map((i) => days[i]);
  const sampleXs = chosen.flatMap((c) => (c.v === null ? [] : c.v === 'tr' ? (trace0 ? [0] : []) : [c.v]));
  const sampleMean = sampleXs.length ? sampleXs.reduce((t, x) => t + x, 0) / sampleXs.length : null;
  const where = `${st}${year === 'all' ? '' : ` ${year}`}`;

  return (
    <div className="stack">
      <Head />
      <p className="small muted" style={{ margin: 0 }}>
        From <b>{data.file}</b>: {data.sheets.length} station-years.{' '}
        <button
          className="btn btn-small btn-ghost"
          onClick={() => {
            saveData(null);
            setData(null);
          }}
        >
          Use a different file
        </button>
      </p>
      <div className="row-wrap card lds-controls">
        <label className="row">
          Station
          <select value={st} onChange={(e) => setStation(e.target.value)}>
            {stations.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="row">
          Year
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="all">Both</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label className="row">
          Variable
          <select value={v} onChange={(e) => setVariable(e.target.value)}>
            {data.variables.map((x) => (
              <option key={x} value={x}>
                {short(x)}
              </option>
            ))}
          </select>
        </label>
        <label className="row small">
          <input type="checkbox" checked={trace0} onChange={(e) => setTrace0(e.target.checked)} /> Count “tr” (trace) as 0
        </label>
      </div>

      <section className="card stack" aria-labelledby="lds-summary">
        <h2 id="lds-summary">
          {short(v)} at {where}
        </h2>
        {sum ? (
          <>
            <TableWrap label="Summary statistics">
              <table className="data">
                <tbody>
                  <tr>
                    <th scope="row">Days with data</th>
                    <td>
                      {sum.n} <span className="muted small">({vals.missing} n/a{vals.trace ? `, ${vals.trace} tr` : ''})</span>
                    </td>
                    <th scope="row">Mean</th>
                    <td>{f(sum.mean)}</td>
                    <th scope="row">Standard deviation (σ)</th>
                    <td>{f(sum.sd)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Minimum</th>
                    <td>{f(sum.min)}</td>
                    <th scope="row">Lower quartile</th>
                    <td>{f(sum.q1)}</td>
                    <th scope="row">Median</th>
                    <td>{f(sum.median)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Upper quartile</th>
                    <td>{f(sum.q3)}</td>
                    <th scope="row">Maximum</th>
                    <td>{f(sum.max)}</td>
                    <th scope="row">Outliers (1.5 × IQR)</th>
                    <td>{sum.outliers.length ? [...new Set(sum.outliers)].slice(0, 6).map((o) => f(o)).join(', ') + (new Set(sum.outliers).size > 6 ? ' …' : '') : 'none'}</td>
                  </tr>
                </tbody>
              </table>
            </TableWrap>
            <label className="row small">
              Compare with
              <select value={compare} onChange={(e) => setCompare(e.target.value)}>
                <option value="">—</option>
                {stations
                  .filter((s) => s !== st)
                  .map((s) => (
                    <option key={s}>{s}</option>
                  ))}
              </select>
            </label>
            <BoxPlots groups={[{ name: st, s: sum }, ...(other ? [{ name: compare, s: other }] : [])]} label={short(v)} />
            {other && (
              <p className="small" style={{ margin: 0 }}>
                {compare}: mean {f(other.mean)}, σ {f(other.sd)}, median {f(other.median)}, IQR {f(other.q3 - other.q1)} — against {st}: mean {f(sum.mean)}, σ {f(sum.sd)}, median {f(sum.median)}, IQR {f(sum.q3 - sum.q1)}.
              </p>
            )}
          </>
        ) : (
          <p className="muted">Not enough data for this choice.</p>
        )}
      </section>

      <section className="card stack" aria-labelledby="lds-rel">
        <h2 id="lds-rel">Is there a relationship?</h2>
        <label className="row">
          Against
          <select value={yv} onChange={(e) => setYVar(e.target.value)}>
            {data.variables
              .filter((x) => x !== v)
              .map((x) => (
                <option key={x} value={x}>
                  {short(x)}
                </option>
              ))}
          </select>
        </label>
        {rel ? (
          <>
            <Scatter rel={rel} xl={short(v)} yl={short(yv)} />
            <p className="small" style={{ margin: 0 }}>
              {rel.pts.length} days · PMCC <b>r = {rel.r.toFixed(3)}</b> · regression line <b>y = {f(rel.a, 3)} {rel.b < 0 ? '−' : '+'} {f(Math.abs(rel.b), 3)}x</b> (y: {short(yv)}, x: {short(v)})
            </p>
          </>
        ) : (
          <p className="muted small">Not enough days with both values.</p>
        )}
      </section>

      <section className="card stack" aria-labelledby="lds-sample">
        <h2 id="lds-sample">Take a sample</h2>
        <div className="row-wrap">
          <label className="row">
            Days
            <input type="number" min={2} max={days.length} value={k} onChange={(e) => setK(Math.max(2, Math.min(days.length, Math.round(Number(e.target.value) || 2))))} style={{ width: '5em' }} />
          </label>
          <label className="row">
            <input type="radio" name="kind" checked={kind === 'random'} onChange={() => setKind('random')} /> Simple random
          </label>
          <label className="row">
            <input type="radio" name="kind" checked={kind === 'systematic'} onChange={() => setKind('systematic')} /> Systematic (every {Math.floor(days.length / Math.max(1, k))}th day)
          </label>
          <button className="btn btn-small" onClick={() => setSeed((s) => s + 1)}>
            <Icon name="refresh" /> Another sample
          </button>
        </div>
        <p className="small" style={{ margin: 0 }} aria-live="polite">
          Sample mean <b>{sampleMean === null ? '–' : f(sampleMean)}</b> from {sampleXs.length} days with data, against the mean of all {sum?.n ?? 0} days: <b>{sum ? f(sum.mean) : '–'}</b>.
        </p>
        <details>
          <summary className="small">The days chosen</summary>
          <p className="small">{chosen.map((c) => `${c.d.slice(8)}/${c.d.slice(5, 7)}/${c.d.slice(2, 4)}: ${c.v ?? 'n/a'}`).join(' · ')}</p>
        </details>
      </section>
    </div>
  );
}

function Head() {
  return (
    <div>
      <h1>Large data set explorer</h1>
      <p className="muted">
        Explore the Met Office weather data used in Paper 3: summaries, box plots, scatter diagrams and sampling, for any station and year. Know it well — questions use extracts and expect you to know its quirks.{' '}
        <a href={href('/practice', { t: 'fx.lds.period,fx.lds.trace,fx.lds.na,fx.lds.cloud-units,fx.lds.knots-conversion,fx.lds.perth-season,fx.lds.sampling-frame' })}>Practise large data set questions</a>
      </p>
    </div>
  );
}
