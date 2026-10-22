import { useState } from 'react';
import { binomCdf, invPhi, pmccCritical } from '../engine/stats/distributions';
import { MathText } from '../components/MathText';
import { md } from '../engine/templates/helpers';

type F = [string, string];
const PURE: { h: string; f: F[] }[] = [
  { h: 'Mensuration', f: [['Surface area of a sphere', md`$S = 4\pi r^{2}$`], ['Curved surface area of a cone (slant height $l$)', md`$S = \pi r l$`]] },
  {
    h: 'Series',
    f: [
      ['Arithmetic series', md`$S_{n} = \frac{1}{2}n(a + l) = \frac{1}{2}n\left[2a + (n - 1)d\right]$`],
      ['Geometric series', md`$S_{n} = \dfrac{a(1 - r^{n})}{1 - r}$, $\quad S_{\infty} = \dfrac{a}{1 - r}$ for $|r| < 1$`],
      [md`Binomial series ($n \in \mathbb{N}$)`, md`$(a + b)^{n} = a^{n} + \binom{n}{1}a^{n-1}b + \binom{n}{2}a^{n-2}b^{2} + \cdots + \binom{n}{r}a^{n-r}b^{r} + \cdots + b^{n}$, where $\binom{n}{r} = \dfrac{n!}{r!(n - r)!}$`],
      [md`Binomial series ($|x| < 1$, $n \in \mathbb{R}$)`, md`$(1 + x)^{n} = 1 + nx + \dfrac{n(n - 1)}{2!}x^{2} + \cdots + \dfrac{n(n - 1)\cdots(n - r + 1)}{r!}x^{r} + \cdots$`],
    ],
  },
  { h: 'Logarithms and exponentials', f: [['Change of base', md`$\log_{a} x = \dfrac{\log_{b} x}{\log_{b} a}$`], ['', md`$e^{x\ln a} = a^{x}$`]] },
  {
    h: 'Trigonometric identities',
    f: [
      ['', md`$\sin(A \pm B) = \sin A\cos B \pm \cos A\sin B$`],
      ['', md`$\cos(A \pm B) = \cos A\cos B \mp \sin A\sin B$`],
      ['', md`$\tan(A \pm B) = \dfrac{\tan A \pm \tan B}{1 \mp \tan A\tan B}$ $\quad (A \pm B \neq (k + \frac{1}{2})\pi)$`],
      ['', md`$\sin A + \sin B = 2\sin\dfrac{A + B}{2}\cos\dfrac{A - B}{2}$, $\quad \sin A - \sin B = 2\cos\dfrac{A + B}{2}\sin\dfrac{A - B}{2}$`],
      ['', md`$\cos A + \cos B = 2\cos\dfrac{A + B}{2}\cos\dfrac{A - B}{2}$, $\quad \cos A - \cos B = -2\sin\dfrac{A + B}{2}\sin\dfrac{A - B}{2}$`],
      ['Small angle approximations ($\\theta$ in radians)', md`$\sin\theta \approx \theta$, $\quad \cos\theta \approx 1 - \dfrac{\theta^{2}}{2}$, $\quad \tan\theta \approx \theta$`],
    ],
  },
  {
    h: 'Differentiation',
    f: [
      ['First principles', md`$\mathrm{f}'(x) = \displaystyle\lim_{h \to 0} \frac{\mathrm{f}(x + h) - \mathrm{f}(x)}{h}$`],
      ['', md`$\tan kx \to k\sec^{2} kx$, $\quad \sec kx \to k\sec kx\tan kx$`],
      ['', md`$\cot kx \to -k\operatorname{cosec}^{2} kx$, $\quad \operatorname{cosec} kx \to -k\operatorname{cosec} kx\cot kx$`],
      ['Quotient rule', md`$\dfrac{\mathrm{f}(x)}{\mathrm{g}(x)} \to \dfrac{\mathrm{f}'(x)\mathrm{g}(x) - \mathrm{f}(x)\mathrm{g}'(x)}{\left(\mathrm{g}(x)\right)^{2}}$`],
    ],
  },
  {
    h: 'Integration (+ constant)',
    f: [
      ['', md`$\displaystyle\int \sec^{2} kx\,\mathrm{d}x = \frac{1}{k}\tan kx$, $\quad \int \tan kx\,\mathrm{d}x = \frac{1}{k}\ln|\sec kx|$, $\quad \int \cot kx\,\mathrm{d}x = \frac{1}{k}\ln|\sin kx|$`],
      ['By parts', md`$\displaystyle\int u\frac{\mathrm{d}v}{\mathrm{d}x}\,\mathrm{d}x = uv - \int v\frac{\mathrm{d}u}{\mathrm{d}x}\,\mathrm{d}x$`],
    ],
  },
  {
    h: 'Numerical methods',
    f: [
      ['Trapezium rule', md`$\displaystyle\int_{a}^{b} y\,\mathrm{d}x \approx \frac{1}{2}h\left\{(y_{0} + y_{n}) + 2(y_{1} + y_{2} + \cdots + y_{n-1})\right\}$, $\quad h = \dfrac{b - a}{n}$`],
      ['Newton–Raphson', md`$x_{n+1} = x_{n} - \dfrac{\mathrm{f}(x_{n})}{\mathrm{f}'(x_{n})}$`],
    ],
  },
];
const STATS: { h: string; f: F[] }[] = [
  {
    h: 'Probability',
    f: [
      ['', md`$\mathrm{P}(A') = 1 - \mathrm{P}(A)$, $\quad \mathrm{P}(A \cup B) = \mathrm{P}(A) + \mathrm{P}(B) - \mathrm{P}(A \cap B)$`],
      ['', md`$\mathrm{P}(A \cap B) = \mathrm{P}(A)\,\mathrm{P}(B \mid A)$`],
      ['', md`$\mathrm{P}(A \mid B) = \dfrac{\mathrm{P}(B \mid A)\mathrm{P}(A)}{\mathrm{P}(B \mid A)\mathrm{P}(A) + \mathrm{P}(B \mid A')\mathrm{P}(A')}$`],
      ['Independent events', md`$\mathrm{P}(A \mid B) = \mathrm{P}(A)$, $\quad \mathrm{P}(A \cap B) = \mathrm{P}(A)\mathrm{P}(B)$`],
    ],
  },
  {
    h: 'Standard deviation',
    f: [
      ['', md`$\sigma = \sqrt{\dfrac{\sum(x - \bar{x})^{2}}{n}} = \sqrt{\dfrac{\sum x^{2}}{n} - \bar{x}^{2}}$`],
      ['Frequencies', md`$\sigma = \sqrt{\dfrac{\sum f(x - \bar{x})^{2}}{\sum f}} = \sqrt{\dfrac{\sum fx^{2}}{\sum f} - \bar{x}^{2}}$`],
    ],
  },
  {
    h: 'Distributions',
    f: [
      ['Binomial $\\mathrm{B}(n, p)$', md`$\mathrm{P}(X = x) = \binom{n}{x}p^{x}(1 - p)^{n - x}$, mean $np$, variance $np(1 - p)$`],
      ['Normal $\\mathrm{N}(\\mu, \\sigma^{2})$', md`$Z = \dfrac{X - \mu}{\sigma} \sim \mathrm{N}(0, 1)$`],
      ['Sample mean', md`For a random sample of size $n$ from $\mathrm{N}(\mu, \sigma^{2})$: $\bar{X} \sim \mathrm{N}\left(\mu, \dfrac{\sigma^{2}}{n}\right)$`],
    ],
  },
];
const MECH: { h: string; f: F[] }[] = [
  {
    h: 'Constant acceleration',
    f: [
      ['', md`$v = u + at$, $\quad s = ut + \frac{1}{2}at^{2}$, $\quad s = vt - \frac{1}{2}at^{2}$`],
      ['', md`$s = \frac{1}{2}(u + v)t$, $\quad v^{2} = u^{2} + 2as$`],
      ['Vectors', md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$, $\quad \mathbf{s} = \mathbf{u}t + \frac{1}{2}\mathbf{a}t^{2}$, $\quad \mathbf{s} = \frac{1}{2}(\mathbf{u} + \mathbf{v})t$`],
    ],
  },
];

const BIN_N = [5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50];
const PS = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5];
const NORMAL_P = [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.975, 0.99, 0.995, 0.9975, 0.999, 0.9995];
const PMCC_N = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100];
const PMCC_A = [0.1, 0.05, 0.025, 0.01, 0.005];

function Formulae({ groups }: { groups: { h: string; f: F[] }[] }) {
  return (
    <div className="stack">
      {groups.map((g) => (
        <section className="card" key={g.h}>
          <h3>{g.h}</h3>
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

function BinomialTable() {
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
      <div className="table-wrap">
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
      </div>
    </div>
  );
}

function NormalTable() {
  return (
    <div className="table-wrap">
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
    </div>
  );
}

function PmccTable() {
  return (
    <div className="table-wrap">
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
    </div>
  );
}

const TABS = [
  { id: 'pure', label: 'Pure formulae' },
  { id: 'stats', label: 'Statistics formulae' },
  { id: 'mech', label: 'Mechanics formulae' },
  { id: 'binomial', label: 'Binomial tables' },
  { id: 'normal', label: 'Normal table' },
  { id: 'pmcc', label: 'PMCC table' },
];

export function Reference() {
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem('mp.reference.tab') ?? 'pure';
    } catch {
      return 'pure';
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
        <p className="muted small">Key formulae of the kind given in the exam, and tables calculated in the app from exact distribution functions. Values are rounded to 4 decimal places.</p>
      </div>
      <div className="tabs" role="tablist" aria-label="Reference sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => choose(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'pure' && <Formulae groups={PURE} />}
        {tab === 'stats' && <Formulae groups={STATS} />}
        {tab === 'mech' && <Formulae groups={MECH} />}
        {tab === 'binomial' && <BinomialTable />}
        {tab === 'normal' && <NormalTable />}
        {tab === 'pmcc' && <PmccTable />}
      </div>
    </div>
  );
}
