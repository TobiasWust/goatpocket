// Date ranges and chart buckets. GoatCounter's API works in UTC hours; the app shows
// everything in the device's local time zone.

import { HOUR } from './util.js';

/** Round to the full hour and format the way the API expects ("2026-01-31T23:00:00Z"). */
export const isoHour = (ms) => new Date(Math.round(ms / HOUR) * HOUR).toISOString().slice(0, 19) + 'Z';

/**
 * The last `days` calendar days including today (local time), plus the period of the
 * same length right before it for the comparison.
 */
export function period(days, now = new Date()) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const end = new Date(midnight);
  end.setHours(23);
  const start = new Date(midnight);
  start.setDate(start.getDate() - (days - 1));
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return {
    days,
    startMs: start.getTime(),
    endMs: end.getTime(),
    q: { start: isoHour(start.getTime()), end: isoHour(end.getTime()) },
    prevQ: { start: isoHour(prevStart.getTime()), end: isoHour(start.getTime() - HOUR) },
  };
}

/** One bar per hour for "today", per week for long ranges, per day otherwise. */
export const bucketMode = (days) => (days === 1 ? 'hour' : days > 120 ? 'week' : 'day');

/**
 * Sum the API's per-day/per-hour numbers (UTC) into local-time buckets.
 * Returns [{ mode, key, value }] where `key` is the local hour (0–23) in hour mode and
 * the timestamp of the local day (or Monday of the week) otherwise.
 */
export function buildBuckets(stats, p) {
  const mode = bucketMode(p.days);
  const keyOf = (ms) => {
    const d = new Date(ms);
    if (mode === 'hour') return d.getHours();
    d.setHours(0, 0, 0, 0);
    if (mode === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  };

  const buckets = [];
  const index = new Map();
  for (let t = p.startMs; t <= p.endMs; t += HOUR) {
    const key = keyOf(t);
    if (index.has(key)) continue;
    index.set(key, buckets.length);
    buckets.push({ mode, key, value: 0 });
  }

  const add = (ms, value) => {
    const i = index.get(keyOf(ms));
    if (i !== undefined) buckets[i].value += value;
  };

  for (const s of stats || []) {
    const [y, m, d] = s.day.slice(0, 10).split('-').map(Number);
    if (Array.isArray(s.hourly) && s.hourly.length) {
      s.hourly.forEach((value, h) => {
        const t = Date.UTC(y, m - 1, d, h);
        if (value && t >= p.startMs && t <= p.endMs) add(t, value);
      });
    } else if (s.daily) {
      // Without hourly data, noon is the safest guess for which local day it belongs to.
      add(new Date(y, m - 1, d, 12).getTime(), s.daily);
    }
  }
  return buckets;
}
