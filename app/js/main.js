// GoatPocket – a mobile dashboard for GoatCounter.
//
// A static page that talks to the GoatCounter API directly from the browser (the API
// sends permissive CORS headers). There is no backend: API tokens stay in this
// device's localStorage and are only ever sent to the GoatCounter site they belong to.
//
// Rendering is plain template strings + innerHTML. Every value that comes from the API
// or the user goes through esc(); translated strings from i18n.js are trusted.

import { AuthError, createClient, verifyToken } from './api.js';
import {
  clearConfig,
  defaultName,
  homeSite,
  loadConfig,
  mergeSites,
  saveConfig,
  sitesFromResponse,
  tokenFor,
} from './config.js';
import { DEMO_SITES, demoApi } from './demo.js';
import { fmt, t } from './i18n.js';
import { buildBuckets, period } from './period.js';
import { $, esc, flag, normalizeBase, short, storage } from './util.js';

const RANGE_KEY = 'goatpocket.range';
const HELP_URL = 'https://github.com/TobiasWust/goatpocket/blob/main/docs/help.md';
// The landing page. Served from /app/ the app finds it one level up; on its own
// domain (app.goatpocket.com) it links to the main site.
const SITE_URL = /\/app\/(index\.html)?$/.test(location.pathname) ? '../' : 'https://goatpocket.com/';
// Operator of this instance. Self-hosting? Point these to your own pages.
const AUTHOR_URL = 'https://wust.dev/';
const LEGAL_URL = `${SITE_URL}legal.html`;
const KOFI_URL = 'https://ko-fi.com/tobiaswust';
const MAX_LIMIT = 100; // the API returns at most 100 rows per request

const RANGES = [
  { id: 'today', days: 1 },
  { id: '7', days: 7 },
  { id: '30', days: 30 },
  { id: '90', days: 90 },
  { id: '365', days: 365 },
];

// Dashboard cards, in display order. `detail`: rows can be tapped for a breakdown.
const SECTIONS = [
  { id: 'pages', wide: true, limit: 8, detail: true },
  { id: 'toprefs', limit: 6, detail: true, blank: 'name.direct' },
  { id: 'locations', limit: 6, detail: true },
  { id: 'browsers', limit: 6, detail: true },
  { id: 'systems', limit: 6, detail: true },
  { id: 'sizes', limit: 6 },
  { id: 'languages', limit: 6 },
  { id: 'campaigns', limit: 6 },
];

const SKELETON = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';

/* ----------------------------------------------------------------- State */

const state = {
  cfg: loadConfig(),
  demo: new URLSearchParams(location.search).has('demo'),
  demoSite: DEMO_SITES[0].base,
  range: storage.get(RANGE_KEY) || '7',
  // Bumped whenever the dashboard reloads; responses for an older generation are dropped.
  gen: 0,
  limits: {},
  sites: [],
  sitesErrors: [],
  notice: '',
  sectionItems: {},
};
state.sites = state.demo ? DEMO_SITES : state.cfg?.sites || [];

const client = createClient({
  isDemo: () => state.demo,
  tokenFor: (base) => tokenFor(state.cfg, state.sites, base),
  demo: demoApi,
});

/** "Made with ❤️ by Wust" plus privacy, imprint and Ko-fi links. */
function creditHtml({ kofi = 'kofi.short' } = {}) {
  const ext = 'target="_blank" rel="noopener noreferrer"';
  return `<div class="credit">
    <p>Made with <span class="heart">❤️</span> by <a href="${AUTHOR_URL}" ${ext}>Wust</a></p>
    <p><a href="${LEGAL_URL}#privacy" target="_blank" rel="noopener">${t('legal.privacy')}</a> ·
      <a href="${LEGAL_URL}#imprint" target="_blank" rel="noopener">${t('legal.imprint')}</a> ·
      <a href="${KOFI_URL}" ${ext}>${t(kofi)}</a></p>
  </div>`;
}

const currentBase = () => (state.demo ? state.demoSite : state.cfg.base);
const currentRange = () => RANGES.find((r) => r.id === state.range) || RANGES[1];
const api = (path, params = {}, base = currentBase()) => client.get(path, params, base);
const num = (n) => fmt().number.format(n);

function siteName() {
  const base = currentBase();
  return state.sites.find((s) => s.base === base)?.name || defaultName(base);
}

/* ---------------------------------------------------------------- Views */

const app = $('#app');

function render() {
  $('#sheet-close').setAttribute('aria-label', t('common.close'));
  if (!state.cfg && !state.demo) return renderSetup();
  renderDashboard();
}

