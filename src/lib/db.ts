import type { SQLiteDatabase } from 'expo-sqlite';

// Subset of expo-sqlite used here, so tests can back it with node:sqlite.
export type DB = Pick<SQLiteDatabase, 'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync'>;

export type Jar = { id: number; name: string; createdAt: number; updatedAt: number };
export type JarSummary = Jar & { count: number; covers: string[] };
export type Memory = {
  id: number;
  jarId: number;
  cover: string;
  title: string | null;
  note: string | null;
  memoryDate: number;
  createdAt: number;
  updatedAt: number;
  openCount: number;
  lastOpenedAt: number | null;
};
export type MediaKind = 'photo' | 'video';
export type Media = { id: number; memoryId: number; file: string; kind: MediaKind; createdAt: number };

const VERSION = 1;

export async function migrate(db: DB) {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let v = row?.user_version ?? 0;
  if (v >= VERSION) return;
  if (v === 0) {
    await db.execAsync(`
      CREATE TABLE jars (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE TABLE memories (
        id INTEGER PRIMARY KEY NOT NULL,
        jarId INTEGER NOT NULL REFERENCES jars(id) ON DELETE CASCADE,
        cover TEXT NOT NULL,
        title TEXT,
        note TEXT,
        memoryDate INTEGER NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        openCount INTEGER NOT NULL DEFAULT 0,
        lastOpenedAt INTEGER
      );
      CREATE INDEX memories_jar ON memories(jarId, memoryDate DESC);
      CREATE TABLE media (
        id INTEGER PRIMARY KEY NOT NULL,
        memoryId INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
        file TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('photo', 'video')),
        createdAt INTEGER NOT NULL
      );
      CREATE INDEX media_memory ON media(memoryId);
    `);
    v = 1;
  }
  await db.execAsync(`PRAGMA user_version = ${VERSION}`);
}

// Jars, most recently used first (updatedAt is bumped when a memory is added).
export async function listJars(db: DB): Promise<JarSummary[]> {
  const rows = await db.getAllAsync<Jar & { count: number; covers: string | null }>(`
    SELECT j.*,
      (SELECT COUNT(*) FROM memories m WHERE m.jarId = j.id) AS count,
      (SELECT group_concat(cover, '|') FROM
        (SELECT cover FROM memories m WHERE m.jarId = j.id ORDER BY memoryDate DESC, id DESC LIMIT 3)) AS covers
    FROM jars j ORDER BY j.updatedAt DESC, j.id DESC`);
  return rows.map((r) => ({ ...r, covers: r.covers ? r.covers.split('|') : [] }));
}

export function getJar(db: DB, id: number) {
  return db.getFirstAsync<Jar>('SELECT * FROM jars WHERE id = ?', [id]);
}

export async function createJar(db: DB, name: string, now = Date.now()) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Jar name is required');
  const r = await db.runAsync('INSERT INTO jars (name, createdAt, updatedAt) VALUES (?, ?, ?)', [trimmed, now, now]);
  return r.lastInsertRowId;
}

export async function renameJar(db: DB, id: number, name: string, now = Date.now()) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Jar name is required');
  await db.runAsync('UPDATE jars SET name = ?, updatedAt = ? WHERE id = ?', [trimmed, now, id]);
}

// Returns the media filenames that belonged to the jar so the caller can delete them.
export async function deleteJar(db: DB, id: number): Promise<string[]> {
  const files = await db.getAllAsync<{ f: string }>(
    `SELECT cover AS f FROM memories WHERE jarId = ?
     UNION ALL SELECT file FROM media WHERE memoryId IN (SELECT id FROM memories WHERE jarId = ?)`,
    [id, id],
  );
  await db.runAsync('DELETE FROM jars WHERE id = ?', [id]);
  return files.map((r) => r.f);
}

export function listMemories(db: DB, jarId: number) {
  return db.getAllAsync<Memory>('SELECT * FROM memories WHERE jarId = ? ORDER BY memoryDate DESC, id DESC', [jarId]);
}

