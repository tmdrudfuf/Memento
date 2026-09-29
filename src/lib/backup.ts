import { Directory, File, FileMode, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { readArchive, writeArchive, type Source } from './archive';
import { dumpAll, isBackup, restoreRows, type DB } from './db';

// Manual backup: one .zip the user keeps anywhere (Drive, Files, email). Nothing is uploaded by us.
const mediaDir = () => new Directory(Paths.document, 'media');

export class NotABackupError extends Error {}

/** Builds the backup zip in the cache folder and opens the share sheet to save it. */
export async function exportBackup(db: DB, onProgress?: (done: number, total: number) => void) {
  const data = await dumpAll(db);
  const names = [...new Set([...data.memories.map((m) => m.cover), ...data.media.map((m) => m.file)])];
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const out = new File(Paths.cache, `Memento-backup-${stamp}.zip`);
  if (out.exists) out.delete();
  out.create();
  const w = out.open(FileMode.WriteOnly);
  let open: { close: () => void } | null = null; // at most one media file open at a time
  try {
    const sources: Source[] = names
      .map((name) => new File(mediaDir(), name))
      .filter((f) => f.exists)
      .map((f) => {
        const size = f.size ?? 0;
        let h: ReturnType<File['open']> | null = null;
        let done = 0;
        return {
          name: f.name,
          size,
          read: (n: number) => {
            if (!h) open = h = f.open(FileMode.ReadOnly);
            const b = h.readBytes(n);
            done += b.length;
            if (done >= size) {
              h.close();
              open = h = null;
            }
            return b;
          },
        };
      });
    await writeArchive(data, sources, (b) => w.writeBytes(b), onProgress);
  } finally {
    (open as { close: () => void } | null)?.close();
    w.close();
  }
  await Sharing.shareAsync(out.uri, { mimeType: 'application/zip', dialogTitle: out.name });
  return out;
}

/** Lets the user pick a backup .zip and adds its jars and memories to this phone. */
export async function importBackup(db: DB): Promise<{ jars: number; memories: number } | null> {
  const picked = await File.pickFileAsync({
    mimeTypes: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
  });
  if (picked.canceled || !picked.result) return null;
  const dir = mediaDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const extracted: File[] = [];
  const r = picked.result.open(FileMode.ReadOnly);
  let json: unknown;
  try {
    json = await readArchive(
      (n) => r.readBytes(n),
      (name) => {
        const dest = new File(dir, name);
        if (dest.exists) return null; // same capture already on this phone
        dest.create();
        extracted.push(dest);
        const h = dest.open(FileMode.WriteOnly);
        return { write: (b) => h.writeBytes(b), close: () => h.close() };
      },
    );
  } catch (e) {
    extracted.forEach((f) => f.exists && f.delete()); // no half-restored files
    throw e;
  } finally {
    r.close();
  }
  if (!isBackup(json)) {
    extracted.forEach((f) => f.exists && f.delete());
    throw new NotABackupError();
  }
  return restoreRows(db, json);
}