/** The connect form; also used to add a further account (`adding`). */
function renderSetup({ error = '', adding = false, prefill = '' } = {}) {
  closeSheet();
  app.innerHTML = `
    <form class="setup" id="setup" autocomplete="off">
      <img class="logo" src="../icons/icon.svg" alt="" width="72" height="72">
      <h1>${t(adding ? 'setup.addTitle' : 'setup.title')}</h1>
      <p>${t(adding ? 'setup.addIntro' : 'setup.intro')}</p>
      ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ''}
      <label class="field">
        <span>${t('setup.site')}</span>
        <input name="site" inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false"
               placeholder="${esc(t('setup.sitePlaceholder'))}" value="${esc(prefill)}" required>
        <small>${t('setup.siteHint')}</small>
      </label>
      <label class="field">
        <span>${t('setup.token')}</span>
        <input name="token" type="password" autocapitalize="none" autocorrect="off" spellcheck="false"
               placeholder="${esc(t('setup.tokenPlaceholder'))}" required>
        <small>${t('setup.tokenHint')}</small>
      </label>
      <button class="btn" type="submit">${t('setup.connect')}</button>
      <button class="btn ghost" type="button" id="secondary">${t(adding ? 'setup.cancel' : 'setup.demo')}</button>
      <ol class="steps">
        <li>${t('setup.step1')}</li>
        <li>${t('setup.step2')}</li>
        <li>${t('setup.step3')}</li>
      </ol>
      <p class="foot"><a href="${HELP_URL}" target="_blank" rel="noopener">${t('setup.help')}</a></p>
      ${creditHtml()}
    </form>`;

  $('#secondary').onclick = adding ? render : enterDemo;
  $('#setup').onsubmit = async (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const site = form.site.value.trim();
    const token = form.token.value.trim();
    const base = normalizeBase(site);
    if (!base) return renderSetup({ error: t('setup.badAddress'), adding, prefill: site });

    const submit = $('button[type=submit]', form);
    submit.disabled = true;
    submit.textContent = t('setup.checking');
    try {
      await verifyToken(base, token, period(1).q);
    } catch (e) {
      return renderSetup({ error: e.message, adding, prefill: site });
    }

    const account = { home: base, token };
    if (adding) {
      state.cfg.accounts = state.cfg.accounts.filter((a) => a.home !== base).concat(account);
      state.cfg.base = base;
    } else {
      state.cfg = { site, base, accounts: [account], sites: [] };
      state.demo = false;
      state.sites = [];
      client.clear();
    }
    saveConfig(state.cfg);
    render();
  };
}

const ICON_REFRESH =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
const ICON_SETTINGS =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>';

function renderDashboard() {
  app.innerHTML = `
    <header class="top">
      <button class="brand" id="brand" aria-haspopup="dialog" title="${esc(t('dash.switchSite'))}">
        <small>GoatCounter</small>
        <h1><span id="site-name">${esc(siteName())}</span><i class="caret" aria-hidden="true">▾</i></h1>
      </button>
      <button class="icon-btn" id="refresh" aria-label="${esc(t('dash.refresh'))}">${ICON_REFRESH}</button>
      <button class="icon-btn" id="settings" aria-haspopup="dialog" aria-label="${esc(t('dash.settings'))}">${ICON_SETTINGS}</button>
    </header>
    ${state.demo ? `<div class="banner"><span>${t('dash.demoBanner')}</span><button id="exit-demo">${t('dash.connectOwn')}</button></div>` : ''}
    ${state.notice ? `<div class="banner" role="status"><span>${esc(state.notice)}</span></div>` : ''}
    <nav class="ranges" aria-label="${esc(t('range.nav'))}">
      ${RANGES.map((r) => `<button class="chip" data-range="${r.id}" aria-pressed="${r.id === state.range}">${t(`range.${r.id}`)}</button>`).join('')}
    </nav>
    <section class="card hero" id="hero" aria-live="polite"></section>
    <div class="grid">
      ${SECTIONS.map(
        (s) => `<section class="card${s.wide ? ' wide' : ''}" id="sec-${s.id}">
          <h3>${t(`section.${s.id}`)}</h3><div class="body">${SKELETON}</div></section>`,
      ).join('')}
    </div>
    <p class="foot" id="foot"></p>
    ${creditHtml()}`;
  state.notice = '';

  $('.ranges').onclick = (ev) => {
    const chip = ev.target.closest('[data-range]');
    if (!chip || chip.dataset.range === state.range) return;
    state.range = chip.dataset.range;
    storage.set(RANGE_KEY, state.range);
    app.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === chip));
    state.limits = {};
    load();
  };
  $('#refresh').onclick = () => {
    client.clear();
    load();
    loadSites();
  };
  $('#settings').onclick = openSettings;
  $('#brand').onclick = openSites;
  $('#exit-demo')?.addEventListener('click', leaveDemo);
  $('.grid').onclick = onGridClick;

  load();
  loadSites();
}

