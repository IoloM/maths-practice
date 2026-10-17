/**
 * Marking engine suite: ≥ 300 equivalent / non-equivalent answer pairs.
 * Expected status: correct · accuracy (right value, wrong presentation → lose final A) · wrong · invalid · unanswered.
 */
import { describe, expect, it } from 'vitest';
import { compare } from '../src/engine/marking/compare';
import { markPart } from '../src/engine/marking/mark';
import { ans, iv, part, M1, A1, B1, err } from '../src/engine/templates/helpers';
import { parseExpr } from '../src/engine/marking/parse';
import { mathJsonToExpr } from '../src/engine/marking/ce-fallback';
import { evaluate, num, sym, sqrt, mul, add, neg, PI, div, ln, pow, E } from '../src/engine/core/expr';
import { Q } from '../src/engine/core/rational';
import type { AnswerSpec, Response } from '../src/engine/marking/types';

type St = 'correct' | 'accuracy' | 'wrong' | 'invalid' | 'unanswered' | 'scored';
const P = (s: string) => parseExpr(s);
let count = 0;

function cases(name: string, spec: AnswerSpec, rows: [Response, St][]) {
  count += rows.length;
  describe(name, () => {
    it.each(rows.map(([r, s]) => [typeof r === 'string' ? r : JSON.stringify(r), r, s] as const))('%s → %s', (_l, r, s) => {
      expect(compare(spec, r).status).toBe(s);
    });
  });
}

const INF = sym('infty');
const NINF = neg(sym('infty'));

// ---------------------------------------------------------------- numbers
cases('numeric awrt 3 s.f. (2.3487)', ans.num(2.3487, { sf: 3 }), [
  ['2.35', 'correct'],
  ['2.349', 'correct'],
  ['2.3487', 'correct'],
  ['2.345', 'correct'],
  ['2.354', 'correct'],
  ['2.3', 'accuracy'],
  ['2', 'wrong'],
  ['2.34', 'wrong'],
  ['2.36', 'wrong'],
  ['2.355', 'wrong'],
  ['-2.35', 'wrong'],
  ['2,35', 'invalid'],
  ['two', 'invalid'],
  ['', 'unanswered'],
  ['x', 'invalid'],
  ['2 3', 'invalid'],
]);

cases('numeric negative (−2.3487)', ans.num(-2.3487, { sf: 3 }), [
  ['-2.35', 'correct'],
  ['−2.35', 'correct'],
  ['-2.349', 'correct'],
  ['2.35', 'wrong'],
  ['-2.3', 'accuracy'],
]);

cases('numeric 4 d.p. probability (0.649576)', ans.num(0.649576, { dp: 4 }), [
  ['0.6496', 'correct'],
  ['.6496', 'correct'],
  ['0.64958', 'correct'],
  ['0.649576', 'correct'],
  ['0.65', 'accuracy'],
  ['0.6495', 'wrong'],
  ['0.6497', 'wrong'],
  ['64.96', 'wrong'],
  ['0.64', 'wrong'],
]);

cases('numeric with table alternative (0.0228 calc, 0.0227 tables)', ans.num(0.022750, { sf: 3 }, { alts: [0.0227] }), [
  ['0.0228', 'correct'],
  ['0.02275', 'correct'],
  ['0.0227', 'correct'],
  ['0.0229', 'wrong'],
]);

cases('rounding boundaries: 0.004999 to 3 s.f.', ans.num(0.004999, { sf: 3 }), [
  ['0.00500', 'correct'],
  ['0.004999', 'correct'],
  ['0.005', 'wrong'],
  ['0.00499', 'wrong'],
  ['0.0050', 'accuracy'],
]);

cases('large value 1203.4 to 3 s.f.', ans.num(1203.4, { sf: 3 }), [
  ['1200', 'correct'],
  ['1203', 'correct'],
  ['1203.4', 'correct'],
  ['1.20e3', 'correct'],
  ['1210', 'wrong'],
  ['1190', 'wrong'],
]);

cases('exactly representable value 2.5 (3 s.f.)', ans.num(2.5, { sf: 3 }), [
  ['2.5', 'correct'],
  ['2.50', 'correct'],
  ['\\frac{5}{2}', 'accuracy'],
  ['5/2', 'accuracy'],
  ['2.51', 'wrong'],
]);

cases('g = 9.8 answers to 2 or 3 s.f. (4.4721)', ans.num(4.4721, { sfRange: [2, 3] }), [
  ['4.5', 'correct'],
  ['4.47', 'correct'],
  ['4.472', 'correct'],
  ['4.473', 'correct'],
  ['4', 'wrong'],
  ['4.4', 'wrong'],
  ['4.48', 'wrong'],
]);

cases('tolerance ±0.001 (1.2345)', ans.num(1.2345, { tol: 0.001 }), [
  ['1.235', 'correct'],
  ['1.234', 'correct'],
  ['1.2335', 'correct'],
  ['1.237', 'wrong'],
]);

cases('exact form given where a decimal is required (√5 to 3 s.f.)', ans.num(Math.sqrt(5), { sf: 3 }), [
  ['2.24', 'correct'],
  ['2.236', 'correct'],
  ['\\sqrt{5}', 'accuracy'],
  ['\\frac{\\sqrt{20}}{2}', 'accuracy'],
  ['\\sqrt{6}', 'wrong'],
]);

