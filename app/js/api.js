// GoatCounter API client: talks directly to https://<site>/api/v0 from the browser.
// API docs: https://www.goatcounter.com/help/api

import { t } from './i18n.js';
import { short, sleep, storage } from './util.js';

// GoatCounter allows 4 requests per second, and the CORS preflight the browser sends
// before every authenticated call counts too. So: at most ~2 calls per second.
const MIN_INTERVAL = 560;
// A rejected (rate-limited) call comes back without CORS headers and looks like a
// network error to the browser, so retry those a few times before giving up.
const NETWORK_RETRIES = 3;
const NETWORK_RETRY_DELAY = 1200;
const RATE_LIMIT_RETRIES = 4;
const RATE_LIMIT_DELAY = 1100;

// Responses are kept on the device for a few minutes so reopening the app is instant.
const STORE_KEY = 'goatpocket.cache';
const FRESH_FOR = 5 * 60e3;

/** The token was rejected (401) or lacks a permission (403). */
export class AuthError extends Error {}

let lastCall = 0;
async function throttle() {
  const now = Date.now();
  const at = Math.max(now, lastCall + MIN_INTERVAL);
  lastCall = at;
  if (at > now) await sleep(at - now);
}

/** A single authenticated GET request, with throttling and retries. */
export async function request(base, token, pathAndQuery) {
  for (let attempt = 0; ; attempt++) {
    await throttle();
    let res;
    try {
      res = await fetch(`${base}/api/v0${pathAndQuery}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        referrerPolicy: 'no-referrer',
      });
    } catch {
      if (attempt < NETWORK_RETRIES) {
        await sleep(NETWORK_RETRY_DELAY);
        continue;
      }
      throw new Error(t('error.offline', { host: short(base) }));
    }
    if (res.status === 429 && attempt < RATE_LIMIT_RETRIES) {
      await sleep(RATE_LIMIT_DELAY);
      continue;
    }
    if (res.status === 401) throw new AuthError(t('error.tokenInvalid'));
    if (res.status === 403) throw new AuthError(t('error.tokenPermission'));
    if (!res.ok) {
      let message = t('error.http', { status: res.status });
      try {
        const body = await res.json();
        if (typeof body.error === 'string') message = body.error;
      } catch {
        /* not JSON */
      }
      throw new Error(message);
    }
    return res.json();
  }
}

/** Check that a token can read statistics, before saving it. */
export const verifyToken = (base, token, q) => request(base, token, '/stats/total?' + new URLSearchParams(q));

const readStore = () => storage.getJSON(STORE_KEY) || {};

function writeStore(key, data) {
  const all = readStore();
  const now = Date.now();
  for (const k of Object.keys(all)) if (now - all[k].t > FRESH_FOR) delete all[k];
  all[key] = { t: now, d: data };
  if (!storage.set(STORE_KEY, all)) storage.remove(STORE_KEY);
}

/**
 * Cached API access. Identical requests share one promise (the dashboard asks for
 * /stats/total from several places), and successful responses are also persisted.
 *
 * @param {object} opts
 * @param {() => boolean} opts.isDemo   use the fake data source instead of the network
 * @param {(base: string) => string} opts.tokenFor   token of the account that owns a site
 * @param {(path: string, params: object, base: string) => Promise<object>} opts.demo
 */
export function createClient({ isDemo, tokenFor, demo }) {
  const memory = new Map();

  function get(path, params, base) {
    const qs = new URLSearchParams(params).toString();
    const pathAndQuery = path + (qs ? '?' + qs : '');
    const key = base + pathAndQuery;
    if (memory.has(key)) return memory.get(key);

    let promise;
    const hit = isDemo() ? null : readStore()[key];
    if (hit && Date.now() - hit.t < FRESH_FOR) promise = Promise.resolve(hit.d);
    else if (isDemo()) promise = demo(path, params, base);
    else
      promise = request(base, tokenFor(base), pathAndQuery).then((data) => {
        writeStore(key, data);
        return data;
      });

    promise = promise.catch((e) => {
      memory.delete(key); // don't cache failures
      throw e;
    });
    memory.set(key, promise);
    return promise;
  }

  function clear({ persisted = true } = {}) {
    memory.clear();
    if (persisted) storage.remove(STORE_KEY);
  }

  return { get, clear };
}
