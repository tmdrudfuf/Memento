/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filesToDelete, groupSets, latestComplete, type DriveFile } from '../src/lib/drivesets.ts';

const f = (id: string, set: string | undefined, part: number, parts: number, t: string): DriveFile => ({
  id,
  name: `Memento-backup-${id}.zip`,
  createdTime: t,
  appProperties: set ? { set, part: String(part), parts: String(parts) } : undefined,
});

test('newest complete set wins; incomplete newer set is ignored', () => {
  const files = [
    f('a1', 'A', 1, 1, '2026-09-01T10:00:00Z'),
    f('b1', 'B', 1, 2, '2026-09-08T10:00:00Z'),
    f('b2', 'B', 2, 2, '2026-09-08T10:05:00Z'),
    f('c1', 'C', 1, 2, '2026-09-15T10:00:00Z'), // upload died before part 2
  ];
  const s = latestComplete(files);
  assert.equal(s?.id, 'B');
  assert.deepEqual(s?.files.map((x) => x.id), ['b1', 'b2']);
});

test('parts are ordered by part number, not upload time', () => {
  const files = [f('x2', 'X', 2, 2, '2026-09-01T10:00:00Z'), f('x1', 'X', 1, 2, '2026-09-01T10:09:00Z')];
  assert.deepEqual(latestComplete(files)?.files.map((x) => x.id), ['x1', 'x2']);
});

test('no complete set → null; unknown files are ignored', () => {
  assert.equal(latestComplete([f('c1', 'C', 1, 3, '2026-09-15T10:00:00Z'), f('z', undefined, 0, 0, 't')]), null);
  assert.deepEqual(groupSets([]), []);
});

test('cleanup deletes everything but the kept set, including stray files', () => {
  const files = [
    f('a1', 'A', 1, 1, '2026-09-01T10:00:00Z'),
    f('b1', 'B', 1, 1, '2026-09-08T10:00:00Z'),
    f('stray', undefined, 0, 0, '2026-09-02T10:00:00Z'),
  ];
  assert.deepEqual(filesToDelete(files, 'B').map((x) => x.id).sort(), ['a1', 'stray']);
});