cases('exact form allowed (√5)', ans.num(Math.sqrt(5), { sf: 3 }, { exactAllowed: true }), [
  ['\\sqrt{5}', 'correct'],
  ['sqrt(5)', 'correct'],
  ['2.24', 'correct'],
]);

// ---------------------------------------------------------------- exact values
cases('exact fraction 32/3', ans.exact(num(Q.of(32, 3)), ['exact']), [
  ['\\frac{32}{3}', 'correct'],
  ['\\dfrac{32}{3}', 'correct'],
  ['32/3', 'correct'],
  ['\\frac{64}{6}', 'correct'],
  ['\\frac{-32}{-3}', 'correct'],
  ['10+\\frac{2}{3}', 'correct'],
  ['10.67', 'accuracy'],
  ['10.666666667', 'accuracy'],
  ['-\\frac{32}{3}', 'wrong'],
  ['\\frac{32}{9}', 'wrong'],
  ['\\frac{32}{}', 'invalid'],
]);

cases('exact fraction in simplest form', ans.exact(num(Q.of(32, 3)), ['exact', 'simplest-fraction']), [
  ['\\frac{32}{3}', 'correct'],
  ['\\frac{64}{6}', 'accuracy'],
  ['10.67', 'accuracy'],
]);

cases('terminating decimal is exact (1/4)', ans.exact(num(Q.of(1, 4)), ['exact']), [
  ['0.25', 'correct'],
  ['\\frac14', 'correct'],
  ['0.3', 'wrong'],
]);

const twoRoot3 = mul(num(2), sqrt(3));
cases('surd 2√3 (no form)', ans.exact(twoRoot3, ['exact']), [
  ['2\\sqrt{3}', 'correct'],
  ['2\\sqrt3', 'correct'],
  ['\\sqrt{12}', 'correct'],
  ['\\sqrt{3}\\cdot2', 'correct'],
  ['2\\times\\sqrt{3}', 'correct'],
  ['\\frac{6}{\\sqrt{3}}', 'correct'],
  ['2 sqrt(3)', 'correct'],
  ['2√3', 'correct'],
  ['3.464', 'accuracy'],
  ['3.4641016', 'accuracy'],
  ['2\\sqrt{2}', 'wrong'],
  ['\\sqrt{6}', 'wrong'],
]);

cases('surd form required (2√3)', ans.exact(twoRoot3, ['exact', 'surd']), [
  ['2\\sqrt{3}', 'correct'],
  ['\\sqrt{12}', 'accuracy'],
  ['\\frac{6}{\\sqrt{3}}', 'accuracy'],
]);

cases('a + b√c form (4 − 2√3)', ans.exact(add(num(4), neg(twoRoot3)), ['exact', 'surd']), [
  ['4-2\\sqrt{3}', 'correct'],
  ['-2\\sqrt{3}+4', 'correct'],
  ['4-\\sqrt{12}', 'accuracy'],
  ['\\frac{2}{2+\\sqrt3}', 'accuracy'],
  ['4+2\\sqrt{3}', 'wrong'],
  ['0.536', 'accuracy'],
]);

cases('rationalised denominator (√2/2)', ans.exact(div(sqrt(2), num(2)), ['exact', 'rationalised']), [
  ['\\frac{\\sqrt{2}}{2}', 'correct'],
  ['\\frac{1}{2}\\sqrt{2}', 'correct'],
  ['\\frac{1}{\\sqrt{2}}', 'accuracy'],
  ['0.7071', 'accuracy'],
]);

cases('exact with π (π/4)', ans.exact(div(PI, num(4)), ['exact']), [
  ['\\frac{\\pi}{4}', 'correct'],
  ['\\frac14\\pi', 'correct'],
  ['\\frac{1}{4}\\pi', 'correct'],
  ['0.25\\pi', 'correct'],
  ['π/4', 'correct'],
  ['pi/4', 'correct'],
  ['0.7854', 'accuracy'],
  ['45', 'wrong'],
  ['\\frac{\\pi}{2}', 'wrong'],
]);

cases('exact with e (e²)', ans.exact(pow(E, 2), ['exact']), [
  ['e^2', 'correct'],
  ['e^{2}', 'correct'],
  ['\\mathrm{e}^{2}', 'correct'],
  ['\\exp(2)', 'correct'],
  ['e\\cdot e', 'correct'],
  ['7.389', 'accuracy'],
  ['2e', 'wrong'],
]);

cases('exact logarithm (ln 5)', ans.exact(ln(5), ['exact']), [
  ['\\ln 5', 'correct'],
  ['\\ln(5)', 'correct'],
  ['\\ln\\left(5\\right)', 'correct'],
  ['ln5', 'correct'],
  ['\\log_e 5', 'correct'],
  ['\\frac{1}{2}\\ln 25', 'correct'],
  ['\\ln 25 - \\ln 5', 'correct'],
  ['1.609', 'accuracy'],
  ['\\log 5', 'wrong'],
  ['\\ln 6', 'wrong'],
]);

