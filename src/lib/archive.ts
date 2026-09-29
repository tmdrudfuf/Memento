// Streaming zip writer/reader for backups. Pure (fflate + callbacks) so it runs in tests too.
// Media is stored, not compressed: JPEG/MP4 are already compressed, and it keeps memory use flat.
import { strFromU8, strToU8, Unzip, UnzipInflate, Zip, ZipPassThrough } from 'fflate';

export const CHUNK = 1024 * 1024;
/** fflate writes no Zip64, so every archive must stay under 4 GB; parts are capped with headroom. */
export const PART_LIMIT = 3.5 * 1024 ** 3;
export const JSON_NAME = 'memento.json';

/** Only plain file names we generated ourselves; blocks "../" and absolute paths from untrusted zips. */
export const safeMediaName = (name: string) => /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(name) && !name.includes('..');

export type Source = { name: string; size: number; read: (length: number) => Uint8Array };

/**
 * Groups files into parts whose total size stays under `limit` (order kept). Each part becomes its own
 * zip with the full memento.json, so parts can be restored in any order.
 * ponytail: a single file larger than 4 GB still can't be zipped; not realistic for phone videos yet.
 */
export function splitParts<T extends { size: number }>(files: T[], limit = PART_LIMIT): T[][] {
  const parts: T[][] = [[]];
  let used = 0;
  for (const f of files) {
    if (used + f.size > limit && parts[parts.length - 1].length) {
      parts.push([]);
      used = 0;
    }
    parts[parts.length - 1].push(f);
    used += f.size;
  }
  return parts;
}

const tick = () => new Promise((r) => setTimeout(r, 0)); // let the UI breathe between chunks

export async function writeArchive(
  json: unknown,
  files: Source[],
  write: (bytes: Uint8Array) => void,
  onProgress?: (done: number, total: number) => void,
) {
  let error: Error | null = null;
  const zip = new Zip((err, chunk) => {
    if (err) error = err;
    else write(chunk);
  });
  const meta = new ZipPassThrough(JSON_NAME);
  zip.add(meta);
  meta.push(strToU8(JSON.stringify(json)), true);
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const entry = new ZipPassThrough(`media/${f.name}`);
    zip.add(entry);
    if (f.size === 0) entry.push(new Uint8Array(0), true);
    for (let done = 0; done < f.size;) {
      const bytes = f.read(Math.min(CHUNK, f.size - done));
      if (!bytes.length) throw new Error(`Unexpected end of ${f.name}`);
      done += bytes.length;
      entry.push(bytes, done >= f.size);
      await tick();
    }
    onProgress?.(i + 1, files.length);
    if (error) throw error;
  }
  zip.end();
  if (error) throw error;
}

export type Sink = { write: (bytes: Uint8Array) => void; close: () => void };

/**
 * Reads a backup zip chunk by chunk. `openMedia` returns a sink for files to extract, or null to skip
 * (already present). Unsafe names are skipped. Returns the parsed memento.json (or null if absent).
 */
export async function readArchive(
  read: (length: number) => Uint8Array,
  openMedia: (name: string) => Sink | null,
): Promise<unknown> {
  let json: unknown = null;
  let error: unknown = null;
  const unzip = new Unzip();
  unzip.register(UnzipInflate);
  unzip.onfile = (file) => {
    if (file.name === JSON_NAME) {
      const parts: Uint8Array[] = [];
      file.ondata = (err, chunk, final) => {
        if (err) return void (error = err);
        parts.push(chunk);
        if (final) {
          const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
          let o = 0;
          for (const p of parts) all.set(p, (o += p.length) - p.length);
          try {
            json = JSON.parse(strFromU8(all));
          } catch (e) {
            error = e;
          }
        }
      };
      file.start();
      return;
    }
    const name = file.name.startsWith('media/') ? file.name.slice(6) : '';
    const sink = name && safeMediaName(name) ? openMedia(name) : null;
    if (!sink) return; // not started = skipped
    file.ondata = (err, chunk, final) => {
      if (err) return void (error = err);
      sink.write(chunk);
      if (final) sink.close();
    };
    file.start();
  };
  for (;;) {
    const bytes = read(CHUNK);
    const last = bytes.length < CHUNK;
    unzip.push(bytes, last);
    if (error) throw error;
    if (last) break;
    await tick();
  }
  return json;
}
