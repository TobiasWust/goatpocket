import assert from 'node:assert/strict';
import { test } from 'node:test';

import { STRINGS, fmt, t } from '../app/js/i18n.js';

test('t fills placeholders', () => {
  assert.equal(t('error.http', { status: 500 }), 'Error 500');
  assert.equal(t('dash.updated', { time: '10:00' }), 'Updated 10:00');
});

test('t leaves unknown keys and missing placeholders visible', () => {
  assert.equal(t('does.not.exist'), 'does.not.exist');
  assert.equal(t('error.http'), 'Error {status}');
});

test('strings are non-empty', () => {
  for (const [key, value] of Object.entries(STRINGS)) assert.ok(value.trim(), key);
});

test('fmt formats numbers in English', () => {
  assert.equal(fmt().number.format(12345), '12,345');
});
