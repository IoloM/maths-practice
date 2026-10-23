/**
 * Flashcards. The "learn" deck is the list of formulae students are expected to know, which are NOT in
 * the booklet Mathematical Formulae and Statistical Tables (9MA0 specification, Issue 4, Appendix 1).
 * The "facts" deck holds definitions, conditions and exam conventions used throughout the course.
 */
const md = String.raw;

export interface Flashcard {
  id: string;
  deck: DeckId;
  topic: string;
  front: string;
  back: string;
}
export type DeckId = 'learn' | 'facts';

export const DECKS: { id: DeckId; title: string; blurb: string }[] = [
  { id: 'learn', title: 'Formulae to learn', blurb: 'The formulae Pearson expects you to know: none of these are printed in the exam formula booklet.' },
  { id: 'facts', title: 'Key facts and exam language', blurb: 'Conditions, definitions, modelling assumptions and what the command words mean.' },
];

type Raw = [topic: string, front: string, back: string];

const LEARN: Raw[] = [
  ['Quadratics', md`Roots of $ax^{2} + bx + c = 0$`, md`$x = \dfrac{-b \pm \sqrt{b^{2} - 4ac}}{2a}$`],
  ['Indices', md`$a^{x} \times a^{y} \equiv\ ?$`, md`$a^{x+y}$`],
  ['Indices', md`$a^{x} \div a^{y} \equiv\ ?$`, md`$a^{x-y}$`],
  ['Indices', md`$(a^{x})^{y} \equiv\ ?$`, md`$a^{xy}$`],
  ['Logarithms', md`Definition of $\log_{a} x$`, md`$a^{n} = x \iff \log_{a} x = n$, for $a > 0$ and $x > 0$`],
  ['Logarithms', md`$\log_{a} x + \log_{a} y \equiv\ ?$`, md`$\log_{a}(xy)$`],
  ['Logarithms', md`$\log_{a} x - \log_{a} y \equiv\ ?$`, md`$\log_{a}\left(\dfrac{x}{y}\right)$`],
  ['Logarithms', md`$k\log_{a} x \equiv\ ?$`, md`$\log_{a}(x^{k})$`],
  ['Coordinate geometry', md`Straight line with gradient $m$ through $(x_{1}, y_{1})$`, md`$y - y_{1} = m(x - x_{1})$`],
  ['Coordinate geometry', md`When are lines with gradients $m_{1}$ and $m_{2}$ perpendicular?`, md`$m_{1}m_{2} = -1$`],
  ['Sequences', md`General ($n$th) term of an arithmetic progression`, md`$u_{n} = a + (n - 1)d$`],
  ['Sequences', md`General ($n$th) term of a geometric progression`, md`$u_{n} = ar^{n-1}$`],
  ['Trigonometry', md`Sine rule (triangle $ABC$)`, md`$\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$`],
  ['Trigonometry', md`Cosine rule (triangle $ABC$)`, md`$a^{2} = b^{2} + c^{2} - 2bc\cos A$`],
  ['Trigonometry', md`Area of triangle $ABC$`, md`Area $= \tfrac{1}{2}ab\sin C$`],
  ['Trigonometry', md`$\cos^{2} A + \sin^{2} A \equiv\ ?$`, md`$1$`],
  ['Trigonometry', md`$\sec^{2} A \equiv\ ?$`, md`$1 + \tan^{2} A$`],
  ['Trigonometry', md`$\operatorname{cosec}^{2} A \equiv\ ?$`, md`$1 + \cot^{2} A$`],
  ['Trigonometry', md`$\sin 2A \equiv\ ?$`, md`$2\sin A\cos A$`],
  ['Trigonometry', md`$\cos 2A \equiv\ ?$`, md`$\cos^{2} A - \sin^{2} A$ $\;(= 2\cos^{2} A - 1 = 1 - 2\sin^{2} A)$`],
  ['Trigonometry', md`$\tan 2A \equiv\ ?$`, md`$\dfrac{2\tan A}{1 - \tan^{2} A}$`],
  ['Mensuration', md`Circumference and area of a circle (radius $r$, diameter $d$)`, md`$C = 2\pi r = \pi d$, $\quad A = \pi r^{2}$`],
  ['Mensuration', md`Pythagoras' theorem (hypotenuse $c$)`, md`$c^{2} = a^{2} + b^{2}$`],
  ['Mensuration', md`Area of a trapezium (parallel sides $a$, $b$; height $h$)`, md`$\tfrac{1}{2}(a + b)h$`],
  ['Mensuration', md`Volume of a prism`, md`Area of cross-section $\times$ length`],
  ['Radians', md`Arc length $s$ and sector area $A$ (radius $r$, angle $\theta$ radians)`, md`$s = r\theta$, $\quad A = \tfrac{1}{2}r^{2}\theta$`],
  ['Differentiation', md`Derivative of $x^{n}$`, md`$nx^{n-1}$`],
  ['Differentiation', md`Derivative of $\sin kx$`, md`$k\cos kx$`],
  ['Differentiation', md`Derivative of $\cos kx$`, md`$-k\sin kx$`],
  ['Differentiation', md`Derivative of $e^{kx}$`, md`$ke^{kx}$`],
  ['Differentiation', md`Derivative of $\ln x$`, md`$\dfrac{1}{x}$`],
  ['Differentiation', md`Derivative of $\mathrm{f}(x) + \mathrm{g}(x)$`, md`$\mathrm{f}'(x) + \mathrm{g}'(x)$`],
  ['Differentiation', md`Product rule: derivative of $\mathrm{f}(x)\mathrm{g}(x)$`, md`$\mathrm{f}'(x)\mathrm{g}(x) + \mathrm{f}(x)\mathrm{g}'(x)$`],
  ['Differentiation', md`Chain rule: derivative of $\mathrm{f}(\mathrm{g}(x))$`, md`$\mathrm{f}'(\mathrm{g}(x))\,\mathrm{g}'(x)$`],
  ['Integration', md`$\displaystyle\int x^{n}\,\mathrm{d}x$ ($n \neq -1$)`, md`$\dfrac{1}{n + 1}x^{n+1} + c$`],
  ['Integration', md`$\displaystyle\int e^{kx}\,\mathrm{d}x$`, md`$\dfrac{1}{k}e^{kx} + c$`],
  ['Integration', md`$\displaystyle\int \dfrac{1}{x}\,\mathrm{d}x$`, md`$\ln|x| + c$, $\; x \neq 0$`],
  ['Integration', md`$\displaystyle\int \cos kx\,\mathrm{d}x$`, md`$\dfrac{1}{k}\sin kx + c$`],
  ['Integration', md`$\displaystyle\int \sin kx\,\mathrm{d}x$`, md`$-\dfrac{1}{k}\cos kx + c$`],
  ['Integration', md`$\displaystyle\int \left(\mathrm{f}'(x) + \mathrm{g}'(x)\right)\mathrm{d}x$`, md`$\mathrm{f}(x) + \mathrm{g}(x) + c$`],
  ['Integration', md`$\displaystyle\int \mathrm{f}'(\mathrm{g}(x))\,\mathrm{g}'(x)\,\mathrm{d}x$`, md`$\mathrm{f}(\mathrm{g}(x)) + c$`],
  ['Integration', md`Area under the curve $y = \mathrm{f}(x)$ from $x = a$ to $x = b$ (with $y \geqslant 0$)`, md`$\displaystyle\int_{a}^{b} y\,\mathrm{d}x$`],
  ['Vectors', md`Magnitude of $x\mathbf{i} + y\mathbf{j} + z\mathbf{k}$`, md`$\sqrt{x^{2} + y^{2} + z^{2}}$`],
  ['Statistics', md`Mean of a set of data (raw, and from a frequency table)`, md`$\bar{x} = \dfrac{\sum x}{n} = \dfrac{\sum fx}{\sum f}$`],
  ['Statistics', md`Standardising: the standard normal variable for $X \sim \mathrm{N}(\mu, \sigma^{2})$`, md`$Z = \dfrac{X - \mu}{\sigma}$`],
  ['Mechanics', md`Weight of a body of mass $m$`, md`$W = mg$ (weight $=$ mass $\times\ g$)`],
  ['Mechanics', md`Friction (coefficient $\mu$, normal reaction $R$)`, md`$F \leqslant \mu R$ (equality when limiting or moving)`],
  ['Mechanics', md`Newton's second law`, md`$F = ma$`],
  ['Mechanics', md`Variable acceleration: velocity and acceleration from displacement $\mathbf{r}$`, md`$\mathbf{v} = \dfrac{\mathrm{d}\mathbf{r}}{\mathrm{d}t}$, $\quad \mathbf{a} = \dfrac{\mathrm{d}\mathbf{v}}{\mathrm{d}t} = \dfrac{\mathrm{d}^{2}\mathbf{r}}{\mathrm{d}t^{2}}$`],
  ['Mechanics', md`Variable acceleration: displacement and velocity by integration`, md`$\mathbf{r} = \displaystyle\int \mathbf{v}\,\mathrm{d}t$, $\quad \mathbf{v} = \displaystyle\int \mathbf{a}\,\mathrm{d}t$`],
];

