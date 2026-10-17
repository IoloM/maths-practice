/** Fixed questions behave like single-seed templates, so practice, review and progress need no special cases. */
import type { FixedQuestion, Template } from '../../engine/templates/types';
import { ans, part } from '../../engine/templates/helpers';
import { expect } from '../../engine/core/numeric';

const GENERIC_HINTS: [string, string, string] = [
  'Read the question carefully and pick out the key words (command word, context, what is being asked for).',
  'Use precise mathematical language and refer to the context.',
  'Compare your answer with the mark scheme points after checking.',
];

export function fixedToTemplate(f: FixedQuestion): Template {
  const { id, title, spec, chapter, sections, level, paper, difficulty, marks, time, commands, tags } = f;
  return {
    id,
    family: f.family ?? `fx.${chapter}`,
    title,
    spec,
    chapter,
    sections: sections ?? [],
    level,
    paper,
    difficulty,
    marks,
    time,
    commands,
    tags: [...tags, 'fixed'],
    generate: () => ({
      stem: f.stem,
      diagram: f.diagram,
      parts: [
        part({
          marks,
          prompt: f.prompt,
          answer: f.kind === 'choice' ? ans.choice(f.options ?? [], f.correct ?? [], { multi: (f.correct ?? []).length > 1 }) : ans.self(f.modelAnswer),
          scheme: f.checklist,
          hints: f.hints ?? GENERIC_HINTS,
          solution: [f.modelAnswer],
        }),
      ],
      params: {},
    }),
    verify: () => {
      if (f.kind === 'choice') {
        expect(f.options && f.options.length >= 2, `${id}: needs options`);
        expect(f.correct && f.correct.length >= 1 && f.correct.every((i) => i >= 0 && i < f.options!.length), `${id}: correct index`);
      } else expect(f.modelAnswer.trim().length > 20, `${id}: model answer`);
    },
  };
}
