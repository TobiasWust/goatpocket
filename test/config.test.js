import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mergeSites, migrate, sitesFromResponse, tokenFor } from '../app/js/config.js';

test('migrate upgrades single-account configs', () => {
  const cfg = migrate({ site: 'a', base: 'https://a.goatcounter.com', token: 'secret' });
  assert.deepEqual(cfg.accounts, [{ home: 'https://a.goatcounter.com', token: 'secret' }]);
  assert.equal(cfg.token, undefined);
  assert.deepEqual(cfg.sites, []);
});

test('migrate keeps current configs untouched', () => {
  const cfg = {
    site: 'a',
    base: 'https://b.goatcounter.com',
    accounts: [{ home: 'https://a.goatcounter.com', token: 't' }],
    sites: [],
  };
  assert.deepEqual(migrate(structuredClone(cfg)), cfg);
});

test('tokenFor finds the account that owns a site', () => {
  const cfg = {
    accounts: [
      { home: 'https://a.goatcounter.com', token: 'A' },
      { home: 'https://stats.example.com', token: 'B' },
    ],
  };
  const sites = [
    { base: 'https://a2.goatcounter.com', home: 'https://a.goatcounter.com' },
    { base: 'https://shop.example.com', home: 'https://stats.example.com' },
  ];
  assert.equal(tokenFor(cfg, sites, 'https://a2.goatcounter.com'), 'A');
  assert.equal(tokenFor(cfg, sites, 'https://shop.example.com'), 'B');
  assert.equal(tokenFor(cfg, sites, 'https://stats.example.com'), 'B');
  assert.equal(tokenFor(cfg, sites, 'https://unknown.example'), 'A');
});

test('sitesFromResponse maps hosted sites to subdomains', () => {
  const home = 'https://a.goatcounter.com';
  const list = sitesFromResponse(home, {
    sites: [
      { code: 'a', link_domain: 'https://a.example/' },
      { code: 'b', link_domain: '' },
    ],
  });
  assert.deepEqual(list, [
    { base: 'https://a.goatcounter.com', home, name: 'a.example', sub: 'a.goatcounter.com' },
    { base: 'https://b.goatcounter.com', home, name: 'b', sub: 'b.goatcounter.com' },
  ]);
});

test('sitesFromResponse only keeps self-hosted sites with a cname, and always the home site', () => {
  const home = 'https://stats.example.com';
  const list = sitesFromResponse(home, { sites: [{ code: 'x' }, { code: 'y', cname: 'shop-stats.example.com' }] });
  assert.deepEqual(
    list.map((s) => s.base),
    ['https://stats.example.com', 'https://shop-stats.example.com'],
  );
});

test('mergeSites drops duplicates', () => {
  const a = { base: 'https://a.goatcounter.com' };
  assert.deepEqual(mergeSites([[a], [a, { base: 'x' }]]), [a, { base: 'x' }]);
});
