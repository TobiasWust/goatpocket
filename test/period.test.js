// Run in a fixed zone with a DST switch, so local-time bucketing is actually exercised.
process.env.TZ = 'Europe/Berlin';

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildBuckets, bucketMode, isoHour, period } from '../app/js/period.js';

const NOW = new Date('2026-03-31T10:30:00+02:00');

test('isoHour formats full hours in UTC', () => {
  assert.equal(isoHour(Date.UTC(2026, 0, 31, 22, 40)), '2026-01-31T23:00:00Z');
});

test('period covers whole local days and the period before', () => {
  const p = period(7, NOW);
  assert.equal(p.days, 7);
  // 25 March 00:00 CET = 24 March 23:00 UTC; 31 March 23:00 CEST = 21:00 UTC
  assert.deepEqual(p.q, { start: '2026-03-24T23:00:00Z', end: '2026-03-31T21:00:00Z' });
  assert.deepEqual(p.prevQ, { start: '2026-03-17T23:00:00Z', end: '2026-03-24T22:00:00Z' });
});

test('bucketMode picks hours, days or weeks', () => {
  assert.equal(bucketMode(1), 'hour');
  assert.equal(bucketMode(30), 'day');
  assert.equal(bucketMode(365), 'week');
});

test('buildBuckets makes one bucket per day, across a DST change', () => {
  const p = period(7, NOW); // includes 29 March, the switch to summer time
  const buckets = buildBuckets([], p);
  assert.equal(buckets.length, 7);
  assert.ok(buckets.every((b) => b.mode === 'day' && b.value === 0));
});

test('buildBuckets moves UTC hours into local days', () => {
  const p = period(7, NOW);
  const stats = [
    // 30 March 22:00 UTC is already 31 March 00:00 in Berlin (CEST, UTC+2).
    { day: '2026-03-30', hourly: Object.assign(Array(24).fill(0), { 10: 5, 22: 3 }), daily: 8 },
  ];
  const buckets = buildBuckets(stats, p);
  assert.equal(buckets.at(-2).value, 5); // 30 March
  assert.equal(buckets.at(-1).value, 3); // 31 March
});

test('buildBuckets falls back to daily totals', () => {
  const p = period(7, NOW);
  const buckets = buildBuckets([{ day: '2026-03-28', daily: 12 }], p);
  assert.equal(buckets.find((b) => new Date(b.key).getDate() === 28).value, 12);
});

test('buildBuckets uses local hours for "today"', () => {
  const p = period(1, NOW);
  const buckets = buildBuckets([{ day: '2026-03-31', hourly: Object.assign(Array(24).fill(0), { 7: 4 }) }], p);
  assert.equal(buckets.length, 24);
  assert.equal(buckets[9].value, 4); // 07:00 UTC = 09:00 CEST
});

test('buildBuckets groups long ranges by week (Monday first)', () => {
  const p = period(365, NOW);
  const buckets = buildBuckets([], p);
  assert.ok(buckets.length >= 52 && buckets.length <= 54);
  assert.ok(buckets.slice(1).every((b) => new Date(b.key).getDay() === 1));
});
