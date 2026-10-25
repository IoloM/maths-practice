/**
 * Read aloud with the device's own voices (Web Speech API): nothing leaves the device. Maths is
 * spoken the way you'd say it ("x squared plus 3 over 4"), using tex-speech.
 */
import type { Instance } from '../engine/templates/types';
import { speakText } from './tex-speech';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

const voice = () => {
  const vs = window.speechSynthesis.getVoices();
  return vs.find((v) => v.lang === 'en-GB' && v.localService) ?? vs.find((v) => v.lang === 'en-GB') ?? vs.find((v) => v.lang.startsWith('en'));
};

/** Speak, sentence by sentence (some browsers cut off one long utterance); onEnd when done or stopped. */
export function speak(text: string, onEnd: () => void): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const parts = text.split(/(?<=[.!?])\s+/).filter((p) => p.trim());
  if (!parts.length) return onEnd();
  parts.forEach((p, i) => {
    const u = new SpeechSynthesisUtterance(p);
    u.lang = 'en-GB';
    const v = voice();
    if (v) u.voice = v;
    if (i === parts.length - 1) u.onend = onEnd;
    u.onerror = onEnd;
    synth.speak(u);
  });
}

export const stopSpeaking = () => canSpeak() && window.speechSynthesis.cancel();

const sentence = (s: string) => (/[.!?:]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** The whole question as it should be read out: stem, figure, then each part with its marks and any options. */
export function questionSpeech(inst: Instance, number: number): string {
  const out: string[] = [`Question ${number}.`];
  if (inst.stem) out.push(sentence(speakText(inst.stem)));
  if (inst.diagram) out.push(sentence(`Figure: ${inst.diagram.alt}`));
  const single = inst.parts.length === 1 && !inst.parts[0].label;
  for (const p of inst.parts) {
    out.push(`${single ? '' : `Part ${p.label}. `}${p.marks} mark${p.marks === 1 ? '' : 's'}.`);
    out.push(sentence(speakText(p.prompt)));
    if (p.answer.type === 'choice') out.push(`Options: ${p.answer.options.map((o, i) => `${i + 1}: ${speakText(o)}`).join('; ')}.`);
  }
  return out.join(' ');
}
