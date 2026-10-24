/**
 * The formulae printed in the booklet given out in the exam, Mathematical Formulae and Statistical
 * Tables (Green), for Pearson Edexcel A level Mathematics 9MA0. The ones you must learn instead are
 * the specification's Appendix 1 (the "learn" flashcard deck).
 */
/** LaTeX-friendly string tag: backslashes are kept as written. */
const md = String.raw;

export type F = [string, string];
export interface FormulaGroup {
  h: string;
  f: F[];
}
export const PURE: FormulaGroup[] = [
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
export const STATS: FormulaGroup[] = [
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
export const MECH: FormulaGroup[] = [
  {
    h: 'Constant acceleration',
    f: [
      ['', md`$v = u + at$, $\quad s = ut + \frac{1}{2}at^{2}$, $\quad s = vt - \frac{1}{2}at^{2}$`],
      ['', md`$s = \frac{1}{2}(u + v)t$, $\quad v^{2} = u^{2} + 2as$`],
      ['Vectors', md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$, $\quad \mathbf{s} = \mathbf{u}t + \frac{1}{2}\mathbf{a}t^{2}$, $\quad \mathbf{s} = \frac{1}{2}(\mathbf{u} + \mathbf{v})t$`],
    ],
  },
];

/** The 9MA0 specification: Appendix 1 (page 49) lists the formulae you must learn, which are not in the booklet. */
export const SPECIFICATION = 'https://qualifications.pearson.com/content/dam/pdf/A%20Level/Mathematics/2017/specification-and-sample-assesment/a-level-l3-mathematics-specification-issue4.pdf';
/** Pearson's 9MA0 page, where the booklet itself is under course materials. */
export const QUALIFICATION_PAGE = 'https://qualifications.pearson.com/en/qualifications/edexcel-a-levels/mathematics-2017.html';
