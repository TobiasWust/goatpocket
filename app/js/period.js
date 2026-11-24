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
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return periodBetween(start, now);
}

/** Local midnight of a "YYYY-MM-DD" string, or null if it isn't a valid date. */
export function parseDay(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  const d = new Date(+m[1], m[2] - 1, +m[3]);
  return d.getDate() === +m[3] && d.getMonth() === m[2] - 1 ? d : null;
}

/** "YYYY-MM-DD" of a local date, the format of <input type="date">. */
export const formatDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * All local calendar days from `from` to `to` (both included, in any order), plus the
 * period of the same length right before it for the comparison.
 */
export function periodBetween(from, to) {
  let start = new Date(from);
  let last = new Date(to);
  start.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);
  if (start > last) [start, last] = [last, start];
  // Count calendar days, not 24-hour blocks, so a DST switch inside doesn't matter.
  const days =
    Math.round(
      (Date.UTC(last.getFullYear(), last.getMonth(), last.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        (24 * HOUR),
    ) + 1;
  const end = new Date(last);
  end.setHours(23);
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