cases('single logarithm required (ln 8)', ans.exact(ln(8), ['exact', 'single-log']), [
  ['\\ln 8', 'correct'],
  ['\\ln(8)', 'correct'],
  ['3\\ln 2', 'accuracy'],
  ['\\ln 2+\\ln 4', 'accuracy'],
  ['\\ln 9', 'wrong'],
]);

cases('log base change (log₂ 10)', ans.exact({ k: 'log', b: num(2), a: num(10) }, ['exact']), [
  ['\\log_2 10', 'correct'],
  ['\\log_{2}(10)', 'correct'],
  ['\\frac{\\ln 10}{\\ln 2}', 'correct'],
  ['\\frac{\\log 10}{\\log 2}', 'correct'],
  ['3.32', 'accuracy'],
  ['\\log_{10} 2', 'wrong'],
]);

// ---------------------------------------------------------------- expressions
cases('expression: (x + 1)² any form', ans.expr(P('(x+1)^2')), [
  ['(x+1)^2', 'correct'],
  ['x^2+2x+1', 'correct'],
  ['1+2x+x^2', 'correct'],
  ['\\left(x+1\\right)^{2}', 'correct'],
  ['(1+x)(x+1)', 'correct'],
  ['x**2 + 2*x + 1', 'correct'],
  ['x^2+2x', 'wrong'],
  ['x^2+1', 'wrong'],
  ['(x+y)^2', 'wrong'],
  ['(x+1)^3', 'wrong'],
  ['x^2+2x+1=', 'invalid'],
]);

cases('factorised form (x² − 5x + 6)', ans.expr(P('x^2-5x+6'), ['x'], { forms: ['factorised'] }), [
  ['(x-2)(x-3)', 'correct'],
  ['(x-3)(x-2)', 'correct'],
  ['(2-x)(3-x)', 'correct'],
  ['\\left(x-2\\right)\\left(x-3\\right)', 'correct'],
  ['x^2-5x+6', 'accuracy'],
  ['(x-2)(x+3)', 'wrong'],
  ['(x+2)(x+3)', 'wrong'],
]);

cases('fully factorised (2x² − 8)', ans.expr(P('2x^2-8'), ['x'], { forms: ['fully-factorised'] }), [
  ['2(x-2)(x+2)', 'correct'],
  ['2(x+2)(x-2)', 'correct'],
  ['(2x-4)(x+2)', 'accuracy'],
  ['2(x^2-4)', 'accuracy'],
  ['2x^2-8', 'accuracy'],
  ['(x-2)(x+2)', 'wrong'],
]);

cases('fully factorised cubic x³ − x', ans.expr(P('x^3-x'), ['x'], { forms: ['fully-factorised'] }), [
  ['x(x-1)(x+1)', 'correct'],
  ['x(x+1)(x-1)', 'correct'],
  ['x(x^2-1)', 'accuracy'],
  ['(x^2-x)(x+1)', 'accuracy'],
]);

cases('completed square (x² − 6x + 11)', ans.expr(P('x^2-6x+11'), ['x'], { forms: ['completed-square'] }), [
  ['(x-3)^2+2', 'correct'],
  ['2+(x-3)^2', 'correct'],
  ['\\left(x-3\\right)^{2}+2', 'correct'],
  ['(3-x)^2+2', 'correct'],
  ['x^2-6x+11', 'accuracy'],
  ['(x-3)^2-2', 'wrong'],
  ['(x+3)^2+2', 'wrong'],
]);

cases('completed square with coefficient (2x² + 12x + 5)', ans.expr(P('2x^2+12x+5'), ['x'], { forms: ['completed-square'] }), [
  ['2(x+3)^2-13', 'correct'],
  ['-13+2(x+3)^2', 'correct'],
  ['2x^2+12x+5', 'accuracy'],
  ['2(x+3)^2+5', 'wrong'],
]);

cases('expanded form ((x + 2)(x − 1))', ans.expr(P('x^2+x-2'), ['x'], { forms: ['expanded'] }), [
  ['x^2+x-2', 'correct'],
  ['-2+x+x^2', 'correct'],
  ['(x+2)(x-1)', 'accuracy'],
  ['x^2-x-2', 'wrong'],
]);

cases('single fraction (1/(x−1) − 1/(x+1))', ans.expr(P('2/(x^2-1)'), ['x'], { forms: ['single-fraction'], domain: { x: [1.5, 4] } }), [
  ['\\frac{2}{x^2-1}', 'correct'],
  ['\\frac{2}{(x-1)(x+1)}', 'correct'],
  ['\\frac{1}{x-1}-\\frac{1}{x+1}', 'accuracy'],
  ['\\frac{2}{x^2+1}', 'wrong'],
]);

cases('√(x²) vs x on a domain with negatives', ans.expr(P('|x|'), ['x'], { domain: { x: [-3, 3] } }), [
  ['\\sqrt{x^2}', 'correct'],
  ['|x|', 'correct'],
  ['\\left|x\\right|', 'correct'],
  ['abs(x)', 'correct'],
  ['x', 'wrong'],
  ['-x', 'wrong'],
]);