export function getMemory(db: DB, id: number) {
  return db.getFirstAsync<Memory>('SELECT * FROM memories WHERE id = ?', [id]);
}

export async function createMemory(
  db: DB,
  m: { jarId: number; cover: string; memoryDate?: number | null },
  now = Date.now(),
) {
  const r = await db.runAsync(
    'INSERT INTO memories (jarId, cover, memoryDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [m.jarId, m.cover, m.memoryDate ?? now, now, now],
  );
  await db.runAsync('UPDATE jars SET updatedAt = ? WHERE id = ?', [now, m.jarId]);
  return r.lastInsertRowId;
}

export async function updateMemory(
  db: DB,
  id: number,
  patch: Partial<Pick<Memory, 'title' | 'note' | 'memoryDate'>>,
  now = Date.now(),
) {
  const keys = (['title', 'note', 'memoryDate'] as const).filter((k) => k in patch);
  if (!keys.length) return;
  const values = keys.map((k) => {
    const v = patch[k];
    return typeof v === 'string' ? v.trim() || null : (v ?? null);
  });
  await db.runAsync(
    `UPDATE memories SET ${keys.map((k) => `${k} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`,
    [...values, now, id],
  );
}

export async function markOpened(db: DB, id: number, now = Date.now()) {
  await db.runAsync('UPDATE memories SET openCount = openCount + 1, lastOpenedAt = ? WHERE id = ?', [now, id]);
}

export async function deleteMemory(db: DB, id: number): Promise<string[]> {
  const files = await db.getAllAsync<{ f: string }>(
    'SELECT cover AS f FROM memories WHERE id = ? UNION ALL SELECT file FROM media WHERE memoryId = ?',
    [id, id],
  );
  await db.runAsync('DELETE FROM memories WHERE id = ?', [id]);
  return files.map((r) => r.f);
}

export function listMedia(db: DB, memoryId: number) {
  return db.getAllAsync<Media>('SELECT * FROM media WHERE memoryId = ? ORDER BY createdAt, id', [memoryId]);
}

export async function addMedia(
  db: DB,
  memoryId: number,
  items: { file: string; kind: MediaKind }[],
  now = Date.now(),
) {
  for (const it of items) {
    await db.runAsync('INSERT INTO media (memoryId, file, kind, createdAt) VALUES (?, ?, ?, ?)', [
      memoryId,
      it.file,
      it.kind,
      now,
    ]);
  }
  await db.runAsync('UPDATE memories SET updatedAt = ? WHERE id = ?', [now, memoryId]);
}

export async function deleteMedia(db: DB, id: number): Promise<string | null> {
  const row = await db.getFirstAsync<{ file: string }>('SELECT file FROM media WHERE id = ?', [id]);
  await db.runAsync('DELETE FROM media WHERE id = ?', [id]);
  return row?.file ?? null;
}

// Local-only success signals (PRODUCT_ASSESSMENT §5). Nothing leaves the device.
export async function stats(db: DB) {
  const r = await db.getFirstAsync<{ memories: number; jars: number; revisited: number }>(
    `SELECT (SELECT COUNT(*) FROM memories) AS memories,
            (SELECT COUNT(*) FROM jars) AS jars,
            (SELECT COUNT(*) FROM memories WHERE lastOpenedAt >= createdAt + ?) AS revisited`,
    [7 * 86400000],
  );
  return r ?? { memories: 0, jars: 0, revisited: 0 };
}

// EXIF DateTimeOriginal "YYYY:MM:DD HH:MM:SS" (local time) -> epoch ms.
export function parseExifDate(s: unknown): number | null {
  if (typeof s !== 'string') return null;
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s);
  if (!m) return null;
  const [y, mo, d, h, mi, se] = m.slice(1).map(Number);
  const t = new Date(y, mo - 1, d, h, mi, se).getTime();
  return Number.isNaN(t) || y < 1900 ? null : t;
}
