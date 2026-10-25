/** Revision notes: Pure Year 1. */
import { md, type TopicNotes } from './types';

export const P1: Record<string, TopicNotes> = {
  'P1.1': {
    intro: 'The algebra everything else is built on: index laws, expanding and factorising, and working exactly with surds.',
    key: [
      md`Index laws: multiply → add powers, divide → subtract, power of a power → multiply.`,
      md`$a^{-n} = \dfrac{1}{a^{n}}$ and $a^{\frac{m}{n}} = \left(\sqrt[n]{a}\right)^{m}$ — do the root first, it keeps numbers small.`,
      md`Factorise fully: take out the highest common factor first, then look for a quadratic or the difference of two squares $a^{2} - b^{2} = (a - b)(a + b)$.`,
      md`Simplify surds by taking out square factors: $\sqrt{48} = \sqrt{16}\sqrt{3} = 4\sqrt{3}$.`,
      md`Rationalise $\dfrac{1}{\sqrt{a}}$ by multiplying top and bottom by $\sqrt{a}$, and $\dfrac{1}{a + \sqrt{b}}$ by the conjugate $a - \sqrt{b}$.`,
    ],
    formulae: [
      ['Index laws', md`$a^{m} \times a^{n} = a^{m+n}$, $\quad a^{m} \div a^{n} = a^{m-n}$, $\quad (a^{m})^{n} = a^{mn}$`],
      ['Zero and negative powers', md`$a^{0} = 1$, $\quad a^{-n} = \dfrac{1}{a^{n}}$`],
      ['Surds', md`$\sqrt{ab} = \sqrt{a}\sqrt{b}$, $\quad (\sqrt{a} + \sqrt{b})(\sqrt{a} - \sqrt{b}) = a - b$`],
    ],
    example: {
      q: md`Rationalise the denominator of $\dfrac{6}{3 - \sqrt{3}}$, giving your answer in the form $a + b\sqrt{3}$.`,
      steps: [
        md`Multiply top and bottom by the conjugate $3 + \sqrt{3}$.`,
        md`Denominator: $(3 - \sqrt{3})(3 + \sqrt{3}) = 9 - 3 = 6$.`,
        md`Numerator: $6(3 + \sqrt{3}) = 18 + 6\sqrt{3}$.`,
        md`So $\dfrac{18 + 6\sqrt{3}}{6} = 3 + \sqrt{3}$.`,
      ],
    },
    mistakes: [md`$\sqrt{a + b} \neq \sqrt{a} + \sqrt{b}$.`, md`$(-8)^{\frac{2}{3}} = 4$, but $-8^{\frac{2}{3}} = -4$: brackets matter.`, 'Stopping before factorising fully (e.g. leaving a common factor inside the brackets).'],
    tips: ['"Show that" or "exact" means no calculator decimals: keep surds.', 'Write each index step on its own line: the method marks are for the steps.'],
  },
  'P1.2': {
    intro: 'Solving and sketching quadratics, and using the discriminant to say how many roots there are.',
    key: [
      'Solve by factorising, completing the square, or the formula — choose the quickest.',
      md`Completing the square: $x^{2} + bx + c = \left(x + \frac{b}{2}\right)^{2} - \left(\frac{b}{2}\right)^{2} + c$. With $a \neq 1$, take $a$ out of the $x$ terms first.`,
      md`From $a(x + p)^{2} + q$: the turning point is $(-p, q)$, a minimum if $a > 0$.`,
      md`Discriminant $b^{2} - 4ac$: $> 0$ two real roots, $= 0$ one repeated root, $< 0$ no real roots.`,
      'Sketches need the shape, the y-intercept, the roots and the turning point.',
    ],
    formulae: [
      ['Quadratic formula (learn it)', md`$x = \dfrac{-b \pm \sqrt{b^{2} - 4ac}}{2a}$`],
      ['Discriminant', md`$b^{2} - 4ac$`],
    ],
    example: {
      q: md`Find the range of values of $k$ for which $x^{2} + kx + 9 = 0$ has two distinct real roots.`,
      steps: [md`Two distinct real roots: $b^{2} - 4ac > 0$.`, md`$k^{2} - 4(1)(9) > 0 \Rightarrow k^{2} > 36$.`, md`Critical values $k = \pm 6$; $k^{2} > 36$ outside them.`, md`$k < -6$ or $k > 6$.`],
    },
    mistakes: [md`Writing $k > \pm 6$: a squared inequality gives two regions.`, 'Forgetting to take out the coefficient of x² before completing the square.', 'Sign slips in the turning point: $(x - 3)^{2}$ has its vertex at $x = +3$.'],
    tips: ['If the question says "hence", use the completed square form you just found.', 'Label every sketch with the coordinates of where it meets the axes.'],
  },
  'P1.3': {
    intro: 'Simultaneous equations (including one quadratic), linear and quadratic inequalities, and regions on graphs.',
    key: [
      'Linear and quadratic: rearrange the linear one for a variable and substitute into the quadratic.',
      'The number of solutions = the number of times the graphs meet; the discriminant of the combined equation tells you.',
      'Multiplying or dividing an inequality by a negative number flips the sign.',
      'Quadratic inequalities: find the critical values, sketch, then read off the region above or below the axis.',
      'Regions: solid lines for ⩽ and ⩾, dashed for < and >; shade (or label) the region asked for.',
    ],
    example: {
      q: md`Solve $x^{2} - x - 12 < 0$.`,
      steps: [md`Critical values: $x^{2} - x - 12 = (x - 4)(x + 3) = 0 \Rightarrow x = -3, 4$.`, 'The parabola is U-shaped, so it is below the axis between the roots.', md`$-3 < x < 4$ (or $\{x : -3 < x < 4\}$).`],
    },
    mistakes: ['Giving the answer as two separate inequalities when it should be one interval (or the other way round).', 'Dividing by a variable that could be negative.'],
    tips: ['Always sketch the quadratic — it takes seconds and stops you choosing the wrong region.', 'Set notation is acceptable: $\\{x : x < -2\\} \\cup \\{x : x > 5\\}$.'],
  },
  'P1.4': {
    intro: 'Sketching cubics, quartics and reciprocal graphs, and how graphs move when the function changes.',
    key: [
      'Cubic: factorise to find the roots; a repeated root touches the axis. Positive x³ term: bottom-left to top-right.',
      md`Reciprocal graphs $y = \frac{k}{x}$ and $y = \frac{k}{x^{2}}$ have asymptotes $x = 0$ and $y = 0$.`,
      md`$y = f(x) + a$: up by $a$. $y = f(x + a)$: left by $a$.`,
      md`$y = af(x)$: vertical stretch, scale factor $a$. $y = f(ax)$: horizontal stretch, scale factor $\frac{1}{a}$.`,
      md`$y = -f(x)$ reflects in the x-axis; $y = f(-x)$ reflects in the y-axis.`,
      'The points where curves meet are the solutions of f(x) = g(x).',
    ],
    example: {
      q: md`The point $(2, 5)$ lies on $y = f(x)$. Find where it moves under $y = 3f(x - 1)$.`,
      steps: [md`$f(x - 1)$: right by $1$ → $(3, 5)$.`, md`$3f(\ldots)$: y-coordinates × 3 → $(3, 15)$.`],
    },
    mistakes: [md`Moving $f(x + 2)$ to the right: inside the bracket does the opposite.`, md`Treating $f(2x)$ as a stretch by 2 — it is scale factor $\frac{1}{2}$.`],
    tips: ['Show where a transformed curve meets the axes and give the new asymptotes.', 'Do inside-the-bracket changes on x, outside changes on y.'],
  },
  'P1.5': {
    intro: 'Equations of straight lines, parallel and perpendicular lines, and lengths and areas in coordinate geometry.',
    key: [
      md`Gradient $m = \dfrac{y_{2} - y_{1}}{x_{2} - x_{1}}$.`,
      md`Line through $(x_{1}, y_{1})$ with gradient $m$: $y - y_{1} = m(x - x_{1})$.`,
      md`Parallel lines have equal gradients; perpendicular gradients multiply to $-1$.`,
      md`Distance between points: $\sqrt{(x_{2} - x_{1})^{2} + (y_{2} - y_{1})^{2}}$.`,
      md`Forms: $y = mx + c$, or $ax + by + c = 0$ with integers $a, b, c$.`,
    ],
    formulae: [
      ['Line through a point (learn it)', md`$y - y_{1} = m(x - x_{1})$`],
      ['Perpendicular (learn it)', md`$m_{1}m_{2} = -1$`],
    ],
    example: {
      q: md`Find the equation of the line through $(2, -1)$ perpendicular to $y = 4x + 3$, in the form $ax + by + c = 0$.`,
      steps: [md`Perpendicular gradient: $-\frac{1}{4}$.`, md`$y + 1 = -\frac{1}{4}(x - 2)$.`, md`$4y + 4 = -x + 2 \Rightarrow x + 4y + 2 = 0$.`],
    },
    mistakes: ['Using the negative gradient instead of the negative reciprocal.', 'Leaving fractions when integers a, b, c are asked for.'],
    tips: ['For a triangle area, a right angle (perpendicular sides) gives ½ × base × height straight away.'],
  },
  'P1.6': {
    intro: 'Circles in coordinate geometry: equations, centres and radii, tangents and chords.',
    key: [
      md`Circle with centre $(a, b)$ and radius $r$: $(x - a)^{2} + (y - b)^{2} = r^{2}$.`,
      md`From $x^{2} + y^{2} + 2fx + 2gy + c = 0$, complete the square in x and y to find the centre and radius.`,
      'A tangent is perpendicular to the radius at the point of contact.',
      'The perpendicular bisector of a chord passes through the centre.',
      'Line meets circle: substitute and use the discriminant (2, 1 or 0 points).',
      'An angle in a semicircle is a right angle.',
    ],
    example: {
      q: md`Find the centre and radius of $x^{2} + y^{2} - 6x + 4y - 12 = 0$.`,
      steps: [md`$(x - 3)^{2} - 9 + (y + 2)^{2} - 4 - 12 = 0$.`, md`$(x - 3)^{2} + (y + 2)^{2} = 25$.`, md`Centre $(3, -2)$, radius $5$.`],
    },
    mistakes: [md`Signs of the centre: $(x + 2)^{2}$ means $a = -2$.`, md`Giving $r^{2}$ as the radius.`],
    tips: ['Tangent questions: find the radius gradient first, then use the perpendicular gradient.'],
  },
  'P1.7': {
    intro: 'Algebraic fractions, polynomial division, the factor theorem, and the methods of proof.',
    key: [
      md`Factor theorem: $(x - a)$ is a factor of $f(x)$ exactly when $f(a) = 0$.`,
      'Divide a cubic by a known factor (long division or comparing coefficients) to get a quadratic, then factorise that.',
      'Simplify algebraic fractions by factorising top and bottom and cancelling common factors.',
      'Proof by deduction: start from known facts, use logical steps, end with a conclusion.',
      'Proof by exhaustion: check every case. Disproof by counter-example: one example is enough.',
    ],
    example: {
      q: md`Show that $(x - 2)$ is a factor of $f(x) = x^{3} - 3x^{2} - 4x + 12$ and factorise $f(x)$ fully.`,
      steps: [md`$f(2) = 8 - 12 - 8 + 12 = 0$, so $(x - 2)$ is a factor.`, md`$f(x) = (x - 2)(x^{2} - x - 6)$.`, md`$= (x - 2)(x - 3)(x + 2)$.`],
    },
    mistakes: ['Not writing a conclusion after showing f(a) = 0 ("so (x − 2) is a factor").', 'Stopping at a quadratic factor that still factorises.'],
    tips: ['In proofs write "Let n be an integer…" and finish with a sentence that answers the question.'],
  },
  'P1.8': {
    intro: 'Expanding (a + b)ⁿ for positive whole numbers n, and using it to estimate.',
    key: [
      md`$\binom{n}{r} = \dfrac{n!}{r!(n - r)!}$ is the number of ways of choosing $r$ from $n$ (row $n$ of Pascal's triangle).`,
      md`The term in $x^{r}$ in $(a + bx)^{n}$ is $\binom{n}{r}a^{n-r}(bx)^{r}$.`,
      'Keep brackets round negative and fractional terms: (−2x)³ = −8x³.',
      'Estimating: choose x so the bracket matches the number, e.g. 1.02 = 1 + 2(0.01).',
    ],
    formulae: [['Binomial expansion (booklet)', md`$(a + b)^{n} = a^{n} + \binom{n}{1}a^{n-1}b + \binom{n}{2}a^{n-2}b^{2} + \cdots + b^{n}$`]],
    example: {
      q: md`Find the first three terms, in ascending powers of $x$, of $(2 - 3x)^{5}$.`,
      steps: [md`$2^{5} = 32$.`, md`$\binom{5}{1}2^{4}(-3x) = 5 \times 16 \times (-3x) = -240x$.`, md`$\binom{5}{2}2^{3}(-3x)^{2} = 10 \times 8 \times 9x^{2} = 720x^{2}$.`, md`$32 - 240x + 720x^{2}$.`],
    },
    mistakes: ['Dropping the minus sign on odd powers.', 'Forgetting to raise the coefficient: (3x)² = 9x², not 3x².'],
    tips: ['Write out each term with its binomial coefficient before simplifying — method marks.'],
  },
  'P1.9': {
    intro: 'Sine and cosine rules, triangle areas, and graphs of sin, cos and tan.',
    key: [
      md`Sine rule $\dfrac{a}{\sin A} = \dfrac{b}{\sin B}$: use with an angle and its opposite side.`,
      md`Cosine rule $a^{2} = b^{2} + c^{2} - 2bc\cos A$: two sides and the angle between, or three sides.`,
      md`Area $= \tfrac{1}{2}ab\sin C$.`,
      md`The ambiguous case: $\sin x = k$ gives $x$ and $180^{\circ} - x$ — check both make a triangle.`,
      md`$y = \sin x$, $\cos x$ have period $360^{\circ}$; $\tan x$ has period $180^{\circ}$ and asymptotes at $90^{\circ} + 180^{\circ}n$.`,
    ],
    formulae: [
      ['Sine rule (learn it)', md`$\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$`],
      ['Cosine rule (learn it)', md`$a^{2} = b^{2} + c^{2} - 2bc\cos A$`],
      ['Area of a triangle (learn it)', md`$\tfrac{1}{2}ab\sin C$`],
    ],
    example: {
      q: md`In triangle $ABC$, $AB = 7$ cm, $AC = 5$ cm and angle $A = 50^{\circ}$. Find $BC$.`,
      steps: [md`Two sides and the included angle: cosine rule.`, md`$BC^{2} = 7^{2} + 5^{2} - 2(7)(5)\cos 50^{\circ} = 74 - 44.99\ldots = 29.00\ldots$`, md`$BC = 5.39$ cm (3 s.f.).`],
    },
    mistakes: ['Calculator in radians when the question is in degrees.', 'Rounding in the middle of a calculation.'],
    tips: ['Label the triangle with a, b, c opposite A, B, C before choosing a rule.'],
  },
  'P1.10': {
    intro: 'Exact values, the two key identities, and solving trigonometric equations in a given interval.',
    key: [
      md`$\tan\theta \equiv \dfrac{\sin\theta}{\cos\theta}$ and $\sin^{2}\theta + \cos^{2}\theta \equiv 1$.`,
      'CAST (or the graphs) gives the second solution: sin x = k → 180° − x; cos x = k → 360° − x; tan x = k → x + 180°.',
      md`For $\sin 2x = k$ in $0 \leqslant x < 360^{\circ}$, solve for $2x$ in $0 \leqslant 2x < 720^{\circ}$ first, then halve.`,
      md`Quadratics in $\sin x$: replace $\cos^{2} x$ with $1 - \sin^{2} x$, factorise, reject values outside $[-1, 1]$.`,
      'Exact values: sin 30° = ½, cos 30° = √3/2, tan 45° = 1, sin 60° = √3/2, cos 60° = ½.',
    ],
    formulae: [
      ['Identities (learn them)', md`$\sin^{2}\theta + \cos^{2}\theta \equiv 1$, $\quad \tan\theta \equiv \dfrac{\sin\theta}{\cos\theta}$`],
    ],
    example: {
      q: md`Solve $2\cos^{2}x + 3\sin x = 3$ for $0 \leqslant x < 360^{\circ}$.`,
      steps: [md`$2(1 - \sin^{2}x) + 3\sin x - 3 = 0 \Rightarrow 2\sin^{2}x - 3\sin x + 1 = 0$.`, md`$(2\sin x - 1)(\sin x - 1) = 0$, so $\sin x = \frac{1}{2}$ or $\sin x = 1$.`, md`$x = 30^{\circ}, 150^{\circ}, 90^{\circ}$.`],
    },
    mistakes: ['Dividing both sides by sin x or cos x and losing solutions — factorise instead.', 'Missing solutions after adjusting the interval for 2x or (x − 30°).'],
    tips: ['List all solutions in order at the end, and check each lies in the interval.'],
  },
  'P1.11': {
    intro: 'Vectors in two dimensions: magnitude and direction, position vectors, and geometric proofs.',
    key: [
      md`$\mathbf{a} = x\mathbf{i} + y\mathbf{j}$ has magnitude $\sqrt{x^{2} + y^{2}}$ and direction $\tan^{-1}\frac{y}{x}$ (check the quadrant).`,
      md`A unit vector in the direction of $\mathbf{a}$ is $\dfrac{\mathbf{a}}{|\mathbf{a}|}$.`,
      md`$\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$ (position vectors from the origin).`,
      md`Parallel vectors are multiples of each other; collinear points share a direction and a point.`,
      'In geometry problems, write a route two ways and compare coefficients.',
    ],
    example: {
      q: md`Find the unit vector in the direction of $3\mathbf{i} - 4\mathbf{j}$.`,
      steps: [md`$|3\mathbf{i} - 4\mathbf{j}| = \sqrt{9 + 16} = 5$.`, md`Unit vector $= \frac{3}{5}\mathbf{i} - \frac{4}{5}\mathbf{j}$.`],
    },
    mistakes: [md`$\overrightarrow{AB} = \mathbf{a} - \mathbf{b}$ (wrong way round).`, 'Angle measured from the wrong axis.'],
    tips: ['Draw a sketch for every direction question and say which angle you have found.'],
  },
  'P1.12': {
    intro: 'Differentiating polynomials and powers of x, and using the gradient for tangents, normals and stationary points.',
    key: [
      md`$\dfrac{\mathrm{d}}{\mathrm{d}x}(x^{n}) = nx^{n-1}$ — rewrite roots and fractions as powers first.`,
      md`From first principles: $f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}$.`,
      'Tangent: gradient f′(a). Normal: gradient −1/f′(a). Both through (a, f(a)).',
      md`Stationary points: $\frac{\mathrm{d}y}{\mathrm{d}x} = 0$. Nature: $\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}} > 0$ minimum, $< 0$ maximum.`,
      md`Increasing where $f'(x) > 0$, decreasing where $f'(x) < 0$.`,
    ],
    formulae: [
      ['Derivative of xⁿ (learn it)', md`$\dfrac{\mathrm{d}}{\mathrm{d}x}x^{n} = nx^{n-1}$`],
      ['First principles (booklet)', md`$f'(x) = \displaystyle\lim_{h \to 0}\frac{f(x + h) - f(x)}{h}$`],
    ],
    example: {
      q: md`Find the stationary points of $y = x^{3} - 3x + 1$ and decide their nature.`,
      steps: [md`$\frac{\mathrm{d}y}{\mathrm{d}x} = 3x^{2} - 3 = 0 \Rightarrow x = \pm 1$.`, md`$x = 1$: $y = -1$; $x = -1$: $y = 3$.`, md`$\frac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}} = 6x$: at $x = 1$ it is $6 > 0$ (minimum), at $x = -1$ it is $-6 < 0$ (maximum).`, md`Minimum $(1, -1)$, maximum $(-1, 3)$.`],
    },
    mistakes: [md`Differentiating $\frac{1}{x^{2}}$ without rewriting it as $x^{-2}$.`, 'Forgetting to find the y-coordinate of a stationary point.'],
    tips: ['State the conclusion of the second-derivative test in words ("so it is a minimum").'],
  },
  'P1.13': {
    intro: 'Integrating powers of x, finding a curve from its gradient, and areas with definite integrals.',
    key: [
      md`$\int x^{n}\,\mathrm{d}x = \dfrac{x^{n+1}}{n + 1} + c$ for $n \neq -1$; always add $+ c$ to indefinite integrals.`,
      'Find c from a point on the curve.',
      md`$\int_{a}^{b} f(x)\,\mathrm{d}x = F(b) - F(a)$: no constant needed.`,
      'Area below the x-axis comes out negative: find each part separately and add the sizes.',
      'Area between a curve and a line: integrate (top − bottom) between the intersections.',
    ],
    formulae: [['Integral of xⁿ (learn it)', md`$\displaystyle\int x^{n}\,\mathrm{d}x = \frac{1}{n + 1}x^{n+1} + c, \; n \neq -1$`]],
    example: {
      q: md`Find the area enclosed by $y = 4x - x^{2}$ and the x-axis.`,
      steps: [md`Roots: $x(4 - x) = 0 \Rightarrow x = 0, 4$.`, md`$\int_{0}^{4}(4x - x^{2})\,\mathrm{d}x = \left[2x^{2} - \frac{x^{3}}{3}\right]_{0}^{4}$.`, md`$= 32 - \frac{64}{3} = \frac{32}{3}$.`],
    },
    mistakes: ['Losing the + c (it is a mark).', 'Subtracting limits the wrong way round.', 'Adding a negative area to a positive one across the x-axis.'],
    tips: ['Sketch the curve first so you know which parts are below the axis.'],
  },
  'P1.14': {
    intro: 'Exponential functions, eˣ and ln x, the laws of logarithms, and modelling with exponentials.',
    key: [
      md`$a^{x} = b \iff x = \log_{a} b$; $\ln$ means $\log_{e}$.`,
      'Laws: add logs to multiply, subtract to divide, a power comes to the front.',
      md`$\dfrac{\mathrm{d}}{\mathrm{d}x}e^{kx} = ke^{kx}$ — the rate of change is proportional to the value.`,
      md`Solve $a^{x} = b$ by taking logs: $x = \dfrac{\ln b}{\ln a}$.`,
      md`Straight-line graphs: $y = ax^{n}$ gives $\log y = \log a + n\log x$; $y = ab^{x}$ gives $\log y = \log a + x\log b$.`,
    ],
    formulae: [
      ['Laws of logs (learn them)', md`$\log_{a}x + \log_{a}y = \log_{a}xy$, $\quad \log_{a}x - \log_{a}y = \log_{a}\frac{x}{y}$, $\quad k\log_{a}x = \log_{a}x^{k}$`],
      ['Change of base (booklet)', md`$\log_{a}x = \dfrac{\log_{b}x}{\log_{b}a}$`],
    ],
    example: {
      q: md`Solve $3^{2x - 1} = 20$, giving $x$ to 3 s.f.`,
      steps: [md`$(2x - 1)\ln 3 = \ln 20$.`, md`$2x - 1 = \dfrac{\ln 20}{\ln 3} = 2.7268\ldots$`, md`$x = 1.86$ (3 s.f.).`],
    },
    mistakes: [md`$\log(a + b) \neq \log a + \log b$.`, md`$\ln 0$ is undefined: check answers make the logs valid.`],
    tips: ['In modelling questions, interpret the constants (initial value, growth rate) in context.'],
  },
};
