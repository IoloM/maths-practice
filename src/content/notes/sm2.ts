/** Revision notes: Statistics and Mechanics Year 2. */
import { md, type TopicNotes } from './types';

export const SM2: Record<string, TopicNotes> = {
  'SM2.1': {
    intro: 'Exponential models using logs, the product moment correlation coefficient, and testing for zero correlation.',
    key: [
      md`If $y = ab^{x}$, then $\log y = \log a + x\log b$ — a straight line in $(x, \log y)$.`,
      md`If $y = ax^{n}$, then $\log y = \log a + n\log x$ — a straight line in $(\log x, \log y)$.`,
      md`PMCC $r$ is between $-1$ and $1$; close to $\pm 1$ is strong linear correlation.`,
      md`Test: $H_{0}: \rho = 0$, $H_{1}: \rho > 0$, $\rho < 0$ or $\rho \neq 0$; compare $r$ with the critical value for the sample size.`,
    ],
    example: {
      q: md`For 12 pairs, $r = 0.62$. Test at 5% for positive correlation.`,
      steps: [md`$H_{0}: \rho = 0$, $H_{1}: \rho > 0$.`, md`Critical value (n = 12, 5% one-tailed) $= 0.4973$.`, md`$0.62 > 0.4973$: reject $H_{0}$ — evidence of positive correlation.`],
    },
    mistakes: [md`Writing hypotheses about $r$ instead of $\rho$.`, 'Using the two-tailed critical value for a one-tailed test.'],
    tips: ['Link the conclusion to the context ("there is evidence that taller students tend to weigh more").'],
  },
  'SM2.2': {
    intro: 'Set notation, conditional probability, and using Venn diagrams, two-way tables and trees.',
    key: [
      md`$P(A \mid B) = \dfrac{P(A \cap B)}{P(B)}$ — "given B" means B is the new whole.`,
      md`Independent: $P(A \mid B) = P(A)$.`,
      md`In a tree, the second branches are conditional probabilities: $P(A \cap B) = P(A)P(B \mid A)$.`,
      md`$A'$ is "not A"; $A \cup B$ is "A or B or both"; $A \cap B$ is "A and B".`,
    ],
    formulae: [['Conditional probability (booklet)', md`$P(A \cap B) = P(A)P(B \mid A)$, $\quad P(A \mid B) = \dfrac{P(B \mid A)P(A)}{P(B \mid A)P(A) + P(B \mid A')P(A')}$`]],
    example: {
      q: md`$P(A) = 0.4$, $P(B) = 0.5$, $P(A \cap B) = 0.15$. Find $P(A \mid B')$.`,
      steps: [md`$P(A \cap B') = 0.4 - 0.15 = 0.25$, $P(B') = 0.5$.`, md`$P(A \mid B') = \frac{0.25}{0.5} = 0.5$.`],
    },
    mistakes: [md`Dividing by $P(A)$ instead of the "given" event.`, md`Treating $P(A \mid B)$ and $P(B \mid A)$ as the same.`],
    tips: ['Draw the Venn diagram or tree even when not asked — it organises the numbers.'],
  },
  'SM2.3': {
    intro: 'The normal distribution: probabilities, the inverse normal, the standard normal Z, finding μ and σ, and approximating the binomial.',
    key: [
      md`$X \sim N(\mu, \sigma^{2})$ is symmetric about $\mu$; about 68% within $\sigma$, 95% within $2\sigma$, 99.7% within $3\sigma$.`,
      md`$Z = \dfrac{X - \mu}{\sigma} \sim N(0, 1)$; use it to find an unknown $\mu$ or $\sigma$.`,
      'For a probability, use the normal cdf; for a value with a given probability, use the inverse normal.',
      md`Approximating $B(n, p)$: when $n$ is large and $p$ is near 0.5, use $N(np, np(1 - p))$ with a continuity correction.`,
      md`Testing a mean: $\bar{X} \sim N\left(\mu, \frac{\sigma^{2}}{n}\right)$.`,
    ],
    formulae: [['Standardising (booklet)', md`$Z = \dfrac{X - \mu}{\sigma}$, $\quad \bar{X} \sim N\left(\mu, \dfrac{\sigma^{2}}{n}\right)$`]],
    example: {
      q: md`$X \sim N(50, \sigma^{2})$ and $P(X > 58) = 0.1$. Find $\sigma$.`,
      steps: [md`$P\left(Z > \frac{8}{\sigma}\right) = 0.1 \Rightarrow \frac{8}{\sigma} = 1.2816$.`, md`$\sigma = \frac{8}{1.2816} = 6.24$ (3 s.f.).`],
    },
    mistakes: [md`Using $\sigma^{2}$ where the calculator wants $\sigma$.`, 'Forgetting the continuity correction in an approximation.'],
    tips: ['Sketch the bell curve and shade the area — it shows whether you need 1 − p.'],
  },
  'SM2.4': {
    intro: 'Moments: turning effects of forces, rigid bodies in equilibrium, centres of mass and tilting.',
    key: [
      'Moment = force × perpendicular distance from the pivot (N m), clockwise or anticlockwise.',
      'In equilibrium: resultant force = 0 and the total moment about any point = 0.',
      'Take moments about the point where the unknown forces you don’t want act.',
      'A uniform rod’s weight acts at its midpoint.',
      'About to tilt about a support: the reaction at the other support is zero.',
    ],
    example: {
      q: 'A uniform 4 m plank of mass 20 kg rests on supports at A and B, 0.5 m from each end. Find the reactions.',
      steps: ['By symmetry the weight 20g acts halfway between A and B.', md`So $R_{A} = R_{B} = 10g = 98$ N.`],
    },
    mistakes: ['Using the distance along a slanting rod instead of the perpendicular distance.', 'Forgetting the weight of the rod itself.'],
    tips: ['Write "Moments about A:" before each moments equation.'],
  },
  'SM2.5': {
    intro: 'Resolving forces, inclined planes, and friction (F ⩽ μR).',
    key: [
      'Resolve parallel and perpendicular to an inclined plane.',
      md`Weight components on a slope at $\alpha$: $mg\sin\alpha$ down the slope, $mg\cos\alpha$ into the slope.`,
      md`Friction opposes motion (or the tendency to move): $F \leqslant \mu R$, and $F = \mu R$ when moving or in limiting equilibrium.`,
      md`A rough slope with no other forces: limiting equilibrium when $\mu = \tan\alpha$.`,
    ],
    example: {
      q: md`A 5 kg box slides down a rough slope at $30^{\circ}$ with $\mu = 0.2$. Find its acceleration.`,
      steps: [md`$R = 5g\cos 30^{\circ} = 42.4$ N, $F = 0.2R = 8.49$ N.`, md`$5g\sin 30^{\circ} - F = 5a \Rightarrow 24.5 - 8.49 = 5a$.`, md`$a = 3.2$ m s$^{-2}$ (2 s.f.).`],
    },
    mistakes: ['Friction in the wrong direction (it changes when motion reverses).', md`Using $R = mg$ on a slope or with an angled pull.`],
    tips: ['Draw the diagram with forces along and across the slope before writing equations.'],
  },
  'SM2.6': {
    intro: 'Projectiles: horizontal and vertical motion handled separately under gravity.',
    key: [
      md`Initial velocity components: $U\cos\theta$ horizontally, $U\sin\theta$ vertically.`,
      'Horizontal: constant velocity (no air resistance). Vertical: suvat with a = −g.',
      'Time links the two directions; find it from the vertical motion.',
      md`Greatest height: vertical velocity $= 0$. Range on level ground: $\dfrac{U^{2}\sin 2\theta}{g}$.`,
    ],
    example: {
      q: md`A ball is projected at $20$ m s$^{-1}$ at $30^{\circ}$ above horizontal ground. Find the time of flight.`,
      steps: [md`Vertical: $u = 20\sin 30^{\circ} = 10$, $a = -9.8$, $s = 0$.`, md`$0 = 10t - 4.9t^{2} \Rightarrow t = \frac{10}{4.9} = 2.04$ s.`],
    },
    mistakes: ['Applying g to horizontal motion.', 'Using the total speed in a vertical suvat equation.'],
    tips: ['Set out two columns: horizontal and vertical, with s, u, v, a, t in each.'],
  },
  'SM2.7': {
    intro: 'Applying forces: statics of particles and rigid bodies (ladders), and dynamics on slopes and with connected particles.',
    key: [
      'Particle in equilibrium: resolve in two perpendicular directions; each sum is zero.',
      'Ladders: resolve vertically and horizontally, then take moments about the foot.',
      'Smooth wall: its reaction is horizontal. Rough ground: friction at the foot.',
      'Limiting equilibrium: F = μR at the point about to slip.',
    ],
    example: {
      q: md`A particle of weight $20$ N hangs from two strings at $30^{\circ}$ and $60^{\circ}$ to the horizontal. Find the tensions.`,
      steps: [md`Horizontal: $T_{1}\cos 30^{\circ} = T_{2}\cos 60^{\circ}$.`, md`Vertical: $T_{1}\sin 30^{\circ} + T_{2}\sin 60^{\circ} = 20$.`, md`Solving: $T_{1} = 10$ N, $T_{2} = 10\sqrt{3} \approx 17.3$ N.`],
    },
    mistakes: ['Missing a force on the ladder (there are usually four or five).', 'Taking moments about a point where you then have two unknown moments.'],
    tips: ['Check your answer is sensible: tensions should be positive and friction ⩽ μR.'],
  },
  'SM2.8': {
    intro: 'Kinematics with vectors: constant acceleration in 2D, and calculus with vector displacement and velocity.',
    key: [
      md`Vector suvat: $\mathbf{v} = \mathbf{u} + \mathbf{a}t$, $\mathbf{r} = \mathbf{u}t + \frac{1}{2}\mathbf{a}t^{2}$ (plus the starting position).`,
      md`Differentiate or integrate each component separately: $\mathbf{v} = \frac{\mathrm{d}\mathbf{r}}{\mathrm{d}t}$.`,
      'Speed = magnitude of the velocity vector.',
      'Moving due north/east, or parallel to a vector: compare components.',
    ],
    formulae: [['Vector suvat (booklet)', md`$\mathbf{v} = \mathbf{u} + \mathbf{a}t$, $\quad \mathbf{s} = \mathbf{u}t + \frac{1}{2}\mathbf{a}t^{2}$`]],
    example: {
      q: md`$\mathbf{r} = (t^{2} - 4t)\mathbf{i} + 3t\mathbf{j}$. When is the particle moving parallel to $\mathbf{j}$?`,
      steps: [md`$\mathbf{v} = (2t - 4)\mathbf{i} + 3\mathbf{j}$.`, md`Parallel to $\mathbf{j}$ when the $\mathbf{i}$ component is 0: $t = 2$.`],
    },
    mistakes: ['Adding the starting position vector only to one component.', 'Treating speed as a vector.'],
    tips: ['Write i and j parts on separate lines when integrating.'],
  },
};
