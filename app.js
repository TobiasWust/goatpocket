// GoatPocket – mobiles Dashboard für GoatCounter.
// Reine statische Seite: spricht direkt mit der GoatCounter-API (CORS ist dort offen).
// Der API-Token bleibt im localStorage dieses Geräts.

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const CFG_KEY = 'goatpocket.cfg';
const RANGE_KEY = 'goatpocket.range';

const RANGES = [
  { id: 'today', label: 'Heute', days: 1, prev: 'gestern' },
  { id: '7', label: '7 Tage', days: 7, prev: 'Vorwoche' },
  { id: '30', label: '30 Tage', days: 30, prev: '30 Tage davor' },
  { id: '90', label: '90 Tage', days: 90, prev: '90 Tage davor' },
  { id: '365', label: '12 Monate', days: 365, prev: 'Vorjahr' },
];

const SECTIONS = [
  { id: 'pages', title: 'Seiten', wide: true, limit: 8, detail: true },
  { id: 'toprefs', title: 'Herkunft', limit: 6, detail: true, blank: 'Direkt / unbekannt' },
  { id: 'locations', title: 'Länder', limit: 6, detail: true },
  { id: 'browsers', title: 'Browser', limit: 6, detail: true },
  { id: 'systems', title: 'Systeme', limit: 6, detail: true },
  { id: 'sizes', title: 'Geräte', limit: 6 },
  { id: 'languages', title: 'Sprachen', limit: 6 },
  { id: 'campaigns', title: 'Kampagnen', limit: 6 },
];

const SIZE_NAMES = {
  'Phones': 'Smartphones',
  'Large phones, small tablets': 'Große Phones, kleine Tablets',
  'Tablets and small laptops': 'Tablets & kleine Laptops',
  'Computer monitors': 'Monitore',
  'Computer monitors larger than HD': 'Monitore größer als HD',
};

const nf = new Intl.NumberFormat('de-DE');
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const state = {
  cfg: loadCfg(),
  demo: new URLSearchParams(location.search).has('demo'),
  range: localStorage.getItem(RANGE_KEY) || '7',
  gen: 0,
  limits: {},
  total: 0,
};

function loadCfg() {
  try { return JSON.parse(localStorage.getItem(CFG_KEY)); } catch { return null; }
}

/* ------------------------------------------------------------------ API */

class AuthError extends Error {}

const cache = new Map();
let lastCall = 0;

// GoatCounter erlaubt 4 Anfragen pro Sekunde – wir bleiben knapp darunter.
async function throttle() {
  const now = Date.now();
  const at = Math.max(now, lastCall + 280);
  lastCall = at;
  if (at > now) await sleep(at - now);
}

function api(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const key = path + '?' + qs;
  if (!cache.has(key)) {
    const p = (state.demo ? demoApi(path, params) : realApi(key)).catch((e) => { cache.delete(key); throw e; });
    cache.set(key, p);
  }
  return cache.get(key);
}

