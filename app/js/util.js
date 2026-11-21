// Small helpers shared by the whole app. Nothing in here touches the DOM at import
// time, so these modules can be imported by the Node test runner as well.

export const HOUR = 3600e3;
export const DAY = 24 * HOUR;

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const $ = (selector, root = document) => root.querySelector(selector);

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape a value for safe interpolation into HTML text and attribute values. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** "https://foo.goatcounter.com" → "foo.goatcounter.com" (also strips the demo prefix). */
export const short = (base) => base.replace(/^(https?:\/\/|demo:)/, '');

/**
 * Turn whatever the user typed into the origin of a GoatCounter instance.
 *   "mysite"                    → https://mysite.goatcounter.com
 *   "stats.example.com/"        → https://stats.example.com
 *   "http://10.0.0.5:8081/foo"  → http://10.0.0.5:8081
 * Returns "" when the input can't be parsed.
 */
export function normalizeBase(input) {
  let s = String(input ?? '')
    .trim()
    .replace(/\/+$/, '');
  if (!s) return '';
  if (/^[a-z0-9-]+$/i.test(s)) return `https://${s.toLowerCase()}.goatcounter.com`;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    return new URL(s).origin;
  } catch {
    return '';
  }
}

/** Two-letter country code → emoji flag ("DE" → 🇩🇪). Returns "" for anything else. */
export function flag(code) {
  if (!/^[A-Z]{2}$/.test(code || '')) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

/**
 * localStorage wrapper that never throws. Storage can be unavailable (private mode,
 * blocked site data) or full; the app should keep working in that case, just without
 * remembering anything.
 */
export const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  getJSON(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
