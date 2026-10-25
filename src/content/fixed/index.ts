/** Fixed (non-generated) questions: proof, explain/interpret, modelling assumptions, large data set. */
import type { FixedQuestion } from '../../engine/templates/types';
import { PROOF } from './proof';
import { MECHANICS } from './mechanics';
import { STATISTICS } from './statistics';
import { LARGE_DATA_SET } from './large-data-set';
import { PURE } from './pure';
import { SHOW_THAT } from './show-that';

export const FIXED: FixedQuestion[] = [...PROOF, ...PURE, ...STATISTICS, ...LARGE_DATA_SET, ...MECHANICS, ...SHOW_THAT];
