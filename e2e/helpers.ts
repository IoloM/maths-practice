import type { Page } from '@playwright/test';
import { ALL_TEMPLATES } from '../src/content/templates/all.gen';
import { generateInstance } from '../src/engine/templates/validate';
import { canonicalResponse } from '../src/engine/marking/mark';

/** Use plain-text answer boxes so typing is identical in every browser. */
export async function plainInput(page: Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript((e) => {
    if (!localStorage.getItem('mp.settings.v1')) localStorage.setItem('mp.settings.v1', JSON.stringify({ input: 'plain', installDismissed: Date.now(), ...e }));
  }, extra);
}

/** The answer a perfect student would type, computed from the same engine. */
export function answerFor(id: string, seed: number, part = 0) {
  const t = ALL_TEMPLATES.find((x) => x.id === id)!;
  return canonicalResponse(generateInstance(t, seed).parts[part].answer);
}