cases('√(x²) vs x on a positive domain', ans.expr(sym('x'), ['x'], { domain: { x: [0.5, 3] } }), [
  ['\\sqrt{x^2}', 'correct'],
  ['x', 'correct'],
  ['|x|', 'correct'],
  ['-x', 'wrong'],
]);

cases('ln|x| vs ln x on x > 0', ans.expr(P('\\ln|x|'), ['x'], { domain: { x: [0.4, 4] } }), [
  ['\\ln x', 'correct'],
  ['\\ln|x|', 'correct'],
  ['\\ln\\left|x\\right|', 'correct'],
  ['\\frac{1}{2}\\ln(x^2)', 'correct'],
  ['\\ln(2x)', 'wrong'],
]);

cases('ln|x| on x < 0: ln x is undefined there', ans.expr(P('\\ln|x|'), ['x'], { domain: { x: [-4, -0.4] } }), [
  ['\\ln|x|', 'correct'],
  ['\\ln(-x)', 'correct'],
  ['\\ln x', 'wrong'],
]);

cases('trig identities', ans.expr(P('\\sin(2x)'), ['x'], { domain: { x: [-3, 3] } }), [
  ['\\sin 2x', 'correct'],
  ['2\\sin x\\cos x', 'correct'],
  ['2\\cos x\\sin x', 'correct'],
  ['sin(2x)', 'correct'],
  ['2\\sin x', 'wrong'],
  ['\\sin^2 x', 'wrong'],
]);

cases('cos 2x forms', ans.expr(P('\\cos 2x'), ['x'], { domain: { x: [-3, 3] } }), [
  ['1-2\\sin^2x', 'correct'],
  ['2\\cos^2x-1', 'correct'],
  ['\\cos^2x-\\sin^2x', 'correct'],
  ['2\\cos x', 'wrong'],
  ['1-\\sin^2x', 'wrong'],
]);

cases('Pythagorean identities', ans.expr(P('\\sec^2x'), ['x'], { domain: { x: [-1.2, 1.2] } }), [
  ['1+\\tan^2x', 'correct'],
  ['\\frac{1}{\\cos^2x}', 'correct'],
  ['\\sec^{2}x', 'correct'],
  ['(\\sec x)^2', 'correct'],
  ['\\tan^2x-1', 'wrong'],
]);

cases('tan and cosec', ans.expr(P('\\tan x'), ['x'], { domain: { x: [-1.2, 1.2] } }), [
  ['\\frac{\\sin x}{\\cos x}', 'correct'],
  ['\\sin x\\sec x', 'correct'],
  ['\\frac{1}{\\cot x}', 'correct'],
  ['\\frac{\\cos x}{\\sin x}', 'wrong'],
]);

cases('exponentials', ans.expr(P('e^{2x}'), ['x'], { domain: { x: [-2, 2] } }), [
  ['(e^x)^2', 'correct'],
  ['e^x\\cdot e^x', 'correct'],
  ['\\exp(2x)', 'correct'],
  ['e^{2x}', 'correct'],
  ['2e^x', 'wrong'],
  ['e^{x^2}', 'wrong'],
]);

cases('a^x as e^{x ln a}', ans.expr(P('2^x'), ['x'], { domain: { x: [-2, 2] } }), [
  ['e^{x\\ln 2}', 'correct'],
  ['2^{x}', 'correct'],
  ['x^2', 'wrong'],
]);

cases('log laws', ans.expr(P('2\\ln x'), ['x'], { domain: { x: [0.4, 4] } }), [
  ['\\ln(x^2)', 'correct'],
  ['\\ln x^2', 'correct'],
  ['\\ln x + \\ln x', 'correct'],
  ['(\\ln x)^2', 'wrong'],
  ['\\ln 2x', 'wrong'],
]);

cases('rational expressions', ans.expr(P('x+1'), ['x'], { domain: { x: [1.3, 4] } }), [
  ['\\frac{x^2-1}{x-1}', 'correct'],
  ['x+1', 'correct'],
  ['\\frac{x^2+2x+1}{x+1}', 'correct'],
  ['\\frac{x^2-1}{x+1}', 'wrong'],
]);

cases('indices and roots', ans.expr(P('x^{\\frac{3}{2}}'), ['x'], { domain: { x: [0.3, 4] } }), [
  ['x\\sqrt{x}', 'correct'],
  ['\\sqrt{x^3}', 'correct'],
  ['x^{1.5}', 'correct'],
  ['x^(3/2)', 'correct'],
  ['(\\sqrt{x})^3', 'correct'],
  ['x^{\\frac{2}{3}}', 'wrong'],
  ['\\sqrt[3]{x^2}', 'wrong'],
]);

cases('negative powers', ans.expr(P('3x^{-2}'), ['x'], { domain: { x: [0.3, 4] } }), [
  ['\\frac{3}{x^2}', 'correct'],
  ['3/x^2', 'correct'],
  ['3x^{-2}', 'correct'],
  ['\\frac{1}{3x^2}', 'wrong'],
  ['3x^2', 'wrong'],
]);

cases('wrong variable', ans.expr(P('3t^2'), ['t']), [
  ['3t^2', 'correct'],
  ['3x^2', 'wrong'],
  ['3t^2+y', 'wrong'],
]);

