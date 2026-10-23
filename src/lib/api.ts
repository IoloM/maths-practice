/**
 * The optional sync / AI server (server/). Its address is built in at deploy time (VITE_API_URL)
 * or typed in Settings. The Anthropic key lives only on the server; the app sends an access code.
 */
import { readSettings, type Settings } from './settings';

export const BUILT_IN_API = ((import.meta.env?.VITE_API_URL as string | undefined) ?? '').trim().replace(/\/+$/, '');

export function apiBase(s: Pick<Settings, 'apiUrl'> = readSettings()): string {
  return (s.apiUrl.trim() || BUILT_IN_API).replace(/\/+$/, '');
}

/** AI reading and marking need a server and an access code. */
export const aiReady = (s: Pick<Settings, 'apiUrl' | 'aiCode'>) => !!(apiBase(s) && s.aiCode.trim());

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** One request; the parsed JSON body comes back for any status listed in `ok`. */
export async function request<T>(path: string, init: RequestInit & { base?: string; ok?: number[]; timeoutMs?: number } = {}): Promise<{ status: number; body: T }> {
  const { base = apiBase(), ok = [200], timeoutMs = 30_000, ...rest } = init;
  if (!base) throw new ApiError(0, 'No server is set up');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: globalThis.Response;
  try {
    res = await fetch(base + path, { ...rest, signal: ctrl.signal, headers: { 'content-type': 'application/json', ...(rest.headers as Record<string, string>) } });
  } catch {
    throw new ApiError(0, navigator.onLine === false ? 'You are offline' : ctrl.signal.aborted ? 'The server took too long to answer' : 'Could not reach the server');
  } finally {
    clearTimeout(timer);
  }
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!ok.includes(res.status)) throw new ApiError(res.status, body.error ?? `Server error (${res.status})`);
  return { status: res.status, body };
}

export async function health(base = apiBase()): Promise<{ ok: boolean; ai: boolean }> {
  return (await request<{ ok: boolean; ai: boolean }>('/health', { base, timeoutMs: 10_000 })).body;
}

const aiHeaders = (s: Pick<Settings, 'aiCode'>) => ({ 'x-access-code': s.aiCode.trim() });

/** Is this access code right? (Free: no AI call.) */
export async function aiCheck(s: Pick<Settings, 'apiUrl' | 'aiCode'>): Promise<void> {
  await request('/ai/check', { base: apiBase(s), headers: aiHeaders(s), timeoutMs: 10_000 });
}

export interface ReadResult {
  answer: string;
  unclear: boolean;
  note: string;
}

/** A handwritten answer (PNG, base64) read as LaTeX. */
export async function aiRead(req: { image: string; question?: string; expects?: string }, s = readSettings()): Promise<ReadResult> {
  return (await request<ReadResult>('/ai/read', { base: apiBase(s), method: 'POST', headers: aiHeaders(s), body: JSON.stringify(req), timeoutMs: 90_000 })).body;
}

export interface MarkRequest {
  question: string;
  marks: number;
  scheme: { code: string; text: string }[];
  solution?: string;
  image?: string;
  typed?: string;
  answer?: string;
  autoResult?: string;
}

export interface AiMarkResult {
  lines: { index: number; awarded: boolean; comment: string }[];
  summary: string;
  nextStep: string;
  legible: boolean;
}

/** Working marked against the mark scheme, line by line. */
export async function aiMark(req: MarkRequest, s = readSettings()): Promise<AiMarkResult> {
  return (await request<AiMarkResult>('/ai/mark', { base: apiBase(s), method: 'POST', headers: aiHeaders(s), body: JSON.stringify(req), timeoutMs: 180_000 })).body;
}
