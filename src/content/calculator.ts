/** LaTeX-friendly string tag: backslashes are kept as written. */
const md = String.raw;

/** Calculator advice: what any allowed calculator does, with the exam rules from the 9MA0 specification (Appendix 3). */
export const CALCULATOR: { h: string; points: string[] }[] = [
  {
    h: 'What your calculator must (and must not) do',
    points: [
      'It must have an iterative function, summary statistics, and probabilities from the standard distributions (binomial and normal). Models such as the Casio fx-991CW or fx-991EX ClassWiz do all of these.',
      'It must not do symbolic algebra, symbolic differentiation or integration, or connect to other devices or the internet, and it must not hold stored formulae or text. Clear its memory before the exam.',
    ],
  },
  {
    h: 'Binomial probabilities',
    points: [
      md`The point function (often "Binomial PD") gives $\mathrm{P}(X = x)$; the cumulative function ("Binomial CD") gives $\mathrm{P}(X \leqslant x)$. Some models ask for a lower and upper value instead, giving $\mathrm{P}(a \leqslant X \leqslant b)$ directly.`,
      md`Convert first: $\mathrm{P}(X \geqslant x) = 1 - \mathrm{P}(X \leqslant x - 1)$, $\;\mathrm{P}(X < x) = \mathrm{P}(X \leqslant x - 1)$, $\;\mathrm{P}(a < X \leqslant b) = \mathrm{P}(X \leqslant b) - \mathrm{P}(X \leqslant a)$.`,
      md`For a critical region, find the cumulative probabilities either side of the boundary, compare them with the significance level (half of it in each tail for a two-tailed test), and quote the probability of the region you choose.`,
    ],
  },
  {
    h: 'Normal distribution',
    points: [
      md`The cumulative function ("Normal CD") needs a lower bound, an upper bound, $\sigma$ and $\mu$. Enter the standard deviation $\sigma$, not the variance $\sigma^{2}$. For $\mathrm{P}(X < a)$ use a very large negative lower bound, such as $-10^{9}$.`,
      md`The inverse function takes the area to the left (on most models). For $\mathrm{P}(X > a) = 0.1$, enter $0.9$.`,
      md`To find an unknown $\mu$ or $\sigma$: get $z$ from the inverse normal with $\mu = 0$, $\sigma = 1$, then solve $\dfrac{a - \mu}{\sigma} = z$.`,
      md`Write the probability statement before the number, e.g. $\mathrm{P}(X > 52) = 0.2119$: the set-up earns method marks.`,
    ],
  },
  {
    h: 'Summary statistics and regression',
    points: [
      md`In Statistics mode, enter the data (switch on the frequency column for a frequency table) to read off $\bar{x}$, $\sum x$, $\sum x^{2}$ and the standard deviation.`,
      md`Edexcel's standard deviation divides by $n$: on the calculator that is $\sigma_{x}$, not $s_{x}$.`,
      md`For regression choose the $y = a + bx$ model to get $a$, $b$ and the product moment correlation coefficient $r$.`,
    ],
  },
  {
    h: 'Iteration and Newton–Raphson',
    points: [
      md`Type $x_{0}$ and press =. Then type the formula using Ans (e.g. $\sqrt[3]{2\,\mathrm{Ans} + 5}$) and press = repeatedly: each press gives the next $x_{n}$.`,
      md`Newton–Raphson: $\mathrm{Ans} - \dfrac{\mathrm{f}(\mathrm{Ans})}{\mathrm{f}'(\mathrm{Ans})}$, with $\mathrm{f}'$ worked out by hand first.`,
      'Write down each iterate the question asks for, to the stated accuracy.',
    ],
  },
  {
    h: 'Tables, sign changes and the trapezium rule',
    points: [
      md`Table mode lists $\mathrm{f}(x)$ from a start value to an end value in steps: ideal for checking a change of sign or getting the $y$-values for the trapezium rule (step $= h$).`,
      'Check the angle unit: radians for calculus and most Pure Year 2 trigonometry, degrees when the question uses °.',
    ],
  },
  {
    h: 'Accuracy and working',
    points: [
      'Keep full values in memory (Ans or a stored variable) and round only the final answer.',
      'Numerical integration and d/dx at a point are allowed and good for checking, but questions asking for exact answers or for working need the method shown.',
      '"Solutions relying entirely on calculator technology are not acceptable" means show the algebra: a calculator answer on its own scores nothing there.',
    ],
  },
];
