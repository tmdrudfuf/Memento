/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Zip, ZipPassThrough, strToU8 } from 'fflate';
import { CHUNK, readArchive, safeMediaName, splitParts, writeArchive, type Sink } from '../src/lib/archive.ts';

const source = (name: string, data: Uint8Array) => {
  let off = 0;
  return {
    name,
    size: data.length,
    read: (n: number) => {
      const b = data.subarray(off, off + n);
      off += b.length;
      return b;
    },
  };
};

function reader(buf: Uint8Array) {
  let off = 0;
  return (n: number) => {
    const b = buf.subarray(off, off + n);
    off += b.length;
    return b;
  };
}

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};

test('archive round trip: json + multi-chunk media + empty file; existing files skipped', async () => {
  const big = new Uint8Array(CHUNK * 2 + 123).map((_, i) => i % 251);
  const small = strToU8('hello');
  const parts: Uint8Array[] = [];
  const progress: number[] = [];
  await writeArchive(
    { format: 'memento-backup', n: 1 },
    [source('a.jpg', big), source('b.mp4', small), source('e.jpg', new Uint8Array(0))],
    (b) => parts.push(b.slice()),
    (done) => progress.push(done),
  );
  assert.deepEqual(progress, [1, 2, 3]);

  const got = new Map<string, Uint8Array[]>();
  const closed: string[] = [];
  const json = await readArchive(reader(concat(parts)), (name): Sink | null => {
    if (name === 'b.mp4') return null; // pretend it already exists
    got.set(name, []);
    return { write: (b) => got.get(name)!.push(b.slice()), close: () => closed.push(name) };
  });
  assert.deepEqual(json, { format: 'memento-backup', n: 1 });
  assert.deepEqual(concat(got.get('a.jpg')!), big);
  assert.equal(got.has('b.mp4'), false);
  assert.deepEqual(closed.sort(), ['a.jpg', 'e.jpg']);
});

test('untrusted zip entries with path traversal are never extracted', async () => {
  const parts: Uint8Array[] = [];
  const zip = new Zip((_, c) => parts.push(c.slice()));
  for (const name of ['media/../../evil.sh', 'media/sub/dir.jpg', 'media/ok.jpg', 'other.txt']) {
    const e = new ZipPassThrough(name);
    zip.add(e);
    e.push(strToU8('x'), true);
  }
  zip.end();
  const asked: string[] = [];
  const json = await readArchive(reader(concat(parts)), (name) => {
    asked.push(name);
    return { write: () => {}, close: () => {} };
  });
  assert.deepEqual(asked, ['ok.jpg']);
  assert.equal(json, null);
});

test('safeMediaName', () => {
  assert.ok(safeMediaName('1790581518179-yb7kk3.jpeg'));
  for (const bad of ['../x', '.hidden', 'a/b.jpg', 'a\\b.jpg', '', 'x..y'])
    assert.equal(safeMediaName(bad), false, bad);
});

test('splitParts keeps every archive under the limit, in order, never empty', () => {
  const f = (size: number, id: number) => ({ size, id });
  const parts = splitParts([f(4, 1), f(4, 2), f(3, 3), f(9, 4), f(1, 5)], 10);
  assert.deepEqual(
    parts.map((p) => p.map((x) => x.id)),
    [[1, 2], [3], [4, 5]],
  );
  assert.deepEqual(splitParts([], 10), [[]]); // json-only backup still gets one part
  assert.deepEqual(splitParts([f(20, 1)], 10), [[f(20, 1)]]); // oversize file alone in its part
});
