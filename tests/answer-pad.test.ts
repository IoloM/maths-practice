import { describe, expect, it } from 'vitest';
import { tidyReading } from '../src/components/AnswerPad';
import type { AnswerSpec } from '../src/engine/marking/types';

describe('using an answer the AI read from handwriting', () => {
  it('drops a written "x =" when the box already shows it, and spaces in numbers', () => {
    expect(tidyReading('x = 2.5', { type: 'numeric', value: 2.5, label: 'x =' } as AnswerSpec)).toBe('2.5');
    expect(tidyReading('k=\\frac{3}{4}', { type: 'exact', value: '\\frac34', label: 'k =' } as unknown as AnswerSpec)).toBe('\\frac{3}{4}');
    expect(tidyReading('12\\,500', { type: 'numeric', value: 12500 } as AnswerSpec)).toBe('12500');
  });
  it('leaves other answers as written', () => {
    expect(tidyReading(' y = 3x - 2 ', { type: 'equation' } as unknown as AnswerSpec)).toBe('y = 3x - 2');
    expect(tidyReading('x = 2', { type: 'exact', value: '2' } as unknown as AnswerSpec)).toBe('x = 2');
  });
});
