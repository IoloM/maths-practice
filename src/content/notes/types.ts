/** Revision notes for one textbook chapter. Text may contain $…$ maths and **bold**. */
export interface TopicNotes {
  /** what the topic is about, in a sentence or two */
  intro: string;
  /** the ideas to understand, in order */
  key: string[];
  /** results to know: [what it is, the formula]; "booklet" in the label means it's printed in the exam booklet */
  formulae?: [string, string][];
  /** one worked example, step by step */
  example: { q: string; steps: string[] };
  /** where marks usually go */
  mistakes: string[];
  /** how to pick up marks in the exam */
  tips: string[];
}

export const md = String.raw;
