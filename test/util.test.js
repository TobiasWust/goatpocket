import assert from 'node:assert/strict';
import { test } from 'node:test';

import { esc, flag, normalizeBase, short } from '../app/js/util.js';

test('normalizeBase turns site codes into goatcounter.com URLs', () => {
  assert.equal(normalizeBase('mysite'), 'https://mysite.goatcounter.com');
  assert.equal(normalizeBase('  MySite  '), 'https://mysite.goatcounter.com');
});

test('normalizeBase keeps custom domains and self-hosted instances', () => {
  assert.equal(normalizeBase('stats.example.com/'), 'https://stats.example.com');
  assert.equal(normalizeBase('https://stats.example.com/some/path'), 'https://stats.example.com');
  assert.equal(normalizeBase('http://10.0.0.5:8081'), 'http://10.0.0.5:8081');
});

test('normalizeBase rejects garbage', () => {
  assert.equal(normalizeBase(''), '');
  assert.equal(normalizeBase('   '), '');
  assert.equal(normalizeBase('https://exa mple.com'), '');
});

test('esc escapes HTML special characters', () => {
  assert.equal(esc(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  assert.equal(esc(null), '');
  assert.equal(esc(42), '42');
});

test('short strips scheme and demo prefix', () => {
  assert.equal(short('https://a.goatcounter.com'), 'a.goatcounter.com');
  assert.equal(short('demo:blog'), 'blog');
});

test('flag converts country codes to emoji', () => {
  assert.equal(flag('DE'), '🇩🇪');
  assert.equal(flag('de'), '');
  assert.equal(flag(undefined), '');
});
