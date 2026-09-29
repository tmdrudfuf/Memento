/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as r from '../src/lib/rediscover.ts';

const DAY = 86_400_000;
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();
let nextId = 1;
const mem = (memoryDate: number, extra: Partial<r.MemoryLite> = {}): r.MemoryLite => ({
  id: nextId++,
  jarId: 1,
  cover: 'c.jpg',
  title: null,
  memoryDate,
  createdAt: memoryDate,
  lastOpenedAt: null,
  ...extra,
});

test('on this day: same month/day in earlier years only, newest year first', () => {
  const now = at(2026, 9, 28);
  const a = mem(at(2024, 9, 28));
  const b = mem(at(2025, 9, 28));
  const rows = [a, b, mem(at(2026, 9, 28)), mem(at(2025, 9, 27)), mem(at(2025, 10, 28))];
  assert.deepEqual(
    r.onThisDay(rows, now).map((m) => m.id),
    [b.id, a.id],
  );
});

test('this week in past years: ±3 days, excludes exact day and this year', () => {
  const now = at(2026, 9, 28);
  const near = mem(at(2025, 10, 1)); // +3 days
  const before = mem(at(2024, 9, 25)); // -3 days
  const rows = [near, before, mem(at(2025, 9, 28)), mem(at(2025, 10, 2)), mem(at(2026, 9, 27))];
  assert.deepEqual(
    r.thisWeekInPastYears(rows, now).map((m) => m.id),
    [near.id, before.id],
  );
});

test('this week wraps the year boundary but ignores last week', () => {
  const now = at(2026, 1, 1);
  const lastYear = mem(at(2024, 12, 30)); // a year+ ago, 2 days before "Jan 1"
  const lastWeek = mem(at(2025, 12, 30)); // only 2 days ago: not a "past years" memory
  assert.deepEqual(
    r.thisWeekInPastYears([lastYear, lastWeek], now).map((m) => m.id),
    [lastYear.id],
  );
});

test('remember this: needs a week-old memory, prefers never-opened, stable within a day', () => {
  const now = at(2026, 9, 28);
  assert.equal(r.rememberThis([mem(now - 2 * DAY)], now), null);
  const opened = mem(now - 30 * DAY, { lastOpenedAt: now - DAY });
  const forgotten = mem(now - 30 * DAY);
  const rows = [opened, forgotten, mem(now - 20 * DAY, { lastOpenedAt: now - 2 * DAY })];
  const pick = r.rememberThis(rows, now);
  assert.equal(pick?.id, forgotten.id);
  assert.equal(r.rememberThis(rows, now + 3600_000)?.id, pick?.id);
});

test('remember this rotates across days among forgotten memories', () => {
  const now = at(2026, 9, 28);
  const rows = Array.from({ length: 9 }, () => mem(now - 60 * DAY));
  const picks = new Set(Array.from({ length: 14 }, (_, i) => r.rememberThis(rows, now + i * DAY)?.id));
  assert.ok(picks.size > 1, 'should not show the same memory every day');
});

test('recap counts, months, top jar, busiest month', () => {
  const rows = [
    mem(at(2026, 3, 1), { jarId: 1 }),
    mem(at(2026, 3, 9), { jarId: 2 }),
    mem(at(2026, 7, 4), { jarId: 2 }),
    mem(at(2025, 3, 1), { jarId: 3 }),
  ];
  const rc = r.recap(rows, 2026);
  assert.equal(rc.count, 3);
  assert.equal(rc.jarCount, 2);
  assert.equal(rc.topJarId, 2);
  assert.equal(rc.months[2], 2);
  assert.equal(rc.busiestMonth, 2);
  assert.deepEqual(
    rc.memories.map((m) => new Date(m.memoryDate).getMonth()),
    [2, 2, 6],
  );
  assert.deepEqual(r.recapYears(rows), [2026, 2025]);
  assert.equal(r.recap(rows, 2020).busiestMonth, null);
});

test('recap season: Dec 15-31 → this year, January → last year, else none', () => {
  assert.equal(r.recapSeasonYear(at(2026, 12, 20)), 2026);
  assert.equal(r.recapSeasonYear(at(2027, 1, 10)), 2026);
  assert.equal(r.recapSeasonYear(at(2026, 9, 28)), null);
  assert.equal(r.recapSeasonYear(at(2026, 12, 14)), null);
});

test('years ago', () => {
  assert.equal(r.yearsAgo(at(2024, 9, 28), at(2026, 9, 28)), 2);
});
