/**
 * Mr Astbury's booklets from the site: he gave them for it, and they are kept in a private storage
 * bucket that only signed-in people can read (migration 20261114000000_booklets.sql). Downloaded
 * once per device, then kept on the device like a file you loaded yourself.
 */
import { cloudMe, supabase } from './cloud';
import type { BookletFile } from './booklet-files';

const NAMES: Record<BookletFile, string> = { questions: 'astbury-questions.pdf', solutions: 'astbury-solutions.pdf' };

/** Can this device get the booklets from the site (someone is signed in)? */
export const canDownloadBooklets = () => !!cloudMe();

/** The booklet's bytes from the site, or null (not signed in, offline, or not there). */
export async function downloadBooklet(kind: BookletFile): Promise<ArrayBuffer | null> {
  if (!cloudMe()) return null;
  try {
    const sb = await supabase();
    const { data, error } = await sb.storage.from('booklets').download(NAMES[kind]);
    if (error || !data) return null;
    return await data.arrayBuffer();
  } catch {
    return null;
  }
}