/** (Re)load the hero chart and all cards for the selected range. */
async function load() {
  const gen = ++state.gen;
  const range = currentRange();
  const p = period(range.days);
  $('#hero').innerHTML =
    `<div class="hero-label">${t('dash.visitors')}</div><div class="skel big"></div><div class="skel chart-skel"></div>`;
  for (const s of SECTIONS) $(`#sec-${s.id} .body`).innerHTML = SKELETON;
  $('#refresh').classList.add('spin');

  await Promise.allSettled([loadHero(gen, range, p), ...SECTIONS.map((s) => loadSection(gen, s, p))]);
  if (gen !== state.gen) return;
  $('#refresh').classList.remove('spin');
  $('#foot').textContent = t('dash.updated', { time: fmt().time.format(new Date()) });
}

/**
 * React to a rejected token. If the current site belongs to a secondary account, go
 * back to the main site; if the main token itself is bad, ask for a new one.
 * Returns true if the error was handled (and the view replaced).
 */
function handleAuthError(e) {
  if (!(e instanceof AuthError)) return false;
  state.gen++; // stop the other pending requests from rendering
  const home = state.cfg?.accounts?.[0]?.home;
  if (home && state.cfg.base !== home) {
    state.notice = t('error.noAccess', { site: siteName(), message: e.message });
    state.cfg.base = home;
    saveConfig(state.cfg);
    render();
    return true;
  }
  const prefill = state.cfg?.site || '';
  disconnect();
  renderSetup({ error: t('error.reenter', { message: e.message }), prefill });
  return true;
}

function bucketLabel(b) {
  if (b.mode === 'hour') return t('chart.hour', { from: b.key, to: b.key + 1 });
  if (b.mode === 'day') return fmt().day.format(b.key);
  return t('chart.week', { date: fmt().date.format(b.key) });
}
const bucketAxis = (b) => (b.mode === 'hour' ? t('chart.hourAxis', { hour: b.key }) : fmt().date.format(b.key));

