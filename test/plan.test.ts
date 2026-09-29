/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canCreateJar, FREE_JAR_LIMIT } from '../src/lib/plan.ts';

test('free plan allows 3 jars; the 4th needs Premium', () => {
  assert.equal(FREE_JAR_LIMIT, 3);
  assert.equal(canCreateJar(0, false), true);
  assert.equal(canCreateJar(2, false), true);
  assert.equal(canCreateJar(3, false), false);
  assert.equal(canCreateJar(3, true), true);
});

test('lapsed Premium with 5 jars: cannot add, but nothing forces removal', () => {
  assert.equal(canCreateJar(5, false), false);
});
