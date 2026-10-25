/** Revision notes: Statistics and Mechanics Year 1. */
import { md, type TopicNotes } from './types';

export const SM1: Record<string, TopicNotes> = {
  'SM1.1': {
    intro: 'Populations and samples, the sampling methods (random and not), types of data, and the large data set.',
    key: [
      'Census: every member (accurate, but slow and costly). Sample: some members (quicker, may not represent the population).',
      'Random: simple random (numbered list + random numbers), systematic (every kth after a random start), stratified (in proportion to groups).',
      'Non-random: quota (fill quotas by group, no sampling frame needed) and opportunity (whoever is available — quick but likely biased).',
      'Quantitative data are numbers (discrete or continuous); qualitative data are descriptions.',
      'Large data set: UK and overseas weather stations, May–October 1987 and 2015; know the variables, units, "tr" and "n/a".',
    ],
    example: {
      q: 'A school has 300 boys and 200 girls. Describe how to take a stratified sample of 50.',
      steps: ['Boys: 300/500 × 50 = 30; girls: 200/500 × 50 = 20.', 'Number the boys 1–300 and use random numbers to choose 30; do the same for the girls (1–200, choose 20).'],
    },
    mistakes: ['Describing a method without saying how the random choices are made.', 'Calling an opportunity sample "random".'],
    tips: ['For one advantage and one disadvantage, make them specific to the context in the question.'],
  },
  'SM1.2': {
    intro: 'Averages and spread: mean, median, mode, quartiles, interquartile range, variance, standard deviation and coding.',
    key: [
      md`Mean $\bar{x} = \frac{\sum x}{n}$ (or $\frac{\sum fx}{\sum f}$ for a frequency table).`,
      'Median and quartiles for discrete data: position n/4, n/2, 3n/4 — a whole number means average that value and the next; otherwise round up.',
      'For grouped data, estimate the median and quartiles by linear interpolation.',
      md`Variance $\sigma^{2} = \frac{\sum x^{2}}{n} - \bar{x}^{2}$; standard deviation is its square root (same units as the data).`,
      md`Coding $y = \frac{x - a}{b}$: $\bar{x} = a + b\bar{y}$ and $\sigma_{x} = b\sigma_{y}$ (adding doesn't change spread).`,
    ],
    formulae: [['Standard deviation (booklet)', md`$\sigma = \sqrt{\dfrac{\sum (x - \bar{x})^{2}}{n}} = \sqrt{\dfrac{\sum x^{2}}{n} - \bar{x}^{2}}$`]],
    example: {
      q: md`For 10 values, $\sum x = 52$ and $\sum x^{2} = 300$. Find the mean and standard deviation.`,
      steps: [md`$\bar{x} = 5.2$.`, md`$\sigma^{2} = \frac{300}{10} - 5.2^{2} = 30 - 27.04 = 2.96$.`, md`$\sigma = \sqrt{2.96} = 1.72$ (3 s.f.).`],
    },
    mistakes: ['Forgetting to square-root the variance.', 'Applying a shift (+ a) to the standard deviation.'],
    tips: ['Choose median and IQR when there are outliers or skew; mean and standard deviation otherwise.'],
  },
  'SM1.3': {
    intro: 'Outliers, box plots, cumulative frequency, histograms and comparing distributions.',
    key: [
      'Outlier (unless told otherwise): more than 1.5 × IQR below Q₁ or above Q₃.',
      'Box plot: whiskers go to the lowest and highest values that are not outliers; outliers are crosses.',
      md`Histograms: frequency is proportional to area; frequency density $= \frac{\text{frequency}}{\text{class width}}$.`,
      'Cumulative frequency: plot at the upper class boundary; read the median at n/2.',
      'Comparing: one measure of location and one of spread, each in context.',
    ],
    example: {
      q: 'A histogram bar for the class 10–20 has height 3.5 and represents 14 people. How many people does a bar of height 2 over 20–25 represent?',
      steps: ['Area 10 × 3.5 = 35 units for 14 people, so 1 person = 2.5 units.', 'Bar area 5 × 2 = 10 units → 10 ÷ 2.5 = 4 people.'],
    },
    mistakes: ['Plotting frequency rather than frequency density on a histogram with unequal widths.', 'Comparing without context ("the median is higher" instead of "times were longer on average").'],
    tips: ['When asked to compare, write two sentences: one on average, one on spread, both in context.'],
  },
  'SM1.4': {
    intro: 'Scatter diagrams, types of correlation, and the regression line of y on x.',
    key: [
      'Correlation describes a linear relationship; it does not show that one variable causes the other.',
      md`The regression line $y = a + bx$: $b$ is the change in $y$ for each one-unit increase in $x$ — interpret it in context.`,
      'Use the line only within the range of the data (interpolation); outside it is extrapolation and unreliable.',
      'The explanatory (independent) variable goes on the x-axis; the response variable on the y-axis.',
    ],
    example: {
      q: md`The regression line of fuel used $f$ (litres) on distance $d$ (km) is $f = 2.1 + 0.06d$, for $50 \leqslant d \leqslant 300$. Interpret $0.06$ and estimate $f$ when $d = 200$.`,
      steps: ['For every extra 1 km driven, about 0.06 litres more fuel is used.', md`$f = 2.1 + 0.06(200) = 14.1$ litres — reliable, as 200 is inside the data range.`],
    },
    mistakes: ['Saying correlation proves causation.', 'Extrapolating without comment.'],
    tips: ['Interpret gradients with "for each extra… on average…".'],
  },
  'SM1.5': {
    intro: 'Calculating probabilities with Venn diagrams and tree diagrams; mutually exclusive and independent events.',
    key: [
      md`Mutually exclusive: $P(A \cap B) = 0$, so $P(A \cup B) = P(A) + P(B)$.`,
      md`Independent: $P(A \cap B) = P(A)P(B)$ — the test you show in an answer.`,
      'Tree diagrams: multiply along branches, add the end results you need.',
      md`$P(\text{not } A) = 1 - P(A)$ — often quicker for "at least one".`,
    ],
    formulae: [['Addition rule (booklet)', md`$P(A \cup B) = P(A) + P(B) - P(A \cap B)$`]],
    example: {
      q: md`$P(A) = 0.3$, $P(B) = 0.5$, $P(A \cup B) = 0.65$. Are $A$ and $B$ independent?`,
      steps: [md`$P(A \cap B) = 0.3 + 0.5 - 0.65 = 0.15$.`, md`$P(A)P(B) = 0.15$ — equal, so independent.`],
    },
    mistakes: ['Confusing mutually exclusive with independent.', 'Venn diagrams where the regions don’t add to 1.'],
    tips: ['Fill Venn diagrams from the middle outwards.'],
  },
  'SM1.6': {
    intro: 'Discrete probability distributions and the binomial distribution B(n, p).',
    key: [
      'A probability distribution lists every value with its probability; the probabilities add to 1.',
      'Binomial conditions: fixed number of trials n, two outcomes, constant probability p, independent trials.',
      md`$P(X = r) = \binom{n}{r}p^{r}(1 - p)^{n-r}$; use the calculator's cumulative function for $P(X \leqslant r)$.`,
      md`Convert inequalities: $P(X < 5) = P(X \leqslant 4)$, $P(X \geqslant 5) = 1 - P(X \leqslant 4)$.`,
    ],
    formulae: [['Binomial (booklet)', md`$P(X = x) = \binom{n}{x}p^{x}(1 - p)^{n-x}$`]],
    example: {
      q: md`$X \sim B(20, 0.3)$. Find $P(4 < X \leqslant 8)$.`,
      steps: [md`$P(X \leqslant 8) - P(X \leqslant 4)$.`, md`$= 0.8867 - 0.2375 = 0.6492$.`],
    },
    mistakes: [md`$P(X > 4) = 1 - P(X \leqslant 4)$, not $1 - P(X \leqslant 5)$.`, 'Stating conditions without context.'],
    tips: ['Write the distribution in full, e.g. X ~ B(20, 0.3), before calculating.'],
  },
  'SM1.7': {
    intro: 'Hypothesis tests for a binomial proportion: hypotheses, critical regions, significance levels and conclusions.',
    key: [
      md`$H_{0}: p = p_{0}$ always; $H_{1}: p < p_{0}$, $p > p_{0}$ (one-tailed) or $p \neq p_{0}$ (two-tailed).`,
      'Work out the probability, under H₀, of a result at least as extreme as the one observed; compare with the significance level.',
      'Critical region: the values that lead to rejecting H₀. Actual significance level = P(being in the critical region | H₀ true).',
      'Two-tailed: halve the significance level for each tail.',
      'Conclusion: reject or don’t reject H₀, then a sentence in context that isn’t too definite ("there is evidence that…").',
    ],
    example: {
      q: md`A coin is thrown 20 times and gives 15 heads. Test at 5% whether it is biased towards heads.`,
      steps: [md`$H_{0}: p = 0.5$, $H_{1}: p > 0.5$. $X \sim B(20, 0.5)$.`, md`$P(X \geqslant 15) = 1 - P(X \leqslant 14) = 0.0207 < 0.05$.`, 'Reject H₀: there is evidence the coin is biased towards heads.'],
    },
    mistakes: ['Writing hypotheses with x or the sample proportion instead of p.', 'Calculating P(X = 15) instead of P(X ⩾ 15).'],
    tips: ['Always define p in words ("p is the probability of a head").'],
  },
  'SM1.8': {
    intro: 'How mechanics models the real world: assumptions, SI units, and vectors.',
    key: [
      'Particle: size ignored, so rotation is ignored. Rod: length but no thickness. Lamina: flat with no thickness.',
      'Light: no mass (so tension is the same throughout a string). Inextensible: doesn’t stretch (so connected particles share acceleration).',
      'Smooth: no friction. Rough: friction acts. Bead: moves along a wire. Peg: a support you can hang from.',
      md`SI base units: kg, m, s; derived: newton $\text{N} = \text{kg m s}^{-2}$.`,
      'Speed is the magnitude of velocity; distance is the magnitude of displacement.',
    ],
    example: {
      q: 'A ball is thrown and modelled as a particle with no air resistance. Give one effect of each assumption.',
      steps: ['Particle: its size and any spin are ignored.', 'No air resistance: the only force is its weight, so its acceleration is g throughout.'],
    },
    mistakes: ['Saying "light" means "not heavy" without saying what it allows (same tension throughout).'],
    tips: ['When asked to criticise a model, name the assumption and its effect on the answer.'],
  },
  'SM1.9': {
    intro: 'Motion with constant acceleration: graphs and the suvat equations, including free fall.',
    key: [
      'Gradient of a velocity–time graph = acceleration; area = displacement.',
      'Gradient of a displacement–time graph = velocity.',
      'Choose the suvat equation without the variable you don’t know and don’t want.',
      md`Vertical motion: take up as positive, $a = -9.8$ m s$^{-2}$; at the top $v = 0$.`,
    ],
    formulae: [['suvat (booklet)', md`$v = u + at$, $\; s = ut + \frac{1}{2}at^{2}$, $\; s = \frac{1}{2}(u + v)t$, $\; v^{2} = u^{2} + 2as$, $\; s = vt - \frac{1}{2}at^{2}$`]],
    example: {
      q: md`A ball is thrown up at $14$ m s$^{-1}$. Find its greatest height.`,
      steps: [md`At the top $v = 0$: $0 = 14^{2} - 2(9.8)s$.`, md`$s = \frac{196}{19.6} = 10$ m.`],
    },
    mistakes: ['Mixing signs of u and g in vertical motion.', md`Giving more than 2–3 s.f. when $g = 9.8$ was used.`],
    tips: [md`With $g = 9.8$, give answers to 2 or 3 s.f.`],
  },
  'SM1.10': {
    intro: 'Forces and Newton’s laws: force diagrams, F = ma, connected particles and pulleys.',
    key: [
      'Draw a clear force diagram: weight, normal reaction, tension/thrust, friction, driving force, resistance.',
      md`Newton’s second law: resultant force $= ma$ in the direction of the acceleration.`,
      'Connected particles: write F = ma for each particle (or the whole system when the internal forces cancel).',
      'Pulleys (smooth, light string): same tension on both sides, same size of acceleration.',
      'Newton’s third law: forces between objects are equal and opposite.',
    ],
    example: {
      q: md`A car of mass $1200$ kg tows a trailer of $400$ kg with driving force $2400$ N and no resistances. Find the acceleration and the tension in the towbar.`,
      steps: [md`Whole system: $2400 = 1600a \Rightarrow a = 1.5$ m s$^{-2}$.`, md`Trailer: $T = 400 \times 1.5 = 600$ N.`],
    },
    mistakes: ['Including the tension when treating the system as a whole.', 'Using mass instead of weight (mg) for the gravitational force.'],
    tips: ['State which particle each equation is for — it earns the method marks.'],
  },
  'SM1.11': {
    intro: 'When acceleration varies with time: using differentiation and integration.',
    key: [
      md`$v = \frac{\mathrm{d}s}{\mathrm{d}t}$, $a = \frac{\mathrm{d}v}{\mathrm{d}t} = \frac{\mathrm{d}^{2}s}{\mathrm{d}t^{2}}$.`,
      md`$v = \int a\,\mathrm{d}t$, $s = \int v\,\mathrm{d}t$ — find each constant from the given conditions.`,
      'Maximum or minimum velocity: set a = 0.',
      md`Distance travelled: if $v$ changes sign, split the integral where $v = 0$ and add the sizes.`,
    ],
    example: {
      q: md`$v = 6t - t^{2}$ for $0 \leqslant t \leqslant 6$. Find the greatest velocity.`,
      steps: [md`$a = 6 - 2t = 0 \Rightarrow t = 3$.`, md`$v = 18 - 9 = 9$ m s$^{-1}$.`],
    },
    mistakes: ['Using suvat when acceleration isn’t constant.', 'Forgetting the constant of integration.'],
    tips: ['Check whether the particle changes direction before finding total distance.'],
  },
};