async function loadHero(gen, range, p) {
  const hero = $('#hero');
  let cur, prev;
  try {
    [cur, prev] = await Promise.all([api('/stats/total', p.q), api('/stats/total', p.prevQ).catch(() => null)]);
  } catch (e) {
    if (gen !== state.gen || handleAuthError(e)) return;
    hero.innerHTML = `<div class="hero-label">${t('dash.visitors')}</div><p class="err">${esc(e.message)}</p>`;
    return;
  }
  if (gen !== state.gen) return;

  const total = cur.total || 0;
  const buckets = buildBuckets(cur.stats, p);
  const max = Math.max(1, ...buckets.map((b) => b.value));

  let delta = '';
  if (prev?.total > 0) {
    const pct = Math.round(((total - prev.total) / prev.total) * 100);
    const [cls, sign] = pct > 0 ? ['up', '▲'] : pct < 0 ? ['down', '▼'] : ['flat', '='];
    delta = `<span class="delta ${cls}">${sign} ${num(Math.abs(pct))} %</span>`;
  }
  const baseLabel = t('dash.visitorsIn', { range: t(`range.${range.id}`) });
  const baseSub =
    prev?.total > 0
      ? esc(t('dash.previous', { count: num(prev.total), prev: t(`range.${range.id}.prev`) }))
      : cur.total_events
        ? esc(t('dash.events', { count: num(cur.total_events) }))
        : '&nbsp;';

  hero.innerHTML = `
    <div class="hero-label">${esc(baseLabel)}</div>
    <div class="hero-row"><div class="hero-num">${num(total)}</div>${delta}</div>
    <div class="hero-sub">${baseSub}</div>
    <div class="chart" role="img" tabindex="0" aria-label="${esc(t('dash.chart'))}">
      ${buckets.map((b) => `<div class="bar${b.value ? '' : ' zero'}" style="--h:${(b.value / max) * 100}%"><i></i></div>`).join('')}
    </div>
    <div class="axis"><span>${esc(buckets[0] ? bucketAxis(buckets[0]) : '')}</span><span>${esc(buckets.at(-1) ? bucketAxis(buckets.at(-1)) : '')}</span></div>`;

  // Sliding a finger (or the mouse, or arrow keys) over the chart shows single bars.
  const chart = $('.chart', hero);
  const label = $('.hero-label', hero);
  const number = $('.hero-num', hero);
  const sub = $('.hero-sub', hero);
  const deltaEl = $('.delta', hero);
  let picked = -1;

  const pick = (i) => {
    picked = Math.min(buckets.length - 1, Math.max(0, i));
    chart.classList.add('picking');
    chart.querySelector('.bar.on')?.classList.remove('on');
    chart.children[picked].classList.add('on');
    label.textContent = bucketLabel(buckets[picked]);
    number.textContent = num(buckets[picked].value);
    sub.innerHTML = '&nbsp;';
    if (deltaEl) deltaEl.hidden = true;
  };
  const reset = () => {
    picked = -1;
    chart.classList.remove('picking');
    chart.querySelector('.bar.on')?.classList.remove('on');
    label.textContent = baseLabel;
    number.textContent = num(total);
    sub.innerHTML = baseSub;
    if (deltaEl) deltaEl.hidden = false;
  };
  const pickAt = (ev) => {
    const r = chart.getBoundingClientRect();
    pick(Math.floor(((ev.clientX - r.left) / r.width) * buckets.length));
  };

  let pressed = false;
  chart.onpointerdown = (ev) => {
    pressed = true;
    pickAt(ev);
  };
  chart.onpointermove = (ev) => {
    if (pressed || ev.pointerType === 'mouse') pickAt(ev);
  };
  chart.onpointerup = chart.onpointercancel = () => {
    pressed = false;
  };
  chart.onpointerleave = (ev) => {
    if (ev.pointerType === 'mouse') reset();
  };
  chart.onkeydown = (ev) => {
    if (ev.key === 'ArrowLeft') pick(picked < 0 ? buckets.length - 1 : picked - 1);
    else if (ev.key === 'ArrowRight') pick(picked < 0 ? 0 : picked + 1);
    else return;
    ev.preventDefault();
  };
  chart.onblur = reset;
  hero.onclick = (ev) => {
    if (!ev.target.closest('.chart')) reset();
  };
}

function displayName(sec, item) {
  const raw = String(item.name ?? item.path ?? '').trim();
  if (!raw || raw === '(unknown)') return t(sec.blank || 'name.unknown');
  if (sec.id === 'locations') {
    const f = flag(item.id);
    return f ? `${f} ${raw}` : raw;
  }
  return raw;
}

function rowsHtml(sec, items, { clickable, total }) {
  const max = Math.max(1, ...items.map((x) => x.count));
  const rows = items.map((x, i) => {
    const sub = sec.id === 'pages' && x.title && x.title !== x.path ? `<small>${esc(x.title)}</small>` : '';
    const tag = x.event ? `<span class="tag">${t('dash.event')}</span>` : '';
    const pct = total > 0 ? `<span class="pct">${Math.round((x.count / total) * 100)} %</span>` : '';
    const inner = `<span class="name"><b>${esc(displayName(sec, x))}${tag}</b>${sub}</span><span class="val">${num(x.count)}</span>${pct}`;
    const width = `--w:${(x.count / max) * 100}%`;
    const canOpen = clickable && (sec.id === 'pages' ? x.path_id != null : !!x.id);
    return canOpen
      ? `<li><button class="row" style="${width}" data-sec="${sec.id}" data-i="${i}">${inner}<span class="chev" aria-hidden="true">›</span></button></li>`
      : `<li><div class="row" style="${width}">${inner}</div></li>`;
  });
  return `<ul class="list">${rows.join('')}</ul>`;
}

async function loadSection(gen, sec, p) {
  const body = $(`#sec-${sec.id} .body`);
  const limit = state.limits[sec.id] || sec.limit;
  let items, more, total;
  try {
    // The total for the percentages comes from the hero's (cached) request.
    total = (await api('/stats/total', p.q).catch(() => null))?.total || 0;
    if (sec.id === 'pages') {
      const r = await api('/stats/hits', { ...p.q, limit });
      [items, more] = [r.hits || [], r.more];
    } else {
      const r = await api(`/stats/${sec.id}`, { ...p.q, limit });
      [items, more] = [r.stats || [], r.more];
    }
  } catch (e) {
    if (gen !== state.gen || handleAuthError(e)) return;
    body.innerHTML = `<p class="err">${esc(e.message)}</p>`;
    return;
  }
  if (gen !== state.gen) return;

  state.sectionItems[sec.id] = { items, p };
  if (!items.length) {
    body.innerHTML = `<p class="empty">${t('dash.noData')}</p>`;
    return;
  }
  body.innerHTML =
    rowsHtml(sec, items, { clickable: sec.detail, total }) +
    (more && limit < MAX_LIMIT ? `<button class="more" data-more="${sec.id}">${t('dash.more')}</button>` : '');
}

