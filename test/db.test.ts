/// <reference types="node" />
// Runs the real schema and queries from src/lib/db.ts against Node's built-in SQLite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import * as q from '../src/lib/db.ts';

function open(): q.DB {
  const s = new DatabaseSync(':memory:', { enableForeignKeyConstraints: false });
  const args = (p: unknown) => (p === undefined ? [] : Array.isArray(p) ? p : [p]);
  return {
    execAsync: async (sql: string) => void s.exec(sql),
    runAsync: async (sql: string, p?: unknown) => {
      const r = s.prepare(sql).run(...args(p));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    getAllAsync: async (sql: string, p?: unknown) => s.prepare(sql).all(...args(p)),
    getFirstAsync: async (sql: string, p?: unknown) => s.prepare(sql).get(...args(p)) ?? null,
  } as unknown as q.DB;
}

async function fresh() {
  const db = open();
  await q.migrate(db);
  await q.migrate(db); // idempotent
  return db;
}

test('create jar -> create memory -> open memory (core loop)', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, '  Japan 2026 ', 1000);
  const id = await q.createMemory(db, { jarId: jar, cover: 'ramen.jpg' }, 2000);

  const m = await q.getMemory(db, id);
  assert.equal(m?.cover, 'ramen.jpg');
  assert.equal(m?.memoryDate, 2000, 'date defaults to save time');
  assert.equal(m?.title, null);

  await q.markOpened(db, id, 3000);
  await q.markOpened(db, id, 4000);
  const opened = await q.getMemory(db, id);
  assert.equal(opened?.openCount, 2);
  assert.equal(opened?.lastOpenedAt, 4000);

  const [j] = await q.listJars(db);
  assert.equal(j.name, 'Japan 2026');
  assert.equal(j.count, 1);
  assert.deepEqual(j.covers, ['ramen.jpg']);
});

test('jar name is required', async () => {
  const db = await fresh();
  await assert.rejects(q.createJar(db, '   '));
});

test('jars sort by last use; covers are newest 3 by memory date', async () => {
  const db = await fresh();
  const a = await q.createJar(db, 'A', 1);
  const b = await q.createJar(db, 'B', 2);
  for (let i = 1; i <= 4; i++) await q.createMemory(db, { jarId: a, cover: `a${i}.jpg`, memoryDate: i * 10 }, 100 + i);
  await q.createMemory(db, { jarId: a, cover: 'old.jpg', memoryDate: 1 }, 200);
  const jars = await q.listJars(db);
  assert.deepEqual(
    jars.map((j) => j.id),
    [a, b],
  );
  assert.deepEqual(jars[0].covers, ['a4.jpg', 'a3.jpg', 'a2.jpg']);
  assert.equal(jars[0].count, 5);
  assert.deepEqual(jars[1].covers, []);
  const list = await q.listMemories(db, a);
  assert.equal(list.at(-1)?.cover, 'old.jpg');
});

test('update memory trims text, blank becomes null, only given fields change', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'Us');
  const id = await q.createMemory(db, { jarId: jar, cover: 'c.jpg', memoryDate: 5 });
  await q.updateMemory(db, id, { title: ' Ramen Night ', note: 'no English menu' });
  await q.updateMemory(db, id, { note: '   ' });
  const m = await q.getMemory(db, id);
  assert.equal(m?.title, 'Ramen Night');
  assert.equal(m?.note, null);
  assert.equal(m?.memoryDate, 5);
});

test('deleting a memory returns every file and cascades media', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'Cooking');
  const id = await q.createMemory(db, { jarId: jar, cover: 'dish.jpg' });
  await q.addMedia(db, id, [
    { file: 'p1.jpg', kind: 'photo' },
    { file: 'v1.mp4', kind: 'video' },
  ]);
  assert.equal((await q.listMedia(db, id)).length, 2);
  const files = await q.deleteMemory(db, id);
  assert.deepEqual(files.sort(), ['dish.jpg', 'p1.jpg', 'v1.mp4']);
  assert.equal(await q.getMemory(db, id), null);
  assert.equal((await q.listMedia(db, id)).length, 0);
});

