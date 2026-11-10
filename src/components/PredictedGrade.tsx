import { gradeTables, predict, type MockResult } from '../lib/grades';
import type { Course } from '../lib/course';
import { href } from '../router';
import { TableWrap } from './bits';

const pct = (f: number) => `${Math.round(100 * f)}%`;

const papersText = (n: number, real: number) => {
  const app = n - real;
  if (!real) return app === 1 ? 'mock paper' : `${app} mock papers`;
  if (!app) return real === 1 ? 'real past paper' : `${real} real past papers`;
  return `${n} papers (${real} real past paper${real === 1 ? '' : 's'}, ${app} app mock${app === 1 ? '' : 's'})`;
};

/** Predicted A level (or AS) grade from the most recent mock papers and real past papers, with the boundaries it uses. */
export function PredictedGrade({ mocks, papers = [], course = 'alevel' }: { mocks: MockResult[]; papers?: MockResult[]; course?: Course }) {
  const t = gradeTables(course);
  const as = course === 'as';
  const oldest = t.list[t.list.length - 1].series.slice(-4),
    newest = t.latest.series.slice(-4);
  const p = predict([...mocks.map((m) => ({ ...m, kind: 'mock' as const })), ...papers.map((m) => ({ ...m, kind: 'paper' as const }))], undefined, course);
  return (
    <section className="card stack" aria-labelledby="predicted-grade">
      <h2 id="predicted-grade">{as ? 'Predicted AS grade' : 'Predicted grade'}</h2>
      {p ? (
        <>
          <div className="row-wrap" style={{ alignItems: 'center' }}>
            <span className="grade-badge" aria-hidden="true">
              {p.grade}
            </span>
            <span className="sr-only">Predicted grade {p.grade}.</span>
            <div className="stack" style={{ gap: 4, flex: 1 }}>
              <span>
                <strong>{pct(p.frac)}</strong> of the marks on your last {papersText(p.papers, p.real)} ({p.marks} marks).
              </span>
              <span className="muted small">
                Grade {p.grade} on {t.latest.series} {as ? 'AS ' : ''}boundaries
                {p.range[0] !== p.range[1] ? `; ${p.range[0]} to ${p.range[1]} on the boundaries of ${oldest}–${newest}` : `, and on every year from ${oldest}`}.
              </span>
              {p.next && (
                <span className="small">
                  For {p.next.grade === 'A' || p.next.grade === 'A*' || p.next.grade === 'E' ? 'an' : 'a'} {p.next.grade}: about {Math.ceil(100 * p.next.gap)} more marks per 100.
                </span>
              )}
            </div>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            {p.real === p.papers ? 'A guide only: boundaries change every year.' : "A guide only: app mocks are built from this app's questions, not real papers, and boundaries change every year."}
          </p>
        </>
      ) : (
        <p className="muted">
          Finish {as ? 'an AS' : 'a'} <a href={href('/exams')}>mock paper</a>, or <a href={href('/past-papers')}>enter your marks for a real {as ? 'AS' : 'A level'} past paper</a>, to get a predicted grade. It uses your most recent papers ({as ? 'up to both AS papers' : 'up to three full papers'}) and real {t.code} grade boundaries.
        </p>
      )}
      <details>
        <summary className="small">Grade boundaries used (out of {t.full})</summary>
        <TableWrap label="Grade boundaries">
          <table className="data">
            <caption className="sr-only">{as ? '8MA0 AS' : '9MA0 A level'} Mathematics overall grade boundaries</caption>
            <thead>
              <tr>
                <th scope="col">Series</th>
                {t.grades.map((g) => (
                  <th scope="col" key={g}>
                    {g}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.list.map((b) => (
                <tr key={b.series}>
                  <th scope="row">{b.series}</th>
                  {t.grades.map((g) => (
                    <td key={g}>
                      {(b.marks as Record<string, number>)[g]} <span className="muted small">({pct((b.marks as Record<string, number>)[g] / b.max)})</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="muted small">{as ? "Source: Pearson's published GCE grade boundaries (June 2023–2026)." : "Sources: Pearson's published grade boundaries (June 2026); Cognito and Maths Genie grade-boundary tables (2023–2025)."}</p>
      </details>
    </section>
  );
}
