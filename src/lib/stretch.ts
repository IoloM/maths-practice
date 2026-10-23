/** Password helpers shared by the app, its tests and (in spirit) server/scripts/admin-hash.mjs. */

/** What is sent instead of the password: PBKDF2-SHA-256, 100,000 rounds, salted with the username. */
export async function stretch(username: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(`maths-practice login v1:${username.trim().toLowerCase()}`), iterations: 100_000, hash: 'SHA-256' }, base, 256);
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

/** A temporary password an admin can read out or text: three groups of four, no look-alike characters. */
export function tempPassword(): string {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789';
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b, (x) => a[x % a.length])
    .join('')
    .match(/.{4}/g)!
    .join('-');
}
