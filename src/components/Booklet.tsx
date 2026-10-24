/** The exam formula booklet and statistical tables, shared by the Formulae page and the booklet pop-up. */
import { useState, type MouseEvent } from 'react';
import { binomCdf, invPhi, pmccCritical } from '../engine/stats/distributions';
import { MECH, PURE, QUALIFICATION_PAGE, SPECIFICATION, STATS, type FormulaGroup } from '../content/booklet';
import { CALCULATOR } from '../content/calculator';
import { FLASHCARDS } from '../content/flashcards';
import { MathText } from './MathText';
import { TableWrap } from './bits';

const BIN_N = [5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50];
const PS = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
const NORMAL_P = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.975, 0.99, 0.995, 0.9975, 0.999, 0.9995];
const PMCC_N = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const PMCC_A = [0.1, 0.05, 0.025, 0.01, 0.005];

export function Formulae({ groups, level = 2 }: { groups: FormulaGroup[]; level?: 2 | 3 | 4 }) {
  const H = `h${level}` as 'h2';
  return (
    <div className="stack">
      {groups.map((g) => (
        <section className="card" key={g.h}>
          <H className="h3">{g.h}</H>
          {g.f.map(([label, tex], i) => (
            <div className="formula" key={i}>
              {label && (
                <div className="small muted">
                  <MathText src={label} inline />
                </div>
              )}
              <MathText src={tex} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export function BinomialTable() {
  const [n, setN] = useState(10);
  const rows = Array.from({ length: n }, (_, x) => x).filter((x) => PS.some((p) => binomCdf(n, p, x) < 0.99995));
  return (
    <div className="stack">
      <label className="row">
        n ={' '}
        <select value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Number of trials n">
          {BIN_N.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <TableWrap label="Binomial table">
        <table className="data">
          <caption>
            Cumulative binomial probabilities P(X ≤ x) for X ~ B({n}, p)
          </caption>
          <thead>
            <tr>
              <th scope="col">x</th>
              {PS.map((p) => (
                <th scope="col" key={p}>
                  p = {p.toFixed(2)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x}>
                <th scope="row">{x}</th>
                {PS.map((p) => (
                  <td key={p}>{binomCdf(n, p, x).toFixed(4)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}

export function NormalTable() {
  return (
    <TableWrap label="Normal table">
      <table className="data">
        <caption>Percentage points of the standard normal distribution: P(Z ≤ z) = p</caption>
        <thead>
          <tr>
            <th scope="col">p</th>
            <th scope="col">z</th>
          </tr>
        </thead>
        <tbody>
          {NORMAL_P.map((p) => (
            <tr key={p}>
              <th scope="row">{p}</th>
              <td>{invPhi(p).toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function PmccTable() {
  return (
    <TableWrap label="PMCC table">
      <table className="data">
        <caption>Critical values of the product moment correlation coefficient (one-tailed significance level; double it for two-tailed)</caption>
        <thead>
          <tr>
            <th scope="col">n</th>
            {PMCC_A.map((a) => (
              <th scope="col" key={a}>
                {a * 100}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PMCC_N.map((n) => (
            <tr key={n}>
              <th scope="row">{n}</th>
              {PMCC_A.map((a) => (
                <td key={a}>{pmccCritical(n, a).toFixed(4)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export function Calculator() {
  return (
    <div className="stack">
      {CALCULATOR.map((sec) => (
        <section className="card" key={sec.h}>
          <h2 className="h3">{sec.h}</h2>
          <ul className="tips">
            {sec.points.map((p, i) => (
              <li key={i}>
                <MathText src={p} inline />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** The whole booklet in one place: the formulae, then the statistical tables. */
export function BookletContents({ level = 2 }: { level?: 2 | 3 }) {
  const H = `h${level}` as 'h2';
  const sub = (level + 1) as 3 | 4;
  return (
    <div className="stack booklet">
      <p className="small muted">
        Everything printed in <cite>Mathematical Formulae and Statistical Tables</cite>, the booklet you’re given in every 9MA0 paper. Pearson’s own copy is with the{' '}
        <a href={QUALIFICATION_PAGE} target="_blank" rel="noreferrer">
          9MA0 course materials
        </a>
        .
      </p>
      <nav className="booklet-jump small" aria-label="Booklet sections">
        <a href="#bk-pure" onClick={jump('bk-pure')}>Pure</a> · <a href="#bk-mech" onClick={jump('bk-mech')}>Mechanics</a> · <a href="#bk-stats" onClick={jump('bk-stats')}>Statistics</a> ·{' '}
        <a href="#bk-tables" onClick={jump('bk-tables')}>Tables</a>
      </nav>
      <H className="booklet-h" id="bk-pure">Pure mathematics</H>
      <Formulae groups={PURE} level={sub} />
      <H className="booklet-h" id="bk-mech">Mechanics</H>
      <Formulae groups={MECH} level={sub} />
      <H className="booklet-h" id="bk-stats">Statistics</H>
      <Formulae groups={STATS} level={sub} />
      <H className="booklet-h" id="bk-tables">Statistical tables</H>
      <details className="card booklet-table">
        <summary>Binomial cumulative distribution function</summary>
        <BinomialTable />
      </details>
      <details className="card booklet-table">
        <summary>Percentage points of the normal distribution</summary>
        <NormalTable />
      </details>
      <details className="card booklet-table">
        <summary>Critical values for the product moment correlation coefficient</summary>
        <PmccTable />
      </details>
    </div>
  );
}

/** In-page links that work inside the hash router (and inside the pop-up). */
const jump = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/** The formulae you must learn: none of them are in the booklet (the specification’s Appendix 1). */
export function LearnList() {
  const topics = new Map<string, typeof FLASHCARDS>();
  for (const c of FLASHCARDS) if (c.deck === 'learn') topics.set(c.topic, [...(topics.get(c.topic) ?? []), c]);
  return (
    <div className="stack">
      <p className="small">
        These are <strong>not</strong> in the booklet: Pearson expects you to know them (the{' '}
        <a href={SPECIFICATION} target="_blank" rel="noreferrer">
          9MA0 specification
        </a>
        , Appendix 1). <a href="#/flashcards">Learn them with flashcards</a>.
      </p>
      {[...topics].map(([topic, cards]) => (
        <section className="card" key={topic}>
          <h2 className="h3">{topic}</h2>
          {cards.map((c) => (
            <div className="formula learn-row" key={c.id}>
              <div className="small muted">
                <MathText src={c.front} inline />
              </div>
              <MathText src={c.back} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