cases('ASCII and unicode input', ans.expr(P('x^2+\\frac{2}{x}'), ['x'], { domain: { x: [0.3, 4] } }), [
  ['x^2 + 2/x', 'correct'],
  ['x² + 2/x', 'correct'],
  ['x*x + 2*x^(-1)', 'correct'],
  ['(x^3+2)/x', 'correct'],
  ['x^2 + 2÷x', 'correct'],
  ['x^2 + 2x', 'wrong'],
]);

cases('equation-style entry for an expression', ans.expr(P('3x+1'), ['x']), [
  ['y = 3x + 1', 'correct'],
  ['3x+1', 'correct'],
  ['y = 3x - 1', 'wrong'],
]);

// ---------------------------------------------------------------- integrals
cases('indefinite integral of x² + 2', ans.integral(P('\\frac{x^3}{3}+2x')), [
  ['\\frac{x^3}{3}+2x+c', 'correct'],
  ['\\frac{1}{3}x^3+2x+C', 'correct'],
  ['x^3/3 + 2x + k', 'correct'],
  ['\\frac{x^3+6x}{3}+A', 'correct'],
  ['\\frac{x^3}{3}+2x+5+c', 'correct'],
  ['\\frac{x^3}{3}+2x', 'accuracy'],
  ['\\frac{x^3}{3}+2x+5', 'accuracy'],
  ['\\frac{x^3}{3}+2x+cx', 'wrong'],
  ['\\frac{x^3}{3}+2x+c+k', 'wrong'],
  ['x^3+2x+c', 'wrong'],
  ['2x+c', 'wrong'],
  ['\\frac{x^3}{3}+2+c', 'wrong'],
]);

cases('integral of 1/x (x > 0)', ans.integral(P('\\ln|x|'), 'x', { x: [0.4, 4] }), [
  ['\\ln|x|+c', 'correct'],
  ['\\ln x+c', 'correct'],
  ['\\ln(2x)+c', 'correct'],
  ['\\ln x', 'accuracy'],
  ['-\\frac{1}{x^2}+c', 'wrong'],
  ['\\frac{x^0}{0}+c', 'wrong'],
]);

cases('integral of cos 3x', ans.integral(P('\\frac{1}{3}\\sin 3x'), 'x', { x: [-2, 2] }), [
  ['\\frac{1}{3}\\sin 3x+c', 'correct'],
  ['\\frac{\\sin(3x)}{3}+c', 'correct'],
  ['\\frac13\\sin3x', 'accuracy'],
  ['3\\sin 3x+c', 'wrong'],
  ['-\\frac{1}{3}\\sin 3x+c', 'wrong'],
  ['\\sin 3x+c', 'wrong'],
]);

cases('integral of (2x + 1)³', ans.integral(P('\\frac{(2x+1)^4}{8}'), 'x', { x: [-2, 2] }), [
  ['\\frac{(2x+1)^4}{8}+c', 'correct'],
  ['\\frac{1}{8}(2x+1)^4+c', 'correct'],
  ['2x^4+4x^3+3x^2+x+c', 'correct'],
  ['\\frac{(2x+1)^4}{4}+c', 'wrong'],
]);

cases('integral of e^{2x}', ans.integral(P('\\frac{1}{2}e^{2x}'), 'x', { x: [-2, 2] }), [
  ['\\frac{1}{2}e^{2x}+c', 'correct'],
  ['0.5e^{2x}+c', 'correct'],
  ['\\frac{e^{2x}}{2}+k', 'correct'],
  ['2e^{2x}+c', 'wrong'],
  ['e^{2x}+c', 'wrong'],
]);

// ---------------------------------------------------------------- equations
const Y = sym('y');
cases('line y = 2x − 3 in the form y = mx + c', ans.eq(Y, P('2x-3'), ['x', 'y'], ['y=mx+c']), [
  ['y=2x-3', 'correct'],
  ['y = -3 + 2x', 'correct'],
  ['2x-y-3=0', 'accuracy'],
  ['y+3=2x', 'accuracy'],
  ['y=2x+3', 'wrong'],
  ['x=2y-3', 'wrong'],
  ['2x-3', 'invalid'],
]);

cases('line in the form ax + by + c = 0', ans.eq(P('2x-3y+6'), num(0), ['x', 'y'], ['ax+by+c=0']), [
  ['2x-3y+6=0', 'correct'],
  ['-2x+3y-6=0', 'correct'],
  ['4x-6y+12=0', 'correct'],
  ['y=\\frac{2}{3}x+2', 'accuracy'],
  ['x-1.5y+3=0', 'accuracy'],
  ['2x+3y+6=0', 'wrong'],
]);

cases('any form of a line', ans.eq(Y, P('-\\frac{1}{2}x+4'), ['x', 'y']), [
  ['y=-\\frac{1}{2}x+4', 'correct'],
  ['x+2y-8=0', 'correct'],
  ['2y=8-x', 'correct'],
  ['y-3=-\\frac{1}{2}(x-2)', 'correct'],
  ['y=-2x+4', 'wrong'],
]);