function onGridClick(ev) {
  const more = ev.target.closest('[data-more]');
  if (more) {
    const sec = SECTIONS.find((s) => s.id === more.dataset.more);
    state.limits[sec.id] = Math.min(MAX_LIMIT, (state.limits[sec.id] || sec.limit) * 3);
    more.textContent = t('dash.loading');
    more.disabled = true;
    loadSection(state.gen, sec, period(currentRange().days));
    return;
  }
  const row = ev.target.closest('button.row');
  if (!row) return;
  const sec = SECTIONS.find((s) => s.id === row.dataset.sec);
  const { items, p } = state.sectionItems[sec.id];
  openDetail(sec, items[+row.dataset.i], p);
}

/* ---------------------------------------------------------------- Sites */

/** Fetch the sites of every connected account (needs the "Read sites" permission). */
async function loadSites() {
  if (state.demo) {
    state.sites = DEMO_SITES;
    return;
  }
  const cfg = state.cfg;
  const errors = [];
  const lists = await Promise.all(
    cfg.accounts.map(async ({ home }) => {
      try {
        return sitesFromResponse(home, await api('/sites', {}, home));
      } catch (e) {
        errors.push(`${short(home)}: ${e.message}`);
        const cached = cfg.sites.filter((s) => s.home === home);
        return cached.length ? cached : [homeSite(home)];
      }
    }),
  );
  if (state.cfg !== cfg || state.demo) return; // disconnected in the meantime
  state.sites = cfg.sites = mergeSites(lists);
  state.sitesErrors = errors;
  saveConfig(cfg);
  const nameEl = $('#site-name');
  if (nameEl) nameEl.textContent = siteName();
}

function switchSite(base) {
  if (state.demo) state.demoSite = base;
  else {
    state.cfg.base = base;
    saveConfig(state.cfg);
  }
  state.limits = {};
  closeSheet();
  render();
}

/** Sheet listing every site with its visitor count for the selected range. */
function openSites() {
  const range = currentRange();
  const p = period(range.days);
  const cur = currentBase();
  const token = openSheet(
    t('sites.kicker', { range: t(`range.${range.id}`) }),
    t('sites.title'),
    `<ul class="list">${state.sites
      .map(
        (s, i) => `
      <li><button class="row${s.base === cur ? ' current' : ''}" data-site="${i}"${s.base === cur ? ' aria-current="true"' : ''}>
        <span class="name"><b>${esc(s.name)}</b><small>${esc(s.sub)}</small></span>
        <span class="val" data-count="${i}">…</span>
        <span class="chev" aria-hidden="true">${s.base === cur ? '✓' : '›'}</span>
      </button></li>`,
      )
      .join('')}</ul>
    ${state.sitesErrors.map((e) => `<p class="err">${esc(t('sites.error', { message: e }))}</p>`).join('')}
    ${
      state.demo
        ? ''
        : `<button class="more" id="add-account">${t('sites.add')}</button>
           <p class="foot">${t('sites.note')}</p>`
    }`,
  );

  const body = $('#sheet-body');
  body.onclick = (ev) => {
    const row = ev.target.closest('[data-site]');
    if (row) return switchSite(state.sites[+row.dataset.site].base);
    if (ev.target.closest('#add-account')) {
      state.gen++;
      renderSetup({ adding: true });
    }
  };

  const totals = state.sites.map((s) =>
    api('/stats/total', p.q, s.base).then(
      (r) => r.total || 0,
      () => null,
    ),
  );
  totals.forEach((promise, i) =>
    promise.then((v) => {
      const el = $(`[data-count="${i}"]`, body);
      if (isSheetCurrent(token) && el) el.textContent = v === null ? '–' : num(v);
    }),
  );
  Promise.all(totals).then((values) => {
    if (!isSheetCurrent(token)) return;
    const max = Math.max(1, ...values.map((v) => v || 0));
    values.forEach((v, i) => $(`[data-site="${i}"]`, body)?.style.setProperty('--w', ((v || 0) / max) * 100 + '%'));
  });
}

