import { useState } from 'react';
import { BinomialTable, BookletContents, Calculator, LearnList, NormalTable, PmccTable } from '../components/Booklet';
import { GUIDE } from '../lib/self-mark';

/** How mark schemes work, for checking your own work. */
function MarkingGuide() {
  return (
    <div className="stack">
      <section className="card">
        <h2 className="h3">The marks</h2>
        <dl className="guide-list">
          {GUIDE.codes.map(([c, t]) => (
            <div key={c}>
              <dt>{c}</dt>
              <dd>{t}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="card">
        <h2 className="h3">What examiners’ abbreviations mean</h2>
        <dl className="guide-list">
          {GUIDE.terms.map(([c, t]) => (
            <div key={c}>
              <dt>{c}</dt>
              <dd>{t}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="card">
        <h2 className="h3">Marking your own working</h2>
        <ul className="tips">
          {GUIDE.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const TABS = [
  { id: 'booklet', label: 'Formula booklet' },
  { id: 'learn', label: 'Not in the booklet' },
  { id: 'binomial', label: 'Binomial tables' },
  { id: 'normal', label: 'Normal table' },
  { id: 'pmcc', label: 'PMCC table' },
  { id: 'calculator', label: 'Calculator' },
  { id: 'marking', label: 'Mark schemes' },
];

export function Reference({ tab: asked }: { tab?: string }) {
  const [tab, setTab] = useState(() => {
    if (TABS.some((x) => x.id === asked)) return asked!;
    try {
      const t = localStorage.getItem('mp.reference.tab');
      return TABS.some((x) => x.id === t) ? t! : 'booklet';
    } catch {
      return 'booklet';
    }
  });
  const choose = (t: string) => {
    setTab(t);
    try {
      localStorage.setItem('mp.reference.tab', t);
    } catch {
      /* private mode */
    }
  };
  return (
    <div className="stack">
      <div>
        <h1>Formulae and statistical tables</h1>
        <p className="muted small">The formula booklet you get in the exam, the formulae you must learn because they aren’t in it, and the statistical tables (worked out in the app from the exact distributions, to 4 decimal places).</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Reference sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => choose(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'booklet' && <BookletContents />}
        {tab === 'learn' && <LearnList />}
        {tab === 'binomial' && <BinomialTable />}
        {tab === 'normal' && <NormalTable />}
        {tab === 'pmcc' && <PmccTable />}
        {tab === 'calculator' && <Calculator />}
        {tab === 'marking' && <MarkingGuide />}
      </div>
    </div>
  );
}
