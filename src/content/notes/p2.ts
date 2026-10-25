/** Revision notes: Pure Year 2. */
import { md, type TopicNotes } from './types';

export const P2: Record<string, TopicNotes> = {
  'P2.1': {
    intro: 'Proof by contradiction, more algebraic fractions, and splitting fractions into partial fractions.',
    key: [
      'Proof by contradiction: assume the opposite, reason correctly to something impossible, conclude the original statement is true.',
      md`Classic proofs: $\sqrt{2}$ is irrational; there are infinitely many primes.`,
      md`Distinct linear factors: $\dfrac{px + q}{(x - a)(x - b)} \equiv \dfrac{A}{x - a} + \dfrac{B}{x - b}$.`,
      md`A repeated factor needs both $\dfrac{B}{x - b}$ and $\dfrac{C}{(x - b)^{2}}$.`,
      'Find constants by substituting values of x (cover-up) or comparing coefficients.',
      'If the top has degree ⩾ the bottom (improper), divide first.',
    ],
    example: {
      q: md`Express $\dfrac{5x + 1}{(x + 1)(x - 2)}$ in partial fractions.`,
      steps: [md`$5x + 1 \equiv A(x - 2) + B(x + 1)$.`, md`$x = 2$: $11 = 3B \Rightarrow B = \frac{11}{3}$.`, md`$x = -1$: $-4 = -3A \Rightarrow A = \frac{4}{3}$.`, md`$\dfrac{4}{3(x + 1)} + \dfrac{11}{3(x - 2)}$.`],
    },
    mistakes: ['In contradiction proofs, not stating the assumption clearly or not concluding.', 'Missing the squared term for a repeated factor.'],
    tips: ['Check partial fractions by recombining or substituting a value like x = 0.'],
  },
  'P2.2': {
    intro: 'Functions as mappings, composite and inverse functions, the modulus function, and combined transformations.',
    key: [
      'A function maps each input to exactly one output; the range is the set of outputs.',
      md`$fg(x)$ means do $g$ first, then $f$.`,
      md`$f^{-1}$ exists only if $f$ is one-to-one; its graph is the reflection of $f$ in $y = x$, domain of $f^{-1}$ = range of $f$.`,
      md`$|x|$ is the distance from 0. $y = |f(x)|$ reflects the negative parts up; $y = f(|x|)$ mirrors the right half to the left.`,
      md`Solve $|f(x)| = g(x)$ by considering $f(x) = g(x)$ and $-f(x) = g(x)$, then check each solution.`,
    ],
    example: {
      q: md`$f(x) = 2x + 3$, $g(x) = x^{2}$. Find $fg(x)$ and $f^{-1}(x)$.`,
      steps: [md`$fg(x) = f(x^{2}) = 2x^{2} + 3$.`, md`For $f^{-1}$: $y = 2x + 3 \Rightarrow x = \frac{y - 3}{2}$.`, md`$f^{-1}(x) = \dfrac{x - 3}{2}$.`],
    },
    mistakes: ['Doing the composite in the wrong order.', 'Not checking modulus solutions — some are false.'],
    tips: ['Always give the domain of an inverse function when asked: it is the range of f.'],
  },
  'P2.3': {
    intro: 'Arithmetic and geometric sequences and series, sums to infinity, sigma notation and recurrence relations.',
    key: [
      md`Arithmetic: $u_{n} = a + (n - 1)d$, constant difference.`,
      md`Geometric: $u_{n} = ar^{n-1}$, constant ratio.`,
      md`A geometric series converges when $|r| < 1$, to $\frac{a}{1 - r}$.`,
      md`$\sum_{r=1}^{n}$: write out the first few terms to see the pattern and count the terms.`,
      md`Recurrence $u_{n+1} = f(u_{n})$: increasing, decreasing or periodic.`,
    ],
    formulae: [
      ['Arithmetic series (booklet)', md`$S_{n} = \frac{1}{2}n\left[2a + (n - 1)d\right] = \frac{1}{2}n(a + l)$`],
      ['Geometric series (booklet)', md`$S_{n} = \dfrac{a(1 - r^{n})}{1 - r}$, $\quad S_{\infty} = \dfrac{a}{1 - r}$, $|r| < 1$`],
      ['nth terms (learn them)', md`$u_{n} = a + (n - 1)d$, $\quad u_{n} = ar^{n-1}$`],
    ],
    example: {
      q: md`A geometric series has first term $12$ and sum to infinity $48$. Find the common ratio.`,
      steps: [md`$\dfrac{12}{1 - r} = 48$.`, md`$1 - r = \frac{1}{4} \Rightarrow r = \frac{3}{4}$.`],
    },
    mistakes: [md`Counting terms in $\sum_{r=3}^{10}$ as 7 instead of 8.`, md`Using $S_{\infty}$ when $|r| \geqslant 1$.`],
    tips: ['To find n from Sₙ > k, use logs, and remember dividing by a negative log flips the inequality.'],
  },
  'P2.4': {
    intro: 'The binomial expansion for any rational power, its range of validity, and using partial fractions.',
    key: [
      md`$(1 + x)^{n}$ for negative or fractional $n$ is an infinite series, valid for $|x| < 1$.`,
      md`$(a + bx)^{n} = a^{n}\left(1 + \frac{b}{a}x\right)^{n}$, valid for $\left|\frac{bx}{a}\right| < 1$, i.e. $|x| < \left|\frac{a}{b}\right|$.`,
      'For a fraction with two factors, split into partial fractions, expand each, then add.',
      'Use the expansion to approximate by choosing x small and inside the range of validity.',
    ],
    formulae: [['General binomial (booklet)', md`$(1 + x)^{n} = 1 + nx + \dfrac{n(n - 1)}{2!}x^{2} + \dfrac{n(n - 1)(n - 2)}{3!}x^{3} + \cdots$, $|x| < 1$`]],
    example: {
      q: md`Expand $(4 - x)^{\frac{1}{2}}$ up to $x^{2}$ and state when it is valid.`,
      steps: [md`$(4 - x)^{\frac{1}{2}} = 2\left(1 - \frac{x}{4}\right)^{\frac{1}{2}}$.`, md`$= 2\left[1 + \frac{1}{2}\left(-\frac{x}{4}\right) + \frac{\frac{1}{2}(-\frac{1}{2})}{2}\left(-\frac{x}{4}\right)^{2} + \cdots\right]$.`, md`$= 2 - \frac{x}{4} - \frac{x^{2}}{64} + \cdots$, valid for $|x| < 4$.`],
    },
    mistakes: [md`Forgetting $a^{n}$ outside the bracket ($4^{\frac{1}{2}} = 2$).`, 'Losing a minus sign inside the bracket.'],
    tips: ['State the range of validity even if not asked — it is often a mark.'],
  },
  'P2.5': {
    intro: 'Radian measure, arcs, sectors and segments, and the small angle approximations.',
    key: [
      md`$\pi$ radians $= 180^{\circ}$.`,
      md`Arc length $s = r\theta$, sector area $A = \frac{1}{2}r^{2}\theta$ ($\theta$ in radians).`,
      md`Segment = sector − triangle $= \frac{1}{2}r^{2}(\theta - \sin\theta)$.`,
      md`For small $\theta$ (radians): $\sin\theta \approx \theta$, $\tan\theta \approx \theta$, $\cos\theta \approx 1 - \frac{\theta^{2}}{2}$.`,
      'Trig equations in radians: give answers in terms of π where possible, in the interval asked.',
    ],
    formulae: [
      ['Arc and sector (learn them)', md`$s = r\theta$, $\quad A = \frac{1}{2}r^{2}\theta$`],
      ['Small angles (booklet)', md`$\sin\theta \approx \theta$, $\quad \cos\theta \approx 1 - \frac{\theta^{2}}{2}$, $\quad \tan\theta \approx \theta$`],
    ],
    example: {
      q: md`A sector has radius $6$ cm and perimeter $20$ cm. Find its area.`,
      steps: [md`Perimeter $= 2r + r\theta = 12 + 6\theta = 20 \Rightarrow \theta = \frac{4}{3}$.`, md`Area $= \frac{1}{2}(36)\left(\frac{4}{3}\right) = 24$ cm².`],
    },
    mistakes: ['Calculator in degree mode.', 'Forgetting the two radii in a sector’s perimeter.'],
    tips: ['If an answer should be exact, leave π in it.'],
  },
  'P2.6': {
    intro: 'Secant, cosecant and cotangent, their graphs and identities, and the inverse trig functions.',
    key: [
      md`$\sec x = \frac{1}{\cos x}$, $\operatorname{cosec} x = \frac{1}{\sin x}$, $\cot x = \frac{1}{\tan x}$.`,
      md`Divide $\sin^{2} + \cos^{2} = 1$ by $\cos^{2}$: $1 + \tan^{2}x = \sec^{2}x$; by $\sin^{2}$: $1 + \cot^{2}x = \operatorname{cosec}^{2}x$.`,
      md`$\arcsin$ and $\arctan$ give values in $\left[-\frac{\pi}{2}, \frac{\pi}{2}\right]$; $\arccos$ in $[0, \pi]$.`,
      'Graphs of sec and cosec have asymptotes where cos or sin is 0, and never lie between −1 and 1.',
    ],
    formulae: [['Identities (learn them)', md`$1 + \tan^{2}x \equiv \sec^{2}x$, $\quad 1 + \cot^{2}x \equiv \operatorname{cosec}^{2}x$`]],
    example: {
      q: md`Solve $\sec^{2}x = 3\tan x - 1$ for $0 \leqslant x < 360^{\circ}$.`,
      steps: [md`$1 + \tan^{2}x = 3\tan x - 1 \Rightarrow \tan^{2}x - 3\tan x + 2 = 0$.`, md`$(\tan x - 1)(\tan x - 2) = 0$.`, md`$\tan x = 1$: $x = 45^{\circ}, 225^{\circ}$; $\tan x = 2$: $x = 63.4^{\circ}, 243.4^{\circ}$.`],
    },
    mistakes: [md`$\sec x$ is $\frac{1}{\cos x}$, not $\cos^{-1}x$.`, 'Using the wrong principal range for an inverse function.'],
    tips: ['In proofs, start from the more complicated side and turn everything into sin and cos.'],
  },
  'P2.7': {
    intro: 'Addition and double-angle formulae, a cos x + b sin x as a single wave, and modelling with trig.',
    key: [
      md`Addition formulae (in the booklet) give exact values, e.g. $\sin 75^{\circ} = \sin(45^{\circ} + 30^{\circ})$.`,
      md`Double angles: $\sin 2A = 2\sin A\cos A$; $\cos 2A = \cos^{2}A - \sin^{2}A = 2\cos^{2}A - 1 = 1 - 2\sin^{2}A$.`,
      md`$a\cos x + b\sin x = R\cos(x - \alpha)$ with $R = \sqrt{a^{2} + b^{2}}$, $\tan\alpha = \frac{b}{a}$.`,
      md`The max of $R\cos(x - \alpha)$ is $R$ when $x = \alpha$ — great for modelling questions.`,
    ],
    formulae: [
      ['Addition formulae (booklet)', md`$\sin(A \pm B) = \sin A\cos B \pm \cos A\sin B$, $\quad \cos(A \pm B) = \cos A\cos B \mp \sin A\sin B$`],
      ['Double angles (learn them)', md`$\sin 2A = 2\sin A\cos A$, $\quad \cos 2A = 2\cos^{2}A - 1$, $\quad \tan 2A = \dfrac{2\tan A}{1 - \tan^{2}A}$`],
    ],
    example: {
      q: md`Write $3\cos x + 4\sin x$ in the form $R\cos(x - \alpha)$, $0 < \alpha < 90^{\circ}$.`,
      steps: [md`$R\cos\alpha = 3$, $R\sin\alpha = 4$.`, md`$R = \sqrt{9 + 16} = 5$, $\tan\alpha = \frac{4}{3} \Rightarrow \alpha = 53.1^{\circ}$.`, md`$5\cos(x - 53.1^{\circ})$.`],
    },
    mistakes: [md`Mixing up which of $R\cos\alpha$ and $R\sin\alpha$ is $a$ and which is $b$.`, 'Using the wrong version of cos 2A for the job.'],
    tips: [md`Choose the $\cos 2A$ form that leaves only one trig function.`],
  },
  'P2.8': {
    intro: 'Curves given by parametric equations: converting to Cartesian form, sketching, and modelling.',
    key: [
      md`$x = f(t)$, $y = g(t)$: each value of $t$ gives a point.`,
      'To get a Cartesian equation, eliminate t (rearrange one equation, or use a trig identity).',
      md`The domain and range of the Cartesian form come from the values $x$ and $y$ can take for the allowed $t$.`,
      md`Intersections with a line: substitute $x(t)$, $y(t)$ into the line and solve for $t$.`,
      md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = \dfrac{\mathrm{d}y/\mathrm{d}t}{\mathrm{d}x/\mathrm{d}t}$ (from Chapter 9).`,
    ],
    example: {
      q: md`Find a Cartesian equation of $x = 3\cos t$, $y = 2\sin t$.`,
      steps: [md`$\cos t = \frac{x}{3}$, $\sin t = \frac{y}{2}$.`, md`$\cos^{2}t + \sin^{2}t = 1 \Rightarrow \frac{x^{2}}{9} + \frac{y^{2}}{4} = 1$.`],
    },
    mistakes: ['Forgetting the restricted domain when t is limited.'],
    tips: ['If a double angle appears, write it in terms of single angles before eliminating.'],
  },
  'P2.9': {
    intro: 'Differentiating trig, exponential and log functions; chain, product and quotient rules; implicit and parametric differentiation.',
    key: [
      md`$\frac{\mathrm{d}}{\mathrm{d}x}\sin x = \cos x$, $\frac{\mathrm{d}}{\mathrm{d}x}\cos x = -\sin x$, $\frac{\mathrm{d}}{\mathrm{d}x}e^{x} = e^{x}$, $\frac{\mathrm{d}}{\mathrm{d}x}\ln x = \frac{1}{x}$ (x in radians).`,
      md`Chain rule: $\frac{\mathrm{d}y}{\mathrm{d}x} = \frac{\mathrm{d}y}{\mathrm{d}u}\frac{\mathrm{d}u}{\mathrm{d}x}$.`,
      md`Product rule: $(uv)' = u'v + uv'$. Quotient rule (booklet): $\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^{2}}$.`,
      md`Implicit: differentiate each term with respect to $x$; $y^{2} \to 2y\frac{\mathrm{d}y}{\mathrm{d}x}$; then make $\frac{\mathrm{d}y}{\mathrm{d}x}$ the subject.`,
      md`Second derivative and concavity: $f''(x) > 0$ convex, $< 0$ concave; a point of inflection is where concavity changes.`,
    ],
    formulae: [
      ['Chain and product rules (learn them)', md`$\dfrac{\mathrm{d}y}{\mathrm{d}x} = \dfrac{\mathrm{d}y}{\mathrm{d}u} \times \dfrac{\mathrm{d}u}{\mathrm{d}x}$, $\quad \dfrac{\mathrm{d}}{\mathrm{d}x}(uv) = u\dfrac{\mathrm{d}v}{\mathrm{d}x} + v\dfrac{\mathrm{d}u}{\mathrm{d}x}$`],
      ['Quotient rule (booklet)', md`$\dfrac{\mathrm{d}}{\mathrm{d}x}\left(\dfrac{u}{v}\right) = \dfrac{v\frac{\mathrm{d}u}{\mathrm{d}x} - u\frac{\mathrm{d}v}{\mathrm{d}x}}{v^{2}}$`],
    ],
    example: {
      q: md`Differentiate $y = x^{2}e^{3x}$.`,
      steps: [md`Product: $u = x^{2}$, $v = e^{3x}$; $u' = 2x$, $v' = 3e^{3x}$ (chain rule).`, md`$\frac{\mathrm{d}y}{\mathrm{d}x} = 2xe^{3x} + 3x^{2}e^{3x} = xe^{3x}(2 + 3x)$.`],
    },
    mistakes: ['Forgetting to multiply by the derivative of the inside (chain rule).', md`In implicit differentiation, differentiating $xy$ as $\frac{\mathrm{d}y}{\mathrm{d}x}$ instead of using the product rule.`],
    tips: ['Factorise the final answer — it makes the next part (often = 0) much easier.'],
  },
  'P2.10': {
    intro: 'Finding roots numerically: change of sign, iteration, and Newton–Raphson.',
    key: [
      md`If $f$ is continuous and $f(a)$, $f(b)$ have opposite signs, there is a root between $a$ and $b$.`,
      'A change of sign can fail: asymptotes, or two roots close together.',
      md`Iteration $x_{n+1} = g(x_{n})$ from a rearrangement of $f(x) = 0$; staircase or cobweb diagrams show convergence.`,
      md`Newton–Raphson fails if $f'(x_{n}) = 0$ (horizontal tangent) or the start is far from the root.`,
    ],
    formulae: [['Newton–Raphson (booklet)', md`$x_{n+1} = x_{n} - \dfrac{f(x_{n})}{f'(x_{n})}$`]],
    example: {
      q: md`Show that $f(x) = x^{3} - 2x - 5$ has a root between $2$ and $3$, then apply Newton–Raphson once from $x_{0} = 2$.`,
      steps: [md`$f(2) = -1 < 0$, $f(3) = 16 > 0$: a change of sign and $f$ is continuous, so there is a root in $(2, 3)$.`, md`$f'(x) = 3x^{2} - 2$, $f'(2) = 10$.`, md`$x_{1} = 2 - \frac{-1}{10} = 2.1$.`],
    },
    mistakes: ['Not stating "f is continuous" and "change of sign" in the conclusion.'],
    tips: ['To show a root is correct to n d.p., test the bounds either side (e.g. 2.0945 and 2.0955).'],
  },
  'P2.11': {
    intro: 'Integrating standard functions, by substitution and by parts, partial fractions, areas, the trapezium rule and differential equations.',
    key: [
      md`Standard: $\int e^{kx}\,\mathrm{d}x = \frac{1}{k}e^{kx}$, $\int \frac{1}{x}\,\mathrm{d}x = \ln|x|$, $\int \cos kx\,\mathrm{d}x = \frac{1}{k}\sin kx$.`,
      md`Reverse chain rule: $\int \frac{f'(x)}{f(x)}\,\mathrm{d}x = \ln|f(x)| + c$.`,
      md`By parts: $\int u\,\frac{\mathrm{d}v}{\mathrm{d}x}\,\mathrm{d}x = uv - \int v\,\frac{\mathrm{d}u}{\mathrm{d}x}\,\mathrm{d}x$ — choose $u$ to get simpler when differentiated (but $\ln x$ is usually $u$).`,
      'Substitution: change dx and the limits too.',
      md`Separable differential equations: $\int \frac{1}{g(y)}\,\mathrm{d}y = \int f(x)\,\mathrm{d}x$, then use the initial condition.`,
      md`Use identities to integrate $\sin^{2}x$ and $\cos^{2}x$: $\cos^{2}x = \frac{1}{2}(1 + \cos 2x)$.`,
    ],
    formulae: [
      ['By parts (booklet)', md`$\displaystyle\int u\frac{\mathrm{d}v}{\mathrm{d}x}\,\mathrm{d}x = uv - \int v\frac{\mathrm{d}u}{\mathrm{d}x}\,\mathrm{d}x$`],
      ['Trapezium rule (booklet)', md`$\displaystyle\int_{a}^{b} y\,\mathrm{d}x \approx \frac{1}{2}h\left\{(y_{0} + y_{n}) + 2(y_{1} + \cdots + y_{n-1})\right\}$`],
    ],
    example: {
      q: md`Find $\displaystyle\int x\cos x\,\mathrm{d}x$.`,
      steps: [md`$u = x$, $\frac{\mathrm{d}v}{\mathrm{d}x} = \cos x$ → $\frac{\mathrm{d}u}{\mathrm{d}x} = 1$, $v = \sin x$.`, md`$= x\sin x - \int \sin x\,\mathrm{d}x$.`, md`$= x\sin x + \cos x + c$.`],
    },
    mistakes: ['Forgetting to change the limits in a substitution.', md`$\int \frac{1}{2x}\,\mathrm{d}x = \frac{1}{2}\ln|x|$, not $\ln|2x|$ (they differ only by a constant, but check the form asked).`],
    tips: ['Differentiate your answer in your head to check it.'],
  },
  'P2.12': {
    intro: 'Vectors in three dimensions: coordinates, magnitudes, and geometric problems.',
    key: [
      md`$\mathbf{a} = x\mathbf{i} + y\mathbf{j} + z\mathbf{k}$ has magnitude $\sqrt{x^{2} + y^{2} + z^{2}}$.`,
      md`Distance between points: $\sqrt{(x_{2} - x_{1})^{2} + (y_{2} - y_{1})^{2} + (z_{2} - z_{1})^{2}}$.`,
      md`The angle with the x-axis: $\cos\theta_{x} = \frac{x}{|\mathbf{a}|}$ (similarly for y and z).`,
      'Same techniques as 2D: parallel = multiple, collinear = parallel and sharing a point.',
    ],
    example: {
      q: md`Find $|\overrightarrow{AB}|$ for $A(1, 2, -1)$ and $B(4, -2, 11)$.`,
      steps: [md`$\overrightarrow{AB} = 3\mathbf{i} - 4\mathbf{j} + 12\mathbf{k}$.`, md`$|\overrightarrow{AB}| = \sqrt{9 + 16 + 144} = 13$.`],
    },
    mistakes: ['Sign errors when subtracting position vectors.'],
    tips: ['Write vectors as columns in your working — it keeps components lined up.'],
  },
};
