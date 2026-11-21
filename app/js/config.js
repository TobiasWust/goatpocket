// Saved configuration. Everything lives in localStorage on this device only:
//
//   {
//     site:     "mysite",                                 what the user first typed
//     base:     "https://mysite.goatcounter.com",          the site shown right now
//     accounts: [{ home: "https://…", token: "…" }],       one entry per API token
//     sites:    [{ base, home, name, sub }],               every known site (cached)
//   }

import { short, storage } from './util.js';

const CFG_KEY = 'goatpocket.cfg';

export function loadConfig() {
  const cfg = storage.getJSON(CFG_KEY);
  if (!cfg || typeof cfg !== 'object') return null;
  return migrate(cfg);
}

/** Bring configs written by older versions up to the current shape. */
export function migrate(cfg) {
  // Before multi-account support there was a single { base|home, token }.
  if (!Array.isArray(cfg.accounts)) cfg.accounts = [{ home: cfg.home || cfg.base, token: cfg.token }];
  delete cfg.token;
  delete cfg.home;
  if (!Array.isArray(cfg.sites)) cfg.sites = [];
  if (!cfg.base) cfg.base = cfg.accounts[0]?.home;
  return cfg;
}

export const saveConfig = (cfg) => storage.set(CFG_KEY, cfg);
export const clearConfig = () => storage.remove(CFG_KEY);

/** The token of the account a site belongs to (falls back to the first account). */
export function tokenFor(cfg, sites, base) {
  const accounts = cfg.accounts;
  const site = sites.find((s) => s.base === base);
  const account = accounts.find((a) => a.home === site?.home) || accounts.find((a) => a.home === base) || accounts[0];
  return account?.token;
}

/** Display name for a site's base URL: "mysite.goatcounter.com" → "mysite". */
export const defaultName = (base) => short(base).replace(/\.goatcounter\.com$/, '');

/**
 * Convert a GET /api/v0/sites response into site entries. On goatcounter.com every
 * site has its own subdomain; on a self-hosted instance we can only reach sites that
 * have a custom domain (cname). The account's own site is always included first.
 */
export function sitesFromResponse(home, response) {
  const hosted = /\.goatcounter\.com$/.test(home);
  const list = (response?.sites || [])
    .filter((s) => hosted || s.cname)
    .map((s) => {
      const base = hosted ? `https://${s.code}.goatcounter.com` : `https://${s.cname}`;
      const domain = (s.link_domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return { base, home, name: domain || s.code, sub: short(base) };
    });
  if (!list.some((s) => s.base === home)) list.unshift(homeSite(home));
  return list;
}

export const homeSite = (home) => ({ base: home, home, name: defaultName(home), sub: short(home) });

/** Merge per-account site lists, keeping the first occurrence of each site. */
export function mergeSites(lists) {
  const seen = new Set();
  return lists.flat().filter((s) => !seen.has(s.base) && seen.add(s.base));
}
