/** Lazy chunk: MathLive + the A-level virtual keyboard. Uses the KaTeX fonts already bundled. */
import { MathfieldElement } from 'mathlive';
import type { VirtualKeyboardLayout } from 'mathlive';

const k = (latex: string, extra: Record<string, unknown> = {}) => ({ latex, ...extra });

const MAIN: VirtualKeyboardLayout = {
  id: 'alevel-main',
  label: '123',
  tooltip: 'Numbers and operators',
  rows: [
    [k('x'), k('y'), k('\\theta'), k('\\pi'), k('e', { insert: 'e' }), { class: 'separator w5' }, '[7]', '[8]', '[9]', k('\\div', { insert: '\\frac{#@}{#?}', label: '⁄', tooltip: 'fraction' }), { class: 'separator w5' }, k('#@^{2}', { insert: '#@^{2}', label: 'x²' }), k('#@^{#?}', { insert: '#@^{#?}', label: 'xⁿ' })],
    [k('t'), k('n'), k('c'), k('('), k(')'), { class: 'separator w5' }, '[4]', '[5]', '[6]', k('\\times'), { class: 'separator w5' }, k('\\sqrt{#0}', { insert: '\\sqrt{#0}' }), k('\\sqrt[#?]{#0}', { insert: '\\sqrt[#?]{#0}' })],
    [k('<'), k('>'), k('\\leqslant', { insert: '\\le' }), k('\\geqslant', { insert: '\\ge' }), k('\\pm'), { class: 'separator w5' }, '[1]', '[2]', '[3]', k('-'), { class: 'separator w5' }, k('\\left|#0\\right|', { insert: '\\left|#0\\right|', label: '|x|' }), '[backspace]'],
    [k(','), k('='), k('\\infty'), k('\\cup'), k('\\cap'), { class: 'separator w5' }, '[0]', '[.]', k('\\degree', { insert: '^{\\circ}', label: '°' }), k('+'), { class: 'separator w5' }, '[left]', '[right]'],
  ],
};

const FUNCS: VirtualKeyboardLayout = {
  id: 'alevel-functions',
  label: 'f(x)',
  tooltip: 'Functions, logs, vectors, sets',
  rows: [
    [k('\\sin', { insert: '\\sin\\left(#0\\right)' }), k('\\cos', { insert: '\\cos\\left(#0\\right)' }), k('\\tan', { insert: '\\tan\\left(#0\\right)' }), k('\\ln', { insert: '\\ln\\left(#0\\right)' }), k('e^{#0}', { insert: 'e^{#0}', label: 'eˣ' }), k('\\log_{#?}', { insert: '\\log_{#?}\\left(#0\\right)', label: 'logₐ' })],
    [k('\\sec', { insert: '\\sec\\left(#0\\right)' }), k('\\operatorname{cosec}', { insert: '\\operatorname{cosec}\\left(#0\\right)', label: 'cosec' }), k('\\cot', { insert: '\\cot\\left(#0\\right)' }), k('\\arcsin', { insert: '\\arcsin\\left(#0\\right)' }), k('\\arccos', { insert: '\\arccos\\left(#0\\right)' }), k('\\arctan', { insert: '\\arctan\\left(#0\\right)' })],
    [k('\\mathbf{i}', { insert: '\\mathbf{i}' }), k('\\mathbf{j}', { insert: '\\mathbf{j}' }), k('\\mathbf{k}', { insert: '\\mathbf{k}' }), k('\\begin{pmatrix}#0\\\\#?\\end{pmatrix}', { insert: '\\begin{pmatrix}#0\\\\#?\\end{pmatrix}', label: '( : )' }), k('\\{', { insert: '\\left\\lbrace #0\\right\\rbrace', label: '{ }' }), k(':')],
    [k('\\alpha'), k('\\mu'), k('\\sigma'), k('\\lambda'), k('\\text{ or }', { insert: '\\text{ or }', label: 'or' }), k('\\text{ and }', { insert: '\\text{ and }', label: 'and' })],
    [k('a'), k('b'), k('k'), k('r'), k('v'), '[backspace]'],
  ],
};

let done = false;
export function setup(): typeof MathfieldElement {
  if (done) return MathfieldElement;
  MathfieldElement.fontsDirectory = null; // fonts come from katex.css
  MathfieldElement.soundsDirectory = null;
  const kb = (window as unknown as { mathVirtualKeyboard?: { layouts: unknown } }).mathVirtualKeyboard;
  if (kb) kb.layouts = [MAIN, FUNCS, 'alphabetic'];
  done = true;
  return MathfieldElement;
}