cases('circle (x − 2)² + (y + 1)² = 25', ans.eq(P('(x-2)^2+(y+1)^2'), num(25), ['x', 'y']), [
  ['(x-2)^2+(y+1)^2=25', 'correct'],
  ['x^2-4x+y^2+2y-20=0', 'correct'],
  ['x^2+y^2-4x+2y=20', 'correct'],
  ['(x-2)^2+(y+1)^2=5', 'wrong'],
  ['(x+2)^2+(y-1)^2=25', 'wrong'],
]);

// ---------------------------------------------------------------- lists
cases('roots x = 2 ± √3 (exact)', ans.list([ans.exact(add(num(2), sqrt(3))), ans.exact(add(num(2), neg(sqrt(3))))], { v: 'x' }), [
  ['2+\\sqrt{3}, 2-\\sqrt{3}', 'correct'],
  ['x=2\\pm\\sqrt{3}', 'correct'],
  [['2+\\sqrt3', '2-\\sqrt3'], 'correct'],
  [['2-\\sqrt{3}', '2+\\sqrt{3}'], 'correct'],
  ['x = 2 + \\sqrt3 \\text{ or } x = 2-\\sqrt3', 'correct'],
  [['3.73', '0.268'], 'accuracy'],
  [['2+\\sqrt3'], 'accuracy'],
  [['2+\\sqrt3', '2-\\sqrt3', '2'], 'accuracy'],
  [['2+\\sqrt2', '2-\\sqrt2'], 'wrong'],
]);

cases('angles in degrees (30°, 150°)', ans.list([ans.num(30, { sf: 3 }), ans.num(150, { sf: 3 })], { v: '\\theta', angle: 'deg' }), [
  [['30', '150'], 'correct'],
  [['150', '30'], 'correct'],
  [['30°', '150°'], 'correct'],
  [['30^\\circ', '150^{\\circ}'], 'correct'],
  ['30, 150', 'correct'],
  [['30', '150', '390'], 'accuracy'],
  [['30'], 'accuracy'],
  [['\\frac{\\pi}{6}', '\\frac{5\\pi}{6}'], 'wrong'],
  [['30', '210'], 'accuracy'],
  [['60', '120'], 'wrong'],
]);

cases('angles in radians to 3 s.f.', ans.list([ans.num(0.5236, { sf: 3 }), ans.num(2.618, { sf: 3 })], { angle: 'rad' }), [
  [['0.524', '2.62'], 'correct'],
  [['\\frac{\\pi}{6}', '\\frac{5\\pi}{6}'], 'accuracy'],
  [['30°', '150°'], 'wrong'],
  [['0.52', '2.6'], 'accuracy'],
]);

cases('single-value list with a rejected root', ans.list([ans.exact(num(5))], { v: 'k' }), [
  [['5'], 'correct'],
  ['k = 5', 'correct'],
  [['5', '-8'], 'accuracy'],
  [['-8'], 'wrong'],
]);

// ---------------------------------------------------------------- coordinates & vectors
cases('coordinates (2, −3)', ans.coord(ans.exact(num(2)), ans.exact(num(-3))), [
  [['2', '-3'], 'correct'],
  ['(2, -3)', 'correct'],
  ['\\left(2,-3\\right)', 'correct'],
  [['-3', '2'], 'wrong'],
  [['2', '3'], 'accuracy'],
  [['1', '1'], 'wrong'],
  [['2', ''], 'invalid'],
]);

cases('exact coordinates (1/2, √3)', ans.coord(ans.exact(num(Q.of(1, 2))), ans.exact(sqrt(3))), [
  [['\\frac12', '\\sqrt3'], 'correct'],
  [['0.5', '\\sqrt{3}'], 'correct'],
  [['0.5', '1.732'], 'accuracy'],
]);

cases('vector 3i − 2j', ans.vec([ans.exact(num(3)), ans.exact(num(-2))]), [
  [['3', '-2'], 'correct'],
  ['3\\mathbf{i}-2\\mathbf{j}', 'correct'],
  ['3i - 2j', 'correct'],
  ['-2\\mathbf{j}+3\\mathbf{i}', 'correct'],
  ['\\begin{pmatrix}3\\\\-2\\end{pmatrix}', 'correct'],
  [['3', '2'], 'wrong'],
  ['3i + 2j', 'wrong'],
  ['3x - 2y', 'invalid'],
]);

cases('3D vector 2i − k', ans.vec([ans.exact(num(2)), ans.exact(num(0)), ans.exact(num(-1))]), [
  [['2', '0', '-1'], 'correct'],
  ['2\\mathbf{i}-\\mathbf{k}', 'correct'],
  ['\\begin{pmatrix}2\\\\0\\\\-1\\end{pmatrix}', 'correct'],
  [['2', '-1', '0'], 'wrong'],
]);

cases('vector with surd components', ans.vec([ans.num(Math.sqrt(2) * 5, { sf: 3 }), ans.num(-Math.sqrt(2) * 5, { sf: 3 })]), [
  [['7.07', '-7.07'], 'correct'],
  [['5\\sqrt2', '-5\\sqrt2'], 'accuracy'],
  [['7.1', '-7.07'], 'accuracy'],
]);