const FACTS: Raw[] = [
  ['Quadratics', md`What does the discriminant $b^{2} - 4ac$ tell you?`, md`$> 0$: two distinct real roots. $= 0$: one repeated root. $< 0$: no real roots.`],
  ['Circles', md`Equation of a circle with centre $(a, b)$ and radius $r$`, md`$(x - a)^{2} + (y - b)^{2} = r^{2}$`],
  ['Circles', md`Two facts linking a circle's radius to tangents and chords`, md`A tangent is perpendicular to the radius at the point of contact. The perpendicular bisector of a chord passes through the centre.`],
  ['Algebra', md`Factor theorem`, md`$(x - a)$ is a factor of $\mathrm{f}(x)$ if and only if $\mathrm{f}(a) = 0$.`],
  ['Differentiation', md`How do you classify a stationary point using $\dfrac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}}$?`, md`At $\dfrac{\mathrm{d}y}{\mathrm{d}x} = 0$: $\dfrac{\mathrm{d}^{2}y}{\mathrm{d}x^{2}} > 0$ minimum, $< 0$ maximum ($= 0$: test further).`],
  ['Differentiation', md`Increasing and decreasing functions`, md`Increasing where $\mathrm{f}'(x) \geqslant 0$; decreasing where $\mathrm{f}'(x) \leqslant 0$.`],
  ['Differentiation', md`Convex, concave and points of inflection`, md`Convex where $\mathrm{f}''(x) \geqslant 0$, concave where $\mathrm{f}''(x) \leqslant 0$. A point of inflection is where $\mathrm{f}''(x)$ changes sign.`],
  ['Trigonometry', md`Write $a\cos\theta + b\sin\theta$ in the form $R\cos(\theta - \alpha)$`, md`$R = \sqrt{a^{2} + b^{2}}$, $\quad \tan\alpha = \dfrac{b}{a}$`],
  ['Radians', md`Convert between degrees and radians`, md`$\pi$ radians $= 180^{\circ}$`],
  ['Functions', md`How are $\mathrm{f}$ and $\mathrm{f}^{-1}$ related?`, md`The domain of $\mathrm{f}^{-1}$ is the range of $\mathrm{f}$ (and vice versa); the graph of $y = \mathrm{f}^{-1}(x)$ is the reflection of $y = \mathrm{f}(x)$ in $y = x$. Only one-to-one functions have inverses.`],
  ['Logarithms', md`Turning $y = ax^{n}$ and $y = ab^{x}$ into straight lines`, md`$y = ax^{n}$: $\log y = \log a + n\log x$ (plot $\log y$ against $\log x$). $\;y = ab^{x}$: $\log y = \log a + x\log b$ (plot $\log y$ against $x$).`],
  ['Numerical methods', md`When does a change of sign show there is a root in $[a, b]$?`, md`If $\mathrm{f}$ is continuous on $[a, b]$ and $\mathrm{f}(a)$, $\mathrm{f}(b)$ have opposite signs. (A sign change can also come from an asymptote.)`],
  ['Numerical methods', md`When does the Newton–Raphson method fail?`, md`When $\mathrm{f}'(x_{n}) = 0$ (a stationary point), and it can converge slowly or to a different root if $x_{0}$ is near one.`],
  ['Proof', md`Proof by contradiction`, md`Assume the statement is false, then show this leads to a contradiction, so the statement must be true.`],
  ['Binomial distribution', md`Conditions for $X \sim \mathrm{B}(n, p)$`, md`A fixed number of trials $n$; two outcomes (success/failure); trials independent; constant probability of success $p$.`],
  ['Binomial distribution', md`$\mathrm{P}(X \geqslant x)$ and $\mathrm{P}(X < x)$ from cumulative tables`, md`$\mathrm{P}(X \geqslant x) = 1 - \mathrm{P}(X \leqslant x - 1)$; $\quad \mathrm{P}(X < x) = \mathrm{P}(X \leqslant x - 1)$`],
  ['Hypothesis testing', md`What is a critical region?`, md`The set of values of the test statistic that lead to rejecting $\mathrm{H_0}$. Its actual significance level is the probability of falling in it when $\mathrm{H_0}$ is true.`],
  ['Hypothesis testing', md`How do you write the conclusion of a hypothesis test?`, md`State the decision (reject / do not reject $\mathrm{H_0}$), then a non-assertive conclusion in context: "there is (in)sufficient evidence at the 5% level that …".`],
  ['Hypothesis testing', md`Two-tailed tests: what happens to the significance level?`, md`It is split between the two tails: e.g. 5% means 2.5% in each tail.`],
  ['Correlation', md`Hypotheses for a test of correlation using the PMCC`, md`$\mathrm{H_0}: \rho = 0$ against $\mathrm{H_1}: \rho > 0$, $\rho < 0$ or $\rho \neq 0$.`],
  ['Normal distribution', md`Features of the normal curve for $\mathrm{N}(\mu, \sigma^{2})$`, md`Symmetrical about $\mu$; points of inflection at $\mu \pm \sigma$; about 68% within $1\sigma$, 95% within $2\sigma$, 99.7% within $3\sigma$ of the mean.`],
  ['Normal distribution', md`Normal approximation to $\mathrm{B}(n, p)$`, md`When $n$ is large and $p$ is close to 0.5: $X \approx \mathrm{N}(np,\ np(1 - p))$, with a continuity correction (e.g. $\mathrm{P}(X \leqslant 10) \approx \mathrm{P}(Y < 10.5)$).`],
  ['Data', md`Histograms: what does the area represent?`, md`Area is proportional to frequency; frequency density $=$ frequency $\div$ class width.`],
  ['Data', md`Coding: if $y = \dfrac{x - a}{b}$, how are the statistics of $x$ and $y$ related?`, md`$\bar{x} = a + b\bar{y}$ and $\sigma_{x} = b\,\sigma_{y}$ (adding $a$ doesn't change the spread).`],
  ['Probability', md`Independent and mutually exclusive events`, md`Independent: $\mathrm{P}(A \cap B) = \mathrm{P}(A)\,\mathrm{P}(B)$. Mutually exclusive: $\mathrm{P}(A \cap B) = 0$.`],
  ['Modelling', md`What do "light" and "inextensible" tell you about a string?`, md`Light: its mass is negligible, so the tension is the same throughout. Inextensible: it doesn't stretch, so connected particles have the same acceleration.`],
  ['Modelling', md`What do "smooth", "rough" and "uniform" mean?`, md`Smooth: no friction. Rough: friction acts. Uniform: mass evenly spread, so the centre of mass is at the geometric centre.`],
  ['Modelling', md`Modelling an object as a particle`, md`Its dimensions are negligible: mass acts at a single point, and rotation (and usually air resistance) are ignored.`],
  ['Mechanics', md`Value of $g$ and accuracy in Edexcel mechanics`, md`Take $g = 9.8\ \text{m s}^{-2}$ unless told otherwise, and give answers to 2 or 3 significant figures.`],
  ['Mechanics', md`What do the gradient and area of a velocity–time graph give?`, md`Gradient: acceleration. Area under the graph: displacement.`],
  ['Mechanics', md`Moment of a force, and the conditions for equilibrium of a rigid body`, md`Moment $=$ force $\times$ perpendicular distance from the pivot. In equilibrium the resultant force is zero and the resultant moment about any point is zero.`],
  ['Mechanics', md`A rod resting on two supports is "about to tilt" about one of them. What does that tell you?`, md`The reaction at the other support is zero.`],
  ['Mechanics', md`Particle on a smooth plane inclined at $\theta$: normal reaction and component of weight down the slope`, md`$R = mg\cos\theta$ (no other forces perpendicular to the plane); component down the slope $mg\sin\theta$.`],
  ['Mechanics', md`Projectile launched at speed $u$ at angle $\alpha$ above the horizontal: what stays constant?`, md`The horizontal component of velocity, $u\cos\alpha$. Vertically, acceleration is $g$ downwards, starting from $u\sin\alpha$.`],
  ['Exam technique', md`"Show that"`, md`Every step must be shown and the printed result reached exactly: the answer is given, the marks are for the working.`],
  ['Exam technique', md`"Hence" versus "Hence or otherwise"`, md`"Hence": you must use the previous result. "Hence or otherwise": using it is expected, but any correct method scores.`],
  ['Exam technique', md`"Give your answer in exact form"`, md`Leave fractions, surds, $\pi$, $e$ and $\ln$ unevaluated: a rounded decimal loses the final mark.`],
  ['Exam technique', md`"Solutions relying entirely on calculator technology are not acceptable"`, md`Show the algebra or method in full: an answer straight off the calculator scores no marks for that question.`],
  ['Exam technique', md`No accuracy given in the question?`, md`Give answers to an appropriate degree of accuracy: 3 significant figures is the safe default (2 or 3 s.f. when $g = 9.8$ is used).`],
];

/** Stable id from the front text (FNV-1a), so adding or reordering cards keeps everyone's progress. */
function hashId(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}
const cards = (deck: DeckId, raw: Raw[]): Flashcard[] => raw.map(([topic, front, back]) => ({ id: `${deck}-${hashId(front)}`, deck, topic, front, back }));

export const FLASHCARDS: Flashcard[] = [...cards('learn', LEARN), ...cards('facts', FACTS)];
