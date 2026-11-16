import { calendarPreference } from '@/stores/calendar-preference.store';
import { CalendarPreferenceController } from './calendar-preference-controller';
import locales from '@/stores/locales.store';
import { LanguageObserver } from '@/utils/language-observer';
import { getRenderingLanguage } from '@/services/locale/locale-scope';
import { configureMoment, momentHijri } from './moment-setup';
import { toMomentLocale } from './locale-map';
import { toHijriFormat } from './tokens';
import { toDate } from './normalize';
import { resolveNumberingScript, toNumerals } from './numerals';
import { CalendarSystem, DateInput, DateStyle, FormatDateOptions, NumberingSystemPreference, TimeStyle } from './types';

/**
 * The one global entry point for calendar-aware date DISPLAY (Gregorian or Hijri).
 *
 * Pass an ordinary moment format string and it renders in the active language, switching to the
 * Hijri calendar when that is the resolved preference — the call site never changes:
 *
 *   formatDate('2026-08-27', 'ddd, DD MMM YYYY')
 *     en           → Thu, 27 Aug 2026
 *     ar           → خميس, 27 أغسطس 2026
 *     ar + hijri   → الخميس، 14 ربيع الأول 1448
 *
 * Never used for parsing or identity. `data-date` attributes, API payloads, calendar cell keys
 * and every persisted value stay Gregorian ISO strings — use {@link toApiDate} for that
 * boundary. The global moment locale is left at `'en'` by `moment-setup.ts` and nothing here
 * mutates it; every format call sets its locale per instance, so a raw
 * `moment(x).format('YYYY-MM-DD')` elsewhere in the codebase always yields Latin-digit ISO.
 */

/**
 * One-time initialisation of the date layer: moment locale configuration plus the calendar /
 * numbering-system preference resolution. Runs on the first format rather than from
 * `src/global/app.ts`, so that both the moment instance and the preference store initialise
 * inside the component-chunk graph — see the comment in `app.ts` for why that matters.
 */
let dateLayerReady = false;
function ensureDateLayer(): void {
  configureMoment();
  if (dateLayerReady) return;
  dateLayerReady = true;
  CalendarPreferenceController.init();
}

/**
 * Semantic styles map onto plain moment tokens (never moment's localized `L`/`ll` tokens, which
 * have no Hijri counterpart — see `tokens.ts`). The English output of each reproduces exactly
 * what the previous `Intl.DateTimeFormat` implementation produced, so existing screens and the
 * assertions in `ir-date.spec.ts` are unchanged.
 */
const STYLE_FORMATS: Record<DateStyle, string> = {
  'short': 'M/D/YYYY', // 8/27/2026
  'medium': 'MMM D, YYYY', // Aug 27, 2026
  'long': 'MMMM D, YYYY', // August 27, 2026
  'weekday-medium': 'ddd, MMM D, YYYY', // Thu, Aug 27, 2026
  'month-year': 'MMMM YYYY', // August 2026
  'day-only': 'D', // 27
};

/** Zero-pads to two digits without allocating a format string. */
function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * Whether the platform prefers a 12-hour clock. Cached — `Intl` resolution is not free and this
 * cannot change within a session. Preserves the behaviour introduced for `_formatTime`.
 */
let cachedHour12: boolean | undefined;
function prefersHour12(): boolean {
  if (cachedHour12 === undefined) {
    try {
      cachedHour12 = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12 ?? false;
    } catch {
      cachedHour12 = false;
    }
  }
  return cachedHour12;
}

const TIME_FORMATS: Record<TimeStyle, () => string> = {
  short: () => (prefersHour12() ? 'h:mm A' : 'HH:mm'),
};

/**
 * Resolution order: an explicit per-call override, then the `lang` subtree of the component
 * rendering right now (see `locale-scope.ts`), then the language the locale store was loaded
 * with, then `<html lang>`, then English. Exported because `@/utils/number` resolves the same
 * display locale and digit-script preference — they are one user-facing setting, not two.
 */
export function resolveLocale(options?: Pick<FormatDateOptions, 'locale'>): string {
  return options?.locale ?? getRenderingLanguage() ?? locales.language ?? LanguageObserver.getLang() ?? 'en';
}

function resolveCalendar(options?: FormatDateOptions): CalendarSystem {
  return options?.calendar ?? calendarPreference.resolved;
}

export function resolveNumberingSystem(options?: Pick<FormatDateOptions, 'numberingSystem'>): NumberingSystemPreference {
  return options?.numberingSystem ?? calendarPreference.numberingSystem;
}

/**
 * Formatted results are memoized. A calendar view formats the same handful of dates in the same
 * handful of formats on every re-render — thousands of calls, a few hundred distinct results.
 *
 * The key carries every input that can change the output (timestamp, format, locale, calendar,
 * digit script), so a preference change simply lands on different keys; there is no invalidation
 * to get wrong. The store reads that build the key still happen on every call, which is what
 * keeps `@stencil/store`'s render tracking working — returning a cached string must not skip
 * them, or components would stop re-rendering when the language or calendar changes.
 */
const MAX_CACHED_RESULTS = 5000;
const resultCache = new Map<string, string>();

