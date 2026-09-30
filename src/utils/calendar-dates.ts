import moment from 'moment';

/**
 * Calendar-day helpers.
 *
 * Invariant: a calendar day is the API's `YYYY-MM-DD` string. Never wrap it in `Date`
 * (`new Date('YYYY-MM-DD')` parses as UTC midnight and shifts a day west of UTC), never
 * convert it to a timestamp or `D_M_YYYY`, and never emit a `Date` for a day.
 * The only day the UI produces itself is today: `todayISO()`.
 *
 * Zero-padded ISO dates compare correctly as plain strings — use `<`, `>`, `===`.
 */
export type ISODate = string;

export const ISO_FORMAT = 'YYYY-MM-DD';

/** Reads the leading `YYYY-MM-DD` as a local calendar day (a trailing time, if any, is ignored). */
const parse = (d: ISODate) => moment(d, ISO_FORMAT);

export const todayISO = (): ISODate => moment().format(ISO_FORMAT);

export const addDaysISO = (d: ISODate, n: number): ISODate => parse(d).add(n, 'days').format(ISO_FORMAT);

export const addMonthsISO = (d: ISODate, n: number): ISODate => parse(d).add(n, 'months').format(ISO_FORMAT);

/** Whole nights from `from` to `to` (negative when `to` is earlier). */
export const nightsBetween = (from: ISODate, to: ISODate): number => parse(to).diff(parse(from), 'days');