// ---------------------------------------------------------------- intervals
const outside = ans.interval([iv(NINF, num(2), false, false), iv(num(5), INF, false, false)]);
cases('quadratic inequality: x < 2 or x > 5', outside, [
  ['x<2 \\text{ or } x>5', 'correct'],
  ['x < 2 or x > 5', 'correct'],
  ['x<2, x>5', 'correct'],
  ['x>5 \\text{ or } x<2', 'correct'],
  ['2>x \\text{ or } x>5', 'correct'],
  ['\\left\\lbrace x:x<2\\right\\rbrace\\cup\\left\\lbrace x:x>5\\right\\rbrace', 'correct'],
  ['\\{x : x < 2\\} \\cup \\{x : x > 5\\}', 'correct'],
  ['x\\in(-\\infty,2)\\cup(5,\\infty)', 'correct'],
  ['x \\le 2 \\text{ or } x \\ge 5', 'accuracy'],
  ['2<x<5', 'accuracy'],
  ['x<2 \\text{ and } x>5', 'wrong'],
  ['x<3 \\text{ or } x>5', 'wrong'],
  ['x>2', 'wrong'],
  ['y<2', 'invalid'],
]);

const inside = ans.interval([iv(num(-1), num(4), true, true)]);
cases('closed interval −1 ⩽ x ⩽ 4', inside, [
  ['-1\\le x\\le 4', 'correct'],
  ['-1 \\leqslant x \\leqslant 4', 'correct'],
  ['-1≤x≤4', 'correct'],
  ['x \\ge -1 \\text{ and } x \\le 4', 'correct'],
  ['[-1, 4]', 'correct'],
  ['\\{x:-1\\le x\\le 4\\}', 'correct'],
  ['4\\ge x\\ge -1', 'correct'],
  ['-1<x<4', 'accuracy'],
  ['(-1,4)', 'accuracy'],
  ['x\\le -1 \\text{ or } x\\ge 4', 'accuracy'],
  ['-1\\le x\\le 5', 'wrong'],
]);

cases('set notation required', ans.interval([iv(NINF, num(2), false, false), iv(num(5), INF, false, false)], 'x', { setNotation: true }), [
  ['\\{x:x<2\\}\\cup\\{x:x>5\\}', 'correct'],
  ['x<2 \\text{ or } x>5', 'accuracy'],
]);

cases('critical region over the integers: X ⩽ 2 or X ⩾ 11', ans.interval([iv(NINF, num(2), false, true), iv(num(11), INF, true, false)], 'X', { integer: true }), [
  ['X \\le 2, X \\ge 11', 'correct'],
  ['X\\leqslant 2 \\cup X\\geqslant 11', 'correct'],
  ['X < 3 \\text{ or } X > 10', 'correct'],
  ['X\\le2 \\text{ or } X\\ge 11', 'correct'],
  ['X \\le 2', 'wrong'],
  ['X\\le 3, X\\ge 11', 'wrong'],
  ['X\\le 2, X\\ge 10', 'wrong'],
]);

cases('one-tailed critical region X ⩾ 9', ans.interval([iv(num(9), INF, true, false)], 'X', { integer: true }), [
  ['X\\ge 9', 'correct'],
  ['X > 8', 'correct'],
  ['X>9', 'wrong'],
]);

cases('range written with f(x): f(x) ⩾ 3', ans.interval([iv(num(3), INF, true, false)], 'y', { aliases: ['f(x)', 'f', 'y'], display: '\\mathrm{f}(x)' }), [
  ['f(x) \\geq 3', 'correct'],
  ['\\mathrm{f}\\left(x\\right)\\ge3', 'correct'],
  ['f \\geqslant 3', 'correct'],
  ['y >= 3', 'correct'],
  ['f(x) > 3', 'accuracy'],
  ['x \\geq 3', 'wrong'],
]);
cases('inverse-function domain: x > −2 written with g⁻¹', ans.interval([iv(num(-2), INF, false, false)], 'y', { aliases: ['g^{-1}(x)', 'g^{-1}', 'y'] }), [
  ['g^{-1}(x) > -2', 'correct'],
  ['g^-1(x)>-2', 'correct'],
  ['\\mathrm{g}^{-1}(x) > -2', 'correct'],
]);
cases('increasing interval: either strict or non-strict ends', ans.interval([iv(num(1), num(4), true, true)], 'x', { endsEither: true }), [
  ['1 < x < 4', 'correct'],
  ['1 \\le x \\le 4', 'correct'],
  ['1 \\le x < 4', 'correct'],
  ['x < 1 \\text{ or } x > 4', 'accuracy'],
]);

// ---------------------------------------------------------------- choice & hypothesis
cases('single choice', ans.choice(['A', 'B', 'C'], 1), [
  ['1', 'correct'],
  ['0', 'wrong'],
  ['2', 'wrong'],
]);
cases('multiple choice (B and C)', ans.choice(['A', 'B', 'C'], [1, 2], { multi: true }), [
  [['1', '2'], 'correct'],
  [['2', '1'], 'correct'],
  [['1'], 'wrong'],
  [['0', '1', '2'], 'wrong'],
]);