async function realApi(pathAndQuery, cfg = state.cfg) {
  for (let attempt = 0; ; attempt++) {
    await throttle();
    let res;
    try {
      res = await fetch(cfg.base + '/api/v0' + pathAndQuery, {
        headers: { Authorization: 'Bearer ' + cfg.token, 'Content-Type': 'application/json' },
        referrerPolicy: 'no-referrer',
      });
    } catch {
      throw new Error('Keine Verbindung zu ' + cfg.base.replace(/^https?:\/\//, ''));
    }
    if (res.status === 429 && attempt < 4) { await sleep(1100); continue; }
    if (res.status === 401 || res.status === 403) {
      throw new AuthError(res.status === 401 ? 'Token ungültig.' : 'Dem Token fehlt die Berechtigung „Read statistics“.');
    }
    if (!res.ok) {
      let msg = 'Fehler ' + res.status;
      try { const j = await res.json(); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }
}

function normalizeBase(input) {
  let s = input.trim().replace(/\/+$/, '');
  if (!s) return '';
  if (/^[a-z0-9-]+$/i.test(s)) return `https://${s.toLowerCase()}.goatcounter.com`;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { return new URL(s).origin; } catch { return ''; }
}

/* --------------------------------------------------------------- Zeitraum */

const iso = (ms) => new Date(Math.round(ms / HOUR) * HOUR).toISOString().slice(0, 19) + 'Z';

function period(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const end = new Date(d); end.setHours(23);
  const start = new Date(d); start.setDate(start.getDate() - (days - 1));
  const prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - days);
  return {
    days,
    startMs: start.getTime(), endMs: end.getTime(),
    q: { start: iso(start.getTime()), end: iso(end.getTime()) },
    prevQ: { start: iso(prevStart.getTime()), end: iso(start.getTime() - HOUR) },
  };
}

const fmtDay = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' });

// Baut die Balken aus den Stundenwerten der API (UTC) in lokaler Zeit zusammen.
function buildBuckets(stats, p) {
  const mode = p.days === 1 ? 'hour' : p.days > 120 ? 'week' : 'day';
  const buckets = [];
  const index = new Map();
  const keyOf = (ms) => {
    const d = new Date(ms);
    if (mode === 'hour') return d.getHours();
    d.setHours(0, 0, 0, 0);
    if (mode === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  };
  for (let t = p.startMs; t <= p.endMs; t += HOUR) {
    const k = keyOf(t);
    if (index.has(k)) continue;
    let label;
    if (mode === 'hour') label = `${k}–${k + 1} Uhr`;
    else if (mode === 'day') label = fmtDay.format(k);
    else label = 'Woche ab ' + fmtShort.format(k);
    index.set(k, buckets.length);
    buckets.push({ label, value: 0, axis: mode === 'hour' ? k + ' Uhr' : fmtShort.format(k) });
  }
  for (const s of stats || []) {
    const [y, m, d] = s.day.slice(0, 10).split('-').map(Number);
    if (Array.isArray(s.hourly) && s.hourly.length) {
      s.hourly.forEach((v, h) => {
        const t = Date.UTC(y, m - 1, d, h);
        if (!v || t < p.startMs || t > p.endMs) return;
        const i = index.get(keyOf(t));
        if (i !== undefined) buckets[i].value += v;
      });
    } else if (s.daily) {
      const i = index.get(keyOf(new Date(y, m - 1, d, 12).getTime()));
      if (i !== undefined) buckets[i].value += s.daily;
    }
  }
  return buckets;
}

/* ------------------------------------------------------------------ Views */

const app = $('#app');

function render() {
  if (!state.cfg && !state.demo) return renderSetup();
  renderDashboard();
}

function renderSetup(error = '') {
  const cfg = state.cfg || {};
  app.innerHTML = `
    <form class="setup" id="setup" autocomplete="off">
      <img class="logo" src="icon.svg" alt="">
      <h1>GoatPocket</h1>
      <p>Deine GoatCounter-Statistiken, gemacht fürs Handy.</p>
      ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ''}
      <label class="field">
        <span>Deine GoatCounter-Seite</span>
        <input name="site" inputmode="url" autocapitalize="none" autocorrect="off" spellcheck="false"
               placeholder="meinprojekt oder stats.example.com" value="${esc(cfg.site || '')}" required>
        <small>Der Code vor <b>.goatcounter.com</b> – oder die ganze Adresse bei eigener Domain.</small>
      </label>
      <label class="field">
        <span>API-Token</span>
        <input name="token" type="password" autocapitalize="none" autocorrect="off" spellcheck="false"
               placeholder="Token einfügen" required>
        <small>Bleibt nur auf diesem Gerät gespeichert und geht ausschließlich an deine GoatCounter-Seite.</small>
      </label>
      <button class="btn" type="submit">Verbinden</button>
      <button class="btn ghost" type="button" id="demo">Erst mal die Demo ansehen</button>
      <ol class="steps">
        <li>In GoatCounter anmelden → oben rechts <b>User</b> → <b>API</b></li>
        <li>Neuen Token anlegen, nur <b>Read statistics</b> ankreuzen</li>
        <li>Token kopieren und hier einfügen</li>
      </ol>
    </form>`;
  $('#demo').onclick = () => { state.demo = true; cache.clear(); render(); };
  $('#setup').onsubmit = async (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const btn = $('button[type=submit]', f);
    const site = f.site.value.trim();
    const cfg = { site, base: normalizeBase(site), token: f.token.value.trim() };
    if (!cfg.base) return renderSetup('Die Adresse sieht nicht richtig aus.');
    btn.disabled = true; btn.textContent = 'Prüfe …';
    try {
      const p = period(1);
      await realApi('/stats/total?' + new URLSearchParams(p.q), cfg);
      localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
      state.cfg = cfg; state.demo = false; cache.clear();
      render();
    } catch (e) {
      state.cfg = { site };
      renderSetup(e.message);
      state.cfg = null;
    }
  };
}

function siteName() {
  if (state.demo) return 'Demo-Seite';
  return state.cfg.base.replace(/^https?:\/\//, '').replace(/\.goatcounter\.com$/, '');
}

function renderDashboard() {
  const skel = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  app.innerHTML = `
    <header class="top">
      <div class="brand"><small>GoatCounter</small><h1>${esc(siteName())}</h1></div>
      <button class="icon-btn" id="refresh" aria-label="Aktualisieren">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>
      </button>
      <button class="icon-btn" id="settings" aria-label="Einstellungen">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>
      </button>
    </header>
    ${state.demo ? `<div class="banner"><span>Demo mit erfundenen Zahlen.</span><button id="exit-demo">Eigene Seite verbinden</button></div>` : ''}
    <nav class="ranges" aria-label="Zeitraum">
      ${RANGES.map((r) => `<button class="chip" data-range="${r.id}" aria-pressed="${r.id === state.range}">${r.label}</button>`).join('')}
    </nav>
    <section class="card hero" id="hero"></section>
    <div class="grid">
      ${SECTIONS.map((s) => `<section class="card ${s.wide ? 'wide' : ''}" id="sec-${s.id}"><h3>${s.title}</h3><div class="body">${skel}</div></section>`).join('')}
    </div>
    <p class="foot" id="foot"></p>`;

  $('.ranges').onclick = (ev) => {
    const b = ev.target.closest('[data-range]');
    if (!b || b.dataset.range === state.range) return;
    state.range = b.dataset.range;
    localStorage.setItem(RANGE_KEY, state.range);
    app.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b));
    state.limits = {};
    load();
  };
  $('#refresh').onclick = () => { cache.clear(); load(); };
  $('#settings').onclick = openSettings;
  const exit = $('#exit-demo');
  if (exit) exit.onclick = () => { state.demo = false; cache.clear(); history.replaceState(null, '', location.pathname); render(); };
  app.querySelector('.grid').onclick = onGridClick;
  load();
}

async function load() {
  const gen = ++state.gen;
  const range = RANGES.find((r) => r.id === state.range) || RANGES[1];
  const p = period(range.days);
  const skel = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
  $('#hero').innerHTML = '<div class="hero-label">Besucher</div><div class="skel big"></div><div class="skel chart-skel"></div>';
  for (const s of SECTIONS) $(`#sec-${s.id} .body`).innerHTML = skel;
  $('#refresh').classList.add('spin');

  const jobs = [loadHero(gen, range, p), ...SECTIONS.map((s) => loadSection(gen, s, p))];
  await Promise.allSettled(jobs);
  if (gen !== state.gen) return;
  $('#refresh').classList.remove('spin');
  $('#foot').textContent = 'Stand ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
}

function fail(e) {
  if (e instanceof AuthError) {
    const site = state.cfg?.site;
    localStorage.removeItem(CFG_KEY);
    state.cfg = { site };
    renderSetup(e.message + ' Bitte Token neu eingeben.');
    state.cfg = null;
    state.gen++;
    return true;
  }
  return false;
}

async function loadHero(gen, range, p) {
  const hero = $('#hero');
  let cur, prev;
  try {
    [cur, prev] = await Promise.all([api('/stats/total', p.q), api('/stats/total', p.prevQ).catch(() => null)]);
  } catch (e) {
    if (gen !== state.gen || fail(e)) return;
    hero.innerHTML = `<div class="hero-label">Besucher</div><p class="err">${esc(e.message)}</p>`;
    return;
  }
  if (gen !== state.gen) return;
  state.total = cur.total || 0;
  const buckets = buildBuckets(cur.stats, p);
  const max = Math.max(1, ...buckets.map((b) => b.value));

  let delta = '';
  if (prev && prev.total > 0) {
    const pct = Math.round(((cur.total - prev.total) / prev.total) * 100);
    const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
    delta = `<span class="delta ${cls}">${pct > 0 ? '▲' : pct < 0 ? '▼' : '='} ${nf.format(Math.abs(pct))} %</span>`;
  }
  const baseLabel = `Besucher · ${range.label}`;
  const baseSub = prev && prev.total > 0 ? `${nf.format(prev.total)} im Zeitraum davor (${range.prev})` : (cur.total_events ? `davon ${nf.format(cur.total_events)} Events` : '&nbsp;');

  hero.innerHTML = `
    <div class="hero-label">${baseLabel}</div>
    <div class="hero-row"><div class="hero-num">${nf.format(cur.total || 0)}</div>${delta}</div>
    <div class="hero-sub">${baseSub}</div>
    <div class="chart" role="img" aria-label="Verlauf der Besucher">
      ${buckets.map((b, i) => `<div class="bar ${b.value ? '' : 'zero'}" data-i="${i}" style="--h:${(b.value / max) * 100}%"><i></i></div>`).join('')}
    </div>
    <div class="axis"><span>${buckets[0]?.axis || ''}</span><span>${buckets.at(-1)?.axis || ''}</span></div>`;

  // Mit dem Finger über die Balken fahren zeigt den Wert des Tages.
  const chart = $('.chart', hero);
  const label = $('.hero-label', hero), num = $('.hero-num', hero), sub = $('.hero-sub', hero);
  const pick = (ev) => {
    const r = chart.getBoundingClientRect();
    const i = Math.min(buckets.length - 1, Math.max(0, Math.floor(((ev.clientX - r.left) / r.width) * buckets.length)));
    chart.classList.add('picking');
    chart.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
    chart.children[i].classList.add('on');
    label.textContent = buckets[i].label;
    num.textContent = nf.format(buckets[i].value);
    sub.innerHTML = '&nbsp;';
    const d = $('.delta', hero); if (d) d.hidden = true;
  };
  const reset = () => {
    chart.classList.remove('picking');
    chart.querySelectorAll('.bar.on').forEach((b) => b.classList.remove('on'));
    label.textContent = baseLabel;
    num.textContent = nf.format(cur.total || 0);
    sub.innerHTML = baseSub;
    const d = $('.delta', hero); if (d) d.hidden = false;
  };
  let down = false;
  chart.onpointerdown = (ev) => { down = true; pick(ev); };
  chart.onpointermove = (ev) => { if (down || ev.pointerType === 'mouse') pick(ev); };
  chart.onpointerup = chart.onpointercancel = () => { down = false; };
  chart.onpointerleave = (ev) => { if (ev.pointerType === 'mouse') reset(); };
  hero.onclick = (ev) => { if (!ev.target.closest('.chart')) reset(); };
}

function displayName(sec, item) {
  const raw = (item.name ?? item.path ?? '').trim();
  if (!raw || raw === '(unknown)') return sec.blank || 'Unbekannt';
  if (sec.id === 'sizes') return SIZE_NAMES[raw] || raw;
  if (sec.id === 'locations' && /^[A-Z]{2}$/.test(item.id || '')) {
    const flag = String.fromCodePoint(...[...item.id].map((c) => 0x1f1a5 + c.charCodeAt(0)));
    return flag + ' ' + raw;
  }
  return raw;
}

function rowsHtml(sec, items, { clickable, total }) {
  const max = Math.max(1, ...items.map((x) => x.count));
  return `<ul class="list">${items.map((x, i) => {
    const name = displayName(sec, x);
    const sub = sec.id === 'pages' && x.title && x.title !== x.path ? `<small>${esc(x.title)}</small>` : '';
    const tag = x.event ? '<span class="tag">Event</span>' : '';
    const pct = total > 0 ? `<span class="pct">${Math.round((x.count / total) * 100)} %</span>` : '';
    const inner = `<span class="name"><b>${esc(name)}${tag}</b>${sub}</span><span class="val">${nf.format(x.count)}</span>${pct}`;
    const can = clickable && (sec.id === 'pages' ? x.path_id != null : !!x.id);
    return can
      ? `<li><button class="row" style="--w:${(x.count / max) * 100}%" data-sec="${sec.id}" data-i="${i}">${inner}<span class="chev">›</span></button></li>`
      : `<li><div class="row" style="--w:${(x.count / max) * 100}%">${inner}</div></li>`;
  }).join('')}</ul>`;
}

const sectionItems = {};

async function loadSection(gen, sec, p) {
  const body = $(`#sec-${sec.id} .body`);
  const limit = state.limits[sec.id] || sec.limit;
  let items, more, total = 0;
  try {
    // Gesamtzahl für die Prozentangaben (kommt aus dem Cache des Hero-Abrufs).
    total = (await api('/stats/total', p.q).catch(() => null))?.total || 0;
    if (sec.id === 'pages') {
      const r = await api('/stats/hits', { ...p.q, limit, group: 'day' });
      items = r.hits || []; more = r.more;
    } else {
      const r = await api('/stats/' + sec.id, { ...p.q, limit });
      items = r.stats || []; more = r.more;
    }
  } catch (e) {
    if (gen !== state.gen || fail(e)) return;
    body.innerHTML = `<p class="err">${esc(e.message)}</p>`;
    return;
  }
  if (gen !== state.gen) return;
  sectionItems[sec.id] = { items, p };
  if (!items.length) { body.innerHTML = '<p class="empty">Noch keine Daten in diesem Zeitraum.</p>'; return; }
  body.innerHTML = rowsHtml(sec, items, { clickable: sec.detail, total })
    + (more && limit < 100 ? `<button class="more" data-more="${sec.id}">Mehr anzeigen</button>` : '');
}

function onGridClick(ev) {
  const more = ev.target.closest('[data-more]');
  if (more) {
    const sec = SECTIONS.find((s) => s.id === more.dataset.more);
    const cur = state.limits[sec.id] || sec.limit;
    state.limits[sec.id] = Math.min(100, cur * 3);
    more.textContent = 'Lade …'; more.disabled = true;
    const range = RANGES.find((r) => r.id === state.range);
    loadSection(state.gen, sec, period(range.days));
    return;
  }
  const row = ev.target.closest('button.row');
  if (!row) return;
  const sec = SECTIONS.find((s) => s.id === row.dataset.sec);
  const { items, p } = sectionItems[sec.id];
  openDetail(sec, items[+row.dataset.i], p);
}

/* ------------------------------------------------------------------ Sheet */

const sheet = $('#sheet');
sheet.addEventListener('click', (ev) => { if (ev.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeSheet(); });

function openSheet(kicker, title, html) {
  $('#sheet-kicker').textContent = kicker;
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = html;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  sheet.hidden = true;
  document.body.style.overflow = '';
}

async function openDetail(sec, item, p) {
  const isPage = sec.id === 'pages';
  const kicker = isPage ? 'Seite · Herkunft der Besucher' : sec.title;
  openSheet(kicker, displayName(sec, item).replace(/^\S+ (?=.)/u, (m) => (sec.id === 'locations' ? m : m)),
    '<div class="skel"></div><div class="skel"></div><div class="skel"></div>');
  const body = $('#sheet-body');
  const token = (openDetail.token = {});
  try {
    const r = isPage
      ? await api('/stats/hits/' + item.path_id, { ...p.q, limit: 30 })
      : await api(`/stats/${sec.id}/${encodeURIComponent(item.id)}`, { ...p.q, limit: 30 });
    if (openDetail.token !== token) return;
    const items = r.refs || r.stats || [];
    const sub = { id: 'detail', blank: isPage ? 'Direkt / unbekannt' : 'Unbekannt' };
    body.innerHTML = items.length
      ? rowsHtml(sub, items, { clickable: false, total: item.count })
      : '<p class="empty">Keine weiteren Details vorhanden.</p>';
  } catch (e) {
    if (openDetail.token !== token) return;
    body.innerHTML = `<p class="err">${esc(e.message)}</p>`;
  }
}

function openSettings() {
  const base = state.demo ? 'https://www.goatcounter.com' : state.cfg.base;
  openSheet('Einstellungen', siteName(), `
    <ul class="list">
      <li><a class="row" href="${esc(base)}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">
        <span class="name"><b>Original-Dashboard öffnen</b><small>${esc(base.replace(/^https?:\/\//, ''))}</small></span><span class="chev">↗</span></a></li>
      <li><button class="row" id="logout"><span class="name"><b style="color:var(--down)">${state.demo ? 'Demo verlassen' : 'Verbindung trennen'}</b>
        <small>${state.demo ? 'Zur Anmeldung' : 'Löscht den Token von diesem Gerät'}</small></span></button></li>
    </ul>
    <p class="foot">Tipp: Über „Teilen → Zum Home-Bildschirm“ wird GoatPocket zur App.</p>`);
  $('#logout').onclick = () => {
    localStorage.removeItem(CFG_KEY);
    state.cfg = null; state.demo = false; cache.clear();
    history.replaceState(null, '', location.pathname);
    closeSheet(); render();
  };
}

/* ------------------------------------------------------------------- Demo */

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const DEMO = {
  pages: [['/', 'Startseite'], ['/pricing', 'Preise'], ['/blog/antworten-in-sekunden', 'Antworten in Sekunden'], ['/features', 'Funktionen'], ['/docs/start', 'Erste Schritte'], ['signup-click', 'Signup geklickt', true], ['/blog', 'Blog'], ['/about', 'Über uns'], ['/changelog', 'Changelog'], ['/kontakt', 'Kontakt'], ['/impressum', 'Impressum']],
  toprefs: ['', 'Google', 'Hacker News', 'linkedin.com', 'github.com', 'Twitter', 'duckduckgo.com', 'producthunt.com'],
  locations: [['DE', 'Germany'], ['US', 'United States'], ['AT', 'Austria'], ['CH', 'Switzerland'], ['GB', 'United Kingdom'], ['NL', 'Netherlands'], ['FR', 'France']],
  browsers: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Internet'],
  systems: ['iOS', 'Android', 'macOS', 'Windows', 'Linux'],
  sizes: ['Phones', 'Computer monitors', 'Tablets and small laptops', 'Large phones, small tablets', 'Computer monitors larger than HD'],
  languages: ['German', 'English', 'French', 'Dutch', 'Spanish'],
  campaigns: ['newsletter-november', 'launch'],
};

async function demoApi(path, params) {
  await sleep(120 + Math.random() * 380);
  const start = Date.parse(params.start), end = Date.parse(params.end);
  const hours = Math.round((end - start) / HOUR) + 1;
  const hourVal = (t) => {
    const r = rng(Math.floor(t / HOUR))();
    const d = new Date(t), h = d.getHours();
    const dayCurve = Math.max(0.05, Math.sin(((h - 5) / 19) * Math.PI));
    const weekend = [0, 6].includes(d.getDay()) ? 0.55 : 1;
    const trend = 0.6 + 0.4 * ((t - (Date.now() - 400 * DAY)) / (400 * DAY));
    return t > Date.now() ? 0 : Math.round(r * 9 * dayCurve * weekend * trend);
  };
  const byDay = new Map();
  let total = 0;
  for (let i = 0; i < hours; i++) {
    const t = start + i * HOUR, d = new Date(t).toISOString().slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, { day: d, hourly: Array(24).fill(0), daily: 0 });
    const v = hourVal(t), e = byDay.get(d);
    e.hourly[new Date(t).getUTCHours()] = v; e.daily += v; total += v;
  }
  const share = (names, limit, weights = 0.55) => {
    let rest = total;
    const out = names.map((n, i) => {
      const c = i === names.length - 1 ? Math.round(rest * 0.6) : Math.round(rest * weights);
      rest -= c;
      return c;
    });
    return { list: names.map((n, i) => [n, out[i]]).filter((x) => x[1] > 0).slice(0, +limit || 10), more: names.length > (+limit || 10) };
  };

  if (path === '/stats/total') return { total, total_events: Math.round(total * 0.04), total_utc: total, stats: [...byDay.values()] };
  if (path === '/stats/hits') {
    const s = share(DEMO.pages, params.limit, 0.36);
    return { more: s.more, total, hits: s.list.map(([pg, c], i) => ({ path_id: i + 1, path: pg[0], title: pg[1], event: !!pg[2], count: c })) };
  }
  if (path.startsWith('/stats/hits/')) {
    const mine = Math.round(total * 0.3);
    let rest = mine;
    return { more: false, refs: DEMO.toprefs.slice(0, 5).map((n) => { const c = Math.round(rest * 0.5); rest -= c; return { name: n, count: c }; }).filter((x) => x.count) };
  }
  const [, , page, id] = path.split('/');
  if (id) {
    const versions = { browsers: ['131', '130', '129', '18.1'], systems: ['18.1', '17.6', '15', '14'], locations: ['Bayern', 'Berlin', 'Nordrhein-Westfalen', 'Hamburg'], toprefs: ['google.com/search', 'google.de', 'google.at'] }[page] || [];
    let rest = Math.round(total * 0.3);
    return { more: false, stats: versions.map((n) => { const c = Math.round(rest * 0.5); rest -= c; return { name: n, count: c }; }).filter((x) => x.count) };
  }
  const names = DEMO[page] || [];
  const s = share(names, params.limit, page === 'campaigns' ? 0.03 : 0.48);
  return { more: s.more, stats: s.list.map(([n, c]) => (Array.isArray(n) ? { id: n[0], name: n[1], count: c } : { id: n || 'x', name: n, count: c })) };
}

render();