/** The single formatting primitive every other export in this module funnels through. */
function render(value: DateInput, format: string, options?: FormatDateOptions): string {
  ensureDateLayer();
  const date = toDate(value);
  if (!date) return '';

  // Read every preference first: these store reads are what register the component's dependency.
  const calendar = resolveCalendar(options);
  const locale = resolveLocale(options);
  const script = resolveNumberingScript(locale, resolveNumberingSystem(options));

  const cacheKey = `${date.getTime()}|${format}|${locale}|${calendar}|${script}`;
  const cached = resultCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const pattern = calendar === 'islamic-umalqura' ? toHijriFormat(format) : format;
  const formatted = toNumerals(momentHijri(date).locale(toMomentLocale(locale, calendar)).format(pattern), script);

  // Crude but sufficient bound: a full clear is rare and far cheaper than tracking LRU order.
  if (resultCache.size >= MAX_CACHED_RESULTS) resultCache.clear();
  resultCache.set(cacheKey, formatted);
  return formatted;
}

/**
 * Formats a date with a moment format string, in the active language and calendar system.
 *
 * @param value ISO string, native `Date`, or `moment.Moment`. Empty/unparseable → `''`.
 * @param format Any moment format string, e.g. `'ddd, DD MMM YYYY'`.
 */
export function formatDate(value: DateInput, format: string, options?: FormatDateOptions): string;
/** Formats a date with one of the named {@link DateStyle} presets. Defaults to `'medium'`. */
export function formatDate(value: DateInput, options?: FormatDateOptions): string;
export function formatDate(value: DateInput, formatOrOptions?: string | FormatDateOptions, maybeOptions?: FormatDateOptions): string {
  const options = typeof formatOrOptions === 'string' ? maybeOptions : formatOrOptions;
  const base = typeof formatOrOptions === 'string' ? formatOrOptions : STYLE_FORMATS[options?.style ?? 'medium'];
  const format = options?.withTime ? `${base} ${TIME_FORMATS[options.withTime]()}` : base;

  return render(value, format, options);
}

/** Convenience for the from–to span pattern used by `ir-date-view` and similar components. */
export function formatDateRange(from: DateInput, to: DateInput, format: string, options?: FormatDateOptions): string;
export function formatDateRange(from: DateInput, to: DateInput, options?: FormatDateOptions): string;
export function formatDateRange(from: DateInput, to: DateInput, formatOrOptions?: string | FormatDateOptions, maybeOptions?: FormatDateOptions): string {
  const one = (value: DateInput) => (typeof formatOrOptions === 'string' ? formatDate(value, formatOrOptions, maybeOptions) : formatDate(value, formatOrOptions));
  return `${one(from)} – ${one(to)}`;
}

/**
 * Formats the time portion only, honouring the platform's 12h/24h preference by default.
 * Time-of-day is calendar-independent, so this is unaffected by the Hijri preference.
 */
export function formatTime(value: DateInput, options?: FormatDateOptions & { format?: string }): string {
  return render(value, options?.format ?? TIME_FORMATS[options?.withTime ?? 'short'](), options);
}

/** Date and time together. `format` defaults to the `'medium'` style plus a short time. */
export function formatDateTime(value: DateInput, format?: string, options?: FormatDateOptions): string {
  return render(value, format ?? `${STYLE_FORMATS.medium} ${TIME_FORMATS.short()}`, options);
}

/**
 * The API/persistence boundary: always Gregorian, always Latin digits, always `YYYY-MM-DD`,
 * regardless of the active language or calendar preference. Use this for request payloads,
 * `data-date` attributes, calendar cell keys and anything persisted.
 */
export function toApiDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '';
  // Built from the Date's own fields rather than through moment: this is Gregorian Latin ISO by
  // construction, so no locale, calendar preference or digit script can reach it — and it is on
  // the request path, where it was costing ~21µs a call for a nine-character string.
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** As {@link toApiDate}, including the time component. */
export function toApiDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return '';
  return `${toApiDate(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/**
 * Weekday abbreviations, Sunday-first. Day-of-week is a property of the week, not of the
 * calendar system, so this deliberately has no Hijri branch — only the names are localized.
 * Grid column order is Sunday-first everywhere; see {@link getFirstDayOfWeek}.
 */
export function getWeekdayLabels(options?: {
  style?: 'abbreviated' | 'narrow';
  calendar?: CalendarSystem;
  locale?: string;
  numberingSystem?: NumberingSystemPreference;
}): string[] {
  ensureDateLayer();
  const data = momentHijri.localeData(toMomentLocale(options?.locale ?? resolveLocale(), options?.calendar ?? 'gregory'));
  // `options.style` here is the weekday width, not a DateStyle — pass only the numbering system.
  // Resolve the script once rather than per label — this maps over seven strings.
  const script = resolveNumberingScript(resolveLocale(options), resolveNumberingSystem(options));
  return (options?.style === 'narrow' ? data.weekdaysMin() : data.weekdaysShort()).map(label => toNumerals(label, script));
}

/** Month name (+ year), respecting the resolved calendar — used for header/month-grid labels. */
export function getMonthLabel(value: DateInput, options?: { style?: 'long' | 'short'; calendar?: CalendarSystem; locale?: string }): string {
  return render(value, options?.style === 'short' ? 'MMM YYYY' : 'MMMM YYYY', options);
}

/**
 * The locale's conventional first day of the week (0 = Sunday … 6 = Saturday; Arabic reports 6).
 * Exposed for callers that want it — the calendar grids deliberately stay Sunday-first, so
 * changing their column order is an opt-in change, not a side effect of switching language.
 */
export function getFirstDayOfWeek(locale?: string): number {
  ensureDateLayer();
  return momentHijri.localeData(toMomentLocale(locale ?? resolveLocale(), 'gregory')).firstDayOfWeek();
}
