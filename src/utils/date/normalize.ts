import moment, { Moment } from 'moment';

/** `YYYY-MM-DD` — the canonical app date form, and by far the most common input here. */
const PLAIN_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Normalizes any accepted date input to a native `Date`, or `null` for empty/unparseable input.
 *
 * The `YYYY-MM-DD` fast path builds the `Date` directly instead of going through moment's
 * parser. That form dominates this codebase (API payloads, `data-date` attributes, calendar cell
 * keys), and moment's strict parse costs ~6µs against ~0.1µs here — with thousands of cells
 * formatted per calendar render, it was a quarter of the whole formatting budget.
 *
 * `new Date(y, m - 1, d)` yields local midnight, exactly matching what
 * `moment(value, 'YYYY-MM-DD')` produced, so the fast path is not a behaviour change. Anything
 * that is not a plain date still falls through to moment: strict ISO-8601, then the loose
 * parser, so canonical dates never reach the slow/ambiguous path.
 *
 * This exists only to feed the formatter a native `Date` — it is not a general-purpose moment
 * replacement, and nothing outside `src/utils/date/` should depend on it.
 */
export function toDate(value: string | Date | Moment | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (typeof value === 'string') {
    const plain = PLAIN_DATE.exec(value);
    if (plain) {
      const year = +plain[1];
      const month = +plain[2];
      const day = +plain[3];
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        // Rejects overflow such as 2026-02-31, which `new Date` would roll into March.
        return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
      }
      return null;
    }
  } else if (moment.isMoment(value)) {
    return value.isValid() ? value.toDate() : null;
  }

  const iso = moment(value, moment.ISO_8601, true);
  if (iso.isValid()) return iso.toDate();

  const loose = moment(value);
  return loose.isValid() ? loose.toDate() : null;
}