test('deleting a jar returns all files of all its memories and cascades', async () => {
  const db = await fresh();
  const keep = await q.createJar(db, 'Keep');
  const kept = await q.createMemory(db, { jarId: keep, cover: 'k.jpg' });
  const jar = await q.createJar(db, 'Gone');
  const m1 = await q.createMemory(db, { jarId: jar, cover: 'c1.jpg' });
  await q.createMemory(db, { jarId: jar, cover: 'c2.jpg' });
  await q.addMedia(db, m1, [{ file: 'x.jpg', kind: 'photo' }]);
  const files = await q.deleteJar(db, jar);
  assert.deepEqual(files.sort(), ['c1.jpg', 'c2.jpg', 'x.jpg']);
  assert.equal((await q.listMemories(db, jar)).length, 0);
  assert.equal((await q.listJars(db)).length, 1);
  assert.ok(await q.getMemory(db, kept));
});

test('delete single media returns its file', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'J');
  const id = await q.createMemory(db, { jarId: jar, cover: 'c.jpg' });
  await q.addMedia(db, id, [{ file: 'p.jpg', kind: 'photo' }]);
  const [m] = await q.listMedia(db, id);
  assert.equal(await q.deleteMedia(db, m.id), 'p.jpg');
  assert.equal(await q.deleteMedia(db, m.id), null);
});

test('stats counts memories revisited 7+ days after creation', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'J');
  const day = 86400000;
  const a = await q.createMemory(db, { jarId: jar, cover: 'a' }, 0);
  const b = await q.createMemory(db, { jarId: jar, cover: 'b' }, 0);
  await q.markOpened(db, a, 8 * day);
  await q.markOpened(db, b, 1 * day);
  assert.deepEqual({ ...(await q.stats(db)) }, { memories: 2, jars: 1, revisited: 1 });
});

test('kind is constrained to photo/video', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'J');
  const id = await q.createMemory(db, { jarId: jar, cover: 'c' });
  await assert.rejects(q.addMedia(db, id, [{ file: 'f', kind: 'audio' as q.MediaKind }]));
});

test('parseExifDate', () => {
  assert.equal(q.parseExifDate('2026:03:14 19:30:05'), new Date(2026, 2, 14, 19, 30, 5).getTime());
  assert.equal(q.parseExifDate('0000:00:00 00:00:00'), null);
  assert.equal(q.parseExifDate('garbage'), null);
  assert.equal(q.parseExifDate(undefined), null);
});

test('move memory to another jar bumps the target jar to the front', async () => {
  const db = await fresh();
  const a = await q.createJar(db, 'A', 1);
  const b = await q.createJar(db, 'B', 2);
  const id = await q.createMemory(db, { jarId: b, cover: 'c.jpg' }, 3);
  await q.moveMemory(db, id, a, 10);
  assert.equal((await q.getMemory(db, id))?.jarId, a);
  assert.equal((await q.listMemories(db, b)).length, 0);
  assert.equal((await q.listJars(db))[0].id, a);
});

test('set cover swaps cover and related photo; videos cannot be covers', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'J');
  const id = await q.createMemory(db, { jarId: jar, cover: 'old.jpg' });
  await q.addMedia(db, id, [
    { file: 'new.jpg', kind: 'photo' },
    { file: 'v.mp4', kind: 'video' },
  ]);
  const [photo, video] = await q.listMedia(db, id);
  await q.setCover(db, id, photo.id);
  assert.equal((await q.getMemory(db, id))?.cover, 'new.jpg');
  assert.deepEqual(
    (await q.listMedia(db, id)).map((m) => m.file),
    ['old.jpg', 'v.mp4'],
  );
  await assert.rejects(q.setCover(db, id, video.id));
  const other = await q.createMemory(db, { jarId: jar, cover: 'x.jpg' });
  await assert.rejects(q.setCover(db, other, photo.id), 'media from another memory');
});

