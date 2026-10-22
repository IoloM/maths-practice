import { describe, expect, it } from 'vitest';
import { speakTex, speakText } from '../src/lib/tex-speech';

describe('speakTex', () => {
  it.each([
    ['x^2 + 3x', 'x squared + 3x'],
    ['x^{3} - 1', 'x cubed − 1'],
    ['e^{2x}', 'e to the power 2x'],
    ['\\frac{1}{2}', '1 over 2'],
    ['\\dfrac{x+1}{x-1}', 'x+1 over x − 1'],
    ['\\sqrt{3}', 'square root of 3'],
    ['\\sqrt[3]{8}', 'root 3 of 8'],
    ['x \\leqslant 2', 'x ≤ 2'],
    ['H_0: p = 0.3', 'H sub 0: p = 0.3'],
    ['\\bar{x} = 12.5', 'x bar = 12.5'],
    ['\\binom{10}{3}', '10 choose 3'],
    ['30^\\circ', '30°'],
    ['\\sin\\theta', 'sin θ'],
    ['\\left(\\frac{1}{2}, 3\\right)', '(1 over 2, 3)'],
    ['\\mathbb{R}', 'ℝ'],
    ['\\text{B}(20, 0.3)', 'B(20, 0.3)'],
    ['\\overrightarrow{AB}', 'vector AB'],
  ])('%s → %s', (tex, spoken) => {
    expect(speakTex(tex)).toBe(spoken);
  });
});

describe('speakText', () => {
  it('reads the maths and keeps the words', () => {
    expect(speakText('Binomial, $X \\sim \\text{B}(20, 0.3)$')).toBe('Binomial, X ~ B(20, 0.3)');
    expect(speakText('$x > 2$ **or** $x < -1$')).toBe('x > 2 or x < − 1');
    expect(speakText('costs \\$5')).toBe('costs $5');
    expect(speakText('184')).toBe('184');
  });
});
