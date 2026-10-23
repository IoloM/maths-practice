// The stored form of a password, made the way the app and the Worker expect (see server/src/auth.ts):
// the app stretches it with PBKDF2 (salted with the username), the Worker keeps a salted SHA-256 of that.
// CLI (used by setup.sh; the password comes from the environment, never the command line):
//   ADMIN_USER=iolo ADMIN_PASSWORD=… node scripts/admin-hash.mjs
import { createHash, pbkdf2Sync, randomBytes } from 'node:crypto';

export function stretch(username, password) {
  return pbkdf2Sync(password, `maths-practice login v1:${username.trim().toLowerCase()}`, 100_000, 32, 'sha256').toString('base64');
}

export function storedPassword(username, password, salt = randomBytes(16).toString('base64')) {
  const hash = createHash('sha256').update(salt + stretch(username, password)).digest('base64');
  return `s1$${salt}$${hash}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ADMIN_USER, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    console.error('Set ADMIN_USER and ADMIN_PASSWORD');
    process.exit(1);
  }
  console.log(storedPassword(ADMIN_USER, ADMIN_PASSWORD));
}