test('delete all data empties everything but keeps settings', async () => {
  const db = await fresh();
  const jar = await q.createJar(db, 'J');
  const id = await q.createMemory(db, { jarId: jar, cover: 'c' });
  await q.addMedia(db, id, [{ file: 'p', kind: 'photo' }]);
  await q.setSetting(db, 'welcomed', '1');
  await q.deleteAllData(db);
  assert.deepEqual({ ...(await q.stats(db)) }, { memories: 0, jars: 0, revisited: 0 });
  assert.equal((await q.listMedia(db, id)).length, 0);
  assert.equal(await q.getSetting(db, 'welcomed'), '1');
});

test('settings upsert', async () => {
  const db = await fresh();
  assert.equal(await q.getSetting(db, 'k'), null);
  await q.setSetting(db, 'k', 'a');
  await q.setSetting(db, 'k', 'b');
  assert.equal(await q.getSetting(db, 'k'), 'b');
});

test('v1 database migrates to v2 keeping data', async () => {
  const db = open();
  await db.execAsync(`
    CREATE TABLE jars (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL);
    CREATE TABLE memories (id INTEGER PRIMARY KEY NOT NULL, jarId INTEGER NOT NULL REFERENCES jars(id) ON DELETE CASCADE, cover TEXT NOT NULL, title TEXT, note TEXT, memoryDate INTEGER NOT NULL, createdAt INTEGER NOT NULL, updatedAt INTEGER NOT NULL, openCount INTEGER NOT NULL DEFAULT 0, lastOpenedAt INTEGER);
    CREATE TABLE media (id INTEGER PRIMARY KEY NOT NULL, memoryId INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE, file TEXT NOT NULL, kind TEXT NOT NULL CHECK (kind IN ('photo', 'video')), createdAt INTEGER NOT NULL);
    INSERT INTO jars VALUES (1, 'Old', 1, 1);
    PRAGMA user_version = 1;`);
  await q.migrate(db);
  assert.equal((await q.listJars(db))[0].name, 'Old');
  await q.setSetting(db, 'x', 'y');
  assert.equal(await q.getSetting(db, 'x'), 'y');
});

test('backup round-trip into an empty device restores everything', async () => {
  const src = await fresh();
  const a = await q.createJar(src, 'Japan', 1);
  const m = await q.createMemory(src, { jarId: a, cover: 'r.jpg', memoryDate: 5 }, 2);
  await q.updateMemory(src, m, { title: 'Ramen Night', note: 'no English menu' });
  await q.addMedia(src, m, [{ file: 'v.mp4', kind: 'video' }]);
  const backup = await q.dumpAll(src, 99);
  assert.ok(q.isBackup(JSON.parse(JSON.stringify(backup))));

  const dst = await fresh();
  assert.deepEqual(await q.restoreRows(dst, backup), { jars: 1, memories: 1 });
  const [jar] = await q.listJars(dst);
  assert.equal(jar.name, 'Japan');
  const [mem] = await q.listMemories(dst, jar.id);
  assert.equal(mem.title, 'Ramen Night');
  assert.equal(mem.note, 'no English menu');
  assert.deepEqual((await q.listMedia(dst, mem.id)).map((x) => x.file), ['v.mp4']);
});

test('restoring twice does not duplicate; same-name jar is merged', async () => {
  const src = await fresh();
  const a = await q.createJar(src, 'Us');
  await q.createMemory(src, { jarId: a, cover: 'x.jpg' });
  const backup = await q.dumpAll(src);
  const dst = await fresh();
  const existing = await q.createJar(dst, 'Us');
  await q.createMemory(dst, { jarId: existing, cover: 'mine.jpg' });
  assert.deepEqual(await q.restoreRows(dst, backup), { jars: 0, memories: 1 });
  assert.deepEqual(await q.restoreRows(dst, backup), { jars: 0, memories: 0 });
  assert.equal((await q.listJars(dst)).length, 1);
  assert.equal((await q.listMemories(dst, existing)).length, 2);
});

test('isBackup rejects other files', () => {
  assert.equal(q.isBackup({ format: 'zip' }), false);
  assert.equal(q.isBackup(null), false);
});
