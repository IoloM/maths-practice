/**
 * Mr Astbury's booklets, as the student loaded them: kept in this device's own IndexedDB database
 * ('mp-files'), never uploaded, synced, backed up or moved. The name doesn't start with
 * 'maths-practice', so the progress database code (backups, moving address) leaves it alone.
 */
import { openDB } from 'idb';

export type BookletFile = 'questions' | 'solutions';

export interface StoredFile {
  kind: BookletFile;
  name: string;
  data: ArrayBuffer;
  pages: number;
  savedAt: number;
}

const db = () =>
  openDB('mp-files', 1, {
    upgrade(d) {
      d.createObjectStore('files', { keyPath: 'kind' });
    },
  });

export async function saveBookletFile(f: StoredFile): Promise<void> {
  await (await db()).put('files', f);
}

export async function loadBookletFile(kind: BookletFile): Promise<StoredFile | undefined> {
  try {
    return (await (await db()).get('files', kind)) as StoredFile | undefined;
  } catch {
    return undefined;
  }
}

export async function removeBookletFile(kind: BookletFile): Promise<void> {
  await (await db()).delete('files', kind);
}
