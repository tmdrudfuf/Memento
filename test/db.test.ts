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
  assert.deepEqual(jars.map((j) => j.id), [a, b]);
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
