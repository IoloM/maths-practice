/**
 * Claude reads handwriting and marks working. Both calls return structured JSON (zod schemas) and
 * use the server-side refusal fallback, so a declined request is retried on Anthropic's
 * recommended model instead of failing.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { HttpError } from './http';

export const MODEL = 'claude-opus-5-5';
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'] as Anthropic.Beta.AnthropicBeta[], fallbacks: 'default' as const };
export const MAX_IMAGE_CHARS = 4_000_000;

// ---------------------------------------------------------------- reading a handwritten answer
export const ReadResult = z.object({
  answer: z.string(),
  unclear: z.boolean(),
  note: z.string(),
});
export type ReadResult = z.infer<typeof ReadResult>;

export const READ_SYSTEM = `You read a student's handwritten final answer to an A level maths question from an image and write it out exactly as written. You are not marking it: do not correct, simplify, complete or solve anything.

Write the answer as LaTeX without dollar signs: fractions as \\frac{a}{b}, roots as \\sqrt{...}, powers with ^{...}, π as \\pi, ≤ as \\leqslant and ≥ as \\geqslant. Keep everything that is written, including "x =" or "y =", "+ c" and units. Separate several answers with commas, as written.

If a symbol is hard to read, give your best reading, set unclear to true and say in the note which symbol is uncertain. If the image is blank or is not maths, return an empty answer with unclear true. Otherwise leave the note empty.`;

export interface ReadRequest {
  image: string;
  /** the question the answer belongs to, to help with ambiguous symbols */
  question?: string;
  /** e.g. "an exact value", "a set of values of x" */
  expects?: string;
}

export function checkImage(image: unknown): string {
  if (typeof image !== 'string' || !image) throw new HttpError(400, 'Missing image');
  const data = image.replace(/^data:image\/png;base64,/, '');
  if (data.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=]+$/.test(data)) throw new HttpError(400, 'Image must be a base64 PNG under 3 MB');
  return data;
}

export async function readHandwriting(client: Anthropic, req: ReadRequest): Promise<ReadResult> {
  const data = checkImage(req.image);
  const context = [req.question && `The question (only to help read unclear symbols — do not answer it): ${req.question.slice(0, 2000)}`, req.expects && `The answer should be ${req.expects.slice(0, 200)}.`].filter(Boolean).join('\n');
  const msg = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort: 'low', format: betaZodOutputFormat(ReadResult) },
    system: READ_SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data } },
          { type: 'text', text: context || 'Read the handwritten answer.' },
        ],
      },
    ],
  });
  return parsed(msg);
}

// ---------------------------------------------------------------- marking working against a mark scheme
export const MarkResult = z.object({
  lines: z.array(z.object({ index: z.number().int(), awarded: z.boolean(), comment: z.string() })),
  summary: z.string(),
  nextStep: z.string(),
  legible: z.boolean(),
});
export type MarkResult = z.infer<typeof MarkResult>;

export const MARK_SYSTEM = `You are an experienced Pearson Edexcel A level Mathematics examiner. You mark one part of a question against the mark scheme you are given, then give the student short, specific, encouraging feedback.

How to mark:
- Award a mark only when the student's own working shows it. Never award a mark for work that is not there, and do not assume missing steps.
- M marks are for a correct method applied to this problem (slips in arithmetic are allowed). A marks are for accurate results and depend on the M mark before them. B marks are independent. dM marks depend on the previous M mark. ft (follow through) marks allow correct work from the student's own earlier values.
- Accept any correct equivalent method or form unless the scheme says otherwise.
- If the working is illegible or missing, say so, set legible to false where that is the case, and do not award the marks it would need.

Return one entry in lines for every mark scheme line, using the line's index. Each comment is at most two sentences, speaking to the student as "you", in British English and plain words. The summary is at most three sentences. nextStep is the single most useful thing for the student to fix or practise.`;

export interface MarkRequest {
  question: string;
  marks: number;
  scheme: { code: string; text: string }[];
  solution?: string;
  /** PNG of the handwritten working (optional if typed working is given) */
  image?: string;
  typed?: string;
  answer?: string;
  autoResult?: string;
}

export async function markWorking(client: Anthropic, req: MarkRequest): Promise<MarkResult> {
  if (typeof req.question !== 'string' || !Array.isArray(req.scheme) || !req.scheme.length) throw new HttpError(400, 'Missing question or mark scheme');
  if (!req.image && !req.typed?.trim()) throw new HttpError(400, 'Send handwritten or typed working to mark');
  const scheme = req.scheme
    .slice(0, 30)
    .map((l, i) => `${i}. ${String(l.code).slice(0, 8)}: ${String(l.text).slice(0, 600)}`)
    .join('\n');
  const text = [
    `Question part (${Number(req.marks) || req.scheme.length} marks):\n${req.question.slice(0, 4000)}`,
    `Mark scheme (index. code: description):\n${scheme}`,
    req.solution && `Model solution:\n${req.solution.slice(0, 4000)}`,
    req.typed?.trim() && `The student's typed working:\n${req.typed.slice(0, 6000)}`,
    req.answer && `The student's final answer: ${req.answer.slice(0, 500)}`,
    req.autoResult && `The automatic answer checker said: ${req.autoResult.slice(0, 500)}`,
    req.image ? "The student's handwritten working is in the image." : 'There is no handwritten working.',
  ]
    .filter(Boolean)
    .join('\n\n');
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (req.image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: checkImage(req.image) } });
  content.push({ type: 'text', text });
  const msg = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { format: betaZodOutputFormat(MarkResult) },
    system: MARK_SYSTEM,
    messages: [{ role: 'user', content }],
  });
  const out = parsed(msg);
  // keep only well-formed, in-range lines, one per scheme line
  const seen = new Set<number>();
  out.lines = out.lines.filter((l) => l.index >= 0 && l.index < req.scheme.length && !seen.has(l.index) && seen.add(l.index));
  return out;
}

/** The structured result, or a clear error when the model declined or ran out of room. */
function parsed<T>(msg: { stop_reason: string | null; parsed_output: T | null; usage?: unknown }): T {
  console.log(JSON.stringify({ stop: msg.stop_reason, usage: msg.usage }));
  if (msg.stop_reason === 'refusal') throw new HttpError(422, 'The AI declined this request — try rewording or marking it yourself');
  if (msg.stop_reason === 'max_tokens' || !msg.parsed_output) throw new HttpError(502, 'The AI response was incomplete — please try again');
  return msg.parsed_output;
}
