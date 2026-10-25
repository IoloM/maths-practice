import { describe, expect, it } from 'vitest';
import { questionSpeech } from '../src/lib/speech';
import type { Instance } from '../src/engine/templates/types';

describe('reading a question aloud', () => {
  it('reads the stem, the figure, each part with its marks, and the options', () => {
    const inst = {
      templateId: 't',
      seed: 1,
      stem: 'Given $y = x^{2} + \\frac{3}{4}$',
      diagram: { svg: '', alt: 'A parabola' },
      params: {},
      parts: [
        { label: 'a', marks: 2, prompt: 'Find $\\frac{dy}{dx}$', answer: { type: 'expr' }, scheme: [], hints: ['', '', ''], errors: [], solution: [] },
        { label: 'b', marks: 1, prompt: 'Which is right?', answer: { type: 'choice', options: ['$x > 0$', 'Neither'], correct: [0] }, scheme: [], hints: ['', '', ''], errors: [], solution: [] },
      ],
    } as unknown as Instance;
    const s = questionSpeech(inst, 3);
    expect(s).toMatch(/^Question 3\. Given y = x squared \+ 3 over 4\. Figure: A parabola\. Part a\. 2 marks\. Find dy over dx\./);
    expect(s).toContain('Part b. 1 mark. Which is right? Options: 1: x > 0; 2: Neither.');
  });
});
