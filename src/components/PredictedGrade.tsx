import { BOUNDARIES, GRADES, LATEST, predict, type MockResult } from '../lib/grades';
import { href } from '../router';
import { TableWrap } from './bits';

const pct = (f: number) => `${Math.round(100 * f)}%`;

/** Predicted A level grade from the most recent mock papers, with the boundaries it uses. */
export function PredictedGrade({ mocks }: { mocks: MockResult[] }) {
  const p = predict(mocks);
  return (
    <section className="card stack" aria-labelledby="predicted-grade">
      <h2 id="predicted-grade">Predicted grade</h2>
      {p ? (
        <>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <span className="grade-badge" aria-hidden="true">
              {p.grade}
            </span>
            <span className="sr-only">Predicted grade {p.grade}.</span>
            <div className="stack" style={{ gap: 4, flex: 1 }}>
              <span>
                <strong>{pct(p.frac)}</strong> of the marks on your last {p.papers === 1 ? 'mock paper' : `${p.papers} mock papers`} ({p.marks} marks).
              </span>
              <span className="muted small">
                Grade {p.grade} on {LATEST.series} boundaries
                {p.range[0] !== p.range[1] ? `; ${p.range[0]} to ${p.range[1]} on the boundaries of ${BOUNDARIES[BOUNDARIES.length - 1].series.slice(-4)}–${LATEST.series.slice(-4)}` : `, and on every year from ${BOUNDARIES[BOUNDARIES.length - 1].series.slice(-4)}`}.
              </span>
              {p.next && (
                <span className="small">
                  For an {p.next.grade}: about {Math.ceil(100 * p.next.gap)} more marks per 100.
                </span>
              )}
            </div>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            A guide only: the mock papers are built from this app's questions, not real papers, and boundaries change every year.
          </p>
        </>
      ) : (
        <p className="muted">
          Finish a <a href={href('/exams')}>mock paper</a> to get a predicted grade. It uses your most recent mocks (up to three full papers) and real 9MA0 grade boundaries.
        </p>
      )}
      <details>
        <summary className="small">Grade boundaries used (out of 300)</summary>
        <TableWrap label="Grade boundaries">
          <table className="data">
            <caption className="sr-only">9MA0 A level Mathematics overall grade boundaries</caption>
            <thead>
              <tr>
                <th scope="col">Series</th>
                {GRADES.map((g) => (
                  <th scope="col" key={g}>
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOUNDARIES.map((b) => (
                <tr key={b.series}>
                  <th scope="row">{b.series}</th>
                  {GRADES.map((g) => (
                    <td key={g}>
                      {b.marks[g]} <span className="muted small">({pct(b.marks[g] / b.max)})</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="muted small">Sources: Pearson's published grade boundaries (June 2026); Cognito and Maths Genie grade-boundary tables (2023–2025).</p>
      </details>
    </section>
  );
}
