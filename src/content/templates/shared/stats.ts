/** Shared helpers for statistics templates. Contexts are original. */
import { ibeta } from '../../../engine/stats/distributions';
import { nCr } from '../../../engine/core/rational';
import { fmtDP, fmtNum } from '../../../engine/core/format';
import type { Rng } from '../../../engine/core/rng';

export type Op = '<' | '<=' | '>' | '>=' | '=';
const OP_TEX: Record<Op, string> = { '<': '<', '<=': '\\leqslant', '>': '>', '>=': '\\geqslant', '=': '=' };

/** \mathrm{P}(X \leqslant 3) */
export function pX(op: Op, x: number | string, v = 'X'): string {
  return `\\mathrm{P}(${v} ${OP_TEX[op]} ${x})`;
}
export function opTex(op: Op): string {
  return OP_TEX[op];
}

/** P(X ⩽ k) for B(n, p) via the regularised incomplete beta function — independent of the summation used in templates. */
export function binomCdfBeta(n: number, p: number, k: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  return ibeta(1 - p, n - k, k + 1);
}

/** Exact-ish pmf by direct formula (for verify). */
export function binomPmfDirect(n: number, p: number, r: number): number {
  return nCr(n, r) * p ** r * (1 - p) ** (n - r);
}

/** 4 d.p. string. */
export const d4 = (x: number) => fmtDP(x, 4);
export const pct = (a: number) => `${fmtNum(a * 100)}\\%`;
export const pTex = (p: number) => fmtNum(p);

export interface BinContext {
  /** "a large batch of light bulbs" */
  population: string;
  /** "bulb" */
  item: string;
  /** "bulbs" */
  items: string;
  /** "is faulty" */
  is: string;
  /** "are faulty" */
  are: string;
  /** "faulty bulbs" */
  noun: string;
  /** who makes a claim */
  person: string;
}

export const BIN_CONTEXTS: BinContext[] = [
  { population: 'the bulbs made by a factory', item: 'bulb', items: 'bulbs', is: 'is faulty', are: 'are faulty', noun: 'faulty bulbs', person: 'The factory manager' },
  { population: 'a type of sunflower seed', item: 'seed', items: 'seeds', is: 'germinates', are: 'germinate', noun: 'seeds that germinate', person: 'A gardener' },
  { population: 'patients given a standard treatment', item: 'patient', items: 'patients', is: 'recovers within a week', are: 'recover within a week', noun: 'patients who recover within a week', person: 'A doctor' },
  { population: 'customers at a café', item: 'customer', items: 'customers', is: 'pays by card', are: 'pay by card', noun: 'customers who pay by card', person: 'The café owner' },
  { population: 'emails received by a company', item: 'email', items: 'emails', is: 'is spam', are: 'are spam', noun: 'spam emails', person: 'The IT manager' },
  { population: 'students at a large college', item: 'student', items: 'students', is: 'cycles to college', are: 'cycle to college', noun: 'students who cycle to college', person: 'The principal' },
  { population: 'parcels sent by a courier', item: 'parcel', items: 'parcels', is: 'is delivered late', are: 'are delivered late', noun: 'parcels delivered late', person: 'The courier' },
  { population: 'free throws taken by a basketball player', item: 'free throw', items: 'free throws', is: 'is scored', are: 'are scored', noun: 'free throws scored', person: 'The coach' },
  { population: 'trains on a commuter line', item: 'train', items: 'trains', is: 'arrives late', are: 'arrive late', noun: 'trains that arrive late', person: 'A commuter' },
  { population: 'plants of a certain variety', item: 'plant', items: 'plants', is: 'has blue flowers', are: 'have blue flowers', noun: 'plants with blue flowers', person: 'A botanist' },
  { population: 'phone calls to a helpline', item: 'call', items: 'calls', is: 'is answered within a minute', are: 'are answered within a minute', noun: 'calls answered within a minute', person: 'The helpline supervisor' },
  { population: 'eggs from a farm', item: 'egg', items: 'eggs', is: 'is cracked', are: 'are cracked', noun: 'cracked eggs', person: 'The farmer' },
];

export function pickContext(r: Rng): BinContext {
  return r.pick(BIN_CONTEXTS);
}

export const SIG_LEVELS = [0.01, 0.05, 0.1] as const;
export const P_VALUES = [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45] as const;
export const N_VALUES = [10, 12, 15, 16, 20, 25, 30, 40, 50] as const;
