/** Lazily loaded: fixed questions as templates, keyed by id. */
import { FIXED } from './index';
import { fixedToTemplate } from './adapter';

export const FIXED_TEMPLATES = new Map(FIXED.map((f) => [f.id, fixedToTemplate(f)]));
