// Demo mode (?demo): answers API calls with made-up but plausible, stable numbers so
// the app can be tried without a GoatCounter account.

import { DAY, HOUR, sleep } from './util.js';

export const DEMO_SITES = [
  { base: 'demo:acme', name: 'acme.example', sub: 'acme.goatcounter.com', mul: 1 },
  { base: 'demo:blog', name: 'blog.example', sub: 'myblog.goatcounter.com', mul: 2.6 },
  { base: 'demo:docs', name: 'docs.example', sub: 'docs.goatcounter.com', mul: 0.35 },
];

const DATA = {
  pages: [
    ['/', 'Home'],
    ['/pricing', 'Pricing'],
    ['/blog/answers-in-seconds', 'Answers in seconds'],
    ['/features', 'Features'],
    ['/docs/start', 'Getting started'],
    ['signup-click', 'Sign-up clicked', true],
    ['/blog', 'Blog'],
    ['/about', 'About'],
    ['/changelog', 'Changelog'],
    ['/contact', 'Contact'],
    ['/imprint', 'Imprint'],
  ],
  toprefs: ['', 'Google', 'Hacker News', 'linkedin.com', 'github.com', 'Mastodon', 'duckduckgo.com', 'producthunt.com'],
  locations: [
    ['DE', 'Germany'],
    ['US', 'United States'],
    ['AT', 'Austria'],
    ['CH', 'Switzerland'],
    ['GB', 'United Kingdom'],
    ['NL', 'Netherlands'],
    ['FR', 'France'],
  ],
  browsers: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Internet'],
  systems: ['iOS', 'Android', 'macOS', 'Windows', 'Linux'],
  sizes: [
    'Phones',
    'Computer monitors',
    'Tablets and small laptops',
    'Large phones, small tablets',
    'Computer monitors larger than HD',
  ],
  languages: ['German', 'English', 'French', 'Dutch', 'Spanish'],
  campaigns: ['newsletter-november', 'launch'],
};

const DETAILS = {
  browsers: ['131', '130', '129', '18.1'],
  systems: ['18.1', '17.6', '15', '14'],
  locations: ['Bavaria', 'Berlin', 'North Rhine-Westphalia', 'Hamburg'],
  toprefs: ['google.com/search', 'google.de', 'google.at'],
};

/** Small deterministic PRNG (mulberry32), so the same hour always gets the same number. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function visitorsAt(t, mul) {
  if (t > Date.now()) return 0;
  const d = new Date(t);
  const daily = Math.max(0.05, Math.sin(((d.getHours() - 5) / 19) * Math.PI));
  const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.55 : 1;
  const trend = 0.6 + 0.4 * ((t - (Date.now() - 400 * DAY)) / (400 * DAY));
  return Math.round(rng(Math.floor(t / HOUR))() * 9 * mul * daily * weekend * trend);
}

/** Split `total` over `names` with a falling share, like a typical top list. */
function share(names, total, limit, weight) {
  let rest = total;
  const max = +limit || 10;
  const list = names
    .map((name, i) => {
      const count = Math.round(rest * (i === names.length - 1 ? 0.6 : weight));
      rest -= count;
      return [name, count];
    })
    .filter(([, count]) => count > 0)
    .slice(0, max);
  return { list, more: names.length > max };
}

function halving(names, total) {
  let rest = Math.round(total * 0.3);
  return names
    .map((name) => {
      const count = Math.round(rest * 0.5);
      rest -= count;
      return { name, count };
    })
    .filter((x) => x.count);
}

/** Same signature as the real API client's fetch: (path, params, base) → response. */
export async function demoApi(path, params, base, { delay = true } = {}) {
  if (delay) await sleep(120 + Math.random() * 380);
  const mul = DEMO_SITES.find((s) => s.base === base)?.mul || 1;
  const start = Date.parse(params.start);
  const end = Date.parse(params.end);

  const byDay = new Map();
  let total = 0;
  for (let t = start; t <= end; t += HOUR) {
    const day = new Date(t).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { day, hourly: Array(24).fill(0), daily: 0 });
    const value = visitorsAt(t, mul);
    const entry = byDay.get(day);
    entry.hourly[new Date(t).getUTCHours()] = value;
    entry.daily += value;
    total += value;
  }

  if (path === '/stats/total') {
    return { total, total_events: Math.round(total * 0.04), total_utc: total, stats: [...byDay.values()] };
  }
  if (path === '/stats/hits') {
    const { list, more } = share(DATA.pages, total, params.limit, 0.36);
    return {
      more,
      total,
      hits: list.map(([[p, title, event], count], i) => ({ path_id: i + 1, path: p, title, event: !!event, count })),
    };
  }
  if (path.startsWith('/stats/hits/')) {
    return { more: false, refs: halving(DATA.toprefs.slice(0, 5), total) };
  }

  const [, , page, id] = path.split('/');
  if (id) return { more: false, stats: halving(DETAILS[page] || [], total) };

  const { list, more } = share(DATA[page] || [], total, params.limit, page === 'campaigns' ? 0.03 : 0.48);
  return {
    more,
    stats: list.map(([name, count]) =>
      Array.isArray(name) ? { id: name[0], name: name[1], count } : { id: name || 'x', name, count },
    ),
  };
}