const H = ans.hyp({
  param: 'p',
  h0: 0.3,
  h1: '>',
  stat: { label: 'P(X ⩾ 10)', spec: ans.num(0.0479, { dp: 4 }) },
  reject: true,
  conclusions: ['There is evidence that p has increased', 'There is no evidence that p has increased'],
  correctConclusion: 0,
  marks: { hyp: 1, stat: 2, decision: 1, conclusion: 1 },
});
const full = { h0p: 'p', h0v: '0.3', h1p: 'p', h1op: '>', h1v: '0.3', stat: '0.0479', decision: 'reject', conclusion: '0' };
describe('hypothesis test marking', () => {
  count += 6;
  it('fully correct', () => expect(compare(H, full).status).toBe('correct'));
  it('two-tailed H1 loses the hypothesis mark', () => {
    const c = compare(H, { ...full, h1op: '!=' });
    expect(c.status).toBe('scored');
    expect(c.score).toBe(4);
  });
  it('wrong parameter', () => expect(compare(H, { ...full, h0p: 'mu', h1p: 'mu' }).score).toBe(4));
  it('wrong decision loses decision and conclusion', () => expect(compare(H, { ...full, decision: 'accept' }).score).toBe(3));
  it('wrong statistic', () => expect(compare(H, { ...full, stat: '0.1133' }).score).toBe(3));
  it('statistic to too few d.p.', () => expect(compare(H, { ...full, stat: '0.048' }).score).toBe(4));
});

// ---------------------------------------------------------------- parse robustness
cases('parse robustness (value 1/2)', ans.exact(num(Q.of(1, 2))), [
  ['\\frac{1}{2}', 'correct'],
  ['\\frac12', 'correct'],
  ['\\tfrac{1}{2}', 'correct'],
  ['\\left(\\frac{1}{2}\\right)', 'correct'],
  ['{1}/{2}', 'correct'],
  ['\\frac{\\frac{1}{2}}{1}', 'correct'],
  ['1/2', 'correct'],
  ['0.5', 'correct'],
  ['\\frac{1}{2', 'invalid'],
  ['(1/2', 'invalid'],
  ['1/', 'invalid'],
  ['\\placeholder{}', 'invalid'],
  ['\\foo{1}', 'invalid'],
]);

// ---------------------------------------------------------------- part-level: errors, ft, self-marking
describe('markPart: common errors, follow-through and partial credit', () => {
  const p = part({
    label: 'b',
    marks: 3,
    prompt: '',
    answer: ans.num(0.2365, { dp: 4 }),
    scheme: [M1('m'), A1('a'), A1('a')],
    hints: ['a', 'b', 'c'],
    errors: [err('no-cc', ans.num(0.1958, { dp: 4 }), 'continuity correction', 1)],
    solution: ['0.2365'],
    ft: (prev) => (prev.a?.value !== undefined ? ans.num(prev.a.value * 2, { sf: 3 }) : null),
  });
  count += 7;
  it('correct', () => expect(markPart(p, '0.2365').score).toBe(3));
  it('common error matched with partial marks', () => {
    const r = markPart(p, '0.1958');
    expect(r.errorId).toBe('no-cc');
    expect(r.score).toBe(1);
  });
  it('accuracy loses only the final mark', () => expect(markPart(p, '0.24').score).toBe(2));
  it('follow-through from a wrong earlier answer', () => {
    const r = markPart(p, '7.00', { a: { value: 3.5, correct: false } });
    expect(r.ft).toBe(true);
    expect(r.score).toBe(3);
  });
  it('no ft when the earlier part was correct', () => expect(markPart(p, '7.00', { a: { value: 3.5, correct: true } }).score).toBe(0));
  it('wrong answer is self-markable', () => expect(markPart(p, '0.9').selfMarkable).toBe(true));
  it('blank is unanswered and not self-markable', () => expect(markPart(p, '').verdict).toBe('unanswered'));
});

describe('B marks and missing + c at part level', () => {
  const p = part({
    marks: 3,
    prompt: '',
    answer: ans.integral(P('x^2')),
    scheme: [B1('b'), M1('m'), A1('a')],
    hints: ['a', 'b', 'c'],
    solution: ['x^2 + c'],
  });
  count += 2;
  it('missing c → 2/3 with feedback', () => {
    const r = markPart(p, 'x^2');
    expect(r.score).toBe(2);
    expect(r.errorId).toBe('missing-c');
  });
  it('with c → 3/3', () => expect(markPart(p, 'x^2+c').score).toBe(3));
});

// ---------------------------------------------------------------- CE fallback conversion
describe('Compute Engine MathJSON conversion', () => {
  count += 4;
  it('converts arithmetic', () => expect(evaluate(mathJsonToExpr(['Add', ['Multiply', 2, 'x'], ['Rational', 1, 2]])!, { x: 3 })).toBe(6.5));
  it('converts functions and constants', () => expect(evaluate(mathJsonToExpr(['Sin', ['Divide', 'Pi', 2]])!)).toBeCloseTo(1, 12));
  it('converts roots and powers', () => expect(evaluate(mathJsonToExpr(['Root', 27, 3])!)).toBeCloseTo(3, 12));
  it('rejects unknown heads', () => expect(mathJsonToExpr(['Foo', 1])).toBeNull());
});

describe('suite size', () => {
  it('has at least 300 answer pairs', () => expect(count).toBeGreaterThanOrEqual(300));
});
