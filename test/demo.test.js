import assert from 'node:assert/strict';
import { test } from 'node:test';

import { demoApi } from '../app/js/demo.js';
import { period } from '../app/js/period.js';

const q = period(7, new Date('2026-03-31T12:00:00Z')).q;
const call = (path, params = {}) => demoApi(path, { ...q, ...params }, 'demo:acme', { delay: false });

test('demo totals add up', async () => {
  const r = await call('/stats/total');
  const sum = r.stats.reduce((n, d) => n + d.daily, 0);
  assert.equal(r.total, sum);
  assert.ok(r.total > 0);
});

test('demo lists respect the limit', async () => {
  const r = await call('/stats/hits', { limit: 3 });
  assert.equal(r.hits.length, 3);
  assert.equal(r.more, true);
});

test('demo is deterministic', async () => {
  assert.deepEqual(await call('/stats/browsers', { limit: 5 }), await call('/stats/browsers', { limit: 5 }));
});
