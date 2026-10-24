// Supabase Edge Function entry (Deno). The secret key comes from the platform's own environment.
import { createClient } from '@supabase/supabase-js';
import { handle } from './handler.ts';
import { supabaseBackend } from './backend.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
const secret = secrets.default ?? Object.values(secrets)[0] ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const origins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://iolom.github.io').split(',').map((s) => s.trim());

Deno.serve((req) => handle(req, { backend: supabaseBackend(client), origins }));
