/** Pearson Edexcel A level Mathematics textbook chapters (2017 editions). */
import type { Book, ChapterRef } from '../engine/templates/types';

export interface Chapter {
  ref: ChapterRef;
  book: Book;
  n: number;
  title: string;
  /** stream, for grouping in the UI */
  stream: 'Pure' | 'Statistics' | 'Mechanics';
  year: 1 | 2;
  sections: string[];
}

const c = (book: Book, n: number, title: string, stream: Chapter['stream'], sections: string[]): Chapter => ({
  ref: `${book}.${n}` as ChapterRef,
  book,
  n,
  title,
  stream,
  year: book === 'P1' || book === 'SM1' ? 1 : 2,
  sections,
});

export const CHAPTERS: Chapter[] = [
  c('P1', 1, 'Algebraic expressions', 'Pure', ['Index laws', 'Expanding brackets', 'Factorising', 'Negative and fractional indices', 'Surds', 'Rationalising denominators']),
  c('P1', 2, 'Quadratics', 'Pure', ['Solving quadratic equations', 'Completing the square', 'Functions', 'Quadratic graphs', 'The discriminant', 'Modelling with quadratics']),
  c('P1', 3, 'Equations and inequalities', 'Pure', ['Linear simultaneous equations', 'Quadratic simultaneous equations', 'Simultaneous equations on graphs', 'Linear inequalities', 'Quadratic inequalities', 'Inequalities on graphs', 'Regions']),
  c('P1', 4, 'Graphs and transformations', 'Pure', ['Cubic graphs', 'Quartic graphs', 'Reciprocal graphs', 'Points of intersection', 'Translating graphs', 'Stretching graphs', 'Transforming functions']),
  c('P1', 5, 'Straight line graphs', 'Pure', ['y = mx + c', 'Equations of straight lines', 'Parallel and perpendicular lines', 'Length and area', 'Modelling with straight lines']),
  c('P1', 6, 'Circles', 'Pure', ['Midpoints and perpendicular bisectors', 'Equation of a circle', 'Intersections of straight lines and circles', 'Use tangent and chord properties', 'Circles and triangles']),
  c('P1', 7, 'Algebraic methods', 'Pure', ['Algebraic fractions', 'Dividing polynomials', 'The factor theorem', 'Mathematical proof', 'Methods of proof']),
  c('P1', 8, 'The binomial expansion', 'Pure', ["Pascal's triangle", 'Factorial notation', 'The binomial expansion', 'Solving binomial problems', 'Binomial estimation']),
  c('P1', 9, 'Trigonometric ratios', 'Pure', ['The cosine rule', 'The sine rule', 'Areas of triangles', 'Solving triangle problems', 'Graphs of sine, cosine and tangent', 'Transforming trigonometric graphs']),
  c('P1', 10, 'Trigonometric identities and equations', 'Pure', ['Angles in all four quadrants', 'Exact values of trigonometric ratios', 'Trigonometric identities', 'Simple trigonometric equations', 'Harder trigonometric equations', 'Equations and identities']),
  c('P1', 11, 'Vectors', 'Pure', ['Vectors', 'Representing vectors', 'Magnitude and direction', 'Position vectors', 'Solving geometric problems', 'Modelling with vectors']),
  c('P1', 12, 'Differentiation', 'Pure', ['Gradients of curves', 'Finding the derivative', 'Differentiating xⁿ', 'Differentiating quadratics', 'Differentiating functions with two or more terms', 'Gradients, tangents and normals', 'Increasing and decreasing functions', 'Second order derivatives', 'Stationary points', 'Sketching gradient functions', 'Modelling with differentiation']),
  c('P1', 13, 'Integration', 'Pure', ['Integrating xⁿ', 'Indefinite integrals', 'Finding functions', 'Definite integrals', 'Areas under curves', 'Areas under the x-axis', 'Areas between curves and lines']),
  c('P1', 14, 'Exponentials and logarithms', 'Pure', ['Exponential functions', 'y = eˣ', 'Exponential modelling', 'Logarithms', 'Laws of logarithms', 'Solving equations using logarithms', 'Working with natural logarithms', 'Logarithms and non-linear data']),
  c('P2', 1, 'Algebraic methods', 'Pure', ['Proof by contradiction', 'Algebraic fractions', 'Partial fractions', 'Repeated factors', 'Algebraic division']),
  c('P2', 2, 'Functions and graphs', 'Pure', ['The modulus function', 'Functions and mappings', 'Composite functions', 'Inverse functions', 'y = |f(x)| and y = f(|x|)', 'Combining transformations', 'Solving modulus problems']),
  c('P2', 3, 'Sequences and series', 'Pure', ['Arithmetic sequences', 'Arithmetic series', 'Geometric sequences', 'Geometric series', 'Sum to infinity', 'Sigma notation', 'Recurrence relations', 'Modelling with series']),
  c('P2', 4, 'Binomial expansion', 'Pure', ['Expanding (1 + x)ⁿ', 'Expanding (a + bx)ⁿ', 'Using partial fractions']),
  c('P2', 5, 'Radians', 'Pure', ['Radian measure', 'Arc length', 'Areas of sectors and segments', 'Solving trigonometric equations', 'Small angle approximations']),
  c('P2', 6, 'Trigonometric functions', 'Pure', ['Secant, cosecant and cotangent', 'Graphs of sec x, cosec x and cot x', 'Using sec x, cosec x and cot x', 'Trigonometric identities', 'Inverse trigonometric functions']),
  c('P2', 7, 'Trigonometry and modelling', 'Pure', ['Addition formulae', 'Using the angle addition formulae', 'Double-angle formulae', 'Solving trigonometric equations', 'Simplifying a cos x ± b sin x', 'Proving trigonometric identities', 'Modelling with trigonometric functions']),
  c('P2', 8, 'Parametric equations', 'Pure', ['Parametric equations', 'Using trigonometric identities', 'Curve sketching', 'Points of intersection', 'Modelling with parametric equations']),
  c('P2', 9, 'Differentiation', 'Pure', ['Differentiating sin x and cos x', 'Differentiating exponentials and logarithms', 'The chain rule', 'The product rule', 'The quotient rule', 'Differentiating trigonometric functions', 'Parametric differentiation', 'Implicit differentiation', 'Using second derivatives', 'Rates of change']),
  c('P2', 10, 'Numerical methods', 'Pure', ['Locating roots', 'Iteration', 'The Newton–Raphson method', 'Applications to modelling']),
  c('P2', 11, 'Integration', 'Pure', ['Integrating standard functions', 'Integrating f(ax + b)', 'Using trigonometric identities', 'Reverse chain rule', 'Integration by substitution', 'Integration by parts', 'Partial fractions', 'Finding areas', 'The trapezium rule', 'Solving differential equations', 'Modelling with differential equations']),
  c('P2', 12, 'Vectors', 'Pure', ['3D coordinates', 'Vectors in 3D', 'Solving geometric problems', 'Application to mechanics']),
  c('SM1', 1, 'Data collection', 'Statistics', ['Populations and samples', 'Sampling', 'Non-random sampling', 'Types of data', 'The large data set']),
  c('SM1', 2, 'Measures of location and spread', 'Statistics', ['Measures of central tendency', 'Other measures of location', 'Measures of spread', 'Variance and standard deviation', 'Coding']),
  c('SM1', 3, 'Representations of data', 'Statistics', ['Outliers', 'Box plots', 'Cumulative frequency', 'Histograms', 'Comparing data']),
  c('SM1', 4, 'Correlation', 'Statistics', ['Correlation', 'Linear regression']),
  c('SM1', 5, 'Probability', 'Statistics', ['Calculating probabilities', 'Venn diagrams', 'Mutually exclusive and independent events', 'Tree diagrams']),
  c('SM1', 6, 'Statistical distributions', 'Statistics', ['Probability distributions', 'The binomial distribution', 'Cumulative probabilities']),
  c('SM1', 7, 'Hypothesis testing', 'Statistics', ['Hypothesis testing', 'Finding critical values', 'One-tailed tests', 'Two-tailed tests']),
  c('SM1', 8, 'Modelling in mechanics', 'Mechanics', ['Constructing a model', 'Modelling assumptions', 'Quantities and units', 'Working with vectors']),
  c('SM1', 9, 'Constant acceleration', 'Mechanics', ['Displacement–time graphs', 'Velocity–time graphs', 'Constant acceleration formulae 1', 'Constant acceleration formulae 2', 'Vertical motion under gravity']),
  c('SM1', 10, 'Forces and motion', 'Mechanics', ['Force diagrams', 'Forces as vectors', 'Forces and acceleration', 'Motion in 2 dimensions', 'Connected particles', 'Pulleys']),
  c('SM1', 11, 'Variable acceleration', 'Mechanics', ['Functions of time', 'Using differentiation', 'Maxima and minima problems', 'Using integration', 'Constant acceleration formulae']),
  c('SM2', 1, 'Regression, correlation and hypothesis testing', 'Statistics', ['Exponential models', 'Measuring correlation', 'Hypothesis testing for zero correlation']),
  c('SM2', 2, 'Conditional probability', 'Statistics', ['Set notation', 'Conditional probability', 'Conditional probabilities in Venn diagrams', 'Probability formulae', 'Tree diagrams']),
  c('SM2', 3, 'The normal distribution', 'Statistics', ['The normal distribution', 'Finding probabilities for normal distributions', 'The inverse normal distribution function', 'The standard normal distribution', 'Finding μ and σ', 'Approximating a binomial distribution', 'Hypothesis testing with the normal distribution']),
  c('SM2', 4, 'Moments', 'Mechanics', ['Moments', 'Resultant moments', 'Equilibrium', 'Centres of mass', 'Tilting']),
  c('SM2', 5, 'Forces and friction', 'Mechanics', ['Resolving forces', 'Inclined planes', 'Friction']),
  c('SM2', 6, 'Projectiles', 'Mechanics', ['Horizontal projection', 'Horizontal and vertical components', 'Projection at any angle', 'Projectile motion formulae']),
  c('SM2', 7, 'Applications of forces', 'Mechanics', ['Static particles', 'Modelling with statics', 'Friction and static particles', 'Static rigid bodies', 'Dynamics and inclined planes', 'Connected particles']),
  c('SM2', 8, 'Further kinematics', 'Mechanics', ['Vectors in kinematics', 'Vector methods with projectiles', 'Variable acceleration in one dimension', 'Differentiating vectors', 'Integrating vectors']),
];

export const CHAPTER_BY_REF = new Map(CHAPTERS.map((ch) => [ch.ref, ch]));

export const BOOK_NAMES: Record<Book, string> = {
  P1: 'Pure Year 1',
  P2: 'Pure Year 2',
  SM1: 'Statistics & Mechanics Year 1',
  SM2: 'Statistics & Mechanics Year 2',
};

/** Folder name for a chapter's templates, e.g. P1.13 → P1-13. */
export const chapterDir = (ref: ChapterRef): string => ref.replace('.', '-');