/* ---------------------------------------------------------------- Sheet */

const sheet = $('#sheet');
let sheetToken = null;

// Light dismiss for browsers without <dialog closedby> (Safari): close when both the
// press and the release happen outside the panel.
if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e) => {
    const r = sheet.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  let pressedOutside = false;
  sheet.addEventListener('pointerdown', (e) => {
    pressedOutside = outside(e);
  });
  sheet.addEventListener('pointerup', (e) => {
    if (pressedOutside && outside(e)) sheet.close();
  });
}
sheet.addEventListener('close', () => {
  sheetToken = null;
});

/**
 * Open the bottom sheet with new content. Returns a token; async work started for this
 * sheet should check isSheetCurrent(token) before touching the DOM.
 */
function openSheet(kicker, title, html) {
  $('#sheet-kicker').textContent = kicker;
  $('#sheet-title').textContent = title;
  const body = $('#sheet-body');
  body.innerHTML = html;
  body.onclick = null;
  body.scrollTop = 0;
  if (!sheet.open) sheet.showModal();
  return (sheetToken = {});
}
const isSheetCurrent = (token) => token === sheetToken;

function closeSheet() {
  if (sheet.open) sheet.close();
}

async function openDetail(sec, item, p) {
  const isPage = sec.id === 'pages';
  const token = openSheet(t(isPage ? 'detail.pageKicker' : `section.${sec.id}`), displayName(sec, item), SKELETON);
  const body = $('#sheet-body');
  try {
    const r = isPage
      ? await api(`/stats/hits/${item.path_id}`, { ...p.q, limit: 30 })
      : await api(`/stats/${sec.id}/${encodeURIComponent(item.id)}`, { ...p.q, limit: 30 });
    if (!isSheetCurrent(token)) return;
    const items = r.refs || r.stats || [];
    const sub = { id: 'detail', blank: isPage ? 'name.direct' : 'name.unknown' };
    body.innerHTML = items.length
      ? rowsHtml(sub, items, { clickable: false, total: item.count })
      : `<p class="empty">${t('detail.empty')}</p>`;
  } catch (e) {
    if (isSheetCurrent(token)) body.innerHTML = `<p class="err">${esc(e.message)}</p>`;
  }
}

function openSettings() {
  const dashboard = state.demo ? 'https://www.goatcounter.com' : state.cfg.base;
  openSheet(
    t('settings.title'),
    siteName(),
    `
    <ul class="list">
      <li><a class="row link" href="${esc(dashboard)}" target="_blank" rel="noopener">
        <span class="name"><b>${t('settings.open')}</b><small>${esc(short(dashboard))}</small></span><span class="chev" aria-hidden="true">↗</span></a></li>
      <li><a class="row link" href="${HELP_URL}" target="_blank" rel="noopener">
        <span class="name"><b>${t('settings.help')}</b><small>github.com/TobiasWust/goatpocket</small></span><span class="chev" aria-hidden="true">↗</span></a></li>
      <li><a class="row link" href="${SITE_URL}?about">
        <span class="name"><b>${t('settings.about')}</b></span><span class="chev" aria-hidden="true">›</span></a></li>
      <li><button class="row" id="logout"><span class="name"><b class="danger">${t(state.demo ? 'settings.leaveDemo' : 'settings.disconnect')}</b>
        <small>${t(state.demo ? 'settings.leaveDemoSub' : 'settings.disconnectSub')}</small></span></button></li>
    </ul>
    <p class="foot">${t('settings.tip')}</p>
    ${creditHtml({ kofi: 'kofi.long' })}`,
  );
  $('#logout').onclick = () => {
    closeSheet();
    // Leaving the demo must not wipe a real account that is also configured.
    if (state.demo) return leaveDemo();
    disconnect();
    render();
  };
}

/* ------------------------------------------------------------- Sessions */

function enterDemo() {
  state.demo = true;
  state.sites = DEMO_SITES;
  client.clear({ persisted: false });
  history.replaceState(null, '', '?demo');
  render();
}

function leaveDemo() {
  state.demo = false;
  state.sites = state.cfg?.sites || [];
  client.clear({ persisted: false });
  history.replaceState(null, '', location.pathname);
  render();
}

/** Forget every account and cached response on this device. */
function disconnect() {
  clearConfig();
  state.cfg = null;
  state.sites = [];
  state.sitesErrors = [];
  client.clear();
}

/* ---------------------------------------------------------------- Start */

if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});

render();
